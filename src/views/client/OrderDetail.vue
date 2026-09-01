<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

import ConfirmModal from '@/components/common/ConfirmModal.vue'
import OrderStatusTimeline from '@/components/client/account/OrderStatusTimeline.vue'
import OrderDetailItems from '@/components/client/account/OrderDetailItems.vue'

const route = useRoute()
const router = useRouter()

const showCancelModal = ref(false)
const actionLoading = ref(false)
const toast = ref('')

// Mock đúng cấu trúc:
// orders -> order_items -> package -> variant -> product.
// Khi nối backend, thay bằng GET /api/orders/:id.
const order = ref({
    id: Number(route.params.id) || 31,
    order_code: `OR${String(route.params.id || 31).padStart(8, '0')}`,
    user_id: 3,
    note: 'Gọi trước khi giao hàng giúp tôi.',
    delivery_id: 1,
    discount_amount: 100000,
    discount_id: 1,
    delivery_cost: 30000,
    total_quantity: 3,
    total_payment: 1031000,
    payment_method: 'COD',
    order_status: 'shipping',
    created_at: '2026-08-30T10:24:00',

    discount: {
        id: 1,
        discount_code: 'NFARM100K',
    },

    delivery_method: {
        id: 1,
        name: 'Giao hàng tiêu chuẩn',
        description: 'Nhận hàng dự kiến trong 2–4 ngày làm việc',
    },

    receiver_address: {
        receiver_name: 'Trần Quốc Thái',
        receiver_phone: '0334745376',
        province: 'Thành phố Cần Thơ',
        district: 'Quận Ninh Kiều',
        ward: 'Phường Cái Khế',
        address_detail: 'Số 154, đường Trần Văn Khéo',
    },

    items: [
        {
            id: 311,
            order_id: 31,
            package_id: 111,
            quantity: 2,
            price_at_purchase: 268000,

            package: {
                id: 111,
                sku: 'RG-250ML',
                size: 250,
                unit: 'ml',

                variant: {
                    id: 11,
                    variant_name: 'Chai tiêu chuẩn',

                    product: {
                        id: 101,
                        product_name:
                            'Rice Guard - Thuốc bảo vệ thực vật sinh học',

                        images: [
                            {
                                id: 1,
                                image_url:
                                    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=500&q=85',
                                is_primary: true,
                            },
                        ],
                    },
                },
            },
        },

        {
            id: 312,
            order_id: 31,
            package_id: 211,
            quantity: 1,
            price_at_purchase: 565000,

            package: {
                id: 211,
                sku: 'NPK-50KG',
                size: 50,
                unit: 'kg',

                variant: {
                    id: 21,
                    variant_name: 'Bao nông nghiệp',

                    product: {
                        id: 102,
                        product_name:
                            'Phân bón NPK hữu cơ chuyên dùng cho cây lúa',

                        images: [
                            {
                                id: 2,
                                image_url:
                                    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=500&q=85',
                                is_primary: true,
                            },
                        ],
                    },
                },
            },
        },
    ],
})

const statusMap = {
    pending: {
        label: 'Chờ xác nhận',
        message: 'Đơn hàng đang chờ NFarmHouse xác nhận.',
        icon: 'mdi:clock-outline',
        class: 'border-amber-100 bg-amber-50 text-amber-700',
    },

    confirmed: {
        label: 'Đã xác nhận',
        message:
            'Đơn hàng đã được xác nhận và đang chuẩn bị sản phẩm.',
        icon: 'mdi:check-decagram-outline',
        class: 'border-blue-100 bg-blue-50 text-blue-700',
    },

    shipping: {
        label: 'Đang giao hàng',
        message:
            'Đơn hàng đang trên đường giao đến bạn. Vui lòng chú ý điện thoại.',
        icon: 'mdi:truck-fast-outline',
        class: 'border-violet-100 bg-violet-50 text-violet-700',
    },

    completed: {
        label: 'Hoàn thành',
        message:
            'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm!',
        icon: 'mdi:package-variant-closed-check',
        class: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },

    cancelled: {
        label: 'Đã hủy',
        message: 'Đơn hàng này đã được hủy.',
        icon: 'mdi:close-circle-outline',
        class: 'border-red-100 bg-red-50 text-red-600',
    },
}

const currentStatus = computed(() => {
    return statusMap[order.value.order_status] || statusMap.pending
})

const merchandiseTotal = computed(() => {
    return order.value.items.reduce((total, item) => {
        return (
            total +
            Number(item.price_at_purchase || 0) *
            Number(item.quantity || 0)
        )
    }, 0)
})

