<script setup>
import {
    computed,
    onBeforeUnmount,
    ref,
} from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import AddressBookModal from '@/components/client/checkout/AddressBookModal.vue'
import CheckoutProducts from '@/components/client/checkout/CheckoutProducts.vue'
import CheckoutSummary from '@/components/client/checkout/CheckoutSummary.vue'

const route = useRoute()

const addressModalOpen = ref(false)
const selectedAddressId = ref(1)
const selectedDeliveryId = ref(1)
const paymentMethod = ref('COD')
const orderNote = ref('')
const voucherCode = ref('')
const appliedDiscount = ref(null)
const placingOrder = ref(false)
const toast = ref(null)

let toastTimer = null

const addresses = ref([
    {
        id: 1,
        user_id: 3,
        receiver_name: 'Trần Quốc Thái',
        receiver_phone: '0334745378',
        province: 'Thành phố Cần Thơ',
        district: 'Quận Ninh Kiều',
        ward: 'Phường Hưng Lợi',
        address_detail: '30/4, đường 3 Tháng 2',
        address_type: 'home',
        is_default: true,
    },
    {
        id: 2,
        user_id: 3,
        receiver_name: 'Trần Quốc Thái',
        receiver_phone: '0334745378',
        province: 'Thành phố Cần Thơ',
        district: 'Quận Ninh Kiều',
        ward: 'Phường Tân An',
        address_detail:
            'Văn phòng NFarmHouse, đường Hai Bà Trưng',
        address_type: 'office',
        is_default: false,
    },
])

const checkoutItems = ref([
    {
        id: 1,
        cart_id: 1,
        package_id: 111,
        quantity: 2,

        package: {
            id: 111,
            sku: 'RG-250ML',
            size: 250,
            unit: 'ml',
            price: 268000,
            quantity_available: 36,

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
                                'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=85',
                            is_primary: true,
                        },
                    ],
                },
            },
        },
    },

    {
        id: 2,
        cart_id: 1,
        package_id: 211,
        quantity: 1,

        package: {
            id: 211,
            sku: 'NPK-50KG',
            size: 50,
            unit: 'kg',
            price: 565000,
            quantity_available: 8,

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
                                'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=85',
                            is_primary: true,
                        },
                    ],
                },
            },
        },
    },

    {
        id: 3,
        cart_id: 1,
        package_id: 311,
        quantity: 1,

        package: {
            id: 311,
            sku: 'SEED-5KG',
            size: 5,
            unit: 'kg',
            price: 320000,
            quantity_available: 3,

            variant: {
                id: 31,
                variant_name: 'Túi giống nguyên chủng',

                product: {
                    id: 103,
                    product_name:
                        'Hạt giống lúa chất lượng cao OM5451',

                    images: [
                        {
                            id: 3,
                            image_url:
                                'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=85',
                            is_primary: true,
                        },
                    ],
                },
            },
        },
    },
])

const requestedItemIds = String(
    route.query.items || '',
)
    .split(',')
    .map((id) => Number(id))
    .filter(Boolean)

if (requestedItemIds.length) {
    checkoutItems.value = checkoutItems.value.filter(
        (item) => requestedItemIds.includes(item.id),
    )
}

const deliveryMethods = ref([
    {
        id: 1,
        name: 'Giao hàng tiêu chuẩn',
        description:
            'Nhận hàng trong 3–5 ngày làm việc',
        base_price: 30000,
        min_order_amount: 1000000,
        region: 'Toàn quốc',
        is_active: true,
        icon: 'mdi:truck-outline',
    },
    {
        id: 2,
        name: 'Giao hàng nhanh',
        description:
            'Nhận hàng trong 1–2 ngày làm việc',
        base_price: 50000,
        min_order_amount: 2000000,
        region: 'Nội thành',
        is_active: true,
        icon: 'mdi:truck-fast-outline',
    },
])

const paymentMethods = [
    {
        value: 'COD',
        title: 'Thanh toán khi nhận hàng',
        description:
            'Thanh toán tiền mặt cho đơn vị vận chuyển.',
        icon: 'mdi:cash-on-delivery',
    },
    {
        value: 'VNPAY',
        title: 'Ví VNPAY / Ngân hàng',
        description:
            'Thanh toán trực tuyến qua cổng VNPAY.',
        icon: 'mdi:qrcode-scan',
    },
]

const selectedAddress = computed(() => {
    return (
        addresses.value.find(
            (address) =>
                address.id === selectedAddressId.value,
        ) || null
    )
})

const selectedDelivery = computed(() => {
    return (
        deliveryMethods.value.find(
            (method) =>
                method.id === selectedDeliveryId.value,
        ) || deliveryMethods.value[0]
    )
})

