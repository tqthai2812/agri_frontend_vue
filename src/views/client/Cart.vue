<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import CartItem from "@/components/client/cart/CartItem.vue";
import CartSummary from "@/components/client/cart/CartSummary.vue";
import { useCartStore } from "@/stores/client/cartStore";

const router = useRouter();
const cartStore = useCartStore();

const selectedItemIds = ref(new Set());
const toast = ref(null);
const removingSelected = ref(false);

let toastTimer = null;

const cartItems = computed(() => {
    return cartStore.items || [];
});

const selectedIds = computed(() => {
    return [...selectedItemIds.value]
        .map((id) => Number(id))
        .filter(Boolean);
});

const selectedItems = computed(() => {
    return cartItems.value.filter((item) => {
        return selectedItemIds.value.has(Number(item.id));
    });
});

const selectedCount = computed(() => {
    return selectedItems.value.reduce((total, item) => {
        return total + Number(item.quantity || 0);
    }, 0);
});

const allSelected = computed(() => {
    return (
        cartItems.value.length > 0 &&
        selectedItemIds.value.size === cartItems.value.length
    );
});

const subtotal = computed(() => {
    return selectedItems.value.reduce((total, item) => {
        return (
            total +
            Number(item.package?.price || item.price || 0) *
            Number(item.quantity || 0)
        );
    }, 0);
});

const selectedDelivery = computed(() => {
    return (
        cartStore.selectedDelivery ||
        cartStore.deliveryMethods.find((item) => item.is_default) ||
        cartStore.deliveryMethods[0] ||
        null
    );
});

const freeShippingThreshold = computed(() => {
    return Number(selectedDelivery.value?.min_order_amount || 1000000);
});

const previewMatchesSelection = computed(() => {
    const previewIds = cartStore.checkoutPreview?.cart_item_ids || [];

    const normalizedPreviewIds = [...previewIds]
        .map(Number)
        .filter(Boolean)
        .sort((a, b) => a - b);

    const normalizedSelectedIds = [...selectedIds.value]
        .map(Number)
        .filter(Boolean)
        .sort((a, b) => a - b);

    return (
        normalizedPreviewIds.length === normalizedSelectedIds.length &&
        normalizedPreviewIds.every((id, index) => {
            return id === normalizedSelectedIds[index];
        })
    );
});

const discountAmount = computed(() => {
    if (previewMatchesSelection.value) {
        return Number(cartStore.checkoutPreview?.discount_amount || 0);
    }

    return 0;
});

const appliedDiscount = computed(() => {
    if (previewMatchesSelection.value) {
        return cartStore.checkoutPreview?.discount || null;
    }

    return null;
});

const shippingEstimate = computed(() => {
    if (!selectedItems.value.length) {
        return 0;
    }

    if (previewMatchesSelection.value) {
        return Number(cartStore.checkoutPreview?.delivery_cost || 0);
    }

    if (!selectedDelivery.value) {
        return 0;
    }

    const threshold = Number(selectedDelivery.value.min_order_amount || 0);

    if (threshold > 0 && subtotal.value >= threshold) {
        return 0;
    }

    return Number(selectedDelivery.value.base_price || 0);
});

const total = computed(() => {
    return Math.max(
        subtotal.value - discountAmount.value + shippingEstimate.value,
        0,
    );
});

const isBusy = computed(() => {
    return (
        cartStore.loading ||
        cartStore.saving ||
        cartStore.previewing ||
        removingSelected.value
    );
});

function showToast(message, type = "success") {
    toast.value = {
        message,
        type,
    };

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = null;
    }, 2800);
}

function cleanQuery(query) {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => {
            return value !== undefined && value !== null && value !== "";
        }),
    );
}

