<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({
  meta: { type: Object, required: true },
  count: { type: Number, default: 0 },
  loading: Boolean,
});
defineEmits(["change"]);
const pages = computed(() => {
  const result = [];
  for (
    let p = Math.max(1, props.meta.current_page - 2);
    p <= Math.min(props.meta.last_page, props.meta.current_page + 2);
    p++
  )
    result.push(p);
  return result;
});
</script>
<template>
  <div
    class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row"
  >
    <span class="text-sm text-text-light"
      >Hiển thị {{ count }} / {{ meta.total }} kết quả</span
    >
    <div class="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        class="page-btn cursor-pointer disabled:cursor-not-allowed"
        aria-label="Trang trước"
        :disabled="loading || meta.current_page <= 1"
        @click="$emit('change', meta.current_page - 1)"
      >
        <Icon icon="solar:arrow-left-bold" />
      </button>
      <button
        v-for="page in pages"
        :key="page"
        type="button"
        class="page-btn cursor-pointer disabled:cursor-not-allowed"
        :class="{ active: page === meta.current_page }"
        :aria-current="page === meta.current_page ? 'page' : undefined"
        :disabled="loading"
        @click="$emit('change', page)"
      >
        {{ page }}
      </button>
      <button
        type="button"
        class="page-btn cursor-pointer disabled:cursor-not-allowed"
        aria-label="Trang sau"
        :disabled="loading || meta.current_page >= meta.last_page"
        @click="$emit('change', meta.current_page + 1)"
      >
        <Icon icon="solar:arrow-right-bold" />
      </button>
    </div>
  </div>
</template>