<script setup>
import { Icon } from "@iconify/vue";

defineProps({
    merchandiseTotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: null },
    discountAmount: { type: Number, default: null },
    total: { type: Number, default: null },
    ready: { type: Boolean, default: false },
    previewing: { type: Boolean, default: false },
    canRecalculate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
});

defineEmits(["place-order", "recalculate"]);

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}
</script>

<template>
    <aside
        class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(6,75,38,0.09)] sm:p-6 lg:sticky lg:top-6">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#123d27]">Chi tiết thanh toán</h2>
            <Icon icon="mdi:receipt-text-check-outline" class="text-2xl text-[#0a7139]" />
        </div>

        <dl class="mt-5 space-y-3.5 text-sm">
            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Tổng tiền hàng</dt>
                <dd class="font-semibold text-slate-700">{{ formatVND(merchandiseTotal) }}</dd>
            </div>

            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Phí vận chuyển</dt>
                <dd class="font-semibold text-slate-700">
                    {{ ready ? (shippingCost === 0 ? "Miễn phí" : formatVND(shippingCost)) : "Chưa tính" }}
                </dd>
            </div>

            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Giảm giá</dt>
                <dd class="font-semibold text-[#0a7a3d]">
                    {{ ready ? `-${formatVND(discountAmount)}` : "Chưa tính" }}
                </dd>
            </div>
        </dl>

        <div class="my-5 border-t border-dashed border-slate-200"></div>

        <div class="flex items-end justify-between gap-4">
            <span class="text-sm font-bold text-[#123d27]">Tổng thanh toán</span>
            <strong class="text-right text-2xl font-extrabold text-[#0a7a3d]">
                {{ previewing ? "Đang tính..." : ready ? formatVND(total) : "Chưa tính" }}
            </strong>
        </div>

        <p v-if="!ready && !previewing" class="mt-3 text-xs leading-5 text-slate-500">
            Chọn địa chỉ và phương thức giao hàng để tính tổng thanh toán.
            Nếu có thông báo lỗi, hãy kiểm tra và cập nhật thông tin.
        </p>

        <button v-if="!ready" type="button"
            class="mt-4 w-full rounded-full border border-[#bdd3c5] px-4 py-3 text-sm font-semibold text-[#07532b] disabled:opacity-40"
            :disabled="!canRecalculate || previewing || loading" @click="$emit('recalculate')">
            {{ previewing ? "Đang tính..." : "Tính lại đơn hàng" }}
        </button>

        <button type="button"
            class="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-sm font-bold text-white transition hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="disabled || loading || !ready || previewing" @click="$emit('place-order')">
            <Icon v-if="loading" icon="mdi:loading" class="animate-spin text-xl" />
            {{ loading ? "Đang đặt hàng..." : "Đặt hàng" }}
            <Icon v-if="!loading" icon="mdi:arrow-right" class="text-lg" />
        </button>

        <p class="mt-4 text-center text-[10px] leading-4 text-slate-400">
            Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của NFarmHouse.
        </p>

        <div
            class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#f2f8f4] px-3 py-2.5 text-[11px] text-[#37604a]">
            <Icon icon="mdi:shield-lock-outline" class="text-lg text-[#0a7139]" />
            Kiểm tra lại thông tin trước khi đặt hàng
        </div>
    </aside>
</template>