<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },

    wishlisted: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits([
    'add-cart',
    'buy-now',
    'toggle-wishlist',
])

const selectedVariantId = ref(null)
const selectedPackageId = ref(null)
const quantity = ref(1)

const variants = computed(() => {
    return props.product.variants || []
})

const selectedVariant = computed(() => {
    return (
        variants.value.find(
            (variant) =>
                variant.id === selectedVariantId.value,
        ) || null
    )
})

const packages = computed(() => {
    return selectedVariant.value?.packages || []
})

const selectedPackage = computed(() => {
    return (
        packages.value.find(
            (item) =>
                item.id === selectedPackageId.value,
        ) || null
    )
})

const stock = computed(() => {
    return Number(
        selectedPackage.value?.quantity_available || 0,
    )
})

const canPurchase = computed(() => {
    return (
        Boolean(selectedPackage.value) &&
        stock.value > 0 &&
        props.product.is_show
    )
})

function selectFirstVariant() {
    selectedVariantId.value =
        variants.value[0]?.id ?? null
}

function selectFirstPackage() {
    selectedPackageId.value =
        packages.value[0]?.id ?? null

    quantity.value = 1
}

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value || 0))
}

function formatUnit(unit) {
    const labels = {
        kg: 'kg',
        g: 'g',
        ml: 'ml',
        l: 'lít',
        piece: 'cái',
    }

    return labels[unit] || unit
}

function changeQuantity(change) {
    const nextQuantity =
        quantity.value + change

    quantity.value = Math.min(
        Math.max(nextQuantity, 1),
        Math.max(stock.value, 1),
    )
}

function purchasePayload() {
    return {
        package_id: selectedPackage.value?.id,
        quantity: quantity.value,
    }
}

watch(
    variants,
    () => {
        selectFirstVariant()
    },
    {
        immediate: true,
    },
)

watch(
    selectedVariantId,
    () => {
        selectFirstPackage()
    },
    {
        immediate: true,
    },
)
</script>

