<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
const props = defineProps({ open: Boolean });
const emit = defineEmits(["update:open"]);
const dialog = ref(),
  content = ref();
let locked = false,
  previousOverflow = "";
function unlock() {
  if (!locked) return;
  document.body.style.overflow = previousOverflow;
  locked = false;
}
function close() {
  emit("update:open", false);
}
function outside(event) {
  if (event.target !== dialog.value) return;
  const rect = dialog.value.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    close();
}
watch(
  [() => props.open, dialog],
  ([open, element]) => {
    if (!element) return;
    if (open && !element.open) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      locked = true;
      element.showModal();
      if (content.value) content.value.scrollTop = 0;
    } else if (!open && element.open) {
      element.close();
      unlock();
    }
  },
  { flush: "post" },
);
onBeforeUnmount(() => {
  dialog.value?.close();
  unlock();
});
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="nf-news news-preview-dialog"
      aria-label="Xem trước bài viết"
      @cancel.prevent="close"
      @close="
        unlock();
        close();
      "
      @click="outside"
    >
      <header class="news-preview-header">
        <div>
          <strong>Xem trước bài viết</strong>
          <p class="muted">Nội dung đang soạn</p>
        </div>
        <button
          type="button"
          class="news-preview-close"
          aria-label="Đóng xem trước"
          autofocus
          @click="close"
        >
          ×
        </button>
      </header>
      <div ref="content" class="news-preview-content"><slot /></div>
    </dialog>
  </Teleport>
</template>