<script setup>
import { useUserStore } from "@/stores/admin/userStore";

const store = useUserStore();
</script>

<template>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="stat-card-info">
            <div class="stat-label">Theo bộ lọc</div>
            <div class="stat-value text-info">{{ store.meta.total }}</div>
        </div>

        <div class="stat-card-success">
            <div class="stat-label">Đang hoạt động · trang này</div>
            <div class="stat-value text-success">{{ store.activeUsers.length }}</div>
        </div>

        <div class="stat-card-danger">
            <div class="stat-label">Đã khóa · trang này</div>
            <div class="stat-value text-danger">{{ store.inactiveUsers.length }}</div>
        </div>

        <div class="stat-card-warning">
            <div class="stat-label">Admin · trang này</div>
            <div class="stat-value">{{ store.adminUsers.length }}</div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
    @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
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
    @apply text-text-light text-xs font-medium;
}

.stat-value {
    @apply text-2xl font-bold font-mono;
}
</style>