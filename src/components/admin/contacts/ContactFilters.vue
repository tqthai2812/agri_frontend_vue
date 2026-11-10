<script setup>
import { Icon } from "@iconify/vue";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const store = useAdminContactStore();
defineProps({ statusNames: Object });
const emit = defineEmits(["apply", "reset"]);
</script>

<template>
<form class="mb-5 flex flex-wrap items-end gap-3" @submit.prevent="emit('apply')">
  <div class="min-w-[220px] flex-1">
    <label for="contact-search" class="mb-1 block text-xs text-text-light">Tìm kiếm</label>
    <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <Icon icon="solar:magnifer-bold" class="text-text-light" />
      <input id="contact-search" v-model.trim="store.filters.search" maxlength="255" type="search" placeholder="Mã yêu cầu, chủ đề, tên, email, số điện thoại..." class="w-full bg-transparent text-sm outline-none" />
    </div>
  </div>
  <label class="flex-1 sm:flex-none"><span class="mb-1 block text-xs text-text-light">Trạng thái</span>
    <select v-model="store.filters.status" class="filter-select w-full"><option value="">Tất cả</option><option v-for="(label, value) in statusNames" :key="value" :value="value">{{ label }}</option></select>
  </label>
  <label><span class="mb-1 block text-xs text-text-light">Từ ngày</span><input v-model="store.filters.date_from" type="date" class="filter-select" /></label>
  <label><span class="mb-1 block text-xs text-text-light">Đến ngày</span><input v-model="store.filters.date_to" type="date" :min="store.filters.date_from || undefined" class="filter-select" /></label>
  <button type="submit" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.loading"><Icon icon="solar:magnifer-bold" />Áp dụng</button>
  <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.loading" @click="emit('reset')"><Icon icon="solar:restart-bold" />Xóa lọc</button>
</form>
</template>