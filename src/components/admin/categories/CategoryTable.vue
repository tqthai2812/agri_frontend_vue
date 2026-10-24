<script setup>
import { Icon } from "@iconify/vue";
import { useCatalogStore } from "@/stores/admin/catalogStore";

const store = useCatalogStore();

const emit = defineEmits(["delete"]);

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("vi-VN");
}
</script>

<template>
    <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải dữ liệu...</p>
    </div>

    <!-- Categories table -->
    <div v-else-if="store.activeTab === 'categories'" class="overflow-x-auto">
        <table class="w-full min-w-[850px]">
            <thead class="bg-bg">
                <tr>
                    <th class="table-th">Danh mục</th>
                    <th class="table-th">Slug</th>
                    <th class="table-th">Mô tả</th>
                    <th class="table-th">Danh mục con</th>
                    <th class="table-th">Sản phẩm</th>
                    <th class="table-th">Ngày tạo</th>
                    <th class="table-th">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="category in store.categories" :key="category.id" class="table-row">
                    <td class="table-td">
                        <div class="flex items-center gap-3">
                            <div class="icon-box bg-primary/10 text-primary">
                                <Icon icon="solar:sort-bold-duotone" />
                            </div>

                            <div>
                                <div class="font-semibold">{{ category.name }}</div>
                                <div class="text-xs text-text-light">ID: {{ category.id }}</div>
                            </div>
                        </div>
                    </td>

                    <td class="table-td">
                        <span class="badge-gray">{{ category.slug }}</span>
                    </td>

                    <td class="table-td max-w-[260px]">
                        <span class="line-clamp-2 text-sm text-text-sec">
                            {{ category.description || "Chưa có mô tả" }}
                        </span>
                    </td>

                    <td class="table-td font-mono">
                        {{ category.subcategories_count ?? category.subcategories?.length ?? 0 }}
                    </td>

                    <td class="table-td font-mono">
                        {{ category.products_count ?? 0 }}
                    </td>

                    <td class="table-td text-sm text-text-light">
                        {{ formatDate(category.created_at) }}
                    </td>

                    <td class="table-td">
                        <div class="flex gap-2">
                            <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Sửa danh mục" aria-label="Sửa danh mục"
                                @click="store.openEditModal('category', category)" :disabled="store.saving">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Xóa danh mục" aria-label="Xóa danh mục" :disabled="store.deleting"
                                @click="emit('delete', 'category', category)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.categories.length">
                    <td colspan="7" class="empty-cell">
                        Chưa có danh mục nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Subcategories table -->
    <div v-else-if="store.activeTab === 'subcategories'" class="overflow-x-auto">
        <table class="w-full min-w-[850px]">
            <thead class="bg-bg">
                <tr>
                    <th class="table-th">Danh mục con</th>
                    <th class="table-th">Danh mục cha</th>
                    <th class="table-th">Slug</th>
                    <th class="table-th">Sản phẩm</th>
                    <th class="table-th">Ngày tạo</th>
                    <th class="table-th">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="subcategory in store.subcategories" :key="subcategory.id" class="table-row">
                    <td class="table-td">
                        <div class="flex items-center gap-3">
                            <div class="icon-box bg-green-50 text-green-600">
                                <Icon icon="solar:folder-with-files-bold-duotone" />
                            </div>

                            <div>
                                <div class="font-semibold">{{ subcategory.name }}</div>
                                <div class="text-xs text-text-light">ID: {{ subcategory.id }}</div>
                            </div>
                        </div>
                    </td>

                    <td class="table-td">
                        {{ subcategory.category_name || subcategory.category?.name || "Chưa có" }}
                    </td>

                    <td class="table-td">
                        <span class="badge-gray">{{ subcategory.slug }}</span>
                    </td>

                    <td class="table-td font-mono">
                        {{ subcategory.products_count ?? 0 }}
                    </td>

                    <td class="table-td text-sm text-text-light">
                        {{ formatDate(subcategory.created_at) }}
                    </td>

                    <td class="table-td">
                        <div class="flex gap-2">
                            <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Sửa danh mục con" aria-label="Sửa danh mục con"
                                @click="store.openEditModal('subcategory', subcategory)" :disabled="store.saving">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Xóa danh mục con" aria-label="Xóa danh mục con" :disabled="store.deleting"
                                @click="emit('delete', 'subcategory', subcategory)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.subcategories.length">
                    <td colspan="6" class="empty-cell">
                        Chưa có danh mục con nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Origins table -->
    <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[760px]">
            <thead class="bg-bg">
                <tr>
                    <th class="table-th">Xuất xứ</th>
                    <th class="table-th">Hình ảnh</th>
                    <th class="table-th">Sản phẩm</th>
                    <th class="table-th">Ngày tạo</th>
                    <th class="table-th">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="origin in store.origins" :key="origin.id" class="table-row">
                    <td class="table-td">
                        <div class="flex items-center gap-3">
                            <div class="icon-box bg-yellow-50 text-yellow-600">
                                <Icon icon="solar:global-bold-duotone" />
                            </div>

                            <div>
                                <div class="font-semibold">{{ origin.origin_name }}</div>
                                <div class="text-xs text-text-light">ID: {{ origin.id }}</div>
                            </div>
                        </div>
                    </td>

                    <td class="table-td">
                        <div
                            class="w-14 h-14 rounded-xl overflow-hidden bg-bg border border-border flex items-center justify-center">
                            <img v-if="origin.origin_image" :src="origin.origin_image" :alt="origin.origin_name"
                                class="w-full h-full object-cover" />

                            <Icon v-else icon="solar:gallery-minimalistic-bold-duotone"
                                class="text-2xl text-text-light" />
                        </div>
                    </td>

                    <td class="table-td font-mono">
                        {{ origin.products_count ?? 0 }}
                    </td>

                    <td class="table-td text-sm text-text-light">
                        {{ formatDate(origin.created_at) }}
                    </td>

                    <td class="table-td">
                        <div class="flex gap-2">
                            <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Sửa xuất xứ" aria-label="Sửa xuất xứ"
                                @click="store.openEditModal('origin', origin)" :disabled="store.saving">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Xóa xuất xứ" aria-label="Xóa xuất xứ" :disabled="store.deleting"
                                @click="emit('delete', 'origin', origin)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.origins.length">
                    <td colspan="5" class="empty-cell">
                        Chưa có xuất xứ nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.table-th {
    @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
    @apply p-3 align-middle;
}

.table-row {
    @apply border-b border-border hover:bg-primary/5 transition;
}

.empty-cell {
    @apply p-8 text-center text-text-light;
}

.icon-box {
    @apply w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0;
}
</style>