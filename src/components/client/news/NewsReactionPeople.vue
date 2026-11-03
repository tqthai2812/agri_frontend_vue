<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { newsApi, errorText } from "@/services/newsStudio.service";
import NewsAvatar from "./NewsAvatar.vue";
const props = defineProps({ target: { type: Object, default: null } });
const emit = defineEmits(["close"]);
const dialog = ref(),
  type = ref("like"),
  rows = ref([]),
  meta = ref({}),
  busy = ref(false),
  error = ref("");
let sequence = 0,
  locked = false,
  oldOverflow = "";
function unlock() {
  if (locked) {
    document.body.style.overflow = oldOverflow;
    locked = false;
  }
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
  if (!props.target) return;
  const token = ++sequence;
  busy.value = true;
  error.value = "";
  rows.value = [];
  try {
    const r = await newsApi.get(
      `/api/v1/news-comments/${props.target.id}/reactions`,
      { type: type.value, page },
    );
    if (token !== sequence) return;
    rows.value = r.data;
    meta.value = r;
    if (!rows.value.length && page > 1) return await load(page - 1);
  } catch (e) {
    if (token === sequence)
      error.value =
        e.response?.status === 404
          ? "Bình luận đã bị ẩn hoặc không còn tồn tại."
          : errorText(e);
  } finally {
    if (token === sequence) busy.value = false;
  }
}
function choose(value) {
  type.value = value;
  load();
}
watch(
  [() => props.target, dialog],
  ([target, element]) => {
    if (!element) return;
    if (target) {
      if (!element.open) {
        oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        locked = true;
        element.showModal();
      }
      type.value = target.type || "like";
      meta.value = {};
      load();
    } else {
      sequence++;
      rows.value = [];
      meta.value = {};
      error.value = "";
      busy.value = false;
      if (element.open) element.close();
      unlock();
    }
  },
  { flush: "post" },
);
onBeforeUnmount(() => {
  sequence++;
  dialog.value?.close();
  unlock();
});
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="nf-news news-reactions-dialog"
      aria-label="Người đã tương tác"
      @cancel.prevent="close"
      @close="
        unlock();
        close();
      "
      @click="outside"
    >
      <header class="news-reactions-header">
        <h2>Người đã tương tác</h2>
        <button
          type="button"
          aria-label="Đóng danh sách tương tác"
          autofocus
          @click="close"
        >
          ×
        </button>
      </header>
      <div class="news-reactions-tabs">
        <button
          type="button"
          :aria-pressed="type === 'like'"
          @click="choose('like')"
        >
          Thích</button
        ><button
          type="button"
          :aria-pressed="type === 'dislike'"
          @click="choose('dislike')"
        >
          Không thích
        </button>
      </div>
      <div class="news-reactions-body">
        <p v-if="busy" class="muted" role="status">Đang tải…</p>
        <div v-else-if="error">
          <p class="error" role="alert">{{ error }}</p>
          <button type="button" @click="load()">Thử lại</button>
        </div>
        <template v-else>
          <p class="muted">
            {{ meta.total || 0 }} người
            {{ type === "like" ? "đã thích" : "đã không thích" }}
          </p>
          <ul class="news-reaction-users">
            <li v-for="person in rows" :key="person.user_id">
              <NewsAvatar
                :name="person.name"
                :src="person.avatar_url"
              /><span>{{ person.name }}</span>
            </li>
          </ul>
          <p v-if="!rows.length" class="muted">
            Chưa có lượt tương tác loại này.
          </p>
          <nav
            v-if="meta.last_page > 1"
            class="row pager"
            aria-label="Trang người tương tác"
          >
            <button
              type="button"
              :disabled="meta.current_page <= 1"
              @click="load(meta.current_page - 1)"
            >
              Trước</button
            ><span>{{ meta.current_page }} / {{ meta.last_page }}</span
            ><button
              type="button"
              :disabled="meta.current_page >= meta.last_page"
              @click="load(meta.current_page + 1)"
            >
              Sau
            </button>
          </nav>
        </template>
      </div>
    </dialog>
  </Teleport>
</template>