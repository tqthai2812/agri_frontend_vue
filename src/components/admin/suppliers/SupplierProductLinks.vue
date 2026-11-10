<script setup>
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";

const store = useSupplierStore();

defineProps({ canManageProducts: Boolean, canViewProducts: Boolean });
const emit = defineEmits(["search", "load"]);
</script>

<template>
<section class="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                            <h3 class="text-lg font-bold">
                                Sản phẩm có thể cung ứng
                                <span v-if="store.productsLoaded">
                                    ({{ store.selectedProducts.length }}/500)
                                </span>
                            </h3>

                            <p class="text-sm text-text-light">
                                Đây là danh sách sản phẩm nhà cung cấp có thể cung ứng.
                                Nguồn hàng thực tế của từng lần nhập được lưu ở phiếu nhập và lô.
                            </p>

                            <p v-if="!store.productsLoaded" class="text-sm text-warning">
                                Chưa tải được danh sách sản phẩm liên kết.
                                Bạn vẫn có thể sửa thông tin nhà cung cấp; liên kết được giữ nguyên.
                            </p>

                            <template v-else>
                                <div class="flex flex-wrap gap-2">
                                    <div v-for="product in store.selectedProducts" :key="product.id"
                                        class="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                                        <span>{{ product.product_name }}</span>

                                        <button v-if="canManageProducts" type="button" class="text-danger cursor-pointer disabled:cursor-not-allowed"
                                            :disabled="store.saving" :aria-label="`Bỏ liên kết ${product.product_name}`"
                                            @click="store.removeProduct(product.id)">
                                            <Icon icon="solar:close-circle-bold" />
                                        </button>
                                    </div>
                                </div>

                                <p v-if="!store.selectedProducts.length" class="text-sm text-text-light">
                                    Chưa liên kết sản phẩm.
                                </p>
                            </template>

                            <p v-if="!store.readOnly && !canViewProducts" class="text-xs text-text-light">
                                Tài khoản chưa có quyền xem sản phẩm để thay đổi danh sách cung ứng.
                                Bạn vẫn có thể lưu thông tin nhà cung cấp.
                            </p>

                            <template v-if="canManageProducts">
                                <div class="flex flex-col gap-3 sm:flex-row">
                                    <input v-model="store.productSearch" type="search" maxlength="255"
                                        class="form-control min-w-0 flex-1" placeholder="Tìm sản phẩm để liên kết..."
                                        aria-label="Tìm sản phẩm cung ứng" :disabled="store.saving"
                                        @input="emit('search')" @keydown.enter.prevent="emit('load', 1)" />

                                    <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                                        :disabled="store.saving || store.productLoading" @click="emit('load', 1)">
                                        Tìm
                                    </button>
                                </div>

                                <p v-if="store.productError" class="text-sm text-danger">
                                    {{ store.productError }}
                                </p>

                                <p v-if="store.productLoading" class="text-sm text-text-light">
                                    Đang tìm sản phẩm...
                                </p>

                                <div v-else-if="store.productResults.length" class="rounded-xl border border-border">
                                    <div v-for="product in store.productResults" :key="product.id"
                                        class="flex items-center justify-between gap-3 border-b border-border p-3 last:border-b-0">
                                        <div class="min-w-0 text-sm">
                                            <div class="break-words">{{ product.product_name }}</div>
                                            <div class="text-xs text-text-light">
                                                ID: {{ product.id }}
                                                <span v-if="product.first_sku">
                                                    · {{ product.first_sku }}
                                                </span>
                                            </div>
                                        </div>

                                        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving ||
                                            store.isProductSelected(product.id) ||
                                            store.selectedProducts.length >= 500
                                            " @click="store.addProduct(product)">
                                            {{ store.isProductSelected(product.id) ? "Đã chọn" : "Chọn" }}
                                        </button>
                                    </div>

                                    <div class="flex items-center justify-end gap-3 p-3">
                                        <span class="text-xs text-text-light">
                                            {{ store.productMeta.current_page }}
                                            / {{ store.productMeta.last_page }}
                                        </span>

                                        <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sản phẩm trước"
                                            :disabled="store.saving || store.productMeta.current_page <= 1"
                                            @click="emit('load', store.productMeta.current_page - 1)">
                                            <Icon icon="solar:arrow-left-bold" />
                                        </button>

                                        <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sản phẩm sau"
                                            :disabled="store.saving || store.productMeta.current_page >= store.productMeta.last_page"
                                            @click="emit('load', store.productMeta.current_page + 1)">
                                            <Icon icon="solar:arrow-right-bold" />
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </section>
</template>