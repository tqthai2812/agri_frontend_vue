<script setup>
import { Icon } from "@iconify/vue";
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";

const store = useDeliveryMethodStore();

const emit = defineEmits(["search", "filter-change", "reset"]);
</script>

<template>
    <div class="mb-5 flex flex-wrap gap-3">
        <div class="search-box">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />
            <input v-model.trim="store.filters.search" type="search" maxlength="255"
                aria-label="Tìm phương thức giao hàng" placeholder="Tìm tên, mô tả..." class="search-input"
                :disabled="store.busy" @input="emit('search')" />
        </div>

        <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none" aria-label="Lọc trạng thái"
            :disabled="store.busy" @change="emit('filter-change')">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang bật</option>
            <option value="0">Đã tắt</option>
        </select>

        <select v-model="store.filters.region" class="filter-select flex-1 sm:flex-none" aria-label="Lọc khu vực"
            :disabled="store.busy || !store.regionsLoaded" @change="emit('filter-change')">
            <option value="">Tất cả khu vực</option>
            <option v-for="region in store.shippingRegions" :key="region.value" :value="region.value">
                {{ region.label }}
            </option>
        </select>

        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.busy"
            @click="emit('reset')">
            <Icon icon="solar:restart-bold" />
            Xóa lọc
        </button>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.search-box {
    @apply flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2;
}

.search-input {
    @apply w-full bg-transparent text-sm outline-none;
}
</style>