const receiverAddress = computed(() => {
    const address = order.value.receiver_address || {}

    return [
        address.address_detail,
        address.ward,
        address.district,
        address.province,
    ]
        .filter(Boolean)
        .join(', ')
})

const paymentLabel = computed(() => {
    return order.value.payment_method === 'VNPAY'
        ? 'Thanh toán trực tuyến qua VNPay'
        : 'Thanh toán khi nhận hàng (COD)'
})

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

function formatDate(value) {
    if (!value) return '—'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

async function cancelOrder() {
    actionLoading.value = true

    try {
        // Backend:
        // await apiClient.patch(`/api/orders/${order.value.id}/cancel`)

        await new Promise((resolve) => {
            window.setTimeout(resolve, 500)
        })

        order.value.order_status = 'cancelled'
        toast.value = `Đã hủy đơn hàng #${order.value.id}.`
        showCancelModal.value = false
    } finally {
        actionLoading.value = false
    }
}

function buyAgain() {
    const payload = order.value.items.map((item) => ({
        package_id: item.package_id,
        quantity: item.quantity,
    }))

    console.log('Buy again payload:', payload)

    toast.value = 'Đã thêm lại các sản phẩm vào giỏ hàng.'

    // Backend:
    // POST /api/cart/buy-again
}

function printOrder() {
    window.print()
}
</script>

<template>
    <section class="space-y-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <button type="button"
                    class="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-[#07532b] print:hidden"
                    @click="router.push({ name: 'my-orders' })">
                    <Icon icon="mdi:arrow-left" class="text-base" />
                    Quay lại đơn mua
                </button>

                <h1 class="text-xl font-bold text-[#123d27] sm:text-2xl">
                    Chi tiết đơn hàng #{{ order.id }}
                </h1>

                <p class="mt-1 text-xs text-slate-400">
                    Đặt lúc {{ formatDate(order.created_at) }}
                </p>
            </div>

            <button type="button"
                class="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-[#0a7139] hover:text-[#07532b] print:hidden"
                @click="printOrder">
                <Icon icon="mdi:printer-outline" class="text-lg" />
                In đơn hàng
            </button>
        </div>

        <OrderStatusTimeline :status="order.order_status" />

        <div class="flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-xs leading-5"
            :class="currentStatus.class">
            <Icon :icon="currentStatus.icon" class="mt-0.5 shrink-0 text-xl" />

            <div>
                <strong class="block text-sm">
                    {{ currentStatus.label }}
                </strong>

                <span>{{ currentStatus.message }}</span>
            </div>
        </div>

        <div v-if="toast"
            class="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 print:hidden">
            <span class="flex items-center gap-2">
                <Icon icon="mdi:check-circle-outline" class="text-xl" />
                {{ toast }}
            </span>

            <button type="button" aria-label="Đóng thông báo" @click="toast = ''">
                <Icon icon="mdi:close" class="text-lg" />
            </button>
        </div>

        <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div class="min-w-0 space-y-5">
                <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div class="flex items-start gap-3">
                        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff7d1] text-[#a77d00]">
                            <Icon icon="mdi:map-marker-outline" class="text-xl" />
                        </span>

                        <div class="min-w-0">
                            <h2 class="text-sm font-bold text-[#123d27]">
                                Địa chỉ nhận hàng
                            </h2>

                            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                <strong class="text-slate-700">
                                    {{ order.receiver_address.receiver_name }}
                                </strong>

                                <span class="text-slate-300">|</span>

                                <a :href="`tel:${order.receiver_address.receiver_phone}`"
                                    class="text-slate-500 hover:text-[#07532b]">
                                    {{ order.receiver_address.receiver_phone }}
                                </a>
                            </div>

                            <p class="mt-2 text-xs leading-5 text-slate-500">
                                {{ receiverAddress }}
                            </p>
                        </div>
                    </div>
                </section>

                <OrderDetailItems :items="order.items" />

                <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 class="text-sm font-bold text-[#123d27]">
                        Vận chuyển và thanh toán
                    </h2>

                    <div class="mt-5 grid gap-5 sm:grid-cols-2">
                        <div class="flex gap-3">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#07532b]">
                                <Icon icon="mdi:truck-delivery-outline" class="text-xl" />
                            </span>

                            <div>
                                <strong class="block text-xs text-slate-700">
                                    {{ order.delivery_method.name }}
                                </strong>

                                <p class="mt-1 text-[10px] leading-4 text-slate-400">
                                    {{ order.delivery_method.description }}
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#07532b]">
                                <Icon icon="mdi:cash-multiple" class="text-xl" />
                            </span>

                            <div>
                                <strong class="block text-xs text-slate-700">
                                    {{ paymentLabel }}
                                </strong>

                                <p class="mt-1 text-[10px] leading-4 text-slate-400">
                                    {{
                                        order.payment_method === 'VNPAY'
                                            ? 'Đã ghi nhận giao dịch thanh toán.'
                                            : 'Thanh toán cho đơn vị vận chuyển khi nhận hàng.'
                                    }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="order.note" class="mt-5 rounded-2xl bg-[#fafcfb] px-4 py-3 text-xs text-slate-500">
                        <strong class="mr-1 text-slate-700">
                            Lời nhắn:
                        </strong>

                        {{ order.note }}
                    </div>
                </section>
            </div>

            <aside class="rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
                <header class="border-b border-slate-100 px-5 py-5">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-[10px] uppercase tracking-wider text-slate-400">
                                Mã đơn hàng
                            </p>

                            <strong class="mt-1 block text-sm text-[#123d27]">
                                {{ order.order_code }}
                            </strong>
                        </div>

                        <span class="rounded-full bg-[#edf5f0] px-3 py-1.5 text-[10px] font-bold text-[#07532b]">
                            {{ currentStatus.label }}
                        </span>
                    </div>
                </header>

                <div class="space-y-3 px-5 py-5 text-xs">
                    <div class="flex items-center justify-between gap-4 text-slate-500">
                        <span>Tiền hàng</span>
                        <span>{{ formatVND(merchandiseTotal) }}</span>
                    </div>

                    <div class="flex items-center justify-between gap-4 text-slate-500">
                        <span>Phí vận chuyển</span>
                        <span>{{ formatVND(order.delivery_cost) }}</span>
                    </div>

                    <div v-if="order.discount_amount" class="flex items-center justify-between gap-4 text-emerald-600">
                        <span class="flex items-center gap-1.5">
                            <Icon icon="mdi:ticket-percent-outline" class="text-base" />

                            Giảm giá

                            <small v-if="order.discount?.discount_code"
                                class="rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold">
                                {{ order.discount.discount_code }}
                            </small>
                        </span>

                        <span>
                            -{{ formatVND(order.discount_amount) }}
                        </span>
                    </div>

                    <div class="border-t border-dashed border-slate-200 pt-4">
                        <div class="flex items-end justify-between gap-4">
                            <span class="font-semibold text-slate-700">
                                Tổng thanh toán
                            </span>

                            <strong class="text-xl text-[#0a7a3d]">
                                {{ formatVND(order.total_payment) }}
                            </strong>
                        </div>

                        <p class="mt-1 text-right text-[9px] text-slate-400">
                            Đã bao gồm thuế (nếu có)
                        </p>
                    </div>
                </div>

                <footer class="space-y-2 border-t border-slate-100 px-5 py-5 print:hidden">
                    <button v-if="order.order_status === 'pending'" type="button"
                        class="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-300 text-xs font-bold text-red-500 transition hover:bg-red-50"
                        @click="showCancelModal = true">
                        <Icon icon="mdi:close-circle-outline" class="text-lg" />
                        Hủy đơn hàng
                    </button>

                    <button v-if="
                        ['completed', 'cancelled'].includes(
                            order.order_status,
                        )
                    " type="button"
                        class="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#07532b] text-xs font-bold text-white transition hover:bg-[#0a6837]"
                        @click="buyAgain">
                        <Icon icon="mdi:cart-arrow-down" class="text-lg" />
                        Mua lại đơn hàng
                    </button>

                    <a href="tel:+84334745378"
                        class="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-500 transition hover:border-[#0a7139] hover:text-[#07532b]">
                        <Icon icon="mdi:headset" class="text-lg" />
                        Liên hệ hỗ trợ
                    </a>
                </footer>
            </aside>
        </div>

        <ConfirmModal v-model="showCancelModal" title="Xác nhận hủy đơn hàng"
            :message="`Bạn có chắc muốn hủy đơn hàng #${order.id}? Thao tác này không thể hoàn tác.`"
            confirm-text="Hủy đơn hàng" cancel-text="Giữ đơn" loading-text="Đang hủy..." type="danger"
            icon="mdi:close-circle-outline" :loading="actionLoading" :close-on-overlay="false" @confirm="cancelOrder" />
    </section>
</template>