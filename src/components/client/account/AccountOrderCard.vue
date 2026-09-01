<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    order: {
        type: Object,
        required: true,
    },
})

defineEmits([
    'cancel',
    'buy-again',
    'view-detail',
])

const statusMap = {
    pending: {
        label: 'Chờ xác nhận',
        class:
            'bg-amber-50 text-amber-600 border-amber-200',
        icon: 'mdi:clock-outline',
    },
    confirmed: {
        label: 'Đã xác nhận',
        class:
            'bg-blue-50 text-blue-600 border-blue-200',
        icon: 'mdi:check-decagram-outline',
    },
    shipping: {
        label: 'Đang vận chuyển',
        class:
            'bg-violet-50 text-violet-600 border-violet-200',
        icon: 'mdi:truck-fast-outline',
    },
    completed: {
        label: 'Giao hàng thành công',
        class:
            'bg-emerald-50 text-emerald-600 border-emerald-200',
        icon:
            'mdi:package-variant-closed-check',
    },
    cancelled: {
        label: 'Đã hủy',
        class:
            'bg-red-50 text-red-500 border-red-200',
        icon: 'mdi:close-circle-outline',
    },
}

const status = computed(() => {
    return (
        statusMap[props.order.order_status] ||
        statusMap.pending
    )
})

function productOf(item) {
    return (
        item.package?.variant?.product || {}
    )
}

function imageOf(item) {
    const product = productOf(item)
    const images = product.images || []

    return (
        images.find((image) => image.is_primary)
            ?.image_url ||
        images[0]?.image_url ||
        product.primary_image
    )
}

function packageLabel(item) {
    const pkg = item.package || {}

    return `${pkg.size || ''} ${pkg.unit || ''
        }`.trim()
}

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

function formatDate(value) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}
</script>

<template>
    <article
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-[0_14px_40px_rgba(6,75,38,0.07)]">
        <header
            class="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <strong class="text-[#123d27]">
                    Đơn hàng #{{ order.id }}
                </strong>

                <span class="text-slate-300">•</span>

                <span class="text-slate-400">
                    {{ formatDate(order.created_at) }}
                </span>

                <span class="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                    {{ order.payment_method }}
                </span>
            </div>

            <span
                class="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
                :class="status.class">
                <Icon :icon="status.icon" class="text-base" />

                {{ status.label }}
            </span>
        </header>

        <div class="divide-y divide-slate-100">
            <div v-for="item in order.items" :key="item.id" class="flex gap-4 px-5 py-4">
                <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2">
                    <img :src="imageOf(item)" :alt="productOf(item).product_name
                        " class="h-full w-full object-contain" />
                </div>

                <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
                    <div class="min-w-0">
                        <RouterLink :to="{
                            name: 'client-product-detail',
                            params: {
                                id: productOf(item).id,
                            },
                        }" class="line-clamp-2 text-sm font-semibold leading-5 text-[#123d27] hover:text-[#d39f00]">
                            {{
                                productOf(item).product_name
                            }}
                        </RouterLink>

                        <p class="mt-1 text-[10px] text-slate-400">
                            Phân loại:
                            {{
                                item.package?.variant
                                    ?.variant_name
                            }}
                            · {{ packageLabel(item) }}
                        </p>

                        <p class="mt-1 text-[11px] text-slate-500">
                            × {{ item.quantity }}
                        </p>
                    </div>

                    <strong class="mt-2 block shrink-0 text-sm text-[#0a7a3d] sm:mt-0">
                        {{
                            formatVND(
                                item.price_at_purchase,
                            )
                        }}
                    </strong>
                </div>
            </div>
        </div>

        <footer class="border-t border-slate-100 bg-[#fafcfb] px-5 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <button type="button"
                    class="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#07532b]"
                    @click="
                        $emit('view-detail', order)
                        ">
                    <Icon icon="mdi:receipt-text-outline" class="text-lg" />
                    Xem chi tiết đơn hàng
                </button>

                <div class="text-left sm:text-right">
                    <p class="text-xs text-slate-500">
                        Thành tiền:

                        <strong class="ml-2 text-xl text-[#0a7a3d]">
                            {{
                                formatVND(
                                    order.total_payment,
                                )
                            }}
                        </strong>
                    </p>

                    <div class="mt-3 flex flex-wrap gap-2 sm:justify-end">
                        <button type="button"
                            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-[#0a7139] hover:text-[#07532b]">
                            Liên hệ CSKH
                        </button>

                        <button v-if="
                            order.order_status ===
                            'pending'
                        " type="button"
                            class="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                            @click="
                                $emit('cancel', order)
                                ">
                            Hủy đơn hàng
                        </button>

                        <button v-if="
                            [
                                'completed',
                                'cancelled',
                            ].includes(
                                order.order_status,
                            )
                        " type="button"
                            class="rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white hover:bg-[#0a6837]"
                            @click="
                                $emit('buy-again', order)
                                ">
                            Mua lại
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    </article>
</template>