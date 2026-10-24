<script setup>
import { useCatalogStore } from "@/stores/admin/catalogStore";

const store = useCatalogStore();
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="stat-card-info">
            <div class="stat-label">Danh mục</div>
            <div class="stat-value text-info">{{ store.totalCategories }}</div>
        </div>

        <div class="stat-card-success">
            <div class="stat-label">Danh mục con</div>
            <div class="stat-value text-success">{{ store.totalSubcategories }}</div>
        </div>

        <div class="stat-card-warning">
            <div class="stat-label">Xuất xứ</div>
            <div class="stat-value">{{ store.totalOrigins }}</div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-info {
    @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
}

.stat-card-success {
    @apply border-l-success;
}

.stat-card-warning {
    @apply border-l-warning;
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