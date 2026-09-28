<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
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
const navigating = ref(false);

let toastTimer;

const cartItems = computed(() => cartStore.items);

const selectedIds = computed(() => [...selectedItemIds.value]);

const selectedItems = computed(() =>
    cartItems.value.filter((item) =>
        selectedItemIds.value.has(Number(item.id)),
    ),
);

const selectedCount = computed(() =>
    selectedItems.value.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
    ),
);

const allSelected = computed(
    () =>
        cartItems.value.length > 0 &&
        cartItems.value.every((item) =>
            selectedItemIds.value.has(Number(item.id)),
        ),
);

const subtotal = computed(() =>
    selectedItems.value.reduce(
        (sum, item) =>
            sum +
            Number(item.package?.price ?? item.price ?? 0) *
            Number(item.quantity || 0),
        0,
    ),
);

const isBusy = computed(
    () =>
        cartStore.loading ||
        cartStore.saving ||
        cartStore.checkingOut ||
        removingSelected.value ||
        navigating.value,
);

function showToast(message, type = "success") {
    toast.value = { message, type };
    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = null;
    }, 3000);
}

function syncSelection() {
    const validIds = new Set(
        cartItems.value.map((item) => Number(item.id)),
    );

    selectedItemIds.value = new Set(
        [...selectedItemIds.value].filter((id) => validIds.has(id)),
    );

    cartStore.setCheckoutItemIds(selectedIds.value);
}

async function loadCartPage() {
    const previous = [...cartStore.checkoutForm.cart_item_ids];

    try {
        await cartStore.fetchCart();

        selectedItemIds.value = new Set(previous);
        syncSelection();
    } catch (error) {
        showToast(cartStore.errorMsg || error.message, "error");
    }
}

function toggleSelect(itemId) {
    if (isBusy.value) return;

    const next = new Set(selectedItemIds.value);
    const id = Number(itemId);

    next.has(id) ? next.delete(id) : next.add(id);

    selectedItemIds.value = next;
    cartStore.setCheckoutItemIds(selectedIds.value);
}

function toggleAll() {
    if (isBusy.value) return;

    selectedItemIds.value = allSelected.value
        ? new Set()
        : new Set(cartItems.value.map((item) => Number(item.id)));

    cartStore.setCheckoutItemIds(selectedIds.value);
}

async function updateQuantity({ id, quantity }) {
    if (isBusy.value) return;

    try {
        await cartStore.updateItem(id, quantity);
        syncSelection();
        showToast("Đã cập nhật số lượng.");
    } catch (error) {
        showToast(cartStore.errorMsg || error.message, "error");
    }
}

async function removeItem(itemId) {
    if (isBusy.value) return;
    if (!window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
        await cartStore.removeItem(itemId);
        syncSelection();
        showToast("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (error) {
        showToast(cartStore.errorMsg || error.message, "error");
    }
}

async function removeSelectedItems() {
    if (isBusy.value || !selectedIds.value.length) return;

    if (
        !window.confirm(
            `Xóa ${selectedIds.value.length} mục đang chọn khỏi giỏ hàng?`,
        )
    ) {
        return;
    }

    const ids = [...selectedIds.value];
    removingSelected.value = true;
    let removed = 0;

    try {
        for (const id of ids) {
            await cartStore.removeItem(id);
            removed++;
            syncSelection();
        }

        showToast("Đã xóa các sản phẩm được chọn.");
    } catch (error) {
        syncSelection();

        showToast(
            `Đã xóa ${removed}/${ids.length} mục. ${cartStore.errorMsg || error.message
            }`,
            "error",
        );
    } finally {
        removingSelected.value = false;
    }
}

function moveToWishlist() {
    showToast("Chức năng lưu yêu thích chưa được kết nối.", "error");
}

async function checkout() {
    if (isBusy.value) return;

    if (!selectedIds.value.length) {
        showToast("Hãy chọn ít nhất một sản phẩm.", "error");
        return;
    }

    for (const item of selectedItems.value) {
        const reason = cartStore.itemUnavailableReason(item);

        if (reason) {
            showToast(reason, "error");
            return;
        }
    }

    cartStore.setCheckoutItemIds(selectedIds.value);
    navigating.value = true;

    try {
        await router.push({
            name: "checkout",
            query: { items: selectedIds.value.join(",") },
        });
    } catch {
        showToast("Không mở được trang thanh toán. Vui lòng thử lại.", "error");
    } finally {
        navigating.value = false;
    }
}

onMounted(loadCartPage);

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
});
</script>

