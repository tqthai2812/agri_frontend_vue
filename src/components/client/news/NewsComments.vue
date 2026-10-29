<script setup>
import {
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { newsApi, errorText } from "@/services/newsStudio.service";
import NewsAvatar from "./NewsAvatar.vue";
import NewsCommentItem from "./NewsCommentItem.vue";
const props = defineProps({ slug: { type: String, required: true } });
const auth = useAuthStore();
const rows = ref([]),
  meta = ref({}),
  mine = ref(false),
  loading = ref(false),
  sending = ref(false),
  error = ref("");
const text = ref(""),
  rootInput = ref(),
  replyInput = ref(),
  replyTarget = ref(null),
  replyText = ref(""),
  editTarget = ref(null),
  editText = ref(""),
  replies = ref({}),
  replyLoading = ref({});
let seq = 0;
const base = () => `/api/v1/public/news/${encodeURIComponent(props.slug)}`;
const own = (c) =>
  !!auth.isLoggedIn && Number(auth.user?.id) === Number(c.user_id);
const canHide = (c) =>
  !!auth.isLoggedIn &&
  !!auth.hasPermission("article.update") &&
  c.status === "active";
const userName = computed(() => auth.user?.name || "Bạn");
const userAvatar = computed(
  () => auth.user?.avatar_url || auth.user?.avatar || null,
);
async function load(page = 1) {
  const token = ++seq;
  loading.value = true;
  error.value = "";
  try {
    const r = await newsApi.get(
      `${base()}/${mine.value ? "my-comments" : "comments"}`,
      { page },
    );
    if (token !== seq) return;
    rows.value = r.data;
    meta.value = r;
    if (!rows.value.length && page > 1) return await load(page - 1);
  } catch (e) {
    if (token === seq) error.value = errorText(e);
  } finally {
    if (token === seq) loading.value = false;
  }
}
async function getReplies(c, page = 1) {
  if (replyLoading.value[c.id]) return;
  const token = seq;
  replyLoading.value[c.id] = true;
  try {
    const r = await newsApi.get(`${base()}/comments`, {
      parent_id: c.id,
      page,
    });
    if (token !== seq) return;
    const items =
      page === 1 ? r.data : [...(replies.value[c.id]?.data || []), ...r.data];
    replies.value[c.id] = {
      ...r,
      data: [...new Map(items.map((x) => [x.id, x])).values()].sort(
        (a, b) => a.id - b.id,
      ),
    };
  } catch (e) {
    if (token === seq) error.value = errorText(e);
  } finally {
    replyLoading.value[c.id] = false;
  }
}
function cancel() {
  replyTarget.value = null;
  replyText.value = "";
  editTarget.value = null;
  editText.value = "";
}
async function reply(c) {
  cancel();
  replyTarget.value = { id: c.parent_id || c.id, author: c.author };
  if (mine.value) {
    mine.value = false;
    await load();
  }
  await nextTick();
  const input = Array.isArray(replyInput.value)
    ? replyInput.value[0]
    : replyInput.value;
  input?.focus();
}
async function edit(c) {
  cancel();
  editTarget.value = c;
  editText.value = c.content;
  await nextTick();
  document.getElementById(`edit-comment-${c.id}`)?.focus();
}
async function send(kind = "root") {
  const value = (
    kind === "edit"
      ? editText.value
      : kind === "reply"
        ? replyText.value
        : text.value
  ).trim();
  if (sending.value || !value) return;
  const token = seq,
    articleSlug = props.slug,
    parent = kind === "reply" ? replyTarget.value?.id : null;
  const edited = editTarget.value;
  sending.value = true;
  error.value = "";
  try {
    const r = await newsApi.write(
      kind === "edit" ? "patch" : "post",
      kind === "edit"
        ? `/api/v1/news-comments/${edited.id}`
        : `${base()}/comments`,
      { content: value, ...(parent ? { parent_id: parent } : {}) },
    );
    if (articleSlug !== props.slug) return;
    if (kind === "edit") {
      edited.content = value;
      cancel();
    } else if (kind === "reply") {
      cancel();
      const root = rows.value.find((c) => c.id === parent);
      if (root) {
        root.replies_count++;
        await getReplies(root);
        if (
          r.data &&
          replies.value[parent] &&
          !replies.value[parent].data.some((c) => c.id === r.data.id)
        )
          replies.value[parent].data.push(r.data);
      }
    } else {
      text.value = "";
      mine.value = false;
      replies.value = {};
      cancel();
      await load();
    }
  } catch (e) {
    if (token === seq) error.value = errorText(e);
  } finally {
    sending.value = false;
  }
}
async function remove(c) {
  if (
    !confirm(
      c.parent_id
        ? "Xóa phản hồi này?"
        : "Xóa bình luận này? Các phản hồi bên dưới cũng sẽ bị xóa.",
    )
  )
    return;
  if (sending.value) return;
  sending.value = true;
  error.value = "";
  try {
    await newsApi.write("delete", `/api/v1/news-comments/${c.id}`);
    cancel();
    replies.value = {};
    await load(meta.value.current_page || 1);
  } catch (e) {
    error.value = errorText(e);
  } finally {
    sending.value = false;
  }
}
async function hide(c) {
  if (
    sending.value ||
    !confirm(
      "Ẩn bình luận này khỏi bài viết? Nếu là bình luận gốc, các phản hồi cũng sẽ tạm ẩn theo.",
    )
  )
    return;
  sending.value = true;
  error.value = "";
  try {
    await newsApi.write("patch", `/api/v1/news-comment-moderation/${c.id}`, {
      status: "hidden",
    });
    cancel();
    replies.value = {};
    await load(meta.value.current_page || 1);
  } catch (e) {
    error.value = errorText(e);
  } finally {
    sending.value = false;
  }
}
async function toggleMine() {
  cancel();
  replies.value = {};
  mine.value = !mine.value;
  await load();
}
watch(
  () => props.slug,
  () => {
    rows.value = [];
    replies.value = {};
    cancel();
    text.value = "";
    load();
  },
);
watch(
  () => auth.isLoggedIn,
  () => {
    mine.value = false;
    cancel();
    replies.value = {};
    text.value = "";
    load();
  },
);
onMounted(() => load());
onBeforeUnmount(() => seq++);
</script>
<template>
  <section
    class="panel news-comments"
    id="comments"
    aria-labelledby="news-comments-title"
  >
    <div class="row between news-comments-header">
      <h2 id="news-comments-title">Bình luận</h2>
      <button
        v-if="auth.isLoggedIn"
        class="news-filter"
        :disabled="sending"
        @click="toggleMine"
      >
        {{ mine ? "Tất cả bình luận" : "Bình luận của tôi" }}
      </button>
    </div>
    <p class="muted news-comments-help">
      Cùng chia sẻ kinh nghiệm và trao đổi lịch sự, đúng chủ đề.
    </p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form
      v-if="auth.isLoggedIn"
      class="news-composer"
      @submit.prevent="send('root')"
    >
      <NewsAvatar :src="userAvatar" :name="userName" />
      <div class="news-composer-main">
        <label class="news-sr-only" for="comment-input"
          >Nội dung bình luận</label
        >
        <textarea
          id="comment-input"
          ref="rootInput"
          v-model="text"
          rows="2"
          required
          maxlength="3000"
          :disabled="sending"
          placeholder="Viết bình luận…"
        />
        <div class="news-composer-footer">
          <span class="muted">{{ text.length }}/3000</span
          ><button class="primary" :disabled="sending || !text.trim()">
            {{ sending ? "Đang gửi…" : "Gửi bình luận" }}
          </button>
        </div>
      </div>
    </form>
    <p v-else class="notice">
      <RouterLink :to="{ path: '/login', query: { redirect: '/news/' + slug } }"
        >Đăng nhập</RouterLink
      >
      để tham gia bình luận.
    </p>
    <p v-if="loading" class="muted" role="status">Đang tải bình luận…</p>
    <div class="news-comment-list" :aria-busy="loading">
      <article v-for="c in rows" :key="c.id" class="news-thread">
        <NewsCommentItem
          :comment="c"
          :own="own(c)"
          :can-reply="!mine && auth.isLoggedIn"
          :can-hide="canHide(c)"
          :show-status="mine"
          :disabled="sending"
          @reply="reply"
          @edit="edit"
          @remove="remove"
          @hide="hide"
        >
          <form
            v-if="editTarget?.id === c.id"
            class="news-inline-form"
            @submit.prevent="send('edit')"
          >
            <label class="news-sr-only" :for="`edit-comment-${c.id}`"
              >Sửa bình luận</label
            >
            <textarea
              :id="`edit-comment-${c.id}`"
              v-model="editText"
              rows="2"
              required
              maxlength="3000"
            />
            <div class="row">
              <button class="primary" :disabled="sending || !editText.trim()">
                Lưu chỉnh sửa</button
              ><button type="button" :disabled="sending" @click="cancel">
                Hủy
              </button>
            </div>
          </form>
          <template v-if="!mine">
            <button
              v-if="c.replies_count && !replies[c.id]"
              class="news-replies-toggle"
              :disabled="replyLoading[c.id]"
              @click="getReplies(c)"
            >
              {{
                replyLoading[c.id]
                  ? "Đang tải…"
                  : `Xem ${c.replies_count} phản hồi`
              }}
            </button>
            <div v-if="replies[c.id]?.data.length" class="news-replies">
              <NewsCommentItem
                v-for="child in replies[c.id].data"
                :key="child.id"
                :comment="child"
                :own="own(child)"
                :can-reply="auth.isLoggedIn"
                :can-hide="canHide(child)"
                :disabled="sending"
                @reply="reply"
                @edit="edit"
                @remove="remove"
                @hide="hide"
              >
                <form
                  v-if="editTarget?.id === child.id"
                  class="news-inline-form"
                  @submit.prevent="send('edit')"
                >
                  <label class="news-sr-only" :for="`edit-comment-${child.id}`"
                    >Sửa phản hồi</label
                  >
                  <textarea
                    :id="`edit-comment-${child.id}`"
                    v-model="editText"
                    rows="2"
                    required
                    maxlength="3000"
                  />
                  <div class="row">
                    <button
                      class="primary"
                      :disabled="sending || !editText.trim()"
                    >
                      Lưu chỉnh sửa</button
                    ><button type="button" :disabled="sending" @click="cancel">
                      Hủy
                    </button>
                  </div>
                </form>
              </NewsCommentItem>
            </div>
            <button
              v-if="replies[c.id]?.current_page < replies[c.id]?.last_page"
              class="news-replies-toggle"
              :disabled="replyLoading[c.id]"
              @click="getReplies(c, replies[c.id].current_page + 1)"
            >
              Xem thêm phản hồi
            </button>
            <form
              v-if="replyTarget?.id === c.id"
              class="news-composer news-reply-composer"
              @submit.prevent="send('reply')"
            >
              <NewsAvatar :src="userAvatar" :name="userName" />
              <div class="news-composer-main">
                <p class="news-reply-label">
                  Đang trả lời <strong>{{ replyTarget.author }}</strong>
                </p>
                <label class="news-sr-only" :for="`reply-comment-${c.id}`"
                  >Nội dung trả lời</label
                >
                <textarea
                  :id="`reply-comment-${c.id}`"
                  ref="replyInput"
                  v-model="replyText"
                  rows="2"
                  required
                  maxlength="3000"
                  :disabled="sending"
                  placeholder="Viết câu trả lời…"
                />
                <div class="news-composer-footer">
                  <button type="button" :disabled="sending" @click="cancel">
                    Hủy</button
                  ><button
                    class="primary"
                    :disabled="sending || !replyText.trim()"
                  >
                    Gửi trả lời
                  </button>
                </div>
              </div>
            </form>
          </template>
        </NewsCommentItem>
      </article>
    </div>
    <p v-if="!loading && !rows.length" class="empty">
      {{
        mine
          ? "Bạn chưa có bình luận nào."
          : "Chưa có bình luận. Hãy bắt đầu cuộc trao đổi."
      }}
    </p>
    <nav
      v-if="meta.last_page > 1"
      class="row pager"
      aria-label="Trang bình luận"
    >
      <button
        :disabled="loading || sending || meta.current_page <= 1"
        @click="load(meta.current_page - 1)"
      >
        Trước</button
      ><span>{{ meta.current_page }} / {{ meta.last_page }}</span
      ><button
        :disabled="loading || sending || meta.current_page >= meta.last_page"
        @click="load(meta.current_page + 1)"
      >
        Sau
      </button>
    </nav>
  </section>
</template>