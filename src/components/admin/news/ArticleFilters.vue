<script setup>
import { Icon } from "@iconify/vue";
defineProps({ search: String, status: String, labels: Object, busy: Boolean });
const emit = defineEmits(["update:search", "update:status", "submit", "reset"]);
</script>

<template>
<form class="mb-5 flex flex-wrap gap-3" @submit.prevent="emit('submit')">
  <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
    <Icon icon="solar:magnifer-bold" class="text-text-light" />
    <input :value="search" type="search" aria-label="Tìm bài viết" placeholder="Tìm theo tiêu đề…" class="w-full bg-transparent text-sm outline-none" @input="emit('update:search', $event.target.value)" />
  </div>
  <select :value="status" class="filter-select flex-1 sm:flex-none" aria-label="Trạng thái bài viết" @change="emit('update:status', $event.target.value); emit('submit')">
    <option value="">Tất cả trạng thái</option><option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option>
  </select>
  <button type="submit" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy"><Icon icon="solar:magnifer-bold" />Tìm kiếm</button>
  <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')"><Icon icon="solar:restart-bold" />Xóa lọc</button>
</form>
</template>