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
    viewMode: {
        type: String,
        default: 'grid',
        validator: (value) =>
            ['grid', 'list'].includes(value),
    },
})

const emit = defineEmits([
    'toggle-select',
    'remove',
    'add-cart',
])

const product = computed(() => {
    return props.item.product || {}
})

const primaryImage = computed(() => {
    const images = product.value.images || []

    return (
        images.find((image) => image.is_primary)
            ?.image_url ||
        images[0]?.image_url ||
        product.value.primary_image ||
        ''
    )
})

const availablePackages = computed(() => {
    return (product.value.variants || [])
        .flatMap((variant) => variant.packages || [])
        .filter(
            (pkg) =>
                Number(pkg.quantity_available || 0) > 0,
        )
})

const minPrice = computed(() => {
    if (product.value.min_price !== undefined) {
        return Number(product.value.min_price || 0)
    }

    const prices = availablePackages.value.map(
        (pkg) => Number(pkg.price || 0),
    )

    return prices.length ? Math.min(...prices) : 0
})

const oldPrice = computed(() => {
    return Number(product.value.old_price || 0)
})

const inStock = computed(() => {
    return Number(product.value.total_stock || 0) > 0
})

const discountPercent = computed(() => {
    if (
        !oldPrice.value ||
        oldPrice.value <= minPrice.value
    ) {
        return 0
    }

    return Math.round(
        ((oldPrice.value - minPrice.value) /
            oldPrice.value) *
        100,
    )
})

const actionLabel = computed(() => {
    if (!inStock.value) return 'Tạm hết hàng'

    if (availablePackages.value.length !== 1) {
        return 'Chọn phân loại'
    }

    return 'Thêm vào giỏ'
})

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value || 0))
}

function formatDate(value) {
    if (!value) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}
</script>

