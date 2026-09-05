<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import AddressBookModal from "@/components/client/checkout/AddressBookModal.vue";
import CheckoutProducts from "@/components/client/checkout/CheckoutProducts.vue";
import CheckoutSummary from "@/components/client/checkout/CheckoutSummary.vue";
import { useCartStore } from "@/stores/cartStore";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const addressModalOpen = ref(false);
const voucherCode = ref("");
const toast = ref(null);
const initialized = ref(false);

let toastTimer = null;
let previewTimer = null;

const requestedItemIds = computed(() => {
    return parseIds(route.query.items);
});

const checkoutItems = computed(() => {
    return cartStore.selectedCheckoutItems || [];
});

const addresses = computed(() => {
    return cartStore.addresses || [];
});

const deliveryMethods = computed(() => {
    return cartStore.deliveryMethods || [];
});

const paymentMethods = computed(() => {
    const methods = cartStore.paymentMethods || [];

    if (methods.length) {
        return methods.map((method) => ({
            value: method.value,
            title: method.label || method.title || method.value,
            description: method.description || paymentDescription(method.value),
            icon: paymentIcon(method.value),
        }));
    }

    return [
        {
            value: "COD",
            title: "Thanh toán khi nhận hàng",
            description: "Thanh toán tiền mặt cho đơn vị vận chuyển.",
            icon: "mdi:cash-on-delivery",
        },
        {
            value: "VNPAY",
            title: "Ví VNPAY / Ngân hàng",
            description: "Thanh toán trực tuyến qua cổng VNPAY.",
            icon: "mdi:qrcode-scan",
        },
    ];
});

const selectedAddress = computed(() => {
    return cartStore.selectedAddress;
});

const selectedDelivery = computed(() => {
    return cartStore.selectedDelivery;
});

const merchandiseTotal = computed(() => {
    return cartStore.checkoutSubtotal;
});

const shippingCost = computed(() => {
    return cartStore.checkoutDeliveryCost;
});

const discountAmount = computed(() => {
    return cartStore.checkoutDiscountAmount;
});

const totalPayment = computed(() => {
    return cartStore.checkoutTotalPayment;
});

const estimatedDelivery = computed(() => {
    const date = new Date();

    const name = String(selectedDelivery.value?.name || "").toLowerCase();
    const days = name.includes("nhanh") ? 2 : 5;

    date.setDate(date.getDate() + days);

    return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
    });
});

const canPlaceOrder = computed(() => {
    return (
        checkoutItems.value.length > 0 &&
        Boolean(cartStore.checkoutForm.delivery_id) &&
        Boolean(cartStore.checkoutForm.payment_method) &&
        Boolean(
            cartStore.checkoutForm.shipping_address_id ||
            (
                cartStore.checkoutForm.receiver_name &&
                cartStore.checkoutForm.receiver_phone &&
                cartStore.checkoutForm.province &&
                cartStore.checkoutForm.district &&
                cartStore.checkoutForm.ward &&
                cartStore.checkoutForm.address_detail
            ),
        ) &&
        !cartStore.loading &&
        !cartStore.previewing &&
        !cartStore.checkingOut
    );
});

function parseIds(value) {
    return String(value || "")
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean);
}

function paymentIcon(value) {
    if (value === "VNPAY") {
        return "mdi:qrcode-scan";
    }

    return "mdi:cash-on-delivery";
}

function paymentDescription(value) {
    if (value === "VNPAY") {
        return "Thanh toán trực tuyến qua cổng VNPAY.";
    }

    return "Thanh toán tiền mặt cho đơn vị vận chuyển.";
}

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function showToast(message, type = "success") {
    toast.value = {
        message,
        type,
    };

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = null;
    }, 3000);
}

function safeBackToCart(message = "Vui lòng chọn sản phẩm cần thanh toán.") {
    showToast(message, "error");

    window.setTimeout(() => {
        router.replace({
            name: "cart",
        });
    }, 700);
}

function schedulePreview() {
    if (!initialized.value) {
        return;
    }

    window.clearTimeout(previewTimer);

    previewTimer = window.setTimeout(async () => {
        await previewOrder();
    }, 300);
}

async function previewOrder() {
    if (!checkoutItems.value.length || !cartStore.checkoutForm.delivery_id) {
        return;
    }

    try {
        await cartStore.previewCheckout(requestedItemIds.value);
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không tính được đơn hàng.",
            "error",
        );
    }
}

function selectAddress(id) {
    cartStore.selectAddress(id);
}

