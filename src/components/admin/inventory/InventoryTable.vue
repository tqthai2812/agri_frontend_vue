<script setup>
import "@/assets/finance.css";
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
    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm product-admin">
        <div class="mb-5 flex flex-wrap gap-3">
            <div class="search-box">
                <Icon icon="solar:magnifer-bold" />
                <input v-model.trim="store.filters.search" class="search-input"
                    placeholder="Tìm sản phẩm, SKU, barcode..." aria-label="Tìm tồn kho" @input="emit('search')" />
            </div>

            <select v-model="store.filters.category_id" class="filter-select flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed" aria-label="Lọc danh mục"
                :disabled="store.loadingOptions" @change="emit('filter-change')">
                <option value="">Tất cả danh mục</option>
                <option v-for="category in store.categories" :key="category.id" :value="category.id">
                    {{ category.name || category.category_name }}
                </option>
            </select>

            <select v-model="store.filters.status" class="filter-select flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed" aria-label="Lọc tồn vật lý"
                @change="emit('filter-change')">
                <option value="">Tất cả tồn vật lý</option>
                <option value="available">Còn hàng</option>
                <option value="low">Sắp hết</option>
                <option value="out">Hết tồn</option>
            </select>

            <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset-filters')">
                <Icon icon="solar:restart-bold" /> Xóa lọc
            </button>
        </div>

        <div v-if="store.loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />Đang tải tồn kho...</div>

        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[1050px] text-sm table-auto">
                <thead class="bg-bg">
                    <tr>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Sản phẩm / SKU</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Quy cách / Giá</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tồn vật lý</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đang giữ</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Có thể bán</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô / Đối soát</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap w-px product-table-actions">Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in store.inventory" :key="item.id" class="border-b border-border hover:bg-primary/5">
                        <td class="table-td p-3 text-sm text-left">
                            <div class="flex items-center gap-3 text-left justify-start">
                                <div
                                    class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-bg">
                                    <img v-if="item.product?.primary_image" :src="item.product.primary_image"
                                        :alt="item.product?.name || 'Sản phẩm'" class="size-full object-cover" />
                                    <Icon v-else icon="solar:box-bold-duotone" />
                                </div>

                                <div class="text-left">
                                    <div class="max-w-[240px] truncate font-semibold text-left">
                                        {{ item.product?.name || "Không rõ sản phẩm" }}
                                    </div>
                                    <div class="text-xs text-text-light text-left">
                                        {{ item.variant?.name || "—" }}
                                    </div>
                                    <div class="font-mono text-xs text-left">{{ item.sku }}</div>
                                    <div v-if="item.barcode" class="text-xs text-text-light text-left">
                                        Barcode: {{ item.barcode }}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            <div class="text-left">{{ item.size }} {{ item.unit }}</div>
                            <div class="font-mono text-xs text-left">{{ money(item.price) }}</div>
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            <div class="font-mono font-bold text-left" :class="{ 'text-danger': isLow(item) }">
                                {{ quantity(item.quantity_available) }}
                            </div>
                            <span class="text-left" :class="stockBadge(item.stock_status)">
                                {{ item.stock_status_label || "Chưa xác định" }}
                            </span>
                            <div class="mt-1 text-xs text-text-light text-left">
                                Ngưỡng: {{ quantity(item.reorder_level) }}
                            </div>
                        </td>

                        <td class="table-td font-mono p-3 text-sm text-left">
                            {{ quantity(item.reserved_quantity) }}
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            <strong class="font-mono text-left" :class="{
                                'text-danger': item.available_to_sell === 0,
                                'text-success': item.available_to_sell > 0,
                            }">
                                {{ quantity(item.available_to_sell) }}
                            </strong>
                            <div v-if="item.available_to_sell === null" class="text-xs text-text-light text-left">
                                API chưa trả số liệu
                            </div>
                        </td>

                        <td class="table-td p-3 text-sm text-left">
                            <div class="text-left">{{ quantity(item.lot_count) }} lô</div>
                            <div class="text-xs text-text-light text-left">
                                Tổng tồn lô: {{ quantity(item.lot_quantity) }}
                            </div>
                            <div v-if="item.stock_consistent === false" class="text-xs text-danger text-left">
                                Tồn SKU không khớp tổng lô
                            </div>
                        </td>

                        <td class="table-td p-3 text-sm text-left w-px whitespace-nowrap product-table-actions">
                            <div class="flex gap-2 text-left justify-start flex-nowrap">
                                <button aria-label="Xem lô" title="Xem lô" type="button" class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0" @click="emit('open-panel', item, 'lots')">
                      <Icon icon="solar:box-bold-duotone" aria-hidden="true" />
                    </button>

                                <button aria-label="Khởi tạo lô" title="Khởi tạo lô" v-if="canInitialize(item)" type="button" class="text-warning cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                    @click="emit('open-panel', item, 'initialize')">
                      <Icon icon="solar:add-circle-bold" aria-hidden="true" />
                    </button>

                                <button aria-label="Nhập kho" v-if="canCreate" type="button" class="text-success cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                    :disabled="item.stock_consistent !== true"
                                    title="Nhập kho — Chỉ nhập khi tồn SKU đã khớp tổng tồn lô"
                                    @click="emit('open-panel', item, 'import')">
                      <Icon icon="solar:box-bold-duotone" aria-hidden="true" />
                    </button>

                                <button aria-label="Điều chỉnh" title="Điều chỉnh" v-if="canCreate" type="button" class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                    :disabled="item.stock_consistent !== true || !item.lot_count"
                                    @click="emit('open-panel', item, 'adjustment')">
                      <Icon icon="solar:tuning-bold" aria-hidden="true" />
                    </button>

                                <button aria-label="Lịch sử" title="Lịch sử" type="button" class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                    @click="emit('open-panel', item, 'history')">
                      <Icon icon="solar:history-bold" aria-hidden="true" />
                    </button>
                            </div>
                        </td>
                    </tr>

                    <tr class="border-b border-border hover:bg-primary/5" v-if="!store.inventory.length">
                        <td colspan="7" class="empty-cell text-sm p-8 text-text-light text-left">Không có dữ liệu tồn kho.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span class="text-sm text-text-light">
                Hiển thị {{ store.inventory.length }} / {{ store.meta.total }} SKU
            </span>

            <div class="flex flex-wrap justify-center gap-2">
                <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loading || store.meta.current_page <= 1"
                    aria-label="Trang trước" @click="emit('change-page', store.meta.current_page - 1)">
                    <Icon icon="solar:arrow-left-bold" />
                </button>

                <button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
                    :class="{ active: page === store.meta.current_page }" :disabled="store.loading"
                    @click="emit('change-page', page)" :aria-current="page === store.meta.current_page ? 'page' : undefined">
                    {{ page }}
                </button>

                <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loading || store.meta.current_page >= store.meta.last_page
                    " aria-label="Trang sau" @click="emit('change-page', store.meta.current_page + 1)">
                    <Icon icon="solar:arrow-right-bold" />
                </button>
            </div>
        </div>
    </div>
</template>