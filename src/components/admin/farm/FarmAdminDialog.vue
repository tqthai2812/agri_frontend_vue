<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  title: { type: String, required: true },
  busy: Boolean,
});
const emit = defineEmits(["close"]);
const dialog = ref(null);
let previous, previousOverflow;
function close() {
  if (!props.busy) emit("close");
}
function keydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
  if (event.key !== "Tab") return;
  const nodes = [
    ...dialog.value.querySelectorAll(
      "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
    ),
  ].filter((node) => node.getClientRects().length);
  const first = nodes[0],
    last = nodes.at(-1);
  if (!first) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  previous = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  dialog.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  if (previous?.isConnected) previous.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-3 sm:p-6"
      @click.self="close"
    >
      <section
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        class="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface text-text shadow-2xl outline-none"
        @keydown="keydown"
      >
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-border p-5"
        >
          <h2 class="text-lg font-bold">{{ title }}</h2>
          <button
            type="button"
            :disabled="busy"
            aria-label="Đóng cửa sổ"
            class="grid size-9 cursor-pointer place-items-center rounded-xl hover:bg-primary/10 disabled:cursor-not-allowed"
            @click="close"
          >
            <Icon icon="solar:close-circle-linear" class="text-2xl" />
          </button>
        </header>
        <div class="overflow-y-auto p-5"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>