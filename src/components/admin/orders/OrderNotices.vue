<script setup>
import { computed } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";

const store = useOrderStore();

const alerts = computed(() =>
    [
        { text: store.message, type: "success" },
        { text: store.warningMsg, type: "warning" },
        { text: store.errorMsg, type: "error" },
    ].filter((item) => item.text),
);
</script>

<template>
    <div v-for="alert in alerts" :key="alert.type" :role="alert.type === 'error' ? 'alert' : 'status'" class="notice"
        :class="alert.type">{{ alert.text }}</div>
</template>

<style scoped>
@reference "../../../style.css";

.notice {
    @apply mb-5 rounded-2xl border px-4 py-3 text-sm;
}

.notice.success {
    @apply border-green-100 bg-green-50 text-green-700;
}

.notice.warning {
    @apply border-amber-200 bg-amber-50 text-amber-800;
}

.notice.error {
    @apply border-red-100 bg-red-50 text-red-600;
}
</style>