<script setup>
import { useAdminContactStore } from "@/stores/admin/contactStore";
const store = useAdminContactStore();
defineProps({ stats: Array });
const styles = {
  total: { border: "border-l-info", text: "text-info" },
  pending: { border: "border-l-warning", text: "" },
  resolved: { border: "border-l-success", text: "text-success" },
  rejected: { border: "border-l-danger", text: "text-danger" },
};
</script>

<template>
<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
  <div v-for="stat in stats" :key="stat.key" class="rounded-2xl border-l-4 bg-surface p-4 shadow-sm" :class="styles[stat.key].border">
    <div class="text-xs font-medium text-text-light">{{ stat.label }}</div>
    <div class="font-mono text-2xl font-bold" :class="styles[stat.key].text">{{ store.loading || store.listError ? '—' : store.summary[stat.key] }}</div>
  </div>
</div>
</template>