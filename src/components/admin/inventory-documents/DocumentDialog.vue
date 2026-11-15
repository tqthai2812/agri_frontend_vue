<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { onMounted, onBeforeUnmount, ref } from "vue";
const props = defineProps({ title: String, busy: Boolean });
const emit = defineEmits(["close"]);
const element = ref(null);
let previous;
onMounted(() => {
  previous = document.activeElement;
  element.value.showModal();
});
onBeforeUnmount(() => {
  element.value?.close();
  previous?.focus?.();
});
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="element"
      class="stock-doc-dialog stock-docs fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50 product-admin"
      aria-labelledby="stock-document-title"
      @cancel.prevent="!props.busy && emit('close')"
    >
      <header class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
        <h2 class="text-xl font-bold" id="stock-document-title">{{ title }}</h2>
        <button
          type="button"
          class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
          :disabled="busy"
          aria-label="Đóng cửa sổ phiếu kho"
          @click="emit('close')"
        >
          <Icon icon="solar:close-circle-bold" />
        </button>
      </header>
      <div class="space-y-6 p-5 sm:p-6"><slot /></div>
      <footer class="sticky bottom-0 z-10 flex flex-col justify-between gap-3 border-t border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <slot name="footer" />
      </footer>
    </dialog>
  </Teleport>
</template>