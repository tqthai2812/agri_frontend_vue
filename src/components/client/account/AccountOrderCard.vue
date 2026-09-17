<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    order: {
        type: Object,
        required: true,
    },

    disabled: {
        type: Boolean,
        default: false,
    },
});

defineEmits([
    "cancel",
    "buy-again",
    "view-detail",
]);

const statusMap = {
    pending: {
        label: "Chờ xác nhận",
        class: "bg-amber-50 text-amber-600 border-amber-200",
        icon: "mdi:clock-outline",
    },
    confirmed: {
        label: "Đã xác nhận",
        class: "bg-blue-50 text-blue-600 border-blue-200",
        icon: "mdi:check-decagram-outline",
    },
    shipping: {
        label: "Đang vận chuyển",
        class: "bg-violet-50 text-violet-600 border-violet-200",
        icon: "mdi:truck-fast-outline",
    },
    completed: {
        label: "Giao hàng thành công",
        class: "bg-emerald-50 text-emerald-600 border-emerald-200",
        icon: "mdi:package-variant-closed-check",
    },
    cancelled: {
        label: "Đã hủy",
        class: "bg-red-50 text-red-500 border-red-200",
        icon: "mdi:close-circle-outline",
    },
};

const status = computed(() => {
    return statusMap[props.order.order_status] || statusMap.pending;
});

const orderCode = computed(() => {
    return (
        props.order.order_code ||
        props.order.invoice_code ||
        `DH${String(props.order.id || "").padStart(6, "0")}`
    );
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
        "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80"
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

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}
</script>

<template>
    <article
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-[0_14px_40px_rgba(6,75,38,0.07)]">
        <header
            class="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <strong class="text-[#123d27]">
                    {{ orderCode }}
                </strong>

                <span class="text-slate-300">•</span>

                <span class="text-slate-400">
                    {{ formatDate(order.created_at) }}
                </span>

                <span class="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                    {{ order.payment_method_label || order.payment_method }}
                </span>
            </div>

            <span
                class="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
                :class="status.class">
                <Icon :icon="status.icon" class="text-base" />

                {{ order.order_status_label || status.label }}
            </span>
        </header>

        <div class="divide-y divide-slate-100">
            <div v-for="item in order.items || []" :key="item.id" class="flex gap-4 px-5 py-4">
                <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f6f8f5] p-2">
                    <img :src="imageOf(item)" :alt="productNameOf(item)" class="h-full w-full object-contain" />
                </div>

                <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
                    <div class="min-w-0">
                        <RouterLink :to="{
                            name: 'client-product-detail',
                            params: {
                                id: productOf(item).id,
                            },
                        }" class="line-clamp-2 text-sm font-semibold leading-5 text-[#123d27] hover:text-[#d39f00]">
                            {{ productNameOf(item) }}
                        </RouterLink>

                        <p class="mt-1 text-[10px] text-slate-400">
                            Phân loại:
                            {{ variantOf(item).variant_name || variantOf(item).name || "Mặc định" }}
                            · {{ packageLabel(item) || "Mặc định" }}
                        </p>

                        <p class="mt-1 text-[11px] text-slate-500">
                            × {{ item.quantity }}
                        </p>
                    </div>

                    <strong class="mt-2 block shrink-0 text-sm text-[#0a7a3d] sm:mt-0">
                        {{
                            formatVND(
                                Number(item.price_at_purchase || item.price || 0) *
                                Number(item.quantity || 0),
                        )
                        }}
                    </strong>
                </div>
            </div>
        </div>

        <footer class="border-t border-slate-100 bg-[#fafcfb] px-5 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <button type="button"
                    class="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#07532b]"
                    :disabled="disabled" @click="$emit('view-detail', order)">
                    <Icon icon="mdi:receipt-text-outline" class="text-lg" />
                    Xem chi tiết đơn hàng
                </button>

                <div class="text-left sm:text-right">
                    <p class="text-xs text-slate-500">
                        Thành tiền:

                        <strong class="ml-2 text-xl text-[#0a7a3d]">
                            {{ formatVND(order.total_payment) }}
                        </strong>
                    </p>

                    <div class="mt-3 flex flex-wrap gap-2 sm:justify-end">
                        <a href="tel:+84334745378"
                            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-[#0a7139] hover:text-[#07532b]">
                            Liên hệ CSKH
                        </a>

                        <button v-if="['pending', 'confirmed'].includes(order.order_status)" type="button"
                            class="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="disabled" @click="$emit('cancel', order)">
                            Hủy đơn hàng
                        </button>

                        <button v-if="['completed', 'cancelled'].includes(order.order_status)" type="button"
                            class="rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="disabled" @click="$emit('buy-again', order)">
                            Mua lại
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    </article>
</template>