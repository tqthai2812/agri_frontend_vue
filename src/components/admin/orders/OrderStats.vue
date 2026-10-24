<script setup>
import { useOrderStore } from "@/stores/admin/orderStore";
import { tabs } from "@/utils/orderPresentation";

const store = useOrderStore();

const statStyles = {
    all: { border: "border-l-info", text: "text-info" },
    pending: { border: "border-l-warning", text: "text-warning" },
    confirmed: { border: "border-l-info", text: "text-info" },
    shipping: { border: "border-l-primary", text: "text-primary" },
    completed: { border: "border-l-success", text: "text-success" },
    cancelled: { border: "border-l-danger", text: "text-danger" },
};
</script>

<template>
    <div class="mb-2 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div v-for="tab in tabs" :key="tab.countKey" class="stat-card" :class="statStyles[tab.countKey].border">
            <div class="text-xs font-medium text-text-light">{{ tab.label }}</div>
            <div class="font-mono text-2xl font-bold" :class="statStyles[tab.countKey].text">
                {{ store.statusCounts[tab.countKey] }}
            </div>
        </div>
    </div>
    <p class="mb-5 text-xs text-text-light">
        Số lượng trên là tổng toàn hệ thống, không thay đổi theo bộ lọc.
    </p>
</template>

<style scoped>
@reference "../../../style.css";

.stat-card {
    @apply rounded-2xl border-l-4 bg-surface p-4 shadow-sm;
}
</style>