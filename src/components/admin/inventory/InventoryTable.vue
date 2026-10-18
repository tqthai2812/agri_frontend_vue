<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { money, quantity, stockBadge } from "@/utils/inventoryDisplay";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
const authStore = useAuthStore();
const canCreate = computed(() => authStore.hasPermission("inventory.create"));
const canUpdate = computed(() => authStore.hasPermission("inventory.update"));
const emit = defineEmits([
    "search",
    "filter-change",
    "reset-filters",
    "change-page",
    "open-panel",
]);
const visiblePages = computed(() => {
    const pages = [];
    const current = store.meta.current_page;
    const last = store.meta.last_page;

    for (
        let page = Math.max(1, current - 2);
        page <= Math.min(last, current + 2);
        page += 1
    ) {
        pages.push(page);
    }

    return pages;
});
function canInitialize(item) {
    return canUpdate.value && item.lot_count === 0 && item.quantity_available > 0;
}

function isLow(item) {
    return (
        item.quantity_available !== null &&
        item.reorder_level !== null &&
        item.quantity_available <= item.reorder_level
    );
}
</script>

<template>
    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div class="mb-5 flex flex-wrap gap-3">
            <div class="search-box">
                <Icon icon="solar:magnifer-bold" />
                <input v-model.trim="store.filters.search" class="search-input"
                    placeholder="Tìm sản phẩm, SKU, barcode..." aria-label="Tìm tồn kho" @input="emit('search')" />
            </div>

            <select v-model="store.filters.category_id" class="filter-select" aria-label="Lọc danh mục"
                :disabled="store.loadingOptions" @change="emit('filter-change')">
                <option value="">Tất cả danh mục</option>
                <option v-for="category in store.categories" :key="category.id" :value="category.id">
                    {{ category.name || category.category_name }}
                </option>
            </select>

            <select v-model="store.filters.status" class="filter-select" aria-label="Lọc tồn vật lý"
                @change="emit('filter-change')">
                <option value="">Tất cả tồn vật lý</option>
                <option value="available">Còn hàng</option>
                <option value="low">Sắp hết</option>
                <option value="out">Hết tồn</option>
            </select>

            <button type="button" class="btn-outline-sm" @click="emit('reset-filters')">
                Xóa lọc
            </button>
        </div>

        <div v-if="store.loading" class="empty-cell">Đang tải tồn kho...</div>

        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[1200px]">
                <thead class="bg-bg">
                    <tr>
                        <th class="table-th">Sản phẩm / SKU</th>
                        <th class="table-th">Danh mục</th>
                        <th class="table-th">Quy cách / Giá</th>
                        <th class="table-th">Tồn vật lý</th>
                        <th class="table-th">Đang giữ</th>
                        <th class="table-th">Có thể bán</th>
                        <th class="table-th">Lô / Đối soát</th>
                        <th class="table-th">Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in store.inventory" :key="item.id" class="table-row">
                        <td class="table-td">
                            <div class="flex items-center gap-3">
                                <div
                                    class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-bg">
                                    <img v-if="item.product?.primary_image" :src="item.product.primary_image"
                                        :alt="item.product?.name || 'Sản phẩm'" class="size-full object-cover" />
                                    <Icon v-else icon="solar:box-bold-duotone" />
                                </div>

                                <div>
                                    <div class="max-w-[240px] truncate font-semibold">
                                        {{ item.product?.name || "Không rõ sản phẩm" }}
                                    </div>
                                    <div class="text-xs text-text-light">
                                        {{ item.variant?.name || "—" }}
                                    </div>
                                    <div class="font-mono text-xs">{{ item.sku }}</div>
                                    <div v-if="item.barcode" class="text-xs text-text-light">
                                        Barcode: {{ item.barcode }}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td class="table-td">
                            <div>{{ item.category?.name || "—" }}</div>
                            <div class="text-xs text-text-light">
                                {{ item.subcategory?.name || "—" }}
                            </div>
                        </td>

                        <td class="table-td">
                            <div>{{ item.size }} {{ item.unit }}</div>
                            <div class="font-mono text-xs">{{ money(item.price) }}</div>
                        </td>

                        <td class="table-td">
                            <div class="font-mono font-bold" :class="{ 'text-danger': isLow(item) }">
                                {{ quantity(item.quantity_available) }}
                            </div>
                            <span :class="stockBadge(item.stock_status)">
                                {{ item.stock_status_label || "Chưa xác định" }}
                            </span>
                            <div class="mt-1 text-xs text-text-light">
                                Ngưỡng: {{ quantity(item.reorder_level) }}
                            </div>
                        </td>

                        <td class="table-td font-mono">
                            {{ quantity(item.reserved_quantity) }}
                        </td>

                        <td class="table-td">
                            <strong class="font-mono" :class="{
                                'text-danger': item.available_to_sell === 0,
                                'text-success': item.available_to_sell > 0,
                            }">
                                {{ quantity(item.available_to_sell) }}
                            </strong>
                            <div v-if="item.available_to_sell === null" class="text-xs text-text-light">
                                API chưa trả số liệu
                            </div>
                        </td>

                        <td class="table-td">
                            <div>{{ quantity(item.lot_count) }} lô</div>
                            <div class="text-xs text-text-light">
                                Tổng tồn lô: {{ quantity(item.lot_quantity) }}
                            </div>
                            <div v-if="item.stock_consistent === false" class="text-xs text-danger">
                                Tồn SKU không khớp tổng lô
                            </div>
                        </td>

                        <td class="table-td">
                            <div class="flex max-w-[280px] flex-wrap gap-2">
                                <button type="button" class="btn-outline-sm" @click="emit('open-panel', item, 'lots')">
                                    Xem lô
                                </button>

                                <button v-if="canInitialize(item)" type="button" class="btn-outline-sm text-warning"
                                    @click="emit('open-panel', item, 'initialize')">
                                    Khởi tạo lô
                                </button>

                                <button v-if="canCreate" type="button" class="btn-outline-sm text-success"
                                    :disabled="item.stock_consistent !== true"
                                    title="Chỉ nhập khi tồn SKU đã khớp tổng tồn lô"
                                    @click="emit('open-panel', item, 'import')">
                                    Nhập kho
                                </button>

                                <button v-if="canCreate" type="button" class="btn-outline-sm"
                                    :disabled="item.stock_consistent !== true || !item.lot_count"
                                    @click="emit('open-panel', item, 'adjustment')">
                                    Điều chỉnh
                                </button>

                                <button type="button" class="btn-outline-sm"
                                    @click="emit('open-panel', item, 'history')">
                                    Lịch sử
                                </button>
                            </div>
                        </td>
                    </tr>

                    <tr v-if="!store.inventory.length">
                        <td colspan="8" class="empty-cell">Không có dữ liệu tồn kho.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm text-text-light">
                Hiển thị {{ store.inventory.length }} / {{ store.meta.total }} SKU
            </span>

            <div class="flex gap-2">
                <button type="button" class="page-btn" :disabled="store.loading || store.meta.current_page <= 1"
                    aria-label="Trang trước" @click="emit('change-page', store.meta.current_page - 1)">
                    ‹
                </button>

                <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
                    :class="{ active: page === store.meta.current_page }" :disabled="store.loading"
                    @click="emit('change-page', page)">
                    {{ page }}
                </button>

                <button type="button" class="page-btn" :disabled="store.loading || store.meta.current_page >= store.meta.last_page
                    " aria-label="Trang sau" @click="emit('change-page', store.meta.current_page + 1)">
                    ›
                </button>
            </div>
        </div>
    </div>
</template>