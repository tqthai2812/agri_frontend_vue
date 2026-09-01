<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    subtotal: {
        type: Number,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    shippingEstimate: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    selectedCount: {
        type: Number,
        default: 0,
    },
    freeShippingThreshold: {
        type: Number,
        default: 1000000,
    },
    appliedDiscount: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits([
    'apply-discount',
    'remove-discount',
    'checkout',
])

const discountCode = ref('')

const missingForFreeShipping = computed(() => {
    return Math.max(
        props.freeShippingThreshold - props.subtotal,
        0,
    )
})

const shippingProgress = computed(() => {
    if (!props.freeShippingThreshold) {
        return 100
    }

    return Math.min(
        (props.subtotal / props.freeShippingThreshold) * 100,
        100,
    )
})

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

function submitDiscount() {
    const code = discountCode.value.trim().toUpperCase()

    if (!code) {
        return
    }

    emit('apply-discount', code)
}
</script>

<template>
    <aside
        class="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(6,75,38,0.09)] sm:p-6 lg:sticky lg:top-6">
        <h2 class="text-lg font-bold text-[#123d27]">
            Tóm tắt đơn hàng
        </h2>

        <p class="mt-1 text-xs text-slate-500">
            {{ selectedCount }} sản phẩm đang được chọn
        </p>

        <div class="mt-5 rounded-2xl bg-[#f1f7f3] p-4">
            <div class="flex gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#07532b] text-white">
                    <Icon icon="mdi:truck-fast-outline" class="text-xl" />
                </span>

                <div class="min-w-0 flex-1">
                    <p v-if="missingForFreeShipping" class="text-xs leading-5 text-[#365846]">
                        Mua thêm
                        <strong class="text-[#07532b]">
                            {{ formatVND(missingForFreeShipping) }}
                        </strong>
                        để được miễn phí vận chuyển.
                    </p>

                    <p v-else class="text-xs font-semibold leading-5 text-[#07532b]">
                        Chúc mừng! Đơn hàng được miễn phí vận chuyển.
                    </p>

                    <div class="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div class="h-full rounded-full bg-gradient-to-r from-[#0a7139] to-[#f0bd20] transition-all duration-500"
                            :style="{ width: `${shippingProgress}%` }"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-5">
            <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#365846]">
                Mã giảm giá
            </label>

            <div v-if="!appliedDiscount" class="flex gap-2">
                <div class="relative min-w-0 flex-1">
                    <Icon icon="mdi:ticket-percent-outline"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

                    <input v-model="discountCode" type="text" placeholder="Nhập mã ưu đãi"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm uppercase outline-none transition placeholder:normal-case focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10"
                        @keyup.enter="submitDiscount" />
                </div>

                <button type="button"
                    class="rounded-xl bg-[#e9b817] px-4 text-xs font-bold text-[#073f22] transition hover:bg-[#ffd329]"
                    @click="submitDiscount">
                    Áp dụng
                </button>
            </div>

            <div v-else
                class="flex items-center justify-between rounded-xl border border-dashed border-[#8eb89e] bg-[#f1f7f3] px-3 py-2.5">
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:ticket-confirmation-outline" class="text-xl text-[#0a7139]" />

                    <div>
                        <strong class="block text-xs text-[#07532b]">
                            {{ appliedDiscount.discount_code }}
                        </strong>

                        <span class="text-[10px] text-slate-500">
                            Đã áp dụng cho đơn hàng
                        </span>
                    </div>
                </div>

                <button type="button" class="text-xs font-semibold text-red-500 hover:underline"
                    @click="emit('remove-discount')">
                    Bỏ mã
                </button>
            </div>

            <p class="mt-2 text-[10px] text-slate-400">
                Dùng thử mã <strong>NFARM10</strong>
            </p>
        </div>

        <div class="my-5 border-t border-dashed border-slate-200"></div>

        <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4 text-slate-600">
                <dt>Tạm tính</dt>
                <dd class="font-semibold text-slate-800">
                    {{ formatVND(subtotal) }}
                </dd>
            </div>

            <div class="flex items-center justify-between gap-4 text-slate-600">
                <dt>Giảm giá</dt>
                <dd class="font-semibold text-[#0a7a3d]">
                    -{{ formatVND(discountAmount) }}
                </dd>
            </div>

            <div class="flex items-center justify-between gap-4 text-slate-600">
                <dt class="flex items-center gap-1">
                    Phí vận chuyển tạm tính
                    <Icon icon="mdi:information-outline" class="text-base text-slate-400" />
                </dt>

                <dd class="font-semibold text-slate-800">
                    {{
                        shippingEstimate
                            ? formatVND(shippingEstimate)
                            : 'Miễn phí'
                    }}
                </dd>
            </div>
        </dl>

        <div class="my-5 border-t border-slate-200"></div>

        <div class="flex items-end justify-between gap-4">
            <span class="text-sm font-bold text-[#123d27]">
                Tổng cộng
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
            :disabled="selectedCount === 0" @click="emit('checkout')">
            Tiến hành thanh toán

            <span class="grid size-7 place-items-center rounded-full bg-[#ffd326] text-[#07532b]">
                <Icon icon="mdi:arrow-right" class="text-lg" />
            </span>
        </button>

        <div class="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Icon icon="mdi:shield-check-outline" class="text-base text-[#0a7139]" />
            Thanh toán an toàn và bảo mật
        </div>
    </aside>
</template>