function syncSelectedIdsWithCart(selectAllWhenEmpty = false) {
    const validIds = cartItems.value.map((item) => Number(item.id));
    const validIdSet = new Set(validIds);

    let nextSelectedIds = [...selectedItemIds.value]
        .map(Number)
        .filter((id) => validIdSet.has(id));

    if (selectAllWhenEmpty && !nextSelectedIds.length) {
        nextSelectedIds = validIds;
    }

    selectedItemIds.value = new Set(nextSelectedIds);
    cartStore.setCheckoutItemIds(nextSelectedIds);
}

async function loadCartPage() {
    try {
        await Promise.all([
            cartStore.fetchCart(),
            cartStore.fetchCheckoutOptions(),
        ]);

        syncSelectedIdsWithCart(true);

        if (selectedIds.value.length && cartStore.checkoutForm.delivery_id) {
            await cartStore.previewCheckout(selectedIds.value);
        }
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không tải được giỏ hàng.",
            "error",
        );
    }
}

async function refreshPreviewWhenNeeded() {
    cartStore.setCheckoutItemIds(selectedIds.value);

    if (!selectedIds.value.length) {
        cartStore.checkoutPreview = null;
        return;
    }

    if (!cartStore.checkoutForm.delivery_id) {
        return;
    }

    if (!cartStore.checkoutForm.discount_code && !cartStore.checkoutPreview) {
        return;
    }

    try {
        await cartStore.previewCheckout(selectedIds.value);
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không tính được đơn hàng.",
            "error",
        );
    }
}

function toggleSelect(itemId) {
    const id = Number(itemId);
    const nextIds = new Set(selectedItemIds.value);

    if (nextIds.has(id)) {
        nextIds.delete(id);
    } else {
        nextIds.add(id);
    }

    selectedItemIds.value = nextIds;
    refreshPreviewWhenNeeded();
}

function toggleAll() {
    selectedItemIds.value = allSelected.value
        ? new Set()
        : new Set(cartItems.value.map((item) => Number(item.id)));

    refreshPreviewWhenNeeded();
}

async function updateQuantity({ id, quantity }) {
    try {
        await cartStore.updateItem(id, quantity);

        syncSelectedIdsWithCart();

        await refreshPreviewWhenNeeded();

        showToast("Đã cập nhật số lượng.");
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không cập nhật được số lượng.",
            "error",
        );
    }
}

async function removeItem(itemId) {
    const confirmed = window.confirm(
        "Xóa sản phẩm này khỏi giỏ hàng?",
    );

    if (!confirmed) {
        return;
    }

    try {
        await cartStore.removeItem(itemId);

        selectedItemIds.value.delete(Number(itemId));
        selectedItemIds.value = new Set(selectedItemIds.value);

        syncSelectedIdsWithCart();

        await refreshPreviewWhenNeeded();

        showToast("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không xóa được sản phẩm.",
            "error",
        );
    }
}

async function removeSelectedItems() {
    if (!selectedItemIds.value.size) {
        return;
    }

    const confirmed = window.confirm(
        `Xóa ${selectedItemIds.value.size} mục đang chọn khỏi giỏ hàng?`,
    );

    if (!confirmed) {
        return;
    }

    removingSelected.value = true;

    try {
        const ids = [...selectedItemIds.value];

        for (const id of ids) {
            await cartStore.removeItem(id);
        }

        selectedItemIds.value = new Set();
        cartStore.checkoutPreview = null;

        showToast("Đã xóa các sản phẩm được chọn.");
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không xóa được các sản phẩm đã chọn.",
            "error",
        );
    } finally {
        removingSelected.value = false;
    }
}

function moveToWishlist() {
    showToast(
        "Chức năng yêu thích chưa nối API nên chưa tự xóa khỏi giỏ.",
        "error",
    );
}

async function applyDiscount(code) {
    if (!selectedIds.value.length) {
        showToast("Hãy chọn sản phẩm trước khi áp dụng mã.", "error");
        return;
    }

    cartStore.checkoutForm.discount_code = code;
    cartStore.setCheckoutItemIds(selectedIds.value);

    try {
        await cartStore.previewCheckout(selectedIds.value);

        showToast("Áp dụng mã giảm giá thành công.");
    } catch (error) {
        cartStore.checkoutForm.discount_code = "";

        showToast(
            cartStore.errorMsg || "Mã giảm giá không hợp lệ.",
            "error",
        );
    }
}