const totalQuantity = computed(() => {
    return checkoutItems.value.reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0),
        0,
    )
})

const merchandiseTotal = computed(() => {
    return checkoutItems.value.reduce(
        (sum, item) => {
            return (
                sum +
                Number(item.package?.price || 0) *
                Number(item.quantity || 0)
            )
        },
        0,
    )
})

const shippingCost = computed(() => {
    if (!selectedDelivery.value) return 0

    return merchandiseTotal.value >=
        Number(
            selectedDelivery.value.min_order_amount || 0,
        )
        ? 0
        : Number(
            selectedDelivery.value.base_price || 0,
        )
})

const discountAmount = computed(() => {
    if (
        !appliedDiscount.value ||
        merchandiseTotal.value <
        appliedDiscount.value.min_order_value
    ) {
        return 0
    }

    const percentValue =
        merchandiseTotal.value *
        (appliedDiscount.value.discount_percent /
            100)

    return Math.min(
        percentValue,
        appliedDiscount.value.max_discount_amount,
    )
})

const totalPayment = computed(() => {
    return Math.max(
        merchandiseTotal.value +
        shippingCost.value -
        discountAmount.value,
        0,
    )
})

const estimatedDelivery = computed(() => {
    const date = new Date()
    const days =
        selectedDeliveryId.value === 2 ? 2 : 5

    date.setDate(date.getDate() + days)

    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
    })
})

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

function showToast(
    message,
    type = 'success',
) {
    toast.value = {
        message,
        type,
    }

    clearTimeout(toastTimer)

    toastTimer = setTimeout(() => {
        toast.value = null
    }, 3200)
}

function selectAddress(id) {
    selectedAddressId.value = id
}

function saveAddress(payload) {
    if (payload.is_default) {
        addresses.value.forEach((address) => {
            address.is_default = false
        })
    }

    if (payload.id) {
        const index = addresses.value.findIndex(
            (address) => address.id === payload.id,
        )

        if (index !== -1) {
            addresses.value[index] = {
                ...addresses.value[index],
                ...payload,
            }

            selectedAddressId.value = payload.id
        }

        showToast('Cập nhật địa chỉ thành công.')
        return
    }

    const newAddress = {
        ...payload,

        id:
            Math.max(
                0,
                ...addresses.value.map((address) =>
                    Number(address.id),
                ),
            ) + 1,

        user_id: 3,
    }

    addresses.value.push(newAddress)
    selectedAddressId.value = newAddress.id

    showToast('Đã thêm địa chỉ mới.')
}

function applyVoucher() {
    const code = voucherCode.value
        .trim()
        .toUpperCase()

    if (code !== 'NFARM10') {
        showToast(
            'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
            'error',
        )

        return
    }

    if (merchandiseTotal.value < 500000) {
        showToast(
            'Đơn hàng cần đạt 500.000đ để dùng mã này.',
            'error',
        )

        return
    }

    appliedDiscount.value = {
        id: 1,
        discount_code: 'NFARM10',
        discount_percent: 10,
        max_discount_amount: 100000,
        min_order_value: 500000,
    }

    showToast('Áp dụng voucher thành công.')
}

if (route.query.discount) {
    voucherCode.value = String(
        route.query.discount,
    )

    applyVoucher()
}

async function placeOrder() {
    if (!selectedAddress.value) {
        showToast(
            'Vui lòng chọn địa chỉ nhận hàng.',
            'error',
        )

        return
    }

    if (!checkoutItems.value.length) {
        showToast(
            'Không có sản phẩm để thanh toán.',
            'error',
        )

        return
    }

    const payload = {
        shipping_address_id:
            selectedAddress.value.id,

        shipping_address: {
            receiver_name:
                selectedAddress.value.receiver_name,

            receiver_phone:
                selectedAddress.value.receiver_phone,

            province:
                selectedAddress.value.province,

            district:
                selectedAddress.value.district,

            ward:
                selectedAddress.value.ward,

            address_detail:
                selectedAddress.value.address_detail,
        },

        note: orderNote.value,
        delivery_id: selectedDeliveryId.value,

        discount_id:
            appliedDiscount.value?.id || null,

        discount_amount:
            discountAmount.value,

        delivery_cost:
            shippingCost.value,

        total_quantity:
            totalQuantity.value,

        total_payment:
            totalPayment.value,

        payment_method:
            paymentMethod.value,

        order_status: 'pending',

        items: checkoutItems.value.map(
            (item) => ({
                cart_item_id: item.id,
                package_id: item.package_id,
                quantity: item.quantity,

                price_at_purchase: Number(
                    item.package?.price || 0,
                ),
            }),
        ),
    }

    placingOrder.value = true

    try {
        console.log(
            'Order payload:',
            payload,
        )

        // Khi nối backend:
        // await apiClient.post('/api/orders', payload)

        await new Promise((resolve) =>
            setTimeout(resolve, 700),
        )

        showToast(
            paymentMethod.value === 'VNPAY'
                ? 'Tạo đơn thành công. Bước tiếp theo chuyển sang VNPAY.'
                : 'Đặt hàng thành công!',
        )
    } finally {
        placingOrder.value = false
    }
}

