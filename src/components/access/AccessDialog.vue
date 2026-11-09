<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({ title: String, busy: Boolean, wide: Boolean });
const emit = defineEmits(["close"]);
const dialog = ref(null);
let priorFocus, previousOverflow;
function close() {
  if (!props.busy) emit("close");
}
onMounted(async () => {
  priorFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  dialog.value?.close();
  document.body.style.overflow = previousOverflow;
  priorFocus?.focus?.();
});
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="ac ac-dialog"
      :class="{ 'ac-dialog-wide': wide }"
      :aria-label="title"
      @cancel.prevent="close"
      @click="
        (event) => {
          if (event.target === dialog) close();
        }
      "
    >
      <header
        class="flex items-center justify-between gap-4 border-b border-border px-5 py-4 shrink-0"
      >
        <h2 class="text-lg font-bold">{{ title }}</h2>
        <button
          type="button"
          class="ac-icon"
          aria-label="Đóng hộp thoại"
          :disabled="busy"
          @click="close"
        >
          <Icon icon="solar:close-circle-bold" class="text-xl" />
        </button>
      </header>
      <div class="overflow-y-auto min-h-0 p-5"><slot /></div>
      <footer
        v-if="$slots.footer"
        class="flex flex-wrap justify-end gap-3 border-t border-border p-4 shrink-0"
      >
        <slot name="footer" />
      </footer>
    </dialog>
  </Teleport>
</template>