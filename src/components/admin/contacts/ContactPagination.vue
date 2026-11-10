<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const store = useAdminContactStore();
const emit = defineEmits(["change"]);
const pages = computed(() => {
  const list = [];
  for (let p = Math.max(1, store.meta.current_page - 2); p <= Math.min(store.meta.last_page, store.meta.current_page + 2); p++) list.push(p);
  return list;
});
</script>

<template>
<nav v-if="!store.listError" aria-label="Phân trang liên hệ" class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
  <span class="text-sm text-text-light">Hiển thị {{ store.contacts.length }} / {{ store.meta.total }} yêu cầu theo bộ lọc</span>
  <div class="flex flex-wrap justify-center gap-2">
    <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang trước" :disabled="store.loading || store.meta.current_page <= 1" @click="emit('change', store.meta.current_page - 1)"><Icon icon="solar:arrow-left-bold" /></button>
    <button v-for="page in pages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" :class="{ active: page === store.meta.current_page }" :aria-current="page === store.meta.current_page ? 'page' : undefined" :disabled="store.loading" @click="emit('change', page)">{{ page }}</button>
    <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sau" :disabled="store.loading || store.meta.current_page >= store.meta.last_page" @click="emit('change', store.meta.current_page + 1)"><Icon icon="solar:arrow-right-bold" /></button>
  </div>
</nav>
</template>