onBeforeUnmount(() => {
    clearTimeout(toastTimer)
})
</script>

<template>
    <div class="min-h-[70vh] bg-[#f7f9f7] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400">
                    <RouterLink to="/cart" class="transition hover:text-[#07532b]">
                        Giỏ hàng
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-medium text-[#174e31]">
                        Thanh toán
                    </span>
                </nav>

                <div class="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
                    <Icon icon="mdi:shield-check-outline" class="text-lg text-[#0a7139]" />
                    Thanh toán an toàn
                </div>
            </div>
        </div>

        <main class="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div class="mb-7">
                <span
                    class="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a7139]">
                    <Icon icon="mdi:sprout-outline" class="text-base" />
                    NFarmHouse
                </span>

                <h1 class="text-2xl font-extrabold text-[#123d27] sm:text-3xl">
                    Thanh toán đơn hàng
                </h1>

                <p class="mt-1 text-sm text-slate-500">
                    Kiểm tra địa chỉ, vận chuyển và phương
                    thức thanh toán trước khi đặt hàng.
                </p>
            </div>

            <div class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div class="space-y-5">
                    <!-- Địa chỉ -->
                    <section
                        class="relative overflow-hidden rounded-3xl border border-[#e7c866] bg-white p-5 shadow-sm sm:p-6">
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#0a7139_0,#0a7139_16px,#ffd326_16px,#ffd326_32px,#fff_32px,#fff_48px)]">
                        </div>

                        <div class="flex items-start justify-between gap-4">
                            <div class="flex min-w-0 gap-3">
                                <span
                                    class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                    <Icon icon="mdi:map-marker-outline" class="text-2xl" />
                                </span>

                                <div v-if="selectedAddress" class="min-w-0">
                                    <h2 class="text-sm font-bold text-[#123d27]">
                                        Địa chỉ nhận hàng
                                    </h2>

                                    <div class="mt-2 flex flex-wrap items-center gap-2">
                                        <strong class="text-sm">
                                            {{
                                                selectedAddress.receiver_name
                                            }}
                                        </strong>

                                        <span class="h-4 w-px bg-slate-200"></span>

                                        <span class="text-sm text-slate-600">
                                            {{
                                                selectedAddress.receiver_phone
                                            }}
                                        </span>

                                        <span v-if="
                                            selectedAddress.is_default
                                        "
                                            class="rounded border border-[#0a7139] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0a7139]">
                                            Mặc định
                                        </span>
                                    </div>

                                    <p class="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                                        {{
                                            selectedAddress.address_detail
                                        }},
                                        {{ selectedAddress.ward }},
                                        {{ selectedAddress.district }},
                                        {{ selectedAddress.province }}
                                    </p>
                                </div>
                            </div>

                            <button type="button"
                                class="shrink-0 rounded-full border border-[#0a7139] px-4 py-2 text-xs font-bold text-[#07532b] transition hover:bg-[#edf5f0]"
                                @click="
                                    addressModalOpen = true
                                    ">
                                {{
                                    selectedAddress
                                        ? 'Thay đổi'
                                        : 'Thêm địa chỉ'
                                }}
                            </button>
                        </div>
                    </section>

                    <CheckoutProducts :items="checkoutItems" />

                    <!-- Vận chuyển -->
                    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div class="flex items-center gap-3">
                            <span class="grid size-9 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                <Icon icon="mdi:truck-delivery-outline" class="text-xl" />
                            </span>

                            <div>
                                <h2 class="text-sm font-bold text-[#123d27]">
                                    Phương thức vận chuyển
                                </h2>

                                <p class="text-[10px] text-slate-400">
                                    Chọn tốc độ giao hàng phù hợp.
                                </p>
                            </div>
                        </div>

                        <div class="mt-4 grid gap-3 sm:grid-cols-2">
                            <label v-for="method in deliveryMethods" :key="method.id"
                                class="flex cursor-pointer gap-3 rounded-2xl border p-4 transition" :class="selectedDeliveryId === method.id
                                    ? 'border-[#0a7139] bg-[#f2f8f4] ring-2 ring-[#0a7139]/10'
                                    : 'border-slate-200 hover:border-[#9dbba8]'
                                    ">
                                <input v-model="selectedDeliveryId" type="radio" :value="method.id"
                                    class="mt-1 accent-[#07532b]" />

                                <Icon :icon="method.icon" class="text-2xl text-[#0a7139]" />

                                <span class="min-w-0 flex-1">
                                    <strong class="block text-xs text-[#123d27]">
                                        {{ method.name }}
                                    </strong>

                                    <small class="mt-1 block text-[10px] leading-4 text-slate-400">
                                        {{ method.description }}
                                    </small>

                                    <small class="mt-2 block font-semibold text-[#0a7139]">
                                        {{
                                            merchandiseTotal >=
                                                method.min_order_amount
                                                ? 'Miễn phí'
                                                : formatVND(
                                                    method.base_price,
                                                )
                                        }}
                                    </small>
                                </span>
                            </label>
                        </div>

                        <div
                            class="mt-4 flex items-center gap-2 rounded-xl bg-[#fff8dc] px-3 py-2.5 text-[11px] text-[#806513]">
                            <Icon icon="mdi:calendar-check-outline" class="text-lg" />

                            Dự kiến nhận hàng:
                            <strong>
                                {{ estimatedDelivery }}
                            </strong>
                        </div>
                    </section>

                    <!-- Thanh toán -->
                    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 class="text-sm font-bold text-[#123d27]">
                            Phương thức thanh toán
                        </h2>

                        <div class="mt-4 space-y-3">
                            <label v-for="method in paymentMethods" :key="method.value"
                                class="flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition" :class="paymentMethod === method.value
                                    ? 'border-[#0a7139] bg-[#f2f8f4] ring-2 ring-[#0a7139]/10'
                                    : 'border-slate-200'
                                    ">
                                <input v-model="paymentMethod" type="radio" :value="method.value"
                                    class="size-4 accent-[#07532b]" />

                                <Icon :icon="method.icon" class="text-2xl text-[#07532b]" />

                                <span class="flex-1">
                                    <strong class="block text-xs text-[#123d27]">
                                        {{ method.title }}
                                    </strong>

                                    <small class="mt-1 block text-[10px] text-slate-400">
                                        {{ method.description }}
                                    </small>
                                </span>

                                <Icon v-if="
                                    paymentMethod ===
                                    method.value
                                " icon="mdi:check-circle" class="text-xl text-[#0a7139]" />
                            </label>
                        </div>
                    </section>

                    <!-- Voucher + ghi chú -->
                    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div class="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label class="mb-2 block text-xs font-bold text-[#123d27]">
                                    Voucher NFarmHouse
                                </label>

                                <div v-if="!appliedDiscount" class="flex gap-2">
                                    <input v-model="voucherCode"
                                        class="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-[#0a7139]"
                                        placeholder="Nhập NFARM10" @keyup.enter="applyVoucher" />

                                    <button type="button"
                                        class="rounded-xl bg-[#e9b817] px-4 text-xs font-bold text-[#073f22]"
                                        @click="applyVoucher">
                                        Áp dụng
                                    </button>
                                </div>

                                <div v-else class="flex items-center justify-between rounded-xl bg-[#f1f7f3] px-3 py-3">
                                    <strong class="text-xs text-[#07532b]">
                                        {{
                                            appliedDiscount.discount_code
                                        }}
                                    </strong>

                                    <button type="button" class="text-xs text-red-500" @click="
                                        appliedDiscount = null
                                        ">
                                        Bỏ mã
                                    </button>
                                </div>
                            </div>

                            <label>
                                <span class="mb-2 block text-xs font-bold text-[#123d27]">
                                    Lời nhắn cho người bán
                                </span>

                                <textarea v-model.trim="orderNote" rows="3" maxlength="255"
                                    class="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-[#0a7139]"
                                    placeholder="Gọi trước khi giao hàng..."></textarea>
                            </label>
                        </div>
                    </section>
                </div>

                <CheckoutSummary :merchandise-total="merchandiseTotal
                    " :shipping-cost="shippingCost" :discount-amount="discountAmount
                        " :total="totalPayment" :disabled="!selectedAddress ||
                !checkoutItems.length
                " :loading="placingOrder" @place-order="placeOrder" />
            </div>
        </main>

        <AddressBookModal v-model="addressModalOpen" :addresses="addresses" :selected-address-id="selectedAddressId
            " @confirm="selectAddress" @save-address="saveAddress" />

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            leave-active-class="transition duration-150" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl"
                :class="toast.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-[#07532b]'
                    ">
                <Icon :icon="toast.type === 'error'
                    ? 'mdi:alert-circle-outline'
                    : 'mdi:check-circle-outline'
                    " class="text-xl" />

                {{ toast.message }}
            </div>
        </Transition>
    </div>
</template>