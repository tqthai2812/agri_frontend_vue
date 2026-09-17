<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    items: {
        type: Array,
        default: () => [],
    },
});

const totalQuantity = computed(() => {
    return props.items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
    }, 0);
});

function productOf(item) {
    return (
        item.product ||
        item.package?.variant?.product ||
        item.variant?.product ||
        {}
    );
}

function variantOf(item) {
    return item.variant || item.package?.variant || {};
}

function imageOf(item) {
    const product = productOf(item);
    const images = product.images || [];

    return (
        product.primary_image ||
        images.find((image) => image.is_primary)?.image_url ||
        images[0]?.image_url ||
        null
    );
}

function productNameOf(item) {
    const product = productOf(item);

    return product.product_name || product.name || "Sản phẩm";
}

function packageLabel(item) {
    const pkg = item.package || {};

    const unitMap = {
        l: "lít",
        piece: "cái",
    };

    return `${pkg.size || ""} ${unitMap[pkg.unit] || pkg.unit || ""}`.trim();
}

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:package-variant-closed" class="text-xl" />
                </span>

                <div>
                    <h2 class="text-sm font-bold text-[#123d27]">
                        Sản phẩm đã đặt
                    </h2>

                    <p class="mt-0.5 text-[10px] text-slate-400">
                        {{ totalQuantity }} sản phẩm trong đơn
                    </p>
                </div>
            </div>
        </header>

        <div class="divide-y divide-slate-100">
            <article v-for="item in items" :key="item.id" class="flex gap-4 px-5 py-5 sm:px-6">
                <RouterLink :to="{
                    name: 'client-product-detail',
                    params: {
                        id: productOf(item).id,
                    },
                }"
                    class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-[#f7f9f7] p-2 sm:size-24">
                    <img v-if="imageOf(item)" :src="imageOf(item)" :alt="productNameOf(item)"
                        class="h-full w-full object-contain transition duration-300 hover:scale-105" />

                    <Icon v-else icon="mdi:image-outline" class="text-3xl text-slate-300" />
                </RouterLink>

                <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
                    <div class="min-w-0">
                        <RouterLink :to="{
                            name: 'client-product-detail',
                            params: {
                                id: productOf(item).id,
                            },
                        }"
                            class="line-clamp-2 text-sm font-bold leading-5 text-[#123d27] transition hover:text-[#d39f00]">
                            {{ productNameOf(item) }}
                        </RouterLink>

                        <p class="mt-1.5 text-[10px] leading-4 text-slate-400">
                            Phân loại:
                            {{ variantOf(item).variant_name || variantOf(item).name || "Mặc định" }}
                            ·
                            {{ packageLabel(item) || "Mặc định" }}
                        </p>

                        <p class="mt-1 text-[10px] text-slate-400">
                            SKU: {{ item.package?.sku || "—" }}
                        </p>
                    </div>

                    <div class="mt-3 shrink-0 sm:mt-0 sm:text-right">
                        <p class="text-xs text-slate-400">
                            {{ formatVND(item.price_at_purchase || item.price) }}
                            ×
                            {{ item.quantity }}
                        </p>

                        <strong class="mt-1 block text-sm text-[#0a7a3d]">
                            {{
                                formatVND(
                                    Number(item.price_at_purchase || item.price || 0) *
                                    Number(item.quantity || 0),
                                )
                            }}
                        </strong>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>