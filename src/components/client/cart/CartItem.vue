<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useCartStore } from "@/stores/client/cartStore";

const props = defineProps({
    item: { type: Object, required: true },
    selected: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
});

const emit = defineEmits([
    "toggle-select",
    "update-quantity",
    "remove",
    "move-wishlist",
]);

const cartStore = useCartStore();

const packageData = computed(() => props.item.package || {});
const variant = computed(() => packageData.value.variant || props.item.variant || {});
const product = computed(() => variant.value.product || props.item.product || {});

const productLink = computed(() =>
    product.value.id
        ? { name: "client-product-detail", params: { id: product.value.id } }
        : { name: "client-products" },
);

const primaryImage = computed(() => {
    const images = product.value.images || [];
    const primary = images.find(
        (image) =>
            image.is_primary === true ||
            image.is_primary === 1 ||
            image.is_primary === "1",
    );

    return product.value.primary_image || primary?.image_url || images[0]?.image_url || "";
});

const stock = computed(() => cartStore.sellableQuantity(props.item));
const unavailableReason = computed(() => cartStore.itemUnavailableReason(props.item));
const quantity = computed(() => Number(props.item.quantity || 1));
const price = computed(() => Number(packageData.value.price ?? props.item.price ?? 0));
const lineTotal = computed(() => price.value * quantity.value);
const maxQuantity = computed(() => Math.min(stock.value ?? 0, 999));

const productName = computed(
    () => product.value.product_name || product.value.name || "Sản phẩm không còn tồn tại",
);

const editableQuantity = computed(() => {
    const shown = product.value.is_show;

    return (
        !props.disabled &&
        Boolean(props.item.package) &&
        Boolean(product.value.id) &&
        shown !== false &&
        shown !== 0 &&
        shown !== "0" &&
        maxQuantity.value > 0
    );
});

const packageLabel = computed(() => {
    const units = { kg: "kg", g: "g", ml: "ml", l: "lít", piece: "cái" };

    return `${packageData.value.size ?? ""} ${units[packageData.value.unit] || packageData.value.unit || ""
        }`.trim() || "Mặc định";
});

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}

function changeQuantity(next) {
    if (!editableQuantity.value) return;

    const value = Number(next);

    if (!Number.isSafeInteger(value)) return;

    const safe = Math.min(Math.max(value, 1), maxQuantity.value);

    if (safe !== quantity.value) {
        emit("update-quantity", { id: props.item.id, quantity: safe });
    }
}

function inputChanged(event) {
    changeQuantity(event.target.value);

    // Giá trị hiển thị luôn theo dữ liệu đã được server chấp nhận.
    event.target.value = quantity.value;
}
</script>

<template>
    <article class="group rounded-3xl border bg-white p-4 transition sm:p-5"
        :class="selected ? 'border-[#9bc2aa] shadow-sm' : 'border-slate-200 hover:border-[#b7cebf]'">
        <div class="flex gap-3 sm:gap-5">
            <label class="mt-10 shrink-0" :aria-label="`Chọn ${productName}`">
                <input type="checkbox" class="size-[18px] accent-[#07532b]" :checked="selected" :disabled="disabled"
                    @change="emit('toggle-select', item.id)" />
            </label>

            <RouterLink :to="productLink"
                class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2 sm:size-32">
                <img v-if="primaryImage" :src="primaryImage" :alt="productName" class="size-full object-contain" />
                <Icon v-else icon="mdi:package-variant" class="text-4xl text-slate-300" />
            </RouterLink>

            <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <RouterLink :to="productLink"
                            class="line-clamp-2 text-sm font-bold text-[#123d27] sm:text-base">
                            {{ productName }}
                        </RouterLink>

                        <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span class="rounded-full bg-[#edf5f0] px-2.5 py-1 text-[#176139]">
                                {{ variant.variant_name || variant.name || "Mặc định" }}
                            </span>
                            <span class="rounded-full bg-slate-100 px-2.5 py-1">{{ packageLabel }}</span>
                            <span v-if="packageData.sku" class="rounded-full bg-slate-100 px-2.5 py-1">SKU: {{
                                packageData.sku }}</span>
                        </div>
                    </div>

                    <button type="button"
                        class="grid size-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        aria-label="Xóa khỏi giỏ hàng" :disabled="disabled" @click="emit('remove', item.id)">
                        <Icon icon="mdi:trash-can-outline" class="text-xl" />
                    </button>
                </div>

                <p class="mt-3 font-bold text-[#0a7a3d]">{{ formatVND(price) }}</p>

                <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div class="inline-flex h-10 items-center overflow-hidden rounded-full border border-[#bfd2c5]">
                            <button type="button" class="grid h-full w-10 place-items-center disabled:opacity-35"
                                :disabled="!editableQuantity || quantity <= 1" aria-label="Giảm số lượng"
                                @click="changeQuantity(quantity - 1)">
                                <Icon icon="mdi:minus" />
                            </button>

                            <input :value="quantity" type="number" min="1" :max="maxQuantity || 1" step="1"
                                class="h-full w-14 border-x border-slate-200 bg-transparent text-center text-sm outline-none"
                                :disabled="!editableQuantity" aria-label="Số lượng" @change="inputChanged" />

                            <button type="button" class="grid h-full w-10 place-items-center disabled:opacity-35"
                                :disabled="!editableQuantity || quantity >= maxQuantity" aria-label="Tăng số lượng"
                                @click="changeQuantity(quantity + 1)">
                                <Icon icon="mdi:plus" />
                            </button>
                        </div>

                        <p class="mt-2 text-xs" :class="unavailableReason ? 'text-red-600' : 'text-slate-500'">
                            {{ unavailableReason || `Còn ${stock} sản phẩm có thể bán` }}
                        </p>
                    </div>

                    <div class="sm:text-right">
                        <button type="button"
                            class="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 sm:ml-auto"
                            :disabled="disabled || !product.id"
                            @click="emit('move-wishlist', { itemId: item.id, productId: product.id })">
                            <Icon icon="mdi:heart-outline" class="text-lg" />
                            Lưu yêu thích
                        </button>
                        <span class="block text-[10px] uppercase text-slate-400">Thành tiền</span>
                        <strong class="text-lg text-[#073f22]">{{ formatVND(lineTotal) }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>