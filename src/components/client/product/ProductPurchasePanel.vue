<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },
    wishlisted: {
        type: Boolean,
        default: false,
    },
    purchasing: {
        type: Boolean,
        default: false,
    },
    savingWishlist: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits([
    "add-cart",
    "buy-now",
    "toggle-wishlist",
]);

const selectedVariantId = ref(null);
const selectedPackageId = ref(null);
const quantity = ref(1);

function sameId(a, b) {
    return a != null && b != null && String(a) === String(b);
}

function isTrue(value) {
    return value === true || value === 1 || value === "1";
}

function availableStock(pkg) {
    const value = pkg?.available_to_sell;

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isSafeInteger(number) && number >= 0
        ? number
        : null;
}

const variants = computed(() =>
    Array.isArray(props.product.variants) ? props.product.variants : [],
);

const selectedVariant = computed(
    () =>
        variants.value.find((variant) =>
            sameId(variant.id, selectedVariantId.value),
        ) || null,
);

const packages = computed(() =>
    Array.isArray(selectedVariant.value?.packages)
        ? selectedVariant.value.packages
        : [],
);

const selectedPackage = computed(
    () =>
        packages.value.find((pkg) =>
            sameId(pkg.id, selectedPackageId.value),
        ) || null,
);

const stock = computed(() => availableStock(selectedPackage.value));

const isSelling = computed(() => isTrue(props.product.is_show));

const validPrice = computed(() => {
    const price = selectedPackage.value?.price;

    return (
        price !== null &&
        price !== undefined &&
        price !== "" &&
        Number.isFinite(Number(price)) &&
        Number(price) >= 0
    );
});

const canPurchase = computed(
    () =>
        isSelling.value &&
        Boolean(selectedPackage.value?.id) &&
        validPrice.value &&
        stock.value !== null &&
        stock.value > 0 &&
        Number.isSafeInteger(quantity.value) &&
        quantity.value >= 1 &&
        quantity.value <= stock.value &&
        !props.purchasing,
);

const productName = computed(
    () => props.product.product_name || props.product.name || "Sản phẩm",
);

const rating = computed(() => {
    const value = Number(props.product.average_rating ?? 0);
    return Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
});

const stockText = computed(() => {
    if (!selectedPackage.value) return "Chọn quy cách";
    if (stock.value === null) return "Chưa có thông tin";
    if (stock.value === 0) return "Hết hàng";
    return `${stock.value} sản phẩm`;
});

function preferredPackage(list = []) {
    return (
        list.find((pkg) => (availableStock(pkg) ?? 0) > 0) ||
        list[0] ||
        null
    );
}

function preferredVariant() {
    return (
        variants.value.find((variant) =>
            (variant.packages || []).some(
                (pkg) => (availableStock(pkg) ?? 0) > 0,
            ),
        ) ||
        variants.value[0] ||
        null
    );
}

function reconcileSelection(reset = false) {
    const currentVariant = reset
        ? null
        : variants.value.find((variant) =>
            sameId(variant.id, selectedVariantId.value),
        );

    const variant = currentVariant || preferredVariant();

    selectedVariantId.value = variant?.id ?? null;

    const list = variant?.packages || [];

    const currentPackage = reset
        ? null
        : list.find((pkg) => sameId(pkg.id, selectedPackageId.value));

    selectedPackageId.value =
        (currentPackage || preferredPackage(list))?.id ?? null;

    if (reset || !currentPackage) {
        quantity.value = 1;
    }

    clampQuantity();
}

function selectVariant(variant) {
    if (props.purchasing) return;

    selectedVariantId.value = variant.id;
    selectedPackageId.value =
        preferredPackage(variant.packages || [])?.id ?? null;
    quantity.value = 1;
}

function selectPackage(pkg) {
    if (props.purchasing) return;

    selectedPackageId.value = pkg.id;
    quantity.value = 1;
}

function clampQuantity() {
    const maximum = Math.max(stock.value ?? 0, 1);
    const value = Number(quantity.value);

    quantity.value = Math.min(
        Math.max(Number.isFinite(value) ? Math.trunc(value) : 1, 1),
        maximum,
    );
}

