<script setup>
import { useOrderStore } from "@/stores/admin/orderStore";
import { tabs } from "@/utils/orderPresentation";

const store = useOrderStore();

const emit = defineEmits(["select"]);
</script>

<template>
    <div class="mb-5 flex flex-wrap gap-2">
        <button v-for="tab in tabs" :key="tab.countKey" type="button"
            class="tab-btn cursor-pointer disabled:cursor-not-allowed"
            :class="{ active: store.filters.order_status === tab.key }" :disabled="store.busy"
            @click="emit('select', tab.key)">
            {{ tab.label }}
        </button>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.tab-btn {
    @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-text-sec hover:bg-primary/10 hover:text-primary transition;
}

.tab-btn.active {
    @apply bg-primary text-white hover:bg-primary hover:text-white;
}
</style>