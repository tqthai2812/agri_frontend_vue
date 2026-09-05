<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },

    favorite: {
        type: Boolean,
        default: false,
    },
});

defineEmits([
    "add-cart",
    "toggle-favorite",
]);

const fallbackImage =
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80";

const productImage = computed(() => {
    return props.product.image || props.product.primary_image || fallbackImage;
});

const productName = computed(() => {
    return props.product.name || props.product.product_name || "Sản phẩm";
});

const productBrand = computed(() => {
    return props.product.brand || props.product.origin?.name || props.product.origin?.origin_name || "AgriShop";
});

const productRating = computed(() => {
    const rating = Number(props.product.rating || props.product.average_rating || 5);

    return Math.min(5, Math.max(0, Math.round(rating)));
});

const productReviews = computed(() => {
    return Number(props.product.reviews || props.product.review_count || 0);
});

const isOutOfStock = computed(() => {
    return Number(props.product.stock ?? props.product.total_stock ?? 1) <= 0;
});

const discountPercent = computed(() => {
    const oldPrice = Number(props.product.oldPrice || 0);
    const price = Number(props.product.price || 0);

    if (!oldPrice || oldPrice <= price) {
        return 0;
    }

    return Math.round(((oldPrice - price) / oldPrice) * 100);
});

function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}
</script>

<template>
    <article
        class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(6,75,38,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#b8d1c0] hover:shadow-[0_16px_35px_rgba(6,75,38,0.13)]">
        <RouterLink :to="{ name: 'client-product-detail', params: { id: product.id } }"
            class="relative block overflow-hidden bg-[#f2f6f3]">
            <img :src="productImage" :alt="productName" loading="lazy" decoding="async"
                class="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />

            <span v-if="product.badge"
                class="absolute left-3 top-3 rounded-full bg-[#07532b] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {{ product.badge }}
            </span>

            <span v-if="discountPercent"
                class="absolute right-3 top-3 rounded-full bg-[#ff4056] px-2.5 py-1 text-[10px] font-bold text-white">
                -{{ discountPercent }}%
            </span>
        </RouterLink>

        <div class="flex flex-1 flex-col p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b9985]">
                {{ productBrand }}
            </p>

            <RouterLink :to="{ name: 'client-product-detail', params: { id: product.id } }"
                class="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition hover:text-[#087239]">
                {{ productName }}
            </RouterLink>

            <div class="mt-3 flex items-center gap-2">
                <div class="flex" :aria-label="`${productRating} trên 5 sao`">
                    <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-[15px]"
                        :class="star <= productRating ? 'text-[#ffc400]' : 'text-slate-200'" />
                </div>

                <span class="text-[10px] text-slate-400">
                    ({{ productReviews }})
                </span>
            </div>

            <div class="mt-3 flex flex-wrap items-baseline gap-2">
                <strong class="text-[15px] text-[#0b8b42]">
                    {{ formatPrice(product.price) }}
                </strong>

                <del v-if="product.oldPrice" class="text-[11px] text-slate-400">
                    {{ formatPrice(product.oldPrice) }}
                </del>
            </div>

            <div class="mt-auto flex items-center gap-2 pt-4">
                <button type="button"
                    class="flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition"
                    :class="isOutOfStock
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-[#07532b] text-white hover:bg-[#064522]'" :disabled="isOutOfStock"
                    @click="$emit('add-cart', product)">
                    <Icon icon="mdi:cart-outline" class="text-lg" />

                    {{ isOutOfStock ? "Hết hàng" : "Thêm vào giỏ" }}
                </button>

                <button type="button"
                    class="grid size-10 shrink-0 place-items-center rounded-full border border-[#9fc1aa] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
                    :class="favorite ? 'bg-[#07532b] text-white' : 'text-[#07532b]'" :aria-pressed="favorite"
                    aria-label="Thêm vào danh sách yêu thích" @click="$emit('toggle-favorite', product)">
                    <Icon :icon="favorite ? 'mdi:heart' : 'mdi:heart-outline'" class="text-lg" />
                </button>
            </div>
        </div>
    </article>
</template>