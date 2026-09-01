<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Icon } from '@iconify/vue'
import CartItem from '@/components/client/cart/CartItem.vue'
import CartSummary from '@/components/client/cart/CartSummary.vue'

const freeShippingThreshold = 1000000

// Dữ liệu mẫu đúng cấu trúc:
// cart_items -> package -> variant -> product.
//
// Khi nối backend, thay mảng này bằng kết quả GET /api/cart.
const cartItems = ref([
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

const selectedItemIds = ref(
    new Set(cartItems.value.map((item) => item.id)),
)

const appliedDiscount = ref(null)
const toast = ref(null)

let toastTimer = null

const selectedItems = computed(() => {
    return cartItems.value.filter((item) => {
        return selectedItemIds.value.has(item.id)
    })
})

const selectedCount = computed(() => {
    return selectedItems.value.reduce((total, item) => {
        return total + Number(item.quantity || 0)
    }, 0)
})

const allSelected = computed(() => {
    return (
        cartItems.value.length > 0 &&
        selectedItemIds.value.size === cartItems.value.length
    )
})

const subtotal = computed(() => {
    return selectedItems.value.reduce((total, item) => {
        const price = Number(item.package?.price || 0)
        const quantity = Number(item.quantity || 0)

        return total + price * quantity
    }, 0)
})

const discountAmount = computed(() => {
    if (
        !appliedDiscount.value ||
        subtotal.value < appliedDiscount.value.min_order_value
    ) {
        return 0
    }

    const percentValue =
        subtotal.value *
        (appliedDiscount.value.discount_percent / 100)

    return Math.min(
        percentValue,
        appliedDiscount.value.max_discount_amount,
    )
})

const shippingEstimate = computed(() => {
    if (
        !selectedItems.value.length ||
        subtotal.value >= freeShippingThreshold
    ) {
        return 0
    }

    return 30000
})

const total = computed(() => {
    return Math.max(
        subtotal.value -
        discountAmount.value +
        shippingEstimate.value,
        0,
    )
})

function showToast(message, type = 'success') {
    toast.value = {
        message,
        type,
    }

    clearTimeout(toastTimer)

    toastTimer = setTimeout(() => {
        toast.value = null
    }, 3000)
}

function toggleSelect(itemId) {
    const nextIds = new Set(selectedItemIds.value)

    if (nextIds.has(itemId)) {
        nextIds.delete(itemId)
    } else {
        nextIds.add(itemId)
    }

    selectedItemIds.value = nextIds
}

function toggleAll() {
    selectedItemIds.value = allSelected.value
        ? new Set()
        : new Set(cartItems.value.map((item) => item.id))
}

function updateQuantity({ id, quantity }) {
    const item = cartItems.value.find((cartItem) => {
        return cartItem.id === id
    })

    if (!item) {
        return
    }

    item.quantity = quantity

    // Khi nối backend:
    // PATCH /api/cart/items/:id
    // body: { quantity }
}

function removeItem(itemId) {
    cartItems.value = cartItems.value.filter((item) => {
        return item.id !== itemId
    })

    const nextIds = new Set(selectedItemIds.value)

    nextIds.delete(itemId)
    selectedItemIds.value = nextIds

    showToast('Đã xóa sản phẩm khỏi giỏ hàng.')

    // Khi nối backend:
    // DELETE /api/cart/items/:id
}

function moveToWishlist({ itemId }) {
    removeItem(itemId)

    showToast(
        'Đã chuyển sản phẩm vào danh sách yêu thích.',
    )

    // Khi nối backend:
    // POST /api/wishlist
    // Sau đó DELETE cart item.
}

function removeSelectedItems() {
    if (!selectedItemIds.value.size) {
        return
    }

    const confirmed = window.confirm(
        `Xóa ${selectedItemIds.value.size} mục đang chọn khỏi giỏ hàng?`,
    )

    if (!confirmed) {
        return
    }

    cartItems.value = cartItems.value.filter((item) => {
        return !selectedItemIds.value.has(item.id)
    })

    selectedItemIds.value = new Set()

    showToast('Đã xóa các sản phẩm được chọn.')
}

function applyDiscount(code) {
    // Mã mẫu đúng cấu trúc bảng discounts.
    // Khi có backend sẽ gọi API kiểm tra mã.
    const demoDiscount = {
        id: 1,
        discount_code: 'NFARM10',
        discount_description: 'Giảm 10% tối đa 100.000đ',
        discount_percent: 10,
        max_discount_amount: 100000,
        min_order_value: 500000,
        usage_limit: 1000,
        used_count: 124,
        expire_date: '2026-12-31',
        is_active: true,
    }

    if (code !== demoDiscount.discount_code) {
        showToast(
            'Mã giảm giá không tồn tại hoặc đã hết hạn.',
            'error',
        )

        return
    }

    if (subtotal.value < demoDiscount.min_order_value) {
        showToast(
            'Đơn hàng cần đạt 500.000đ để dùng mã NFARM10.',
            'error',
        )

        return
    }

    appliedDiscount.value = demoDiscount

    showToast('Áp dụng mã giảm giá thành công.')
}

function removeDiscount() {
    appliedDiscount.value = null

    showToast('Đã gỡ mã giảm giá.')
}

function checkout() {
    if (!selectedItems.value.length) {
        showToast(
            'Hãy chọn ít nhất một sản phẩm.',
            'error',
        )

        return
    }

    const hasUnavailableItem = selectedItems.value.some(
        (item) => {
            const stock = Number(
                item.package?.quantity_available || 0,
            )

            return stock < Number(item.quantity || 0)
        },
    )

    if (hasUnavailableItem) {
        showToast(
            'Có sản phẩm không đủ tồn kho. Vui lòng kiểm tra lại.',
            'error',
        )

        return
    }

    const checkoutPayload = {
        cart_item_ids: selectedItems.value.map(
            (item) => item.id,
        ),

        discount_id:
            appliedDiscount.value?.id || null,
    }

    console.log('Checkout payload:', checkoutPayload)

    showToast(
        'Giao diện sẵn sàng. Bước tiếp theo sẽ nối trang thanh toán.',
    )

    // Khi có Checkout.vue:
    // router.push({ name: 'checkout' })
}

onBeforeUnmount(() => {
    clearTimeout(toastTimer)
})
</script>

<template>
    <div class="min-h-[70vh] bg-[#f7f9f7] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-medium text-[#174e31]">
                        Giỏ hàng
                    </span>
                </nav>
            </div>
        </div>

        <main class="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div class="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span
                        class="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a7139]">
                        <Icon icon="mdi:sprout-outline" class="text-base" />

                        NFarmHouse
                    </span>

                    <h1 class="text-2xl font-extrabold text-[#123d27] sm:text-3xl">
                        Giỏ hàng của bạn
                    </h1>

                    <p class="mt-1 text-sm text-slate-500">
                        {{
                            cartItems.length
                                ? `${cartItems.length} mặt hàng đang chờ bạn`
                                : 'Giỏ hàng hiện đang trống'
                        }}
                    </p>
                </div>

                <RouterLink to="/products"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-[#07532b] transition hover:text-[#d39f00]">
                    <Icon icon="mdi:arrow-left" />
                    Tiếp tục mua sắm
                </RouterLink>
            </div>

            <template v-if="cartItems.length">
                <div class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <section>
                        <div
                            class="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
                            <label class="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#365846]">
                                <input type="checkbox"
                                    class="size-[18px] cursor-pointer rounded border-slate-300 accent-[#07532b]"
                                    :checked="allSelected" @change="toggleAll" />

                                Chọn tất cả ({{ cartItems.length }})
                            </label>

                            <button type="button"
                                class="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="selectedItemIds.size === 0" @click="removeSelectedItems">
                                <Icon icon="mdi:trash-can-outline" class="text-lg" />

                                <span class="hidden sm:inline">
                                    Xóa mục đã chọn
                                </span>
                            </button>
                        </div>

                        <div class="space-y-4">
                            <CartItem v-for="item in cartItems" :key="item.id" :item="item"
                                :selected="selectedItemIds.has(item.id)" @toggle-select="toggleSelect"
                                @update-quantity="updateQuantity" @remove="removeItem"
                                @move-wishlist="moveToWishlist" />
                        </div>

                        <div class="mt-5 grid gap-3 sm:grid-cols-3">
                            <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <Icon icon="mdi:leaf-circle-outline" class="text-2xl text-[#0a7139]" />

                                <div>
                                    <strong class="block text-xs text-[#123d27]">
                                        Sản phẩm chính hãng
                                    </strong>

                                    <span class="text-[10px] text-slate-400">
                                        Nguồn gốc minh bạch
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <Icon icon="mdi:truck-check-outline" class="text-2xl text-[#0a7139]" />

                                <div>
                                    <strong class="block text-xs text-[#123d27]">
                                        Giao hàng an toàn
                                    </strong>

                                    <span class="text-[10px] text-slate-400">
                                        Theo dõi đơn dễ dàng
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <Icon icon="mdi:headset" class="text-2xl text-[#0a7139]" />

                                <div>
                                    <strong class="block text-xs text-[#123d27]">
                                        Hỗ trợ tận tâm
                                    </strong>

                                    <span class="text-[10px] text-slate-400">
                                        Tư vấn đúng nhu cầu
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <CartSummary :subtotal="subtotal" :discount-amount="discountAmount"
                        :shipping-estimate="shippingEstimate" :total="total" :selected-count="selectedCount"
                        :free-shipping-threshold="freeShippingThreshold
                            " :applied-discount="appliedDiscount" @apply-discount="applyDiscount" @remove-discount="removeDiscount"
                        @checkout="checkout" />
                </div>
            </template>

            <section v-else
                class="rounded-[2rem] border border-slate-200 bg-white px-5 py-16 text-center shadow-sm sm:py-20">
                <div class="mx-auto grid size-24 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:cart-outline" class="text-5xl" />
                </div>

                <h2 class="mt-6 text-xl font-bold text-[#123d27]">
                    Giỏ hàng đang trống
                </h2>

                <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Khám phá các sản phẩm nông nghiệp chính hãng
                    và thêm sản phẩm phù hợp vào giỏ hàng nhé.
                </p>

                <RouterLink to="/products"
                    class="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#07532b] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0a6837]">
                    Khám phá sản phẩm
                    <Icon icon="mdi:arrow-right" class="text-lg" />
                </RouterLink>
            </section>
        </main>

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            leave-active-class="transition duration-150" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-[80] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl"
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