<template>
    <!-- Grid view -->
    <article v-if="viewMode === 'grid'"
        class="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-[0_7px_24px_rgba(6,75,38,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(6,75,38,0.12)]"
        :class="selected
            ? 'border-[#0a7139] ring-2 ring-[#0a7139]/10'
            : 'border-slate-200 hover:border-[#b4d0bd]'
            ">
        <label
            class="absolute left-3 top-3 z-20 grid size-8 cursor-pointer place-items-center rounded-full bg-white/95 shadow-md">
            <input type="checkbox" class="size-4 cursor-pointer accent-[#07532b]" :checked="selected"
                :aria-label="`Chọn ${product.product_name}`" @change="emit('toggle-select', item.id)" />
        </label>

        <button type="button"
            class="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-white/95 text-red-500 shadow-md transition hover:scale-105 hover:bg-red-50"
            aria-label="Xóa khỏi danh sách yêu thích" @click="emit('remove', item)">
            <Icon icon="mdi:heart" class="text-xl" />
        </button>

        <RouterLink :to="{
            name: 'client-product-detail',
            params: { id: product.id },
        }" class="relative block overflow-hidden bg-[#f3f7f4]">
            <img v-if="primaryImage" :src="primaryImage" :alt="product.product_name" loading="lazy"
                class="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />

            <div v-else class="grid h-56 place-items-center text-slate-300">
                <Icon icon="mdi:image-outline" class="text-5xl" />
            </div>

            <span v-if="discountPercent"
                class="absolute bottom-3 left-3 rounded-full bg-[#ff4056] px-2.5 py-1 text-[10px] font-bold text-white">
                -{{ discountPercent }}%
            </span>

            <span v-if="!inStock"
                class="absolute inset-x-0 bottom-0 bg-slate-900/75 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                Tạm hết hàng
            </span>
        </RouterLink>

        <div class="flex flex-1 flex-col p-4">
            <div class="flex items-center justify-between gap-3">
                <p class="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b9985]">
                    {{
                        product.brand ||
                        product.category?.name ||
                        'NFarmHouse'
                    }}
                </p>

                <span class="shrink-0 text-[9px] text-slate-400">
                    Đã lưu {{ formatDate(item.created_at) }}
                </span>
            </div>

            <RouterLink :to="{
                name: 'client-product-detail',
                params: { id: product.id },
            }"
                class="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#123d27] transition hover:text-[#087239]">
                {{ product.product_name }}
            </RouterLink>

            <div class="mt-3 flex items-center gap-2">
                <div class="flex" :aria-label="`${product.rating || 0} trên 5 sao`">
                    <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-[14px]" :class="star <= Number(product.rating || 0)
                        ? 'text-[#ffc400]'
                        : 'text-slate-200'
                        " />
                </div>

                <span class="text-[9px] text-slate-400">
                    ({{ product.review_count || 0 }})
                </span>
            </div>

            <div class="mt-3 flex flex-wrap items-baseline gap-2">
                <strong class="text-[15px] text-[#0a7a3d]">
                    {{ formatVND(minPrice) }}
                </strong>

                <del v-if="oldPrice" class="text-[10px] text-slate-400">
                    {{ formatVND(oldPrice) }}
                </del>
            </div>

            <div class="mt-auto pt-4">
                <button type="button"
                    class="flex h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-bold transition"
                    :class="inStock
                        ? 'bg-[#07532b] text-white hover:bg-[#064522]'
                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                        " :disabled="!inStock" @click="emit('add-cart', item)">
                    <Icon :icon="availablePackages.length === 1
                        ? 'mdi:cart-plus'
                        : 'mdi:tune-variant'
                        " class="text-lg" />

                    {{ actionLabel }}
                </button>
            </div>
        </div>
    </article>

    <!-- List view -->
    <article v-else
        class="group rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-[0_14px_36px_rgba(6,75,38,0.08)] sm:p-5"
        :class="selected
            ? 'border-[#0a7139] ring-2 ring-[#0a7139]/10'
            : 'border-slate-200'
            ">
        <div class="flex items-start gap-3 sm:gap-5">
            <label class="mt-2 grid size-6 shrink-0 cursor-pointer place-items-center">
                <input type="checkbox" class="size-4 cursor-pointer accent-[#07532b]" :checked="selected"
                    :aria-label="`Chọn ${product.product_name}`" @change="emit('toggle-select', item.id)" />
            </label>

            <RouterLink :to="{
                name: 'client-product-detail',
                params: { id: product.id },
            }" class="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f3f7f4] sm:size-32">
                <img v-if="primaryImage" :src="primaryImage" :alt="product.product_name"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />

                <Icon v-else icon="mdi:image-outline" class="text-4xl text-slate-300" />
            </RouterLink>

            <div class="min-w-0 flex-1 md:flex md:items-center md:justify-between md:gap-7">
                <div class="min-w-0">
                    <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b9985]">
                        {{
                            product.brand ||
                            product.category?.name ||
                            'NFarmHouse'
                        }}
                    </p>

                    <RouterLink :to="{
                        name: 'client-product-detail',
                        params: { id: product.id },
                    }"
                        class="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#123d27] hover:text-[#087239] sm:text-base">
                        {{ product.product_name }}
                    </RouterLink>

                    <p class="mt-2 text-[10px] text-slate-400">
                        {{
                            product.category?.name ||
                            'Chưa phân loại'
                        }}
                        · {{ availablePackages.length }} quy cách còn
                        hàng
                    </p>

                    <div class="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Icon icon="mdi:heart-clock-outline" class="text-base text-red-400" />

                        Đã lưu {{ formatDate(item.created_at) }}
                    </div>
                </div>

                <div class="mt-4 shrink-0 md:mt-0 md:w-52 md:text-right">
                    <strong class="block text-base text-[#0a7a3d]">
                        {{ formatVND(minPrice) }}
                    </strong>

                    <del v-if="oldPrice" class="text-[10px] text-slate-400">
                        {{ formatVND(oldPrice) }}
                    </del>

                    <div class="mt-3 flex gap-2 md:justify-end">
                        <button type="button"
                            class="grid size-10 shrink-0 place-items-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-50"
                            aria-label="Xóa khỏi danh sách yêu thích" @click="emit('remove', item)">
                            <Icon icon="mdi:trash-can-outline" class="text-lg" />
                        </button>

                        <button type="button"
                            class="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[10px] font-bold transition md:flex-none"
                            :class="inStock
                                ? 'bg-[#07532b] text-white hover:bg-[#064522]'
                                : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                " :disabled="!inStock" @click="emit('add-cart', item)">
                            <Icon :icon="availablePackages.length === 1
                                ? 'mdi:cart-plus'
                                : 'mdi:tune-variant'
                                " class="text-base" />

                            {{ actionLabel }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>