<template>
    <div class="min-h-[70vh] bg-[#f7f9f7] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400">
                    <RouterLink to="/" class="hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>
                    <Icon icon="mdi:chevron-right" />
                    <span class="font-medium text-[#174e31]">Giỏ hàng</span>
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
                                ? `${cartItems.length} mặt hàng trong giỏ`
                                : "Giỏ hàng hiện đang trống"
                        }}
                    </p>
                </div>

                <RouterLink to="/products" class="inline-flex items-center gap-2 text-sm font-semibold text-[#07532b]">
                    <Icon icon="mdi:arrow-left" />
                    Tiếp tục mua sắm
                </RouterLink>
            </div>

            <div v-if="cartStore.errorMsg" role="alert"
                class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {{ cartStore.errorMsg }}
            </div>

            <div v-if="cartStore.loading"
                class="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto animate-spin text-5xl text-[#07532b]" />
                    <p class="mt-4 text-sm text-slate-500">Đang tải giỏ hàng...</p>
                </div>
            </div>

            <div v-else-if="cartItems.length" class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section>
                    <div
                        class="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
                        <label class="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#365846]">
                            <input type="checkbox" class="size-[18px] accent-[#07532b]" :checked="allSelected"
                                :indeterminate="selectedItems.length > 0 && !allSelected" :disabled="isBusy"
                                @change="toggleAll" />
                            Chọn tất cả ({{ cartItems.length }})
                        </label>

                        <button type="button"
                            class="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 disabled:opacity-40"
                            :disabled="!selectedIds.length || isBusy" @click="removeSelectedItems">
                            <Icon icon="mdi:trash-can-outline" class="text-lg" />
                            <span class="hidden sm:inline">Xóa mục đã chọn</span>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <CartItem v-for="item in cartItems" :key="item.id" :item="item"
                            :selected="selectedItemIds.has(Number(item.id))" :disabled="isBusy"
                            @toggle-select="toggleSelect" @update-quantity="updateQuantity" @remove="removeItem"
                            @move-wishlist="moveToWishlist" />
                    </div>

                    <div class="mt-5 grid gap-3 sm:grid-cols-3">
                        <div v-for="benefit in [
                            { icon: 'mdi:leaf-circle-outline', title: 'Sản phẩm chính hãng', text: 'Nguồn gốc minh bạch' },
                            { icon: 'mdi:truck-check-outline', title: 'Giao hàng an toàn', text: 'Theo dõi đơn dễ dàng' },
                            { icon: 'mdi:headset', title: 'Hỗ trợ tận tâm', text: 'Tư vấn đúng nhu cầu' },
                        ]" :key="benefit.title"
                            class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                            <Icon :icon="benefit.icon" class="text-2xl text-[#0a7139]" />
                            <div>
                                <strong class="block text-xs text-[#123d27]">{{ benefit.title }}</strong>
                                <span class="text-[10px] text-slate-400">{{ benefit.text }}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <CartSummary :subtotal="subtotal" :selected-count="selectedCount" :loading="isBusy"
                    @checkout="checkout" />
            </div>

            <section v-else class="rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center">
                <Icon icon="mdi:cart-outline" class="mx-auto text-6xl text-[#07532b]" />
                <h2 class="mt-6 text-xl font-bold text-[#123d27]">Giỏ hàng đang trống</h2>
                <p class="mt-2 text-sm text-slate-500">Khám phá và thêm sản phẩm phù hợp vào giỏ hàng nhé.</p>
                <RouterLink to="/products"
                    class="mt-7 inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-3 text-sm font-bold text-white">
                    Khám phá sản phẩm
                    <Icon icon="mdi:arrow-right" />
                </RouterLink>
            </section>
        </main>

        <div v-if="toast" role="status"
            class="fixed bottom-5 left-1/2 z-50 flex w-max max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm text-white shadow-xl"
            :class="toast.type === 'error' ? 'bg-red-600' : 'bg-[#063f22]'">
            <Icon :icon="toast.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'" class="shrink-0 text-lg" />
            {{ toast.message }}
        </div>
    </div>
</template>