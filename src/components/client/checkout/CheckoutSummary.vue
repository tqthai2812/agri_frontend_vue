<script setup>
import { Icon } from '@iconify/vue'

defineProps({
    merchandiseTotal: {
        type: Number,
        default: 0,
    },
    shippingCost: {
        type: Number,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

defineEmits(['place-order'])

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}
</script>

<template>
    <aside
        class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(6,75,38,0.09)] sm:p-6 lg:sticky lg:top-6">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#123d27]">
                Chi tiết thanh toán
            </h2>

            <Icon icon="mdi:receipt-text-check-outline" class="text-2xl text-[#0a7139]" />
        </div>

        <dl class="mt-5 space-y-3.5 text-sm">
            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Tổng tiền hàng</dt>
                <dd class="font-semibold text-slate-700">
                    {{ formatVND(merchandiseTotal) }}
                </dd>
            </div>

            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Phí vận chuyển</dt>
                <dd class="font-semibold text-slate-700">
                    {{
                        shippingCost
                            ? formatVND(shippingCost)
                            : 'Miễn phí'
                    }}
                </dd>
            </div>

            <div class="flex justify-between gap-4 text-slate-500">
                <dt>Voucher NFarmHouse</dt>
                <dd class="font-semibold text-[#0a7a3d]">
                    -{{ formatVND(discountAmount) }}
                </dd>
            </div>
        </dl>

        <div class="my-5 border-t border-dashed border-slate-200"></div>

        <div class="flex items-end justify-between gap-4">
            <span class="text-sm font-bold text-[#123d27]">
                Tổng thanh toán
            </span>

            <div class="text-right">
                <strong class="block text-2xl font-extrabold text-[#0a7a3d]">
                    {{ formatVND(total) }}
                </strong>

                <span class="text-[10px] text-slate-400">
                    Đã bao gồm thuế (nếu có)
                </span>
            </div>
        </div>

        <button type="button"
            class="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(7,83,43,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            :disabled="disabled || loading" @click="$emit('place-order')">
            <Icon v-if="loading" icon="mdi:loading" class="animate-spin text-xl" />

            {{ loading ? 'Đang đặt hàng...' : 'Đặt hàng' }}

            <span v-if="!loading" class="grid size-7 place-items-center rounded-full bg-[#ffd326] text-[#07532b]">
                <Icon icon="mdi:arrow-right" class="text-lg" />
            </span>
        </button>

        <p class="mt-4 text-center text-[10px] leading-4 text-slate-400">
            Bằng việc đặt hàng, bạn đồng ý với điều khoản
            sử dụng và chính sách bảo mật của NFarmHouse.
        </p>

        <div
            class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#f2f8f4] px-3 py-2.5 text-[11px] text-[#37604a]">
            <Icon icon="mdi:shield-lock-outline" class="text-lg text-[#0a7139]" />
            Thông tin thanh toán được bảo vệ an toàn
        </div>
    </aside>
</template>