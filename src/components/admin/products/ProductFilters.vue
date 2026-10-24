<script setup>
import { Icon } from "@iconify/vue";
import { useProductStore } from "@/stores/admin/productStore";

const store = useProductStore();

const emit = defineEmits(["search", "category-change", "filter-change", "reset"]);
</script>

<template>
    <div class="mb-5 flex flex-wrap gap-3">
        <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />
            <input v-model.trim="store.filters.search" type="search" maxlength="255" aria-label="Tìm sản phẩm"
                placeholder="Tìm tên sản phẩm, SKU, danh mục..." class="w-full bg-transparent text-sm outline-none"
                @input="emit('search')" />
        </div>

        <select v-model="store.filters.category_id" class="filter-select flex-1 sm:flex-none" aria-label="Danh mục"
            @change="emit('category-change')">
            <option value="">Tất cả danh mục</option>
            <option v-for="category in store.categories" :key="category.id" :value="category.id">
                {{ category.name }}
            </option>
        </select>

        <select v-model="store.filters.subcategory_id" class="filter-select flex-1 sm:flex-none"
            aria-label="Danh mục con" :disabled="!store.filters.category_id" @change="emit('filter-change')">
            <option value="">Tất cả danh mục con</option>
            <option v-for="subcategory in store.filterSubcategories" :key="subcategory.id" :value="subcategory.id">
                {{ subcategory.name }}
            </option>
        </select>

        <select v-model="store.filters.origin_id" class="filter-select flex-1 sm:flex-none" aria-label="Xuất xứ"
            @change="emit('filter-change')">
            <option value="">Tất cả xuất xứ</option>
            <option v-for="origin in store.origins" :key="origin.id" :value="origin.id">
                {{ origin.origin_name }}
            </option>
        </select>

        <select v-model="store.filters.is_show" class="filter-select flex-1 sm:flex-none"
            aria-label="Trạng thái hiển thị" @change="emit('filter-change')">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hiển thị</option>
            <option value="0">Đang ẩn</option>
        </select>

        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')">
            <Icon icon="solar:restart-bold" />
            Xóa lọc
        </button>
    </div>
</template>