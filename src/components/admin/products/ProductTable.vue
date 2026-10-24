<script setup>
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useProductStore } from "@/stores/admin/productStore";

const store = useProductStore();
const authStore = useAuthStore();

const emit = defineEmits(["delete"]);

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value ?? 0));
}
</script>

<template>
    <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        <p class="text-sm">Đang tải sản phẩm...</p>
    </div>

    <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
            <thead class="bg-bg">
                <tr>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Sản phẩm</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Danh mục</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Xuất xứ</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Giá bán</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Tồn vật lý</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Biến thể</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Trạng thái</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="product in store.products" :key="product.id"
                    class="border-b border-border hover:bg-primary/5">
                    <td class="p-3">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg">
                                <img v-if="product.primary_image" :src="product.primary_image"
                                    :alt="product.product_name" loading="lazy" class="h-full w-full object-cover" />
                                <Icon v-else icon="solar:box-bold-duotone" class="text-2xl text-text-light" />
                            </div>

                            <div class="min-w-0">
                                <div class="max-w-[260px] truncate text-sm font-semibold">
                                    {{ product.product_name }}
                                </div>
                                <div v-if="product.brand" class="text-xs text-text-light">
                                    {{ product.brand }}
                                </div>
                                <div class="text-xs text-text-light">
                                    SKU: {{ product.first_sku || "Chưa có" }}
                                </div>
                                <div class="text-xs text-text-light">ID: {{ product.id }}</div>
                            </div>
                        </div>
                    </td>

                    <td class="p-3">
                        <span class="badge-gray">
                            {{ product.category?.name || "Chưa có danh mục" }}
                        </span>
                        <div class="mt-1 text-xs text-text-light">
                            {{ product.subcategory?.name || "Chưa có danh mục con" }}
                        </div>
                    </td>

                    <td class="p-3 text-sm">
                        {{ product.origin?.name || "Chưa có" }}
                    </td>

                    <td class="p-3 font-mono text-sm">
                        <template v-if="Number(product.package_count) > 0">
                            <div v-if="Number(product.min_price) === Number(product.max_price)">
                                {{ formatVND(product.min_price) }}
                            </div>
                            <div v-else>
                                {{ formatVND(product.min_price) }} –
                                {{ formatVND(product.max_price) }}
                            </div>
                        </template>
                        <span v-else class="text-text-light">Chưa có quy cách</span>
                    </td>

                    <td class="p-3 text-sm" :class="store.isLowStock(product) ? 'font-bold text-danger' : ''">
                        <div class="font-mono">{{ product.total_stock ?? 0 }}</div>
                        <span v-if="store.isLowStock(product)" class="text-[10px]">
                            Có quy cách dưới ngưỡng
                        </span>
                    </td>

                    <td class="p-3 text-sm">
                        <div>{{ product.variant_count ?? 0 }} biến thể</div>
                        <div class="mt-1 text-xs text-text-light">
                            {{ product.package_count ?? 0 }} quy cách
                        </div>
                    </td>

                    <td class="p-3">
                        <span :class="product.is_show ? 'badge-active' : 'badge-inactive'">
                            {{ product.is_show ? "Đang hiển thị" : "Đang ẩn" }}
                        </span>
                    </td>

                    <td class="p-3">
                        <div class="flex gap-2">
                            <button v-if="authStore.hasPermission('product.update')" type="button"
                                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" title="Sửa sản phẩm"
                                aria-label="Sửa sản phẩm" :disabled="store.saving"
                                @click="store.openEditModal(product)">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button v-if="authStore.hasPermission('product.delete')" type="button"
                                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed" title="Xóa sản phẩm"
                                aria-label="Xóa sản phẩm" :disabled="store.deleting" @click="emit('delete', product)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>

                            <span v-if="!authStore.hasPermission('product.update') &&
                                !authStore.hasPermission('product.delete')" class="text-xs text-text-light">
                                Chỉ xem
                            </span>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.products.length">
                    <td colspan="8" class="p-8 text-center text-text-light">
                        Không có sản phẩm nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>