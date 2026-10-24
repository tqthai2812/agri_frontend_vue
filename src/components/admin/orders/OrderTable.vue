<script setup>
import { Icon } from "@iconify/vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { money, dateTime, code, statusLabel, statusClass, paymentSummary as formatPaymentSummary } from "@/utils/orderPresentation";

const store = useOrderStore();

const emit = defineEmits(["detail"]);
const paymentSummary = (value) => formatPaymentSummary(value, store);
</script>

<template>
    <div v-if="store.loading" class="py-12 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        Đang tải đơn hàng...
    </div>
    <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
            <thead class="bg-bg">
                <tr>
                    <th>Mã đơn / Ngày tạo</th>
                    <th>Khách hàng</th>
                    <th>Người nhận</th>
                    <th>Tổng thanh toán</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Mặt hàng</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in store.orders" :key="item.id" class="transition hover:bg-primary/5">
                    <td>
                        <strong>{{ code(item) }}</strong>
                        <div class="muted">{{ dateTime(item.created_at) }}</div>
                    </td>
                    <td>
                        {{ item.user?.name || "—" }}
                        <div class="muted">{{ item.user?.email || "—" }}</div>
                    </td>
                    <td>
                        {{
                            (item.address || item.receiver_address)?.receiver_name ||
                            "—"
                        }}
                        <div class="muted">
                            {{
                                (item.address || item.receiver_address)?.receiver_phone ||
                                "—"
                            }}
                        </div>
                    </td>
                    <td class="font-semibold">
                        {{ money(item.total_payment) }}
                        <div v-if="Number(item.discount_amount) > 0" class="muted">
                            Giảm {{ money(item.discount_amount) }}
                        </div>
                    </td>
                    <td>
                        {{ item.payment_method }}
                        <div class="text-xs" :class="store.isPaid(item)
                            ? 'text-success'
                            : 'text-text-light'
                            ">
                            {{ paymentSummary(item) }}
                        </div>
                    </td>
                    <td>
                        <span :class="statusClass(item.order_status)">
                            {{
                                item.order_status_label ||
                                statusLabel(item.order_status)
                            }}
                        </span>
                    </td>
                    <td>
                        {{ item.items_count ?? item.items?.length ?? 0 }}
                    </td>
                    <td>
                        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                            :disabled="store.busy" @click="emit('detail', item)">
                            Chi tiết
                        </button>
                    </td>
                </tr>
                <tr v-if="!store.orders.length">
                    <td colspan="8" class="py-10 text-center text-text-light">
                        Không có đơn hàng phù hợp.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

th {
    @apply bg-bg p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

td {
    @apply border-b border-border p-3 align-middle text-sm;
}

.muted {
    @apply text-xs leading-5 text-text-light;
}
</style>