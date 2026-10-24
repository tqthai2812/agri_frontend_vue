<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { useAuthStore } from "@/stores/shared/authStore";
import { money, dateTime, code, statusLabel, statusClass, paymentLabel, paymentStatus, fullAddress, paymentSummary as formatPaymentSummary } from "@/utils/orderPresentation";
import OrderPrintActions from "./OrderPrintActions.vue";
import OrderNotices from "./OrderNotices.vue";

const store = useOrderStore();
const authStore = useAuthStore();

const emit = defineEmits(["reload"]);
const order = computed(() => store.selectedOrder);
const canEdit = computed(() => authStore.hasPermission("order.update"));
const actionOpen = computed(() => store.showStatusModal || store.showCodModal);
const address = computed(() => order.value?.address || order.value?.receiver_address);
const merchandiseTotal = computed(() =>
    (order.value?.items || []).reduce(
        (sum, item) =>
            sum +
            Number(
                item.subtotal ??
                Number(item.price) * Number(item.quantity),
            ),
        0,
    ),
);

const paymentSummary = (value) => formatPaymentSummary(value, store);
</script>

<template>
    <Teleport to="body">
        <div v-if="store.showDetailModal" class="modal-backdrop z-50" @click.self="store.closeDetailModal">
            <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" class="modal-panel max-w-6xl">
                <header class="modal-header">
                    <div>
                        <h2 id="order-detail-title" class="text-xl font-bold">
                            Đơn hàng {{ code(order) }}
                        </h2>
                        <p class="muted">{{ dateTime(order?.created_at) }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                            :disabled="store.busy || actionOpen || store.loadingDetail
                                " @click="emit('reload')">
                            Tải lại chi tiết
                        </button>
                        <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Đóng chi tiết" :disabled="store.busy || actionOpen"
                            @click="store.closeDetailModal">
                            <Icon icon="solar:close-circle-bold" />
                        </button>
                    </div>
                </header>
                <div class="space-y-5 p-5 sm:p-6">
                    <OrderNotices />
                    <p v-if="store.loadingDetail" class="py-10 text-center">
                        Đang tải chi tiết...
                    </p>
                    <p v-else-if="store.detailError" role="alert" class="notice error">
                        {{ store.detailError }}
                    </p>
                    <template v-else-if="store.detailReady && order">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <span :class="statusClass(order.order_status)">
                                {{
                                    order.order_status_label ||
                                    statusLabel(order.order_status)
                                }}
                            </span>
                            <div v-if="canEdit" class="flex flex-wrap gap-2">
                                <button v-if="store.canUpdateStatus(order)" type="button"
                                    class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                                    :disabled="store.busy || actionOpen" @click="store.openStatusModal">
                                    Cập nhật trạng thái
                                </button>
                                <button v-if="store.canConfirmCodPayment(order)" type="button"
                                    class="btn-primary cursor-pointer disabled:cursor-not-allowed"
                                    :disabled="store.busy || actionOpen" @click="store.openCodModal">
                                    Xác nhận đã thu COD
                                </button>
                            </div>
                        </div>
                        <OrderPrintActions :order-id="Number(order.id)" :disabled="store.busy || actionOpen" />
                        <div class="grid gap-4 md:grid-cols-3">
                            <article class="detail-card">
                                <h3>Khách hàng</h3>
                                <p>{{ order.user?.name || "—" }}</p>
                                <p class="muted">{{ order.user?.email || "—" }}</p>
                                <p class="muted">
                                    {{ order.user?.phone_number || "—" }}
                                </p>
                            </article>
                            <article class="detail-card">
                                <h3>Địa chỉ nhận hàng</h3>
                                <p>{{ address?.receiver_name || "—" }}</p>
                                <p>{{ address?.receiver_phone || "—" }}</p>
                                <p class="muted">{{ fullAddress(address) }}</p>
                            </article>
                            <article class="detail-card">
                                <h3>Thanh toán</h3>
                                <p>{{ paymentLabel(order.payment_method) }}</p>
                                <p v-if="order.payment_review" class="notice error mt-3">{{ order.payment_review }}</p>
                                <p class="mt-2 font-semibold" :class="store.isPaid(order)
                                    ? 'text-success'
                                    : 'text-warning'
                                    ">
                                    {{ paymentSummary(order) }}
                                </p>
                                <p v-if="
                                    order.payment_method === 'COD' &&
                                    !store.isPaid(order)
                                " class="muted mt-2">
                                    Trạng thái giao hàng và xác nhận thu tiền
                                    được theo dõi riêng.
                                </p>
                            </article>
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                            <article class="detail-card">
                                <h3>Giao hàng</h3>
                                <p>{{ order.delivery_method?.name || "—" }}</p>
                                <p class="muted">
                                    {{ order.delivery_method?.description }}
                                </p>
                                <div class="summary-row">
                                    <span>Phí giao hàng của đơn</span>
                                    <strong>{{ money(order.delivery_cost) }}</strong>
                                </div>
                                <p v-if="order.note" class="mt-3 whitespace-pre-wrap text-sm">
                                    <strong>Ghi chú khách hàng:</strong>
                                    {{ order.note }}
                                </p>
                            </article>
                            <article class="detail-card">
                                <h3>Chi tiết số tiền</h3>
                                <div class="summary-row">
                                    <span>Tiền hàng</span>
                                    <span>{{ money(merchandiseTotal) }}</span>
                                </div>
                                <div class="summary-row">
                                    <span>
                                        Giảm giá
                                        <span v-if="order.discount?.discount_code">
                                            ({{ order.discount.discount_code }})
                                        </span>
                                    </span>
                                    <span>-{{ money(order.discount_amount) }}</span>
                                </div>
                                <div class="summary-row">
                                    <span>Phí giao hàng</span>
                                    <span>{{ money(order.delivery_cost) }}</span>
                                </div>
                                <div class="summary-row font-bold">
                                    <span>Tổng thanh toán</span>
                                    <span>{{ money(order.total_payment) }}</span>
                                </div>
                                <p class="muted mt-2">
                                    Tổng số lượng: {{ order.total_quantity }}
                                    · Hoàn thành lúc:
                                    {{ dateTime(order.completed_at) }}
                                </p>
                            </article>
                        </div>
                        <section>
                            <h3 class="mb-3 font-bold">Sản phẩm trong đơn</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full min-w-[1000px]">
                                    <thead class="bg-bg">
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Số lượng</th>
                                            <th>Đơn giá</th>
                                            <th>Tiền hàng</th>
                                            <th>Giảm giá</th>
                                            <th>Sau giảm giá</th>
                                            <th>Giá vốn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in order.items || []" :key="item.id">
                                            <td>
                                                <div class="flex items-center gap-3">
                                                    <img v-if="item.product?.primary_image"
                                                        :src="item.product.primary_image" alt=""
                                                        class="h-12 w-12 shrink-0 rounded-lg object-contain" />
                                                    <div>
                                                        <strong>
                                                            {{
                                                                item.product_name ||
                                                                item.product?.name ||
                                                                "Sản phẩm"
                                                            }}
                                                        </strong>
                                                        <div class="muted">
                                                            {{
                                                                item.variant_name ||
                                                                item.variant?.name ||
                                                                "Mặc định"
                                                            }}
                                                            ·
                                                            {{ item.size ?? item.package?.size }}
                                                            {{ item.unit || item.package?.unit }}
                                                        </div>
                                                        <div class="muted">
                                                            SKU:
                                                            {{ item.sku || item.package?.sku || "—" }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{{ item.quantity }}</td>
                                            <td>{{ money(item.price) }}</td>
                                            <td>{{ money(item.subtotal) }}</td>
                                            <td>{{ money(item.discount_amount) }}</td>
                                            <td>{{ money(item.net_sales_amount) }}</td>
                                            <td>{{ money(item.cost_total) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <section>
                            <h3 class="mb-3 font-bold">Các bản ghi thanh toán</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full min-w-[650px]">
                                    <thead class="bg-bg">
                                        <tr>
                                            <th>Phương thức</th>
                                            <th>Mã giao dịch</th>
                                            <th>Số tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Thời điểm thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="payment in order.payments || []" :key="payment.id">
                                            <td>{{ payment.payment_method }}</td>
                                            <td>{{ payment.transaction_id || "—" }}</td>
                                            <td>{{ money(payment.amount) }}</td>
                                            <td>
                                                <span :class="payment.status === 'paid'
                                                    ? 'text-success'
                                                    : 'text-text-light'
                                                    ">
                                                    {{
                                                        payment.status_label ||
                                                        paymentStatus(payment.status)
                                                    }}
                                                </span>
                                                <p v-if="payment.failed_reason" class="muted max-w-xs">
                                                    {{ payment.failed_reason }}
                                                </p>
                                            </td>
                                            <td>{{ dateTime(payment.paid_at) }}</td>
                                        </tr>
                                        <tr v-if="!order.payments?.length">
                                            <td colspan="5" class="text-center text-text-light">
                                                Chưa có bản ghi thanh toán.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <section>
                            <h3 class="mb-3 font-bold">Lịch sử đơn hàng</h3>
                            <div class="space-y-3">
                                <article v-for="history in order.histories || []" :key="history.id" class="detail-card">
                                    <div class="flex flex-wrap justify-between gap-2">
                                        <strong>
                                            {{
                                                history.order_status_label ||
                                                statusLabel(history.order_status)
                                            }}
                                        </strong>
                                        <span class="muted">
                                            {{ dateTime(history.created_at) }}
                                        </span>
                                    </div>
                                    <p v-if="history.note" class="mt-2 whitespace-pre-wrap text-sm">
                                        {{ history.note }}
                                    </p>
                                    <p class="muted mt-2">
                                        Người thực hiện:
                                        {{ history.creator?.name || "Hệ thống" }}
                                    </p>
                                </article>
                                <p v-if="!order.histories?.length" class="muted">
                                    Chưa có lịch sử.
                                </p>
                            </div>
                        </section>
                    </template>
                </div>
            </section>
        </div>
    </Teleport>
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

.detail-card {
    @apply rounded-2xl border border-border p-4;
}

.detail-card h3 {
    @apply mb-3 text-sm font-bold text-text-light;
}

.summary-row {
    @apply flex justify-between gap-4 border-b border-border py-2 text-sm;
}

.notice {
    @apply mb-5 rounded-2xl border px-4 py-3 text-sm;
}

.notice.success {
    @apply border-green-100 bg-green-50 text-green-700;
}

.notice.warning {
    @apply border-amber-200 bg-amber-50 text-amber-800;
}

.notice.error {
    @apply border-red-100 bg-red-50 text-red-600;
}

.modal-backdrop {
    @apply fixed inset-0 flex items-center justify-center bg-black/50 p-4;
}

.modal-panel {
    @apply max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-surface shadow-xl;
}

.modal-header {
    @apply sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface p-5;
}
</style>