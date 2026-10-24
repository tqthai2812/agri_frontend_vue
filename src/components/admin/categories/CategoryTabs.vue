<script setup>
import { Icon } from "@iconify/vue";
import { useCatalogStore } from "@/stores/admin/catalogStore";

const store = useCatalogStore();

const tabs = [
    {
        value: "categories",
        label: "Danh mục",
        icon: "solar:sort-bold-duotone",
    },
    {
        value: "subcategories",
        label: "Danh mục con",
        icon: "solar:folder-with-files-bold-duotone",
    },
    {
        value: "origins",
        label: "Xuất xứ",
        icon: "solar:global-bold-duotone",
    },
];
</script>

<template>
    <div class="flex flex-wrap gap-2 mb-5 border-b border-border pb-4">
        <button v-for="tab in tabs" :key="tab.value" type="button"
            class="tab-btn cursor-pointer disabled:cursor-not-allowed"
            :class="{ active: store.activeTab === tab.value }" @click="store.activeTab = tab.value">
            <Icon :icon="tab.icon" class="text-lg" />
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