async function removeDiscount() {
    cartStore.checkoutForm.discount_code = "";
    cartStore.checkoutPreview = null;

    try {
        if (selectedIds.value.length && cartStore.checkoutForm.delivery_id) {
            await cartStore.previewCheckout(selectedIds.value);
        }
    } catch (error) {
        cartStore.checkoutPreview = null;
    }

    showToast("Đã gỡ mã giảm giá.");
}

function checkout() {
    if (!selectedIds.value.length) {
        showToast("Hãy chọn ít nhất một sản phẩm.", "error");
        return;
    }

    const unavailableItem = selectedItems.value.find((item) => {
        const stock = Number(item.package?.quantity_available || 0);
        const quantity = Number(item.quantity || 0);

        return stock <= 0 || quantity > stock;
    });

    if (unavailableItem) {
        showToast(
            "Có sản phẩm hết hàng hoặc không đủ tồn kho.",
            "error",
        );
        return;
    }

    cartStore.setCheckoutItemIds(selectedIds.value);

    router.push({
        name: "checkout",
        query: cleanQuery({
            items: selectedIds.value.join(","),
            discount: cartStore.checkoutForm.discount_code || undefined,
        }),
    });
}

onMounted(async () => {
    await loadCartPage();
});

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
});
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
                                : "Giỏ hàng hiện đang trống"
                        }}
                    </p>
                </div>

                <RouterLink to="/products"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-[#07532b] transition hover:text-[#d39f00]">
                    <Icon icon="mdi:arrow-left" />
                    Tiếp tục mua sắm
                </RouterLink>
            </div>

            <div v-if="cartStore.errorMsg"
                class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <Icon icon="mdi:alert-circle-outline" class="mt-0.5 shrink-0 text-xl" />

                <span>{{ cartStore.errorMsg }}</span>
            </div>

            <div v-if="cartStore.loading"
                class="grid min-h-72 place-items-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto text-5xl text-[#07532b] animate-spin" />

                    <p class="mt-4 text-sm font-semibold text-slate-500">
                        Đang tải giỏ hàng...
                    </p>
                </div>
            </div>

            <template v-else-if="cartItems.length">
                <div class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <section>
                        <div
                            class="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
                            <label class="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#365846]">
                                <input type="checkbox"
                                    class="size-[18px] cursor-pointer rounded border-slate-300 accent-[#07532b]"
                                    :checked="allSelected" :disabled="isBusy" @change="toggleAll" />

                                Chọn tất cả ({{ cartItems.length }})
                            </label>

                            <button type="button"
                                class="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                :disabled="selectedItemIds.size === 0 || isBusy" @click="removeSelectedItems">
                                <Icon icon="mdi:trash-can-outline" class="text-lg" />

                                <span class="hidden sm:inline">
                                    Xóa mục đã chọn
                                </span>
                            </button>
                        </div>

                        <div class="space-y-4">
                            <CartItem v-for="item in cartItems" :key="item.id" :item="item"
                                :selected="selectedItemIds.has(Number(item.id))" :disabled="isBusy"
                                @toggle-select="toggleSelect" @update-quantity="updateQuantity" @remove="removeItem"
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
                        :free-shipping-threshold="freeShippingThreshold" :applied-discount="appliedDiscount"
                        :loading="cartStore.previewing" @apply-discount="applyDiscount"
                        @remove-discount="removeDiscount" @checkout="checkout" />
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
            enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150"
            leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white shadow-2xl"
                :class="toast.type === 'error' ? 'bg-red-600' : 'bg-[#063f22]'">
                <Icon :icon="toast.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'"
                    class="text-lg text-[#ffd326]" />

                {{ toast.message }}
            </div>
        </Transition>
    </div>
</template>