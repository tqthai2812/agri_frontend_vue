<script setup>
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";

const store = useDeliveryMethodStore();
</script>

<template>
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="stat-card-info">
            <div class="stat-label">Tổng kết quả</div>
            <div class="stat-value text-info">{{ store.meta.total }}</div>
        </div>

        <div class="stat-card-success">
            <div class="stat-label">Đang bật trong trang</div>
            <div class="stat-value text-success">
                {{ store.activeMethods.length }}
            </div>
        </div>

        <div class="stat-card-danger">
            <div class="stat-label">Đã tắt trong trang</div>
            <div class="stat-value text-danger">
                {{ store.inactiveMethods.length }}
            </div>
        </div>

        <div class="stat-card-warning">
            <div class="stat-label">Mặc định trong trang</div>
            <div class="truncate text-sm font-bold">
                {{ store.defaultMethod?.name || "Không có trong trang" }}
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
    @apply rounded-2xl border-l-4 bg-surface p-4 shadow-sm;
}

.stat-card-success {
    @apply border-l-success;
}

.stat-card-warning {
    @apply border-l-warning;
}

.stat-card-danger {
    @apply border-l-danger;
}

.stat-card-info {
    @apply border-l-info;
}

.stat-label {
    @apply text-xs font-medium text-text-light;
}

.stat-value {
    @apply font-mono text-2xl font-bold;
}
</style>