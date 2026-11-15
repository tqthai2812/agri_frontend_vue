<script>
const stack = [];
let previousOverflow = "";
</script>
<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
const props = defineProps({ title: String, busy: Boolean });
const emit = defineEmits(["close"]);
const panel = ref(null);
const token = Symbol();
let previous;
function close() {
  if (!props.busy && stack.at(-1) === token) emit("close");
}
function keys(e) {
  if (stack.at(-1) !== token) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  }
  if (e.key !== "Tab") return;
  const list = [
    ...panel.value.querySelectorAll(
      'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
    ),
  ].filter((x) => x.getClientRects().length);
  if (!list.length) {
    e.preventDefault();
    panel.value.focus();
    return;
  }
  const first = list[0],
    last = list.at(-1);
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      !panel.value.contains(document.activeElement))
  ) {
    e.preventDefault();
    last.focus();
  } else if (
    !e.shiftKey &&
    (document.activeElement === last ||
      !panel.value.contains(document.activeElement))
  ) {
    e.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  previous = document.activeElement;
  if (!stack.length) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  stack.push(token);
  document.addEventListener("keydown", keys);
  await nextTick();
  panel.value?.focus();
});
onBeforeUnmount(() => {
  stack.splice(stack.indexOf(token), 1);
  document.removeEventListener("keydown", keys);
  if (!stack.length) document.body.style.overflow = previousOverflow;
  previous?.isConnected && previous.focus();
});
</script>
<template>
  <Teleport to="body">
    <div class="finance fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 sm:p-6 product-admin" @click.self="close">
      <section ref="panel" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1"
        class="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface text-text shadow-2xl">
        <header class="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
          <h2 class="text-xl font-bold">{{ title }}</h2>
          <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
            aria-label="Đóng cửa sổ" :disabled="busy" @click="close">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </header>
        <div class="min-h-0 space-y-6 overflow-y-auto p-5 sm:p-6"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>