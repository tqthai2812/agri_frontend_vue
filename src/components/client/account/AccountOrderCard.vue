<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({ order: { type: Object, required: true }, disabled: Boolean });
defineEmits(["cancel", "buy-again", "view-detail", "review"]);
const statusMap = {
    pending: { label: "Chờ xác nhận", class: "bg-amber-50 text-amber-600 border-amber-200", icon: "mdi:clock-outline" },
    confirmed: { label: "Đã xác nhận", class: "bg-blue-50 text-blue-600 border-blue-200", icon: "mdi:check-decagram-outline" },
    shipping: { label: "Đang vận chuyển", class: "bg-violet-50 text-violet-600 border-violet-200", icon: "mdi:truck-fast-outline" },
    completed: { label: "Giao hàng thành công", class: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "mdi:package-variant-closed-check" },
    cancelled: { label: "Đã hủy", class: "bg-red-50 text-red-500 border-red-200", icon: "mdi:close-circle-outline" },
};
const status = computed(() => statusMap[props.order.order_status] || statusMap.pending);
const orderCode = computed(() => props.order.order_code || props.order.invoice_code || `DH${String(props.order.id).padStart(6, "0")}`);
function productOf(item) { return item.product || item.package?.variant?.product || item.variant?.product || {}; }
function variantOf(item) { return item.variant || item.package?.variant || {}; }
function imageOf(item) {
    const product = productOf(item);
    return product.primary_image || product.images?.find((image) => image.is_primary)?.image_url || product.images?.[0]?.image_url;
}
function productNameOf(item) { return item.product_name || productOf(item).product_name || productOf(item).name || "Sản phẩm"; }
function packageLabel(item) {
    const pkg = item.package || item;
    return `${pkg.size ?? ""} ${{ l: "lít", piece: "cái" }[pkg.unit] || pkg.unit || ""}`.trim();
}
function formatVND(value) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0)); }
function formatDate(value) {
    const date = new Date(String(value || "").replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}
</script>

<template>
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <strong class="text-[#123d27]">{{ orderCode }}</strong>
                <span class="text-slate-400">{{ formatDate(order.created_at) }}</span>
                <span class="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{{ order.payment_method_label ||
                    order.payment_method }}</span>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                :class="status.class">
                <Icon :icon="status.icon" />{{ order.order_status_label || status.label }}
            </span>
        </header>
        <div class="divide-y divide-slate-100">
            <div v-for="item in order.items || []" :key="item.id" class="flex gap-4 px-5 py-4">
                <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2">
                    <img v-if="imageOf(item)" :src="imageOf(item)" :alt="productNameOf(item)"
                        class="h-full w-full object-contain" />
                    <Icon v-else icon="mdi:image-off-outline" class="text-3xl text-slate-300" />
                </div>
                <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
                    <div>
                        <RouterLink v-if="productOf(item).id"
                            :to="{ name: 'client-product-detail', params: { id: productOf(item).id } }"
                            class="text-sm font-semibold text-[#123d27]">{{ productNameOf(item) }}</RouterLink>
                        <strong v-else class="text-sm text-[#123d27]">{{ productNameOf(item) }}</strong>
                        <p class="mt-1 text-xs text-slate-400">{{ variantOf(item).variant_name || variantOf(item).name
                            || 'Mặc định' }} · {{ packageLabel(item) }}</p>
                        <p class="mt-1 text-xs text-slate-500">× {{ item.quantity }}</p>
                    </div>
                    <strong class="mt-2 block text-sm text-[#0a7a3d]">{{ formatVND(Number(item.price_at_purchase ??
                        item.price ?? 0) * Number(item.quantity || 0)) }}</strong>
                </div>
            </div>
        </div>
        <footer class="border-t border-slate-100 bg-[#fafcfb] px-5 py-4">
            <p class="mb-3 text-sm" :class="order.is_paid ? 'text-green-700' : 'text-amber-700'">
                {{ order.payment_review ? 'Thanh toán cần đối chiếu' : order.is_paid ? 'Đã thanh toán' :
                    order.payment?.status_label || 'Chờ thanh toán' }}
            </p>
            <div class="flex flex-wrap items-center justify-between gap-4">
                <button type="button" class="text-xs font-semibold text-[#07532b]" :disabled="disabled"
                    @click="$emit('view-detail', order)">
                    Xem chi tiết đơn hàng
                </button>
                <p class="text-xs text-slate-500">Thành tiền: <strong class="ml-2 text-xl text-[#0a7a3d]">{{
                    formatVND(order.total_payment) }}</strong></p>
            </div>
            <div class="mt-4 flex flex-wrap justify-end gap-2">
                <a href="tel:+84334745378" class="rounded-full border px-4 py-2 text-xs text-slate-500">Liên hệ CSKH</a>
                <button v-if="order.order_status === 'completed' && (order.can_review || order.has_reviews)"
                    type="button" :disabled="disabled"
                    class="inline-flex items-center gap-1.5 rounded-full border border-[#d5a828] bg-[#fff8de] px-4 py-2 text-xs font-bold text-[#80600c] disabled:opacity-50"
                    @click="$emit('review', order)">
                    <Icon :icon="order.can_review ? 'mdi:star-outline' : 'mdi:comment-check-outline'" />
                    {{ order.can_review ? 'Đánh giá' : 'Xem đánh giá' }}
                </button>
                <button v-if="order.can_pay" type="button" :disabled="disabled"
                    class="rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    @click="$emit('view-detail', order)">
                    Tiếp tục thanh toán
                </button>
                <button v-if="order.can_cancel" type="button" :disabled="disabled"
                    class="rounded-full border border-red-300 px-4 py-2 text-xs text-red-500 disabled:opacity-50"
                    @click="$emit('cancel', order)">
                    Hủy đơn hàng
                </button>
                <button v-if="['completed', 'cancelled'].includes(order.order_status)" type="button"
                    :disabled="disabled"
                    class="rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    @click="$emit('buy-again', order)">
                    Mua lại
                </button>
            </div>
        </footer>
    </article>
</template>