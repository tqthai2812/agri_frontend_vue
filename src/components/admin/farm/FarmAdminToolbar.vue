<script setup>
import { Icon } from "@iconify/vue";
defineProps({ filters: { type: Object, required: true }, loading: Boolean });
defineEmits(["refresh"]);
</script>
<template>
  <div class="mb-5 flex flex-col gap-3 sm:flex-row">
    <label class="relative flex-1">
      <span class="sr-only">Tìm kiếm</span>
      <Icon
        icon="solar:magnifer-linear"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-text-light"
      />
      <input
        v-model="filters.search"
        type="search"
        maxlength="255"
        class="form-control !pl-10"
        placeholder="Tìm kiếm..."
      />
    </label>
    <select
      v-model="filters.is_active"
      class="form-control sm:!w-48"
      aria-label="Lọc trạng thái"
    >
      <option value="">Tất cả trạng thái</option>
      <option value="1">Đang hiển thị</option>
      <option value="0">Đang ẩn / Bản nháp</option>
    </select>
    <button
      type="button"
      :disabled="loading"
      class="btn-outline cursor-pointer disabled:cursor-not-allowed"
      @click="$emit('refresh')"
    >
      <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': loading }" />
      Tải lại
    </button>
  </div>
</template>