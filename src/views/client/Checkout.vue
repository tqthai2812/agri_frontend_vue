<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import AddressBookModal from "@/components/client/checkout/AddressBookModal.vue";
import CheckoutProducts from "@/components/client/checkout/CheckoutProducts.vue";
import CheckoutSummary from "@/components/client/checkout/CheckoutSummary.vue";
import VnpayService from "@/services/client/vnpay.service";
import { useCartStore } from "@/stores/client/cartStore";
const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const addressModalOpen = ref(false);
const editingAddressId = ref(null);
const voucherCode = ref("");
const toast = ref(null);
const initialized = ref(false);
const pageLoading = ref(false);
const loadError = ref("");
const selectionError = ref("");
const orderCompleted = ref(false);
const completedOrderId = ref(null);
let toastTimer;
let previewTimer;
let loadVersion = 0;
let disposed = false;
const requestedItemIds = computed(() =>
    cartStore.normalizeIds(
        Array.isArray(route.query.items)
            ? route.query.items.join(",")
            : route.query.items || "",
    ),
);
const checkoutItems = computed(() => {
    if (cartStore.checkoutPreview?.cart_data?.items) {
        return cartStore.checkoutPreview.cart_data.items;
    }
    return cartStore.selectedCheckoutItems;
});
const addresses = computed(() => cartStore.addresses);
const deliveryMethods = computed(() => cartStore.deliveryMethods);
const selectedAddress = computed(() => cartStore.selectedAddress);
const selectedAddressText = computed(() => {
    if (!selectedAddress.value) return "";
    return [
        selectedAddress.value.address_detail,
        selectedAddress.value.ward,
        selectedAddress.value.district,
        selectedAddress.value.province,
    ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(", ");
});
const addressNeedsUpdate = computed(() => {
    const address = selectedAddress.value;
    if (!address) return false;
    return (
        String(address.district ?? "").trim() !== "" ||
        String(address.district_id ?? "").trim() !== "" ||
        String(address.province_id ?? "").trim() === "" ||
        String(address.ward_id ?? "").trim() === ""
    );
});
const formLocked = computed(
    () =>
        pageLoading.value ||
        cartStore.saving ||
        cartStore.checkingOut ||
        orderCompleted.value ||
        cartStore.checkoutUncertain,
);
const paymentMethods = computed(() => cartStore.paymentMethods.map((item) => ({
    value: item.value, title: item.label,
    description: item.description,
    icon: item.value === "VNPAY" ? "mdi:qrcode-scan" : "mdi:cash-on-delivery",
    enabled: item.enabled === true || item.enabled === 1 || item.enabled === "1",
})));
const canPlaceOrder = computed(
    () =>
        initialized.value &&
        !selectionError.value &&
        !loadError.value &&
        !addressNeedsUpdate.value &&
        checkoutItems.value.length > 0 &&
        Boolean(cartStore.checkoutPreview) &&
        cartStore.canPreview &&
        paymentMethods.value.some((item) => item.value === cartStore.checkoutForm.payment_method && item.enabled) &&
        !formLocked.value &&
        !cartStore.loading &&
        !cartStore.previewing,
);
function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}
function showToast(message, type = "success") {
    if (disposed) return;
    toast.value = { message, type };
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toast.value = null;
    }, 3500);
}
function cancelPreviewTimer() {
    window.clearTimeout(previewTimer);
}
function openAddressBook() {
    if (formLocked.value) return;
    editingAddressId.value = null;
    addressModalOpen.value = true;
}
function updateSelectedAddress() {
    if (formLocked.value || !selectedAddress.value) return;
    editingAddressId.value = selectedAddress.value.id;
    addressModalOpen.value = true;
}
async function previewOrder() {
    cancelPreviewTimer();
    if (
        !initialized.value ||
        selectionError.value ||
        addressNeedsUpdate.value ||
        formLocked.value ||
        !cartStore.canPreview
    ) {
        return null;
    }
    try {
        return await cartStore.previewCheckout();
    } catch {
        // Lỗi được hiển thị từ cartStore.errorMsg.
        return null;
    }
}
function schedulePreview() {
    cancelPreviewTimer();
    if (
        !initialized.value ||
        formLocked.value ||
        selectionError.value ||
        addressNeedsUpdate.value ||
        !cartStore.canPreview
    ) {
        return;
    }
    previewTimer = window.setTimeout(previewOrder, 300);
}
function selectAddress(id) {
    if (formLocked.value) return;
    cartStore.selectAddress(id);
}
async function saveAddress(payload, done) {
    if (formLocked.value) {
        done?.({
            ok: false,
            message: "Đang xử lý yêu cầu trước. Vui lòng chờ.",
        });
        return;
    }
    cancelPreviewTimer();
    try {
        await cartStore.saveAddress(payload);
        done?.({
            ok: true,
            selectedId: cartStore.checkoutForm.shipping_address_id,
        });
        editingAddressId.value = null;
        showToast(cartStore.message || "Đã lưu địa chỉ.");
        schedulePreview();
    } catch (error) {
        done?.({
            ok: false,
            message:
                cartStore.errorMsg ||
                error.message ||
                "Không lưu được địa chỉ.",
        });
    }
}
async function applyVoucher() {
    if (formLocked.value || cartStore.previewing) return;
    const code = voucherCode.value.trim().toUpperCase();
    if (!code) {
        showToast("Vui lòng nhập mã giảm giá.", "error");
        return;
    }
    if (!cartStore.canPreview || addressNeedsUpdate.value) {
        showToast(
            "Hãy chọn địa chỉ hợp lệ và phương thức giao hàng trước.",
            "error",
        );
        return;
    }
    cartStore.checkoutForm.discount_code = code;
    cancelPreviewTimer();
    const response = await previewOrder();
    if (response && cartStore.appliedDiscount) {
        showToast("Áp dụng mã giảm giá thành công.");
    }
}
async function removeVoucher() {
    if (formLocked.value || cartStore.previewing) return;
    voucherCode.value = "";
    cartStore.checkoutForm.discount_code = "";
    cancelPreviewTimer();
    await previewOrder();
}
async function goToOrder() {
    try {
        await router.replace(
            completedOrderId.value
                ? {
                    name: "order-detail",
                    params: { id: completedOrderId.value },
                }
                : { name: "my-orders" },
        );
    } catch {
        showToast(
            "Đơn đã tạo. Bạn có thể mở Đơn mua để xem.",
            "error",
        );
    }
}
async function placeOrder() {
    if (!canPlaceOrder.value) return;
    cancelPreviewTimer();
    try {
        const response = await cartStore.checkout();
        const order = response.data?.data?.order || cartStore.createdOrder;
        orderCompleted.value = true;
        completedOrderId.value = order?.id || null;
        const url = response.data?.data?.payment_redirect_url;
        if (!disposed && url) {
            try { VnpayService.redirect(url); }
            catch { showToast("Đơn đã tạo. Hãy mở chi tiết đơn để tiếp tục thanh toán.", "error"); }
        } else if (!disposed) await goToOrder();
    } catch (error) {
        showToast(
            cartStore.errorMsg || error.message || "Không đặt được đơn hàng.",
            "error",
        );
    }
}
async function initializePage() {
    if (cartStore.checkingOut || orderCompleted.value) return;
    const version = ++loadVersion;
    initialized.value = false;
    pageLoading.value = true;
    loadError.value = "";
    selectionError.value = "";
    cancelPreviewTimer();
    cartStore.invalidatePreview();
    const ids = requestedItemIds.value;
    if (!ids.length) {
        selectionError.value =
            "Vui lòng quay lại giỏ và chọn sản phẩm cần mua.";
        cartStore.setCheckoutItemIds([]);
        pageLoading.value = false;
        return;
    }
    const discount = Array.isArray(route.query.discount)
        ? route.query.discount[0]
        : route.query.discount;
    cartStore.checkoutForm.discount_code = String(discount || "")
        .trim()
        .toUpperCase();
    voucherCode.value = cartStore.checkoutForm.discount_code;
    try {
        const result = await cartStore.loadCheckoutData(ids);
        if (disposed || version !== loadVersion) return;
        if (result.missingItemIds.length) {
            selectionError.value =
                "Một số sản phẩm đã chọn không còn trong giỏ. Vui lòng quay lại giỏ để kiểm tra.";
            return;
        }
        initialized.value = true;
    } catch (error) {
        if (version === loadVersion && !disposed) {
            loadError.value =
                cartStore.errorMsg ||
                error.message ||
                "Không tải được dữ liệu thanh toán.";
        }
    } finally {
        if (version === loadVersion && !disposed) {
            pageLoading.value = false;
        }
    }
    if (initialized.value && version === loadVersion && !disposed) {
        await previewOrder();
    }
}
watch(
    () => cartStore.previewKey,
    schedulePreview,
    { flush: "sync" },
);
watch(
    () => [route.query.items, route.query.discount],
    initializePage,
    { immediate: true },
);
onBeforeUnmount(() => {
    disposed = true;
    loadVersion++;
    window.clearTimeout(toastTimer);
    cancelPreviewTimer();
    cartStore.invalidatePreview();
});
</script>
<template>
    <div class="min-h-[70vh] bg-[#f7f9f7] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <nav aria-label="Breadcrumb"
                class="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
                <RouterLink :to="{ name: 'cart' }" class="hover:text-[#07532b]">
                    Giỏ hàng
                </RouterLink>
                <Icon icon="mdi:chevron-right" />
                <span class="font-medium text-[#174e31]">Thanh toán</span>
            </nav>
        </div>
        <main class="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div class="mb-7">
                <span
                    class="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a7139]">
                    <Icon icon="mdi:sprout-outline" class="text-base" />
                    NFarmHouse
                </span>
                <h1 class="text-2xl font-extrabold text-[#123d27] sm:text-3xl">
                    Thanh toán đơn hàng
                </h1>
                <p class="mt-1 text-sm text-slate-500">
                    Kiểm tra thông tin nhận hàng trước khi đặt đơn.
                </p>
            </div>
            <div v-if="orderCompleted" class="rounded-3xl border border-green-200 bg-white p-6">
                <h2 class="font-bold text-green-700">Đã tạo đơn hàng</h2>
                <button type="button" class="mt-4 rounded-full bg-[#07532b] px-5 py-3 text-sm font-bold text-white"
                    @click="goToOrder">
                    Xem đơn hàng
                </button>
            </div>
            <div v-else-if="pageLoading"
                class="grid min-h-80 place-items-center rounded-3xl border border-slate-200 bg-white">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto animate-spin text-5xl text-[#07532b]" />
                    <p class="mt-4 text-sm text-slate-500">
                        Đang tải dữ liệu thanh toán...
                    </p>
                </div>
            </div>
            <div v-else-if="loadError || selectionError" class="rounded-3xl border border-red-100 bg-white p-6">
                <p role="alert" class="text-sm text-red-600">
                    {{ loadError || selectionError }}
                </p>
                <div class="mt-4 flex gap-4">
                    <button v-if="loadError" type="button" class="font-semibold text-[#07532b]" @click="initializePage">
                        Tải lại
                    </button>
                    <RouterLink :to="{ name: 'cart' }" class="font-semibold text-[#07532b]">
                        Quay lại giỏ hàng
                    </RouterLink>
                </div>
            </div>
            <template v-else>
                <div v-if="cartStore.errorMsg" role="alert"
                    class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {{ cartStore.errorMsg }}
                </div>
                <div v-if="cartStore.checkoutUncertain"
                    class="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Chưa rõ kết quả yêu cầu đặt hàng trước. Hãy kiểm tra đơn mua
                    trước khi thực hiện lại.
                    <RouterLink :to="{ name: 'my-orders' }" class="ml-2 font-bold underline">
                        Xem đơn mua
                    </RouterLink>
                </div>
                <div class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <div class="space-y-5">
                        <section
                            class="relative overflow-hidden rounded-3xl border border-[#e7c866] bg-white p-5 shadow-sm sm:p-6">
                            <div
                                class="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#0a7139_0,#0a7139_16px,#ffd326_16px,#ffd326_32px,#fff_32px,#fff_48px)]">
                            </div>
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex min-w-0 gap-3">
                                    <Icon icon="mdi:map-marker-outline" class="shrink-0 text-3xl text-[#07532b]" />
                                    <div v-if="selectedAddress" class="min-w-0">
                                        <h2 class="text-sm font-bold text-[#123d27]">
                                            Địa chỉ nhận hàng
                                        </h2>
                                        <p class="mt-2 text-sm">
                                            <strong>{{ selectedAddress.receiver_name }}</strong>
                                            · {{ selectedAddress.receiver_phone }}
                                        </p>
                                        <p class="mt-2 text-xs leading-5 text-slate-500">
                                            {{ selectedAddressText }}
                                        </p>
                                    </div>
                                    <div v-else>
                                        <h2 class="text-sm font-bold text-[#123d27]">
                                            Chưa có địa chỉ nhận hàng
                                        </h2>
                                        <p class="mt-2 text-xs text-slate-500">
                                            Thêm địa chỉ để tiếp tục thanh toán.
                                        </p>
                                    </div>
                                </div>
                                <button type="button"
                                    class="shrink-0 rounded-full border border-[#bdd3c5] px-4 py-2 text-xs font-bold text-[#07532b] disabled:opacity-40"
                                    :disabled="formLocked" @click="openAddressBook">
                                    {{ selectedAddress ? "Thay đổi" : "Thêm địa chỉ" }}
                                </button>
                            </div>
                            <div v-if="addressNeedsUpdate"
                                class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                                Địa chỉ này đang dùng thông tin cũ. Vui lòng chọn lại
                                tỉnh/thành và phường/xã mới trước khi thanh toán.
                                <button type="button" class="ml-1 font-bold underline disabled:opacity-40"
                                    :disabled="formLocked" @click="updateSelectedAddress">
                                    Cập nhật địa chỉ
                                </button>
                            </div>
                        </section>
                        <CheckoutProducts :items="checkoutItems" />
                        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <h2 class="text-base font-bold text-[#123d27]">
                                Phương thức giao hàng
                            </h2>
                            <p class="mt-1 text-xs text-slate-500">
                                Phí cố định theo phương thức. Điều kiện áp dụng được kiểm
                                tra theo địa chỉ và tiền hàng sau giảm giá.
                            </p>
                            <div v-if="!deliveryMethods.length" class="mt-4 text-sm text-amber-700">
                                Hiện chưa có phương thức giao hàng.
                            </div>
                            <div class="mt-4 grid gap-3 sm:grid-cols-2">
                                <label v-for="method in deliveryMethods" :key="method.id"
                                    class="rounded-2xl border p-4 transition" :class="Number(cartStore.checkoutForm.delivery_id) ===
                                        Number(method.id)
                                        ? 'border-[#0a7139] bg-[#f2f8f4]'
                                        : 'border-slate-200'
                                        ">
                                    <div class="flex items-start gap-3">
                                        <input v-model="cartStore.checkoutForm.delivery_id" type="radio"
                                            :value="method.id" :disabled="formLocked" class="mt-1 accent-[#07532b]" />
                                        <div>
                                            <strong class="text-sm text-[#123d27]">
                                                {{ method.name }}
                                            </strong>
                                            <p class="mt-1 text-xs leading-5 text-slate-500">
                                                {{ method.description }}
                                            </p>
                                            <p class="mt-3 text-sm font-semibold text-[#07532b]">
                                                {{ formatVND(method.base_price) }}
                                            </p>
                                            <p v-if="Number(method.min_order_amount) > 0"
                                                class="mt-1 text-xs text-slate-500">
                                                Tiền hàng sau giảm giá từ
                                                {{ formatVND(method.min_order_amount) }}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </section>
                        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <h2 class="text-base font-bold text-[#123d27]">
                                Phương thức thanh toán
                            </h2>
                            <div class="mt-4 grid gap-3 sm:grid-cols-2">
                                <label v-for="method in paymentMethods" :key="method.value"
                                    class="rounded-2xl border p-4" :class="[
                                        !method.enabled
                                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                                            : 'cursor-pointer',
                                        method.enabled &&
                                            cartStore.checkoutForm.payment_method === method.value
                                            ? 'border-[#0a7139] bg-[#f2f8f4]'
                                            : '',
                                    ]">
                                    <div class="flex gap-3">
                                        <input v-model="cartStore.checkoutForm.payment_method" type="radio"
                                            :value="method.value" :disabled="!method.enabled || formLocked"
                                            class="mt-1 accent-[#07532b]" />
                                        <Icon :icon="method.icon" class="shrink-0 text-2xl text-[#07532b]" />
                                        <div>
                                            <strong class="text-sm text-[#123d27]">
                                                {{ method.title }}
                                            </strong>
                                            <p class="mt-1 text-xs leading-5 text-slate-500">
                                                {{ method.description }}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </section>
                        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div class="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label for="voucher-code"
                                        class="mb-2 block text-xs font-bold uppercase text-[#365846]">
                                        Mã giảm giá
                                    </label>
                                    <div class="flex gap-2">
                                        <input id="voucher-code" v-model="voucherCode" type="text" maxlength="255"
                                            placeholder="Nhập mã giảm giá"
                                            class="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-[#0a7139]"
                                            :disabled="formLocked || cartStore.previewing"
                                            @keyup.enter="applyVoucher" />
                                        <button type="button"
                                            class="rounded-xl bg-[#e9b817] px-4 text-xs font-bold text-[#073f22] disabled:opacity-40"
                                            :disabled="formLocked ||
                                                cartStore.previewing ||
                                                !voucherCode.trim() ||
                                                !cartStore.canPreview ||
                                                addressNeedsUpdate
                                                " @click="applyVoucher">
                                            Áp dụng
                                        </button>
                                    </div>
                                    <div v-if="cartStore.checkoutForm.discount_code"
                                        class="mt-3 flex items-center justify-between gap-2 text-xs">
                                        <span :class="cartStore.appliedDiscount
                                            ? 'text-green-700'
                                            : 'text-slate-500'
                                            ">
                                            {{ cartStore.checkoutForm.discount_code }}
                                            ·
                                            {{
                                                cartStore.appliedDiscount
                                                    ? "Đã áp dụng"
                                                    : "Chưa được xác nhận"
                                            }}
                                        </span>
                                        <button type="button" class="shrink-0 text-red-500 disabled:opacity-40"
                                            :disabled="formLocked || cartStore.previewing" @click="removeVoucher">
                                            Bỏ mã
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label for="order-note"
                                        class="mb-2 block text-xs font-bold uppercase text-[#365846]">
                                        Ghi chú đơn hàng
                                    </label>
                                    <textarea id="order-note" v-model.trim="cartStore.checkoutForm.note" rows="3"
                                        maxlength="1000"
                                        class="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#0a7139]"
                                        :disabled="formLocked" placeholder="Ví dụ: gọi trước khi giao..."></textarea>
                                </div>
                            </div>
                        </section>
                    </div>
                    <CheckoutSummary :merchandise-total="cartStore.checkoutSubtotal"
                        :shipping-cost="cartStore.checkoutDeliveryCost"
                        :discount-amount="cartStore.checkoutDiscountAmount" :total="cartStore.checkoutTotalPayment"
                        :ready="Boolean(cartStore.checkoutPreview)" :previewing="cartStore.previewing" :can-recalculate="cartStore.canPreview && !formLocked && !addressNeedsUpdate
                            " :disabled="!canPlaceOrder" :loading="cartStore.checkingOut" @recalculate="previewOrder"
                        @place-order="placeOrder" />
                </div>
            </template>
        </main>
        <AddressBookModal v-model="addressModalOpen" :addresses="addresses"
            :selected-address-id="cartStore.checkoutForm.shipping_address_id" :edit-address-id="editingAddressId"
            :saving="cartStore.saving" @confirm="selectAddress" @save-address="saveAddress" />
        <div v-if="toast" role="status"
            class="fixed bottom-5 left-1/2 z-[120] w-max max-w-[92vw] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm text-white shadow-xl"
            :class="toast.type === 'error' ? 'bg-red-600' : 'bg-[#063f22]'">
            {{ toast.message }}
        </div>
    </div>
</template>