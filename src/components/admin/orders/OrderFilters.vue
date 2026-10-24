<script setup>
import { Icon } from "@iconify/vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { paymentMethods } from "@/utils/orderPresentation";

const store = useOrderStore();

const emit = defineEmits(["search", "change", "reset"]);
</script>

<template>
    <fieldset :disabled="store.busy" class="mb-5 flex flex-wrap items-end gap-3">
        <div class="min-w-[220px] flex-1">
            <label for="order-search" class="mb-1 block text-xs text-text-light">
                Tìm kiếm
            </label>
            <div class="flex min-w-[220px] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                <Icon icon="solar:magnifer-bold" class="text-text-light" />
                <input id="order-search" v-model.trim="store.filters.search" type="search"
                    class="w-full bg-transparent text-sm outline-none"
                    placeholder="Mã đơn, khách hàng, sản phẩm, SKU..." @input="emit('search')" />
            </div>
        </div>
        <label>
            <span class="mb-1 block text-xs text-text-light">
                Phương thức thanh toán
            </span>
            <select v-model="store.filters.payment_method" class="filter-select" @change="emit('change')">
                <option value="">Tất cả</option>
                <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                    {{ method.label }}
                </option>
            </select>
        </label>
        <label>
            <span class="mb-1 block text-xs text-text-light">
                Từ ngày
            </span>
            <input v-model="store.filters.date_from" type="date" class="filter-select" @change="emit('change')" />
        </label>
        <label>
            <span class="mb-1 block text-xs text-text-light">
                Đến ngày
            </span>
            <input v-model="store.filters.date_to" type="date" class="filter-select"
                :min="store.filters.date_from || undefined" @change="emit('change')" />
        </label>
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')">
            <Icon icon="solar:restart-bold" />
            Xóa lọc
        </button>
    </fieldset>
</template>