<script setup>
import { Icon } from "@iconify/vue";
import { useDiscountStore } from "@/stores/admin/discountStore";

const store = useDiscountStore();

const emit = defineEmits(["search", "filter-change", "reset"]);
</script>

<template>
<div class="mb-5 flex flex-wrap gap-3">
                <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                    <Icon icon="solar:magnifer-bold" class="text-text-light" />

                    <input v-model.trim="store.filters.search" type="search" aria-label="Tìm voucher" placeholder="Tìm mã hoặc mô tả giảm giá..."
                        class="w-full bg-transparent text-sm outline-none" @input="emit('search')" />
                </div>

                <select v-model="store.filters.discount_scope" class="filter-select flex-1 sm:flex-none" @change="emit('filter-change')">
                    <option value="">Tất cả loại voucher</option>
                    <option value="order">Toàn sàn</option>
                    <option value="lot">Xả kho</option>
                </select>
                <select v-model="store.filters.status" class="filter-select flex-1 sm:flex-none"
                    @change="emit('filter-change')">
                    <option value="">Tất cả trạng thái</option>
                    <option value="available">Có hiệu lực</option>
                    <option value="expired">Hết hạn</option>
                    <option value="used_up">Hết lượt</option>
                    <option value="scheduled">Chưa bắt đầu</option>
                    <option value="out_of_stock">Hết hàng có thể bán</option>
                    <option value="stock_review">Cần đối chiếu kho</option>
                </select>

                <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
                    @change="emit('filter-change')">
                    <option value="">Bật / tắt</option>
                    <option value="1">Đang bật</option>
                    <option value="0">Đã tắt</option>
                </select>

                <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')">
                    <Icon icon="solar:restart-bold" />
                    Xóa lọc
                </button>
            </div>
</template>