<template>
    <section>
        <!-- Danh mục -->
        <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-[#edf5f0] px-3 py-1 text-[11px] font-bold text-[#07532b]">
                {{
                    product.category?.name ||
                    product.category?.category_name ||
                    'Chưa phân loại'
                }}
            </span>

            <span v-if="product.subcategory"
                class="rounded-full bg-[#fff8dc] px-3 py-1 text-[11px] font-bold text-[#9a7900]">
                {{
                    product.subcategory.name ||
                    product.subcategory.subcategory_name
                }}
            </span>
        </div>

        <!-- Tên sản phẩm -->
        <h1 class="mt-4 text-3xl font-bold leading-tight text-[#153f29] sm:text-4xl">
            {{ product.product_name }}
        </h1>

        <!-- Đánh giá -->
        <div class="mt-4 flex flex-wrap items-center gap-3">
            <div class="flex">
                <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-xl" :class="star <= Math.round(product.average_rating || 0)
                    ? 'text-[#ffc400]'
                    : 'text-slate-200'
                    " />
            </div>

            <strong class="text-sm text-slate-700">
                {{
                    Number(
                        product.average_rating || 0,
                    ).toFixed(1)
                }}
            </strong>

            <span class="text-xs text-slate-400">
                ({{ product.review_count || 0 }} đánh giá)
            </span>
        </div>

        <!-- Giá -->
        <div class="mt-5 rounded-2xl bg-[#f3f8f5] px-5 py-4">
            <p class="text-xs text-slate-500">
                Giá theo quy cách đã chọn
            </p>

            <strong class="mt-1 block text-3xl text-[#0a8b43]">
                {{
                    selectedPackage
                        ? formatPrice(selectedPackage.price)
                        : 'Liên hệ'
                }}
            </strong>
        </div>

        <!-- Thông tin nhanh -->
        <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:barcode" class="text-lg text-[#d2a900]" />

                <dt class="text-slate-400">
                    SKU:
                </dt>

                <dd class="font-semibold">
                    {{ selectedPackage?.sku || 'Chưa có' }}
                </dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:map-marker-outline" class="text-lg text-[#d2a900]" />

                <dt class="text-slate-400">
                    Xuất xứ:
                </dt>

                <dd class="font-semibold">
                    {{
                        product.origin?.name ||
                        product.origin?.origin_name ||
                        'Đang cập nhật'
                    }}
                </dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:package-variant-closed" class="text-lg text-[#d2a900]" />

                <dt class="text-slate-400">
                    Tồn kho:
                </dt>

                <dd :class="stock > 0
                    ? 'font-semibold text-[#0a8b43]'
                    : 'font-semibold text-rose-500'
                    ">
                    <template v-if="selectedPackage">
                        {{
                            stock > 0
                                ? `${stock} sản phẩm`
                                : 'Hết hàng'
                        }}
                    </template>

                    <template v-else>
                        Chọn quy cách
                    </template>
                </dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:shield-check-outline" class="text-lg text-[#d2a900]" />

                <dt class="text-slate-400">
                    Trạng thái:
                </dt>

                <dd class="font-semibold">
                    {{
                        product.is_show
                            ? 'Đang kinh doanh'
                            : 'Tạm ngừng'
                    }}
                </dd>
            </div>
        </dl>

        <!-- Tags -->
        <div v-if="product.tags?.length" class="mt-5 flex flex-wrap gap-2">
            <span v-for="tag in product.tags" :key="tag.id"
                class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-500">
                <Icon icon="mdi:tag-outline" />

                {{ tag.name || tag.tag_name }}
            </span>
        </div>

        <div class="my-6 border-t border-slate-200"></div>

        <!-- Chọn biến thể -->
        <div v-if="variants.length">
            <h2 class="text-sm font-bold text-slate-800">
                Chọn biến thể
            </h2>

            <div class="mt-3 flex flex-wrap gap-2">
                <button v-for="variant in variants" :key="variant.id" type="button"
                    class="rounded-xl border px-4 py-2.5 text-xs font-semibold transition" :class="selectedVariantId === variant.id
                        ? 'border-[#07532b] bg-[#07532b] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#75a286]'
                        " @click="selectedVariantId = variant.id">
                    {{ variant.variant_name }}
                </button>
            </div>
        </div>

        <!-- Chọn package -->
        <div v-if="packages.length" class="mt-5">
            <h2 class="text-sm font-bold text-slate-800">
                Chọn quy cách bán
            </h2>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <button v-for="item in packages" :key="item.id" type="button"
                    class="flex items-center justify-between rounded-xl border p-3 text-left transition" :class="selectedPackageId === item.id
                        ? 'border-[#07532b] bg-[#edf5f0] ring-2 ring-[#07532b]/10'
                        : 'border-slate-200 hover:border-[#75a286]'
                        " @click="
                            selectedPackageId = item.id;
                        quantity = 1
                            ">
                    <span>
                        <strong class="block text-sm text-slate-800">
                            {{ item.size }}
                            {{ formatUnit(item.unit) }}
                        </strong>

                        <small :class="item.quantity_available > 0
                            ? 'text-slate-400'
                            : 'text-rose-500'
                            ">
                            {{
                                item.quantity_available > 0
                                    ? `Còn ${item.quantity_available}`
                                    : 'Hết hàng'
                            }}
                        </small>
                    </span>

                    <span class="text-xs font-bold text-[#0a8b43]">
                        {{ formatPrice(item.price) }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Actions -->
        <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <div class="flex h-12 items-center rounded-full border border-slate-200 bg-white">
                <button type="button" class="grid size-11 place-items-center text-slate-500 disabled:opacity-40"
                    :disabled="quantity <= 1" @click="changeQuantity(-1)">
                    <Icon icon="mdi:minus" />
                </button>

                <span class="min-w-10 text-center text-sm font-bold">
                    {{ quantity }}
                </span>

                <button type="button" class="grid size-11 place-items-center text-slate-500 disabled:opacity-40"
                    :disabled="quantity >= stock" @click="changeQuantity(1)">
                    <Icon icon="mdi:plus" />
                </button>
            </div>

            <button type="button"
                class="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#07532b] px-5 text-sm font-bold text-[#07532b] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canPurchase" @click="
                    emit(
                        'add-cart',
                        purchasePayload(),
                    )
                    ">
                <Icon icon="mdi:cart-outline" class="text-xl" />

                Thêm vào giỏ
            </button>

            <button type="button"
                class="h-12 flex-1 rounded-full bg-[#07532b] px-5 text-sm font-bold text-white transition hover:bg-[#064522] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canPurchase" @click="
                    emit(
                        'buy-now',
                        purchasePayload(),
                    )
                    ">
                Mua ngay
            </button>

            <button type="button" class="grid size-12 shrink-0 place-items-center rounded-full border transition"
                :class="wishlisted
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-rose-200 text-rose-500 hover:bg-rose-50'
                    " :aria-pressed="wishlisted" aria-label="Yêu thích sản phẩm" @click="
                        emit(
                            'toggle-wishlist',
                            product.id,
                        )
                        ">
                <Icon :icon="wishlisted
                    ? 'mdi:heart'
                    : 'mdi:heart-outline'
                    " class="text-xl" />
            </button>
        </div>
    </section>
</template>