async function saveAddress(payload) {
    try {
        await cartStore.saveAddress(payload);

        showToast(
            cartStore.message || "Lưu địa chỉ nhận hàng thành công.",
        );
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không lưu được địa chỉ.",
            "error",
        );

        throw error;
    }
}

async function applyVoucher() {
    const code = voucherCode.value.trim().toUpperCase();

    if (!code) {
        showToast("Vui lòng nhập mã giảm giá.", "error");
        return;
    }

    cartStore.checkoutForm.discount_code = code;

    try {
        await cartStore.previewCheckout(requestedItemIds.value);

        showToast("Áp dụng voucher thành công.");
    } catch (error) {
        cartStore.checkoutForm.discount_code = "";
        voucherCode.value = "";

        showToast(
            cartStore.errorMsg || "Mã giảm giá không hợp lệ.",
            "error",
        );
    }
}

async function removeVoucher() {
    cartStore.checkoutForm.discount_code = "";
    voucherCode.value = "";
    cartStore.checkoutPreview = null;

    await previewOrder();

    showToast("Đã gỡ voucher.");
}

async function placeOrder() {
    if (!checkoutItems.value.length) {
        safeBackToCart("Không có sản phẩm để thanh toán.");
        return;
    }

    if (!selectedAddress.value && !cartStore.checkoutForm.receiver_name) {
        showToast("Vui lòng chọn hoặc thêm địa chỉ nhận hàng.", "error");
        addressModalOpen.value = true;
        return;
    }

    if (!cartStore.checkoutForm.delivery_id) {
        showToast("Vui lòng chọn phương thức giao hàng.", "error");
        return;
    }

    if (!cartStore.checkoutForm.payment_method) {
        showToast("Vui lòng chọn phương thức thanh toán.", "error");
        return;
    }

    try {
        const response = await cartStore.checkout(requestedItemIds.value);

        const order = response.data?.data?.order || cartStore.createdOrder;

        showToast("Đặt hàng thành công.");

        window.setTimeout(() => {
            if (order?.id && router.hasRoute("order-detail")) {
                router.push({
                    name: "order-detail",
                    params: {
                        id: order.id,
                    },
                });

                return;
            }

            if (router.hasRoute("my-orders")) {
                router.push({
                    name: "my-orders",
                });

                return;
            }

            router.push({
                name: "profile",
            });
        }, 700);
    } catch (error) {
        showToast(
            cartStore.errorMsg || "Không đặt được đơn hàng.",
            "error",
        );
    }
}

watch(
    () => cartStore.checkoutForm.delivery_id,
    () => {
        schedulePreview();
    },
);

onMounted(async () => {
    const ids = requestedItemIds.value;

    if (!ids.length) {
        safeBackToCart();
        return;
    }

    try {
        const discount = String(route.query.discount || "")
            .trim()
            .toUpperCase();

        if (discount) {
            cartStore.checkoutForm.discount_code = discount;
            voucherCode.value = discount;
        }

        await cartStore.loadCheckoutData(ids);

        if (!checkoutItems.value.length) {
            safeBackToCart("Sản phẩm thanh toán không còn trong giỏ hàng.");
            return;
        }

        initialized.value = true;
    } catch (error) {
        safeBackToCart(
            cartStore.errorMsg || "Không tải được dữ liệu thanh toán.",
        );
    }
});

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
    window.clearTimeout(previewTimer);
});
</script>

