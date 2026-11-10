<script setup>
import { Icon } from "@iconify/vue";
const props = defineProps({ filters: { type: Object, required: true } });
function resetFilters() {
  Object.assign(props.filters, { search: "", is_active: "", per_page: 15 });
}
</script>

<template>
  <div class="mb-5 flex flex-wrap gap-3">
    <label class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span class="sr-only">Tìm kiếm</span>
      <Icon icon="solar:magnifer-bold" class="text-text-light" />
      <input v-model="filters.search" type="search" maxlength="255"
        class="w-full bg-transparent text-sm outline-none" placeholder="Tìm kiếm..." />
    </label>
    <select v-model="filters.is_active" aria-label="Lọc trạng thái"
      class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
      <option value="">Tất cả trạng thái</option>
      <option value="1">Đang hiển thị</option>
      <option value="0">Đang ẩn / Bản nháp</option>
    </select>
    <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="resetFilters">
      <Icon icon="solar:restart-bold" />
      Xóa lọc
    </button>
  </div>
</template>