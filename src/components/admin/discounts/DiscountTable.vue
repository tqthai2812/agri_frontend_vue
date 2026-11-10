<script setup>
import { Icon } from "@iconify/vue";
import { useDiscountStore } from "@/stores/admin/discountStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useDiscountStore();
const authStore = useAuthStore();

const emit = defineEmits(["toggle", "delete"]);

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("vi-VN");
}

function statusBadgeClass(status) {
    if (status === "available") {
        return "badge-active";
    }

    if (status === "expired" || status === "used_up") {
        return "badge-pending";
    }

    return "badge-inactive";
}
</script>

<template>
<div v-if="store.loading" class="py-10 text-center text-text-light">
                <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
                <p class="text-sm">Đang tải giảm giá...</p>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[1200px]">
                    <thead class="bg-bg">
                        <tr>
                            <th class="table-th">Mã</th>
                            <th class="table-th">Mô tả</th>
                            <th class="table-th">Giảm</th>
                            <th class="table-th">Giảm tối đa</th>
                            <th class="table-th">Tiền hàng tối thiểu</th>
                            <th class="table-th">Sử dụng</th>
                            <th class="table-th">Hết hạn</th>
                            <th class="table-th">Trạng thái</th>
                            <th class="table-th">Đơn hàng</th>
                            <th class="table-th">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="discount in store.discounts" :key="discount.id" class="table-row">
                            <td class="table-td">
                                <span class="badge-gray font-mono">
                                    {{ discount.discount_code }}
                                </span>
                            </td>

                            <td class="table-td">
                                <div class="font-semibold text-sm max-w-[320px]">
                                    {{ discount.discount_description }}
                                    <div class="mt-1 text-xs font-normal text-primary">{{ discount.discount_scope ===
                                        "lot" ? `Xả kho · Lô ${discount.lot?.lot_code || discount.lot_id}` : "Toàn sàn"
                                    }} · {{ discount.show_in_wallet ? "Hiện trong kho voucher" : "Không công khai"
                                        }}</div>
                                </div>

                                <div v-if="discount.user" class="text-xs text-text-light">
                                    Áp dụng cho: {{ discount.user.name }}
                                </div>

                                <div v-else class="text-xs text-text-light">
                                    Áp dụng chung
                                </div>
                            </td>

                            <td class="table-td">
                                <span class="badge-gray">
                                    {{ discount.discount_percent }}%
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ formatVND(discount.max_discount_amount) }}
                            </td>

                            <td class="table-td font-mono">
                                {{ formatVND(discount.min_order_value) }}
                                <p class="mt-1 text-xs font-normal text-text-light">{{ discount.discount_scope === 'lot'
                                    ? 'Chỉ tính tiền hàng từ lô áp dụng' : 'Tính trên tổng tiền hàng' }}</p>
                            </td>

                            <td class="table-td">
                                <div class="font-mono text-sm">
                                    {{ discount.used_count }}
                                    /
                                    {{ discount.usage_limit ?? "∞" }}
                                </div>

                                <div class="text-xs text-text-light">
                                    Còn lại:
                                    {{ discount.remaining_usage ?? "Không giới hạn" }}
                                </div>
                            </td>

                            <td class="table-td text-sm">
                                {{ formatDate(discount.expire_date) }}
                            </td>

                            <td class="table-td">
                                <span :class="statusBadgeClass(discount.status)">
                                    {{ discount.status_label }}
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ discount.orders_count ?? 0 }}
                            </td>

                            <td class="table-td">
                                <div class="flex gap-2">
                                    <button type="button" v-if="authStore.hasPermission('discount.update')" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                        title="Sửa" aria-label="Sửa" :disabled="store.saving" @click="store.openEditModal(discount)">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button type="button" v-if="authStore.hasPermission('discount.update')" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                        :class="discount.is_active ? 'text-warning' : 'text-success'" title="Bật / tắt" aria-label="Bật / tắt"
                                        :disabled="store.saving" @click="emit('toggle', discount)">
                                        <Icon
                                            :icon="discount.is_active ? 'solar:pause-circle-bold' : 'solar:play-circle-bold'" />
                                    </button>

                                    <button type="button" v-if="authStore.hasPermission('discount.delete')" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                        title="Xóa" aria-label="Xóa" :disabled="store.deleting || Number(discount.orders_count || 0) > 0"
                                        @click="emit('delete', discount)">
                                        <Icon icon="solar:trash-bin-trash-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <tr v-if="!store.discounts.length">
                            <td colspan="10" class="empty-cell">
                                Không có chương trình giảm giá nào.
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
</style>