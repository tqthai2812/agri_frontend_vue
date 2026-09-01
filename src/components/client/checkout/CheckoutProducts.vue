<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    items: {
        type: Array,
        default: () => [],
    },
})

const subtotal = computed(() => {
    return props.items.reduce((sum, item) => {
        return (
            sum +
            Number(item.package?.price || 0) *
            Number(item.quantity || 0)
        )
    }, 0)
})

function productOf(item) {
    return item.package?.variant?.product || {}
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

    const unitMap = {
        l: 'lít',
        piece: 'cái',
    }

    return `${pkg.size || ''} ${unitMap[pkg.unit] || pkg.unit || ''
        }`.trim()
}

function formatVND(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <span class="grid size-9 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:storefront-outline" class="text-xl" />
                </span>

                <div>
                    <h2 class="text-sm font-bold text-[#123d27]">
                        NFarmHouse Official
                    </h2>

                    <span class="text-[10px] text-slate-400">
                        Sản phẩm chính hãng
                    </span>
                </div>
            </div>

            <span class="rounded-full bg-[#fff5ce] px-3 py-1 text-[10px] font-semibold text-[#8a6700]">
                {{ items.length }} mặt hàng
            </span>
        </header>

        <div class="divide-y divide-slate-100">
            <article v-for="item in items" :key="item.id" class="flex gap-4 px-5 py-5 sm:px-6">
                <div
                    class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2 sm:size-24">
                    <img :src="imageOf(item)" :alt="productOf(item).product_name"
                        class="h-full w-full object-contain" />
                </div>

                <div
                    class="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_110px_70px_130px] sm:items-center sm:gap-4">
                    <div class="min-w-0">
                        <RouterLink :to="{
                            name: 'client-product-detail',
                            params: {
                                id: productOf(item).id,
                            },
                        }"
                            class="line-clamp-2 text-sm font-semibold leading-5 text-[#123d27] transition hover:text-[#d39f00]">
                            {{ productOf(item).product_name }}
                        </RouterLink>

                        <p class="mt-1 text-[11px] text-slate-400">
                            {{ item.package?.variant?.variant_name }}
                            · {{ packageLabel(item) }}
                        </p>

                        <p v-if="item.package?.sku" class="mt-1 text-[10px] text-slate-400">
                            SKU: {{ item.package.sku }}
                        </p>
                    </div>

                    <div class="mt-3 text-xs text-slate-500 sm:mt-0 sm:text-right">
                        <span class="sm:hidden">Đơn giá: </span>
                        {{ formatVND(item.package?.price) }}
                    </div>

                    <div class="mt-1 text-xs text-slate-500 sm:mt-0 sm:text-center">
                        × {{ item.quantity }}
                    </div>

                    <div class="mt-2 font-bold text-[#0a7a3d] sm:mt-0 sm:text-right">
                        {{
                            formatVND(
                                Number(item.package?.price || 0) *
                                Number(item.quantity || 0),
                            )
                        }}
                    </div>
                </div>
            </article>
        </div>

        <footer class="flex items-center justify-between bg-[#fafcfb] px-5 py-4 text-sm sm:px-6">
            <span class="text-slate-500">
                Tổng tiền hàng
            </span>

            <strong class="text-lg text-[#07532b]">
                {{ formatVND(subtotal) }}
            </strong>
        </footer>
    </section>
</template>