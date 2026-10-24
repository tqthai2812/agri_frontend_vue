<script setup>
import { Icon } from "@iconify/vue";
import { useCatalogStore } from "@/stores/admin/catalogStore";

const store = useCatalogStore();

const emit = defineEmits(["search"]);
</script>

<template>
    <div v-if="store.activeTab === 'categories'" class="flex flex-col sm:flex-row gap-3 justify-between mb-5">
        <div class="search-box">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />

            <input v-model.trim="store.filters.categorySearch" type="text" placeholder="Tìm danh mục..."
                class="search-input" @input="emit('search', 'category')" />
        </div>
    </div>

    <!-- Subcategory toolbar -->
    <div v-if="store.activeTab === 'subcategories'" class="flex flex-col lg:flex-row gap-3 justify-between mb-5">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <div class="search-box">
                <Icon icon="solar:magnifer-bold" class="text-text-light" />

                <input v-model.trim="store.filters.subcategorySearch" type="text" placeholder="Tìm danh mục con..."
                    class="search-input" @input="emit('search', 'subcategory')" />
            </div>

            <select v-model="store.filters.subcategoryCategoryId" class="filter-select"
                @change="store.fetchSubcategories">
                <option value="">Tất cả danh mục cha</option>
                <option v-for="category in store.categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                </option>
            </select>
        </div>
    </div>

    <!-- Origin toolbar -->
    <div v-if="store.activeTab === 'origins'" class="flex flex-col sm:flex-row gap-3 justify-between mb-5">
        <div class="search-box">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />

            <input v-model.trim="store.filters.originSearch" type="text" placeholder="Tìm xuất xứ..."
                class="search-input" @input="emit('search', 'origin')" />
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.search-box {
    @apply flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[220px];
}

.search-input {
    @apply bg-transparent outline-none text-sm w-full;
}
</style>