<template>
    <div class="min-h-[70vh] bg-[#f7f9f7] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400">
                    <RouterLink to="/cart" class="transition hover:text-[#07532b]">
                        Giỏ hàng
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-medium text-[#174e31]">
                        Thanh toán
                    </span>
                </nav>

                <div class="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
                    <Icon icon="mdi:shield-check-outline" class="text-lg text-[#0a7139]" />
                    Thanh toán an toàn
                </div>
            </div>
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
                    Kiểm tra địa chỉ, vận chuyển và phương thức thanh toán trước khi đặt hàng.
                </p>
            </div>

            <div v-if="cartStore.errorMsg"
                class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <Icon icon="mdi:alert-circle-outline" class="mt-0.5 shrink-0 text-xl" />

                <span>{{ cartStore.errorMsg }}</span>
            </div>

            <div v-if="cartStore.loading"
                class="grid min-h-80 place-items-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto text-5xl text-[#07532b] animate-spin" />

                    <p class="mt-4 text-sm font-semibold text-slate-500">
                        Đang tải dữ liệu thanh toán...
                    </p>
                </div>
            </div>

            <div v-else class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div class="space-y-5">
                    <section
                        class="relative overflow-hidden rounded-3xl border border-[#e7c866] bg-white p-5 shadow-sm sm:p-6">
                        <div
                            class="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#0a7139_0,#0a7139_16px,#ffd326_16px,#ffd326_32px,#fff_32px,#fff_48px)]">
                        </div>

                        <div class="flex items-start justify-between gap-4">
                            <div class="flex min-w-0 gap-3">
                                <span
                                    class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                    <Icon icon="mdi:map-marker-outline" class="text-2xl" />
                                </span>

                                <div v-if="selectedAddress" class="min-w-0">
                                    <h2 class="text-sm font-bold text-[#123d27]">
                                        Địa chỉ nhận hàng
                                    </h2>

                                    <div class="mt-2 flex flex-wrap items-center gap-2">
                                        <strong class="text-sm">
                                            {{ selectedAddress.receiver_name }}
                                        </strong>

                                        <span class="h-4 w-px bg-slate-200"></span>

                                        <span class="text-sm text-slate-600">
                                            {{ selectedAddress.receiver_phone }}
                                        </span>

                                        <span v-if="selectedAddress.is_default"
                                            class="rounded border border-[#0a7139] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0a7139]">
                                            Mặc định
                                        </span>
                                    </div>

                                    <p class="mt-2 text-xs leading-5 text-slate-500">
                                        {{ selectedAddress.address_detail }},
                                        {{ selectedAddress.ward }},
                                        {{ selectedAddress.district }},
                                        {{ selectedAddress.province }}
                                    </p>
                                </div>

                                <div v-else class="min-w-0">
                                    <h2 class="text-sm font-bold text-[#123d27]">
                                        Chưa có địa chỉ nhận hàng
                                    </h2>

                                    <p class="mt-2 text-xs leading-5 text-slate-500">
                                        Thêm địa chỉ để hệ thống lưu và dùng cho các lần đặt hàng sau.
                                    </p>
                                </div>
                            </div>

                            <button type="button"
                                class="shrink-0 rounded-full border border-[#bdd3c5] px-4 py-2 text-xs font-bold text-[#07532b] transition hover:bg-[#f2f8f4]"
                                @click="addressModalOpen = true">
                                {{
                                    selectedAddress
                                        ? "Thay đổi"
                                        : "Thêm địa chỉ"
                                }}
                            </button>
                        </div>
                    </section>

                    <CheckoutProducts :items="checkoutItems" />

                    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <h2 class="text-base font-bold text-[#123d27]">
                                    Phương thức giao hàng
                                </h2>

                                <p class="mt-1 text-xs text-slate-400">
                                    Phí giao hàng được backend tính lại theo phương thức đang chọn.
                                </p>
                            </div>

                            <Icon icon="mdi:truck-delivery-outline" class="text-2xl text-[#0a7139]" />
                        </div>

                        <div class="grid gap-3 sm:grid-cols-2">
                            <label v-for="method in deliveryMethods" :key="method.id"
                                class="cursor-pointer rounded-2xl border p-4 transition" :class="Number(cartStore.checkoutForm.delivery_id) === Number(method.id)
                                    ? 'border-[#0a7139] bg-[#f2f8f4] ring-2 ring-[#0a7139]/10'
                                    : 'border-slate-200 hover:border-[#9dbba8]'">
                                <input v-model="cartStore.checkoutForm.delivery_id" type="radio" :value="method.id"
                                    class="hidden" />

                                <div class="flex items-start gap-3">
                                    <span
                                        class="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#07532b]">
                                        <Icon :icon="String(method.name || '').toLowerCase().includes('nhanh')
                                            ? 'mdi:truck-fast-outline'
                                            : 'mdi:truck-outline'" class="text-2xl" />
                                    </span>

                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center justify-between gap-3">
                                            <strong class="text-sm text-[#123d27]">
                                                {{ method.name }}
                                            </strong>

                                            <span v-if="method.is_default"
                                                class="rounded-full bg-[#fff4cc] px-2 py-0.5 text-[9px] font-bold text-[#876300]">
                                                Mặc định
                                            </span>
                                        </div>

                                        <p class="mt-1 text-xs leading-5 text-slate-500">
                                            {{ method.description || "Không có mô tả" }}
                                        </p>

                                        <div class="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                                {{ method.region || "Toàn quốc" }}
                                            </span>

                                            <span
                                                class="rounded-full bg-[#edf5f0] px-2.5 py-1 font-semibold text-[#07532b]">
                                                {{
                                                    method.base_price
                                                        ? formatVND(method.base_price)
                                                : "Miễn phí"
                                                }}
                                            </span>

                                            <span v-if="Number(method.min_order_amount || 0) > 0"
                                                class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                                                Free từ {{ formatVND(method.min_order_amount) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div v-if="selectedDelivery"
                            class="mt-4 rounded-2xl bg-[#f7faf8] px-4 py-3 text-xs text-slate-500">
                            Dự kiến nhận hàng:
                            <strong class="text-[#07532b]">
                                {{ estimatedDelivery }}
                            </strong>
                        </div>
                    </section>

                    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <h2 class="text-base font-bold text-[#123d27]">
                                    Phương thức thanh toán
                                </h2>

                                <p class="mt-1 text-xs text-slate-400">
                                    COD dùng được ngay. VNPAY có thể nối cổng thanh toán sau.
                                </p>
                            </div>

                            <Icon icon="mdi:credit-card-check-outline" class="text-2xl text-[#0a7139]" />
                        </div>

                        <div class="grid gap-3 sm:grid-cols-2">
                            <label v-for="method in paymentMethods" :key="method.value"
                                class="cursor-pointer rounded-2xl border p-4 transition" :class="cartStore.checkoutForm.payment_method === method.value
                                    ? 'border-[#0a7139] bg-[#f2f8f4] ring-2 ring-[#0a7139]/10'
                                    : 'border-slate-200 hover:border-[#9dbba8]'">
                                <input v-model="cartStore.checkoutForm.payment_method" type="radio"
                                    :value="method.value" class="hidden" />

                                <div class="flex gap-3">
                                    <span
                                        class="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#07532b]">
                                        <Icon :icon="method.icon" class="text-2xl" />
                                    </span>

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
                                <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#365846]">
                                    Voucher
                                </label>

                                <div v-if="!cartStore.appliedDiscount" class="flex gap-2">
                                    <div class="relative min-w-0 flex-1">
                                        <Icon icon="mdi:ticket-percent-outline"
                                            class="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

                                        <input v-model="voucherCode" type="text" placeholder="Nhập mã giảm giá"
                                            class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm uppercase outline-none transition placeholder:normal-case focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10"
                                            @keyup.enter="applyVoucher" />
                                    </div>

                                    <button type="button"
                                        class="rounded-xl bg-[#e9b817] px-4 text-xs font-bold text-[#073f22] transition hover:bg-[#ffd329] disabled:cursor-not-allowed disabled:opacity-50"
                                        :disabled="cartStore.previewing || !voucherCode.trim()" @click="applyVoucher">
                                        {{
                                            cartStore.previewing
                                                ? "Đang..."
                                        : "Áp dụng"
                                        }}
                                    </button>
                                </div>

                                <div v-else
                                    class="flex items-center justify-between rounded-xl border border-dashed border-[#8eb89e] bg-[#f1f7f3] px-3 py-2.5">
                                    <div class="flex items-center gap-2">
                                        <Icon icon="mdi:ticket-confirmation-outline" class="text-xl text-[#0a7139]" />

                                        <div>
                                            <strong class="block text-xs text-[#07532b]">
                                                {{ cartStore.appliedDiscount.discount_code }}
                                            </strong>

                                            <span class="text-[10px] text-slate-500">
                                                Giảm {{ formatVND(discountAmount) }}
                                            </span>
                                        </div>
                                    </div>

                                    <button type="button" class="text-xs font-semibold text-red-500 hover:underline"
                                        @click="removeVoucher">
                                        Bỏ mã
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#365846]">
                                    Ghi chú đơn hàng
                                </label>

                                <textarea v-model.trim="cartStore.checkoutForm.note" rows="3"
                                    class="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10"
                                    placeholder="Ví dụ: gọi trước khi giao, giao giờ hành chính..."></textarea>
                            </div>
                        </div>
                    </section>
                </div>

                <CheckoutSummary :merchandise-total="merchandiseTotal" :shipping-cost="shippingCost"
                    :discount-amount="discountAmount" :total="totalPayment" :disabled="!canPlaceOrder"
                    :loading="cartStore.checkingOut" @place-order="placeOrder" />
            </div>
        </main>

        <AddressBookModal v-model="addressModalOpen" :addresses="addresses"
            :selected-address-id="cartStore.checkoutForm.shipping_address_id" :saving="cartStore.saving"
            @confirm="selectAddress" @save-address="saveAddress" />

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150"
            leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white shadow-2xl"
                :class="toast.type === 'error' ? 'bg-red-600' : 'bg-[#063f22]'">
                <Icon :icon="toast.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'"
                    class="text-lg text-[#ffd326]" />

                {{ toast.message }}
            </div>
        </Transition>
    </div>
</template>