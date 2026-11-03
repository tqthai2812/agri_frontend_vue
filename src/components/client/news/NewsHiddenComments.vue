<script setup>
import { ref, shallowRef, computed, watch, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { newsApi, errorText, dateText } from "@/services/newsStudio.service";
import NewsAvatar from "./NewsAvatar.vue";
const props = defineProps({
  open: { type: Boolean, default: false },
  slug: { type: String, required: true },
});
const emit = defineEmits(["close", "restored"]);
const auth = useAuthStore();
const allowed = computed(
  () => !!auth.isLoggedIn && !!auth.hasPermission("article.update"),
);
const dialog = ref(),
  rows = ref([]),
  meta = ref({}),
  loading = ref(false),
  error = ref("");
const restoring = shallowRef(null);
let sequence = 0,
  disposed = false,
  locked = false,
  oldOverflow = "";
const base = () =>
  `/api/v1/public/news/${encodeURIComponent(props.slug)}/hidden-comments`;
function unlock() {
  if (!locked) return;
  document.body.style.overflow = oldOverflow;
  locked = false;
}
function close() {
  emit("close");
}
function outside(event) {
  if (event.target !== dialog.value) return;
  const r = dialog.value.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    close();
}
async function load(page = 1) {
  if (!props.open || !allowed.value) return;
  const token = ++sequence;
  loading.value = true;
  error.value = "";
  try {
    const r = await newsApi.get(base(), { page });
    if (token !== sequence || disposed) return;
    if (!r.data.length && page > 1) {
      return await load(Math.min(page - 1, Math.max(1, r.last_page || 1)));
    }
    rows.value = r.data;
    meta.value = r;
  } catch (e) {
    if (token === sequence && !disposed) error.value = errorText(e);
  } finally {
    if (token === sequence && !disposed) loading.value = false;
  }
}
async function restore(c) {
  if (restoring.value || loading.value || !allowed.value || !c.restore_id)
    return;
  const operation = {
    id: c.restore_id,
    slug: props.slug,
    userId: auth.user?.id,
  };
  restoring.value = operation;
  error.value = "";
  try {
    await newsApi.write("patch", `${base()}/${c.restore_id}`);
    if (
      disposed ||
      props.slug !== operation.slug ||
      auth.user?.id !== operation.userId ||
      !allowed.value
    )
      return;
    emit("restored");
    if (props.open) await load(meta.value.current_page || 1);
  } catch (e) {
    if (
      !disposed &&
      props.open &&
      props.slug === operation.slug &&
      auth.user?.id === operation.userId
    )
      error.value = errorText(e);
  } finally {
    if (restoring.value === operation) restoring.value = null;
  }
}
watch(
  [() => props.open, () => props.slug, () => auth.user?.id, allowed, dialog],
  ([open, , , permitted, element]) => {
    if (!element) return;
    sequence++;
    rows.value = [];
    meta.value = {};
    error.value = "";
    loading.value = false;
    if (open && permitted) {
      if (!element.open) {
        oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        locked = true;
        element.showModal();
      }
      load();
    } else {
      if (element.open) element.close();
      unlock();
      if (open) close();
    }
  },
  { flush: "post" },
);
onBeforeUnmount(() => {
  disposed = true;
  sequence++;
  dialog.value?.close();
  unlock();
});
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="nf-news news-hidden-dialog"
      aria-labelledby="news-hidden-title"
      @cancel.prevent="close"
      @close="
        unlock();
        close();
      "
      @click="outside"
    >
      <header class="news-hidden-header">
        <div>
          <h2 id="news-hidden-title">Bình luận bị ẩn</h2>
          <p class="muted">Chỉ các bình luận của bài viết đang xem.</p>
        </div>
        <button
          type="button"
          aria-label="Đóng bình luận bị ẩn"
          autofocus
          @click="close"
        >
          ×
        </button>
      </header>
      <div class="news-hidden-body" :aria-busy="loading || !!restoring">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="row between news-hidden-summary">
          <span class="muted"
            >{{ meta.total || 0 }} bình luận và phản hồi bị ẩn</span
          >
          <button
            type="button"
            :disabled="loading || !!restoring"
            @click="load(meta.current_page || 1)"
          >
            Tải lại
          </button>
        </div>
        <p v-if="loading" class="muted" role="status">
          Đang tải bình luận bị ẩn…
        </p>
        <ul v-else class="news-hidden-list">
          <li
            v-for="c in rows"
            :key="c.id"
            class="news-hidden-item"
            :data-hidden-comment-id="c.id"
          >
            <NewsAvatar :name="c.author" :src="c.avatar_url" />
            <div class="news-hidden-content">
              <div class="news-hidden-author">
                <strong>{{ c.author }}</strong
                ><time :datetime="c.created_at">{{
                  dateText(c.created_at)
                }}</time>
              </div>
              <span class="news-hidden-badge">{{
                c.status === "hidden" ? "Đã bị ẩn" : "Ẩn theo bình luận gốc"
              }}</span>
              <p v-if="c.parent_id" class="news-hidden-parent">
                Trả lời bình luận #{{ c.parent_id
                }}<template v-if="c.parent_excerpt"
                  >: {{ c.parent_excerpt }}</template
                >
              </p>
              <p class="comment-text">{{ c.content }}</p>
              <p v-if="c.hidden_by_parent" class="muted news-hidden-hint">
                Bình luận gốc đang ẩn. Cần hiển thị lại gốc trước<template
                  v-if="c.status === 'hidden'"
                  >, sau đó hiển thị lại phản hồi này</template
                >.
              </p>
              <button
                v-if="c.restore_id"
                type="button"
                class="primary"
                :disabled="!!restoring || loading"
                @click="restore(c)"
              >
                {{
                  restoring?.id === c.restore_id
                    ? "Đang hiển thị lại…"
                    : c.hidden_by_parent
                      ? "Hiển thị bình luận gốc"
                      : "Hiển thị lại"
                }}
              </button>
              <p v-else class="muted news-hidden-hint">
                Cần kiểm tra trạng thái bình luận gốc trong trang quản lý bình
                luận.
              </p>
            </div>
          </li>
        </ul>
        <p v-if="!loading && !error && !rows.length" class="empty">
          Không có bình luận bị ẩn trong bài viết này.
        </p>
        <nav
          v-if="meta.last_page > 1"
          class="row pager"
          aria-label="Trang bình luận bị ẩn"
        >
          <button
            type="button"
            :disabled="loading || !!restoring || meta.current_page <= 1"
            @click="load(meta.current_page - 1)"
          >
            Trước
          </button>
          <span>{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button
            type="button"
            :disabled="
              loading || !!restoring || meta.current_page >= meta.last_page
            "
            @click="load(meta.current_page + 1)"
          >
            Sau
          </button>
        </nav>
      </div>
    </dialog>
  </Teleport>
</template>