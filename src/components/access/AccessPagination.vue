<script setup>
import { computed } from "vue";
const props = defineProps({
  meta: { type: Object, required: true },
  busy: Boolean,
});
defineEmits(["change"]);
const pages = computed(() => {
  const start = Math.max(1, props.meta.current_page - 2),
    end = Math.min(props.meta.last_page, props.meta.current_page + 2);
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, i) => start + i,
  );
});
</script>
<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-text-light"
  >
    <span
      >{{ meta.total }} kết quả · Trang {{ meta.current_page }} /
      {{ meta.last_page }}</span
    >
    <nav aria-label="Phân trang" class="flex gap-1">
      <button
        type="button"
        class="ac-btn"
        :disabled="busy || meta.current_page <= 1"
        @click="$emit('change', meta.current_page - 1)"
      >
        Trước
      </button>
      <button
        v-for="page in pages"
        :key="page"
        type="button"
        class="ac-btn"
        :class="{ 'ac-btn-primary': page === meta.current_page }"
        :aria-current="page === meta.current_page ? 'page' : undefined"
        :disabled="busy"
        @click="$emit('change', page)"
      >
        {{ page }}
      </button>
      <button
        type="button"
        class="ac-btn"
        :disabled="busy || meta.current_page >= meta.last_page"
        @click="$emit('change', meta.current_page + 1)"
      >
        Sau
      </button>
    </nav>
  </div>
</template>