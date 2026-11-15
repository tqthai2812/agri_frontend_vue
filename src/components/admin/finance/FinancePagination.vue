<script setup>
import "@/assets/finance.css";
import { computed } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({ meta: Object, loading: Boolean, count: { type: Number, default: null } });
const visiblePages = computed(() => {
  const current = Number(props.meta?.current_page) || 1;
  const last = Math.max(1, Number(props.meta?.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) pages.push(page);
  return pages;
});
defineEmits(["page"]);
</script>
<template>
  <div v-if="meta" class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row product-admin">
    <span class="text-sm text-text-light">
      <template v-if="count !== null">Hiển thị {{ count }} / {{ meta.total }} dòng</template>
      <template v-else>{{ meta.total }} dòng · Trang {{ meta.current_page }} / {{ meta.last_page }}</template>
    </span>
    <div class="flex flex-wrap justify-center gap-2">
      <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
        aria-label="Trang trước" :disabled="loading || meta.current_page <= 1"
        @click="$emit('page', meta.current_page - 1)">
        <Icon icon="solar:arrow-left-bold" />
      </button>
      <button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
        :class="{ active: page === Number(meta.current_page) }"
        :aria-current="page === Number(meta.current_page) ? 'page' : undefined"
        :disabled="loading" @click="$emit('page', page)">{{ page }}</button>
      <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
        aria-label="Trang sau" :disabled="loading || meta.current_page >= meta.last_page"
        @click="$emit('page', meta.current_page + 1)">
        <Icon icon="solar:arrow-right-bold" />
      </button>
    </div>
  </div>
</template>