<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    selected: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits([
    'toggle-select',
    'update-quantity',
    'remove',
    'move-wishlist',
])

const packageData = computed(() => props.item.package || {})
const variant = computed(() => packageData.value.variant || {})
const product = computed(() => {
    return variant.value.product || props.item.product || {}
})

const primaryImage = computed(() => {
    const images = product.value.images || []
    const primary = images.find((image) => Boolean(image.is_primary))

    return (
        primary?.image_url ||
        images[0]?.image_url ||
        product.value.primary_image ||
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80'
    )
})

const stock = computed(() => {
    return Number(packageData.value.quantity_available || 0)
})

const quantity = computed(() => {
    return Number(props.item.quantity || 1)
})

const price = computed(() => {
    return Number(packageData.value.price || 0)
})

const lineTotal = computed(() => {
    return price.value * quantity.value
})

const packageLabel = computed(() => {
    const size = packageData.value.size

    const unitMap = {
        kg: 'kg',
        g: 'g',
        ml: 'ml',
        l: 'lít',
        piece: 'cái',
    }

    if (!size) {
        return variant.value.variant_name || 'Mặc định'
    }

    return `${size} ${unitMap[packageData.value.unit] ||
        packageData.value.unit ||
        ''
        }`.trim()
})

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

function changeQuantity(nextQuantity) {
    const safeQuantity = Math.min(
        Math.max(Number(nextQuantity), 1),
        stock.value,
    )

    if (!stock.value || safeQuantity === quantity.value) {
        return
    }

    emit('update-quantity', {
        id: props.item.id,
        quantity: safeQuantity,
    })
}
</script>

<template>
    <article class="group rounded-3xl border bg-white p-4 transition duration-300 sm:p-5" :class="selected
        ? 'border-[#9bc2aa] shadow-[0_14px_40px_rgba(6,75,38,0.08)]'
        : 'border-slate-200 hover:border-[#b7cebf]'
        ">
        <div class="flex gap-3 sm:gap-5">
            <label class="mt-12 shrink-0 cursor-pointer sm:mt-14" :aria-label="`Chọn ${product.product_name}`">
                <input type="checkbox" class="size-[18px] cursor-pointer rounded border-slate-300 accent-[#07532b]"
                    :checked="selected" @change="emit('toggle-select', item.id)" />
            </label>

            <RouterLink :to="{
                name: 'client-product-detail',
                params: { id: product.id },
            }"
                class="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2 sm:size-32">
                <img :src="primaryImage" :alt="product.product_name"
                    class="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
            </RouterLink>

            <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <RouterLink :to="{
                            name: 'client-product-detail',
                            params: { id: product.id },
                        }"
                            class="line-clamp-2 text-sm font-bold leading-5 text-[#123d27] transition hover:text-[#d39f00] sm:text-base">
                            {{ product.product_name }}
                        </RouterLink>

                        <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span class="rounded-full bg-[#edf5f0] px-2.5 py-1 text-[#176139]">
                                {{ variant.variant_name || 'Mặc định' }}
                            </span>

                            <span class="rounded-full bg-slate-100 px-2.5 py-1">
                                {{ packageLabel }}
                            </span>

                            <span v-if="packageData.sku" class="rounded-full bg-slate-100 px-2.5 py-1">
                                SKU: {{ packageData.sku }}
                            </span>
                        </div>
                    </div>

                    <button type="button"
                        class="grid size-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Xóa khỏi giỏ hàng" @click="emit('remove', item.id)">
                        <Icon icon="mdi:trash-can-outline" class="text-xl" />
                    </button>
                </div>

                <p class="mt-3 text-sm font-bold text-[#0a7a3d] sm:text-base">
                    {{ formatVND(price) }}
                </p>

                <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div
                            class="inline-flex h-10 items-center overflow-hidden rounded-full border border-[#bfd2c5] bg-white">
                            <button type="button"
                                class="grid h-full w-10 place-items-center text-[#174e31] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-35"
                                :disabled="quantity <= 1 || stock === 0" aria-label="Giảm số lượng"
                                @click="changeQuantity(quantity - 1)">
                                <Icon icon="mdi:minus" />
                            </button>

                            <input :value="quantity" type="number" min="1" :max="stock"
                                class="h-full w-11 border-x border-[#d8e3dc] bg-transparent text-center text-sm font-semibold text-[#174e31] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                :disabled="stock === 0" aria-label="Số lượng"
                                @change="changeQuantity($event.target.value)" />

                            <button type="button"
                                class="grid h-full w-10 place-items-center text-[#174e31] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-35"
                                :disabled="quantity >= stock || stock === 0" aria-label="Tăng số lượng"
                                @click="changeQuantity(quantity + 1)">
                                <Icon icon="mdi:plus" />
                            </button>
                        </div>

                        <p class="mt-1.5 text-[11px]" :class="stock > 5
                            ? 'text-slate-400'
                            : 'font-semibold text-orange-500'
                            ">
                            {{
                                stock > 0
                                    ? `Còn ${stock} sản phẩm`
                                    : 'Sản phẩm đã hết hàng'
                            }}
                        </p>
                    </div>

                    <div class="flex items-end justify-between gap-4 sm:block sm:text-right">
                        <button type="button"
                            class="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-red-500 sm:mb-2 sm:ml-auto"
                            @click="
                                emit('move-wishlist', {
                                    itemId: item.id,
                                    productId: product.id,
                                })
                                ">
                            <Icon icon="mdi:heart-outline" class="text-lg" />
                            Lưu yêu thích
                        </button>

                        <div>
                            <span class="block text-[10px] uppercase tracking-wide text-slate-400">
                                Thành tiền
                            </span>

                            <strong class="text-base text-[#073f22] sm:text-lg">
                                {{ formatVND(lineTotal) }}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>