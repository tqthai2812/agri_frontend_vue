<script setup>
import { Icon } from "@iconify/vue";

defineProps({
    subtotal: {
        type: Number,
        default: 0,
    },
    selectedCount: {
        type: Number,
        default: 0,
    },
    loading: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["checkout"]);

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
        <h2 class="text-lg font-bold text-[#123d27]">
            Tóm tắt giỏ hàng
        </h2>

        <p class="mt-1 text-xs text-slate-500">
            {{ selectedCount }} sản phẩm đang được chọn
        </p>

        <div class="mt-5 flex gap-3 rounded-2xl bg-[#f1f7f3] p-4">
            <Icon icon="mdi:truck-fast-outline" class="shrink-0 text-2xl text-[#07532b]" />

            <p class="text-xs leading-5 text-[#365846]">
                Phí vận chuyển và mã giảm giá sẽ được tính ở bước thanh toán
                sau khi bạn chọn địa chỉ nhận hàng.
            </p>
        </div>

        <div class="my-5 border-t border-dashed border-slate-200"></div>

        <div class="flex items-end justify-between gap-4">
            <span class="text-sm font-bold text-[#123d27]">
                Tiền hàng đã chọn
            </span>

            <strong class="text-2xl font-extrabold text-[#0a7a3d]">
                {{ formatVND(subtotal) }}
            </strong>
        </div>

        <p class="mt-2 text-right text-xs text-slate-400">
            Chưa bao gồm phí vận chuyển và giảm giá
        </p>

        <button type="button"
            class="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-sm font-bold text-white transition hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="selectedCount === 0 || loading" @click="$emit('checkout')">
            Tiến hành thanh toán
            <Icon icon="mdi:arrow-right" class="text-lg" />
        </button>

        <div class="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Icon icon="mdi:shield-check-outline" class="text-base text-[#0a7139]" />
            Kiểm tra đơn hàng trước khi xác nhận
        </div>
    </aside>
</template>