<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import AccountOrderCard from '@/components/client/account/AccountOrderCard.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeStatus = ref('all')
const search = ref('')
const toast = ref('')

const tabs = [
    { value: 'all', label: 'Tất cả' },
    {
        value: 'pending',
        label: 'Chờ xác nhận',
    },
    {
        value: 'confirmed',
        label: 'Đã xác nhận',
    },
    {
        value: 'shipping',
        label: 'Vận chuyển',
    },
    {
        value: 'completed',
        label: 'Hoàn thành',
    },
    {
        value: 'cancelled',
        label: 'Đã hủy',
    },
]

// Mock đúng cấu trúc:
// orders -> items -> package -> variant -> product
const orders = ref([
    {
        id: 32,
        user_id: 3,
        note: 'Gọi trước khi giao hàng',
        delivery_id: 1,
        discount_amount: 50000,
        discount_id: 1,
        delivery_cost: 0,
        total_quantity: 1,
        total_payment: 518000,
        payment_method: 'COD',
        order_status: 'completed',
        created_at: '2026-08-28T11:25:00',

        items: [
            {
                id: 321,
                order_id: 32,
                package_id: 211,
                quantity: 1,
                price_at_purchase: 568000,

                package: {
                    id: 211,
                    sku: 'NPK-50KG',
                    size: 50,
                    unit: 'kg',

                    variant: {
                        id: 21,
                        variant_name:
                            'Bao nông nghiệp',

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
    },

    {
        id: 31,
        user_id: 3,
        note: '',
        delivery_id: 1,
        discount_amount: 0,
        discount_id: null,
        delivery_cost: 30000,
        total_quantity: 2,
        total_payment: 566000,
        payment_method: 'VNPAY',
        order_status: 'pending',
        created_at: '2026-08-30T10:24:00',

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
                        variant_name:
                            'Chai tiêu chuẩn',

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
        ],
    },
])

const filteredOrders = computed(() => {
    const keyword = search.value
        .trim()
        .toLowerCase()

    return orders.value.filter((order) => {
        const matchesStatus =
            activeStatus.value === 'all' ||
            order.order_status ===
            activeStatus.value

        const productNames = order.items
            .map(
                (item) =>
                    item.package?.variant?.product
                        ?.product_name || '',
            )
            .join(' ')
            .toLowerCase()

        const matchesSearch =
            !keyword ||
            String(order.id).includes(keyword) ||
            productNames.includes(keyword)

        return (
            matchesStatus && matchesSearch
        )
    })
})

function countStatus(status) {
    if (status === 'all') {
        return orders.value.length
    }

    return orders.value.filter(
        (order) =>
            order.order_status === status,
    ).length
}

function cancelOrder(order) {
    if (
        !window.confirm(
            `Bạn có chắc muốn hủy đơn hàng #${order.id}?`,
        )
    ) {
        return
    }

    order.order_status = 'cancelled'
    toast.value =
        `Đã hủy đơn hàng #${order.id}.`

    // Backend:
    // PATCH /api/orders/:id/cancel
}

function buyAgain(order) {
    const payload = order.items.map(
        (item) => ({
            package_id: item.package_id,
            quantity: item.quantity,
        }),
    )

    console.log(
        'Buy again payload:',
        payload,
    )

    toast.value =
        'Đã thêm lại sản phẩm vào giỏ hàng.'

    // Backend:
    // POST /api/cart/buy-again
}

function viewDetail(order) {
    router.push({
        name: 'order-detail',
        params: {
            id: order.id,
        },
    })
}

</script>

<template>
    <section>
        <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header class="border-b border-slate-100 px-5 py-5 sm:px-7">
                <div class="flex items-center gap-3">
                    <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                        <Icon icon="mdi:clipboard-text-clock-outline" class="text-2xl" />
                    </span>

                    <div>
                        <h1 class="text-lg font-bold text-[#123d27]">
                            Đơn mua của tôi
                        </h1>

                        <p class="mt-0.5 text-xs text-slate-400">
                            Theo dõi, quản lý và mua lại sản
                            phẩm từ các đơn hàng.
                        </p>
                    </div>
                </div>
            </header>

            <div class="overflow-x-auto border-b border-slate-100 px-3 sm:px-5">
                <div class="flex min-w-max">
                    <button v-for="tab in tabs" :key="tab.value" type="button"
                        class="relative flex items-center gap-1.5 px-4 py-4 text-xs font-semibold transition" :class="activeStatus === tab.value
                            ? 'text-[#07532b]'
                            : 'text-slate-400 hover:text-[#07532b]'
                            " @click="
                                activeStatus = tab.value
                                ">
                        {{ tab.label }}

                        <span
                            class="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">
                            {{
                                countStatus(tab.value)
                            }}
                        </span>

                        <span v-if="
                            activeStatus === tab.value
                        " class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0a7139]"></span>
                    </button>
                </div>
            </div>

            <div class="p-4 sm:p-5">
                <div class="relative">
                    <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

                    <input v-model.trim="search"
                        class="h-12 w-full rounded-2xl border border-slate-200 bg-[#fafcfb] pl-12 pr-11 text-sm outline-none focus:border-[#0a7139] focus:bg-white focus:ring-4 focus:ring-[#0a7139]/10"
                        placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..." />

                    <button v-if="search" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        @click="search = ''">
                        <Icon icon="mdi:close-circle" class="text-lg" />
                    </button>
                </div>
            </div>
        </div>

        <div v-if="toast"
            class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
            <span class="flex items-center gap-2">
                <Icon icon="mdi:check-circle-outline" class="text-xl" />

                {{ toast }}
            </span>

            <button type="button" @click="toast = ''">
                <Icon icon="mdi:close" class="text-lg" />
            </button>
        </div>

        <div v-if="filteredOrders.length" class="mt-5 space-y-5">
            <AccountOrderCard v-for="order in filteredOrders" :key="order.id" :order="order" @cancel="cancelOrder"
                @buy-again="buyAgain" @view-detail="viewDetail" />
        </div>

        <div v-else class="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <Icon icon="mdi:clipboard-text-off-outline" class="mx-auto text-5xl text-slate-300" />

            <h2 class="mt-5 text-base font-bold text-[#123d27]">
                Không tìm thấy đơn hàng
            </h2>

            <p class="mt-1 text-xs text-slate-400">
                Thử thay đổi trạng thái hoặc từ khóa tìm
                kiếm.
            </p>
        </div>
    </section>
</template>