function changeQuantity(change) {
    if (props.purchasing || !stock.value) return;

    quantity.value += change;
    clampQuantity();
}

function formatPrice(value) {
    const number = Number(value);

    if (value == null || value === "" || !Number.isFinite(number)) {
        return "Chưa có giá";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(number);
}

function formatUnit(unit) {
    return {
        kg: "kg",
        g: "g",
        ml: "ml",
        l: "lít",
        piece: "cái",
    }[unit] || unit;
}

function packageStockText(pkg) {
    const value = availableStock(pkg);

    if (value === null) return "Chưa có thông tin tồn";
    return value > 0 ? `Còn ${value}` : "Hết hàng";
}

function purchase(eventName) {
    if (!canPurchase.value) return;

    emit(eventName, {
        product_id: props.product.id,
        package_id: selectedPackage.value.id,
        quantity: quantity.value,
    });
}

watch(
    () => props.product.id,
    () => reconcileSelection(true),
    { immediate: true },
);

watch(
    variants,
    () => reconcileSelection(),
    { deep: true },
);

watch(stock, clampQuantity);
</script>

<template>
    <section :aria-busy="purchasing">
        <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-[#edf5f0] px-3 py-1 text-[11px] font-bold text-[#07532b]">
                {{
                    product.category?.name ||
                    product.category?.category_name ||
                    "Chưa phân loại"
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

        <h1 class="mt-4 text-3xl font-bold leading-tight text-[#153f29] sm:text-4xl">
            {{ productName }}
        </h1>

        <p v-if="product.brand" class="mt-2 text-sm text-slate-500">
            Thương hiệu:
            <strong class="text-[#07532b]">{{ product.brand }}</strong>
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
            <div class="flex" :aria-label="`${rating.toFixed(1)} trên 5 sao`">
                <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-xl"
                    :class="star <= Math.round(rating) ? 'text-[#ffc400]' : 'text-slate-200'" />
            </div>

            <strong class="text-sm text-slate-700">
                {{ rating.toFixed(1) }}
            </strong>

            <span class="text-xs text-slate-400">
                ({{ product.review_count ?? 0 }} đánh giá)
            </span>
        </div>

        <div class="mt-5 rounded-2xl bg-[#f3f8f5] px-5 py-4">
            <p class="text-xs text-slate-500">Giá theo quy cách đã chọn</p>

            <strong class="mt-1 block text-3xl text-[#0a8b43]">
                {{ selectedPackage ? formatPrice(selectedPackage.price) : "Chọn quy cách" }}
            </strong>
        </div>

        <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:barcode" class="shrink-0 text-lg text-[#d2a900]" />
                <dt class="text-slate-400">SKU:</dt>
                <dd class="break-all font-semibold">{{ selectedPackage?.sku || "Chưa có" }}</dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:map-marker-outline" class="shrink-0 text-lg text-[#d2a900]" />
                <dt class="text-slate-400">Xuất xứ:</dt>
                <dd class="font-semibold">
                    {{ product.origin?.name || product.origin?.origin_name || "Đang cập nhật" }}
                </dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:package-variant-closed" class="shrink-0 text-lg text-[#d2a900]" />
                <dt class="text-slate-400">Có thể mua:</dt>
                <dd class="font-semibold" :class="stock > 0 ? 'text-[#0a8b43]' : 'text-slate-500'">
                    {{ stockText }}
                </dd>
            </div>

            <div class="flex items-center gap-2 text-slate-600">
                <Icon icon="mdi:shield-check-outline" class="shrink-0 text-lg text-[#d2a900]" />
                <dt class="text-slate-400">Trạng thái:</dt>
                <dd class="font-semibold">
                    {{ isSelling ? "Đang kinh doanh" : "Tạm ngừng" }}
                </dd>
            </div>
        </dl>

        <div v-if="product.tags?.length" class="mt-5 flex flex-wrap gap-2">
            <span v-for="tag in product.tags" :key="tag.id"
                class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-500">
                <Icon icon="mdi:tag-outline" />
                {{ tag.name || tag.tag_name }}
            </span>
        </div>

        <div class="my-6 border-t border-slate-200"></div>

        <div v-if="variants.length">
            <h2 class="text-sm font-bold text-slate-800">Chọn biến thể</h2>

            <div class="mt-3 flex flex-wrap gap-2">
                <button v-for="variant in variants" :key="variant.id" type="button" :disabled="purchasing"
                    :aria-pressed="sameId(selectedVariantId, variant.id)"
                    class="rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-60" :class="sameId(selectedVariantId, variant.id)
                        ? 'border-[#07532b] bg-[#07532b] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#75a286]'"
                    @click="selectVariant(variant)">
                    {{ variant.variant_name || variant.name }}
                </button>
            </div>
        </div>

        <div v-if="packages.length" class="mt-5">
            <h2 class="text-sm font-bold text-slate-800">Chọn quy cách bán</h2>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <button v-for="item in packages" :key="item.id" type="button" :disabled="purchasing"
                    :aria-pressed="sameId(selectedPackageId, item.id)"
                    class="flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60"
                    :class="sameId(selectedPackageId, item.id)
                        ? 'border-[#07532b] bg-[#edf5f0] ring-2 ring-[#07532b]/10'
                        : 'border-slate-200 hover:border-[#75a286]'" @click="selectPackage(item)">
                    <span>
                        <strong class="block text-sm text-slate-800">
                            {{ item.size }} {{ formatUnit(item.unit) }}
                        </strong>
                        <small :class="availableStock(item) === 0 ? 'text-rose-500' : 'text-slate-500'">
                            {{ packageStockText(item) }}
                        </small>
                    </span>

                    <span class="text-xs font-bold text-[#0a8b43]">
                        {{ formatPrice(item.price) }}
                    </span>
                </button>
            </div>
        </div>

        <p v-else class="mt-5 text-sm text-slate-500">
            Chưa có quy cách bán cho lựa chọn này.
        </p>

        <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <div class="flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white">
                <button type="button" aria-label="Giảm số lượng"
                    class="grid size-11 place-items-center text-slate-500 disabled:opacity-40"
                    :disabled="purchasing || quantity <= 1 || !stock" @click="changeQuantity(-1)">
                    <Icon icon="mdi:minus" />
                </button>

                <span class="min-w-10 text-center text-sm font-bold" aria-live="polite">
                    {{ quantity }}
                </span>

                <button type="button" aria-label="Tăng số lượng"
                    class="grid size-11 place-items-center text-slate-500 disabled:opacity-40"
                    :disabled="purchasing || !stock || quantity >= stock" @click="changeQuantity(1)">
                    <Icon icon="mdi:plus" />
                </button>
            </div>

            <button type="button"
                class="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#07532b] px-5 text-sm font-bold text-[#07532b] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canPurchase" @click="purchase('add-cart')">
                <Icon :icon="purchasing ? 'mdi:loading' : 'mdi:cart-outline'" class="text-xl"
                    :class="{ 'animate-spin': purchasing }" />
                {{ purchasing ? "Đang xử lý..." : "Thêm vào giỏ" }}
            </button>

            <button type="button"
                class="h-12 flex-1 rounded-full bg-[#07532b] px-5 text-sm font-bold text-white transition hover:bg-[#064522] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canPurchase" @click="purchase('buy-now')">
                Mua ngay
            </button>

            <button type="button"
                class="grid size-12 shrink-0 place-items-center rounded-full border transition disabled:opacity-50"
                :class="wishlisted
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-rose-200 text-rose-500 hover:bg-rose-50'" :disabled="savingWishlist"
                :aria-pressed="wishlisted" :aria-label="wishlisted ? 'Bỏ yêu thích sản phẩm' : 'Yêu thích sản phẩm'"
                @click="emit('toggle-wishlist', product.id)">
                <Icon :icon="savingWishlist ? 'mdi:loading' : wishlisted ? 'mdi:heart' : 'mdi:heart-outline'"
                    class="text-xl" :class="{ 'animate-spin': savingWishlist }" />
            </button>
        </div>
    </section>
</template>