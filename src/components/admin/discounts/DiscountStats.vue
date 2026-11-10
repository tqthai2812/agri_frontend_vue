<script setup>
import { useDiscountStore } from "@/stores/admin/discountStore";

const store = useDiscountStore();
</script>

<template>
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm">
                <div class="text-xs font-medium text-text-light">Theo bộ lọc</div>
                <div class="font-mono text-2xl font-bold text-info">{{ store.meta.total }}</div>
            </div>

            <div class="rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm">
                <div class="text-xs font-medium text-text-light">Có hiệu lực · trang này</div>
                <div class="font-mono text-2xl font-bold text-success">{{ store.availableDiscounts.length }}</div>
            </div>

            <div class="rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm">
                <div class="text-xs font-medium text-text-light">Hết hạn · trang này</div>
                <div class="font-mono text-2xl font-bold">{{ store.expiredDiscounts.length }}</div>
            </div>

            <div class="rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm">
                <div class="text-xs font-medium text-text-light">Đã tắt / hết lượt · trang này</div>
                <div class="font-mono text-2xl font-bold text-danger">
                    {{ store.inactiveDiscounts.length + store.usedUpDiscounts.length }}
                </div>
            </div>
        </div>
</template>