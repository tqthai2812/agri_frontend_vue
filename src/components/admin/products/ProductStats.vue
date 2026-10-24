<script setup>
import { useProductStore } from "@/stores/admin/productStore";

const store = useProductStore();
</script>

<template>
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm">
            <div class="text-xs font-medium text-text-light">Theo bộ lọc</div>
            <div class="font-mono text-2xl font-bold text-info">
                {{ store.meta.total }}
            </div>
        </div>

        <div class="rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm">
            <div class="text-xs font-medium text-text-light">Hiển thị · trang này</div>
            <div class="font-mono text-2xl font-bold text-success">
                {{ store.visibleProducts.length }}
            </div>
        </div>

        <div class="rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm">
            <div class="text-xs font-medium text-text-light">Đang ẩn · trang này</div>
            <div class="font-mono text-2xl font-bold">
                {{ store.hiddenProducts.length }}
            </div>
        </div>

        <div class="rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm">
            <div class="text-xs font-medium text-text-light">Sắp hết · trang này</div>
            <div class="font-mono text-2xl font-bold text-danger">
                {{ store.lowStockProducts.length }}
            </div>
        </div>
    </div>
</template>