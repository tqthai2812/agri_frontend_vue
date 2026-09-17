<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

import AccountOrderCard from "@/components/client/account/AccountOrderCard.vue";
import ClientOrderService from "@/services/client/clientOrder.service";
import { useCartStore } from "@/stores/client/cartStore";

const router = useRouter();
const cartStore = useCartStore();

const activeStatus = ref("all");
const search = ref("");
const toast = ref("");
const error = ref("");
const loading = ref(false);
const actionLoading = ref(false);

const orders = ref([]);
const statusCounts = ref({
    all: 0,
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
});

const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
});

let searchTimer = null;
let toastTimer = null;

const tabs = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "shipping", label: "Vận chuyển" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
];

function countStatus(status) {
    return Number(statusCounts.value?.[status] || 0);
}

function showToast(message) {
    toast.value = message;

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = "";
    }, 2600);
}

async function fetchStatusCounts() {
    try {
        const response = await ClientOrderService.getStatusCounts();

        statusCounts.value = {
            ...statusCounts.value,
            ...(response.data?.data || {}),
        };
    } catch (err) {
        console.error("Không tải được thống kê đơn hàng:", err);
    }
}

async function fetchOrders(page = 1) {
    loading.value = true;
    error.value = "";

    try {
        const params = {
            page,
            per_page: 10,
            search: search.value || undefined,
            order_status:
                activeStatus.value === "all"
                    ? undefined
                    : activeStatus.value,
        };

        const response = await ClientOrderService.getOrders(params);

        orders.value = response.data?.data || [];

        pagination.value = {
            current_page: response.data?.meta?.current_page || 1,
            last_page: response.data?.meta?.last_page || 1,
            total: response.data?.meta?.total || orders.value.length,
        };
    } catch (err) {
        error.value =
            err.response?.data?.message || "Không tải được danh sách đơn hàng.";
    } finally {
        loading.value = false;
    }
}

function reloadOrders() {
    fetchOrders(1);
    fetchStatusCounts();
}

async function cancelOrder(order) {
    const confirmed = window.confirm(
        `Bạn có chắc muốn hủy đơn hàng #${order.id}?`,
    );

    if (!confirmed) {
        return;
    }

    actionLoading.value = true;
    error.value = "";

    try {
        await ClientOrderService.cancelOrder(order.id);

        showToast(`Đã hủy đơn hàng #${order.id}.`);

        await Promise.all([
            fetchOrders(pagination.value.current_page),
            fetchStatusCounts(),
        ]);
    } catch (err) {
        error.value =
            err.response?.data?.message || "Không hủy được đơn hàng.";
    } finally {
        actionLoading.value = false;
    }
}

async function buyAgain(order) {
    actionLoading.value = true;
    error.value = "";

    try {
        for (const item of order.items || []) {
            await cartStore.addToCart({
                package_id: item.package_id,
                quantity: item.quantity,
            });
        }

        showToast("Đã thêm lại sản phẩm vào giỏ hàng.");

        window.setTimeout(() => {
            router.push({
                name: "cart",
            });
        }, 500);
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            cartStore.errorMsg ||
            "Không thêm lại được sản phẩm vào giỏ hàng.";
    } finally {
        actionLoading.value = false;
    }
}

function viewDetail(order) {
    router.push({
        name: "order-detail",
        params: {
            id: order.id,
        },
    });
}

watch(activeStatus, () => {
    fetchOrders(1);
});

watch(search, () => {
    window.clearTimeout(searchTimer);

    searchTimer = window.setTimeout(() => {
        fetchOrders(1);
    }, 350);
});

onMounted(() => {
    reloadOrders();
});

onBeforeUnmount(() => {
    window.clearTimeout(searchTimer);
    window.clearTimeout(toastTimer);
});
</script>

<template>
    <section>
        <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header class="border-b border-slate-100 px-5 py-5 sm:px-7">
                <div class="flex items-center gap-3">
                    <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                        <Icon icon="mdi:clipboard-text-clock-outline" class="text-2xl" />
                    </span>

                    <div>
                        <h1 class="text-lg font-bold text-[#123d27]">
                            Đơn mua của tôi
                        </h1>

                        <p class="mt-0.5 text-xs text-slate-400">
                            Theo dõi, quản lý và mua lại sản phẩm từ các đơn hàng.
                        </p>
                    </div>
                </div>
            </header>

            <div class="overflow-x-auto border-b border-slate-100 px-3 sm:px-5">
                <div class="flex min-w-max">
                    <button v-for="tab in tabs" :key="tab.value" type="button"
                        class="relative flex items-center gap-1.5 px-4 py-4 text-xs font-semibold transition" :class="activeStatus === tab.value
                            ? 'text-[#07532b]'
                            : 'text-slate-400 hover:text-[#07532b]'" @click="activeStatus = tab.value">
                        {{ tab.label }}

                        <span
                            class="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">
                            {{ countStatus(tab.value) }}
                        </span>

                        <span v-if="activeStatus === tab.value"
                            class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0a7139]"></span>
                    </button>
                </div>
            </div>

            <div class="p-4 sm:p-5">
                <div class="relative">
                    <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

                    <input v-model.trim="search"
                        class="h-12 w-full rounded-2xl border border-slate-200 bg-[#fafcfb] pl-12 pr-11 text-sm outline-none focus:border-[#0a7139] focus:bg-white focus:ring-4 focus:ring-[#0a7139]/10"
                        placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..." />

                    <button v-if="search" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        @click="search = ''">
                        <Icon icon="mdi:close-circle" class="text-lg" />
                    </button>
                </div>
            </div>
        </div>

        <div v-if="toast"
            class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
            <span class="flex items-center gap-2">
                <Icon icon="mdi:check-circle-outline" class="text-xl" />
                {{ toast }}
            </span>

            <button type="button" @click="toast = ''">
                <Icon icon="mdi:close" class="text-lg" />
            </button>
        </div>

        <div v-if="error"
            class="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
            <Icon icon="mdi:alert-circle-outline" class="text-xl" />
            {{ error }}
        </div>

        <div v-if="loading"
            class="mt-5 grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="text-center">
                <Icon icon="mdi:loading" class="mx-auto text-5xl text-[#07532b] animate-spin" />

                <p class="mt-3 text-xs font-semibold text-slate-400">
                    Đang tải đơn hàng...
                </p>
            </div>
        </div>

        <div v-else-if="orders.length" class="mt-5 space-y-5">
            <AccountOrderCard v-for="order in orders" :key="order.id" :order="order" :disabled="actionLoading"
                @cancel="cancelOrder" @buy-again="buyAgain" @view-detail="viewDetail" />

            <div v-if="pagination.last_page > 1" class="flex items-center justify-center gap-2 pt-2">
                <button type="button"
                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="pagination.current_page <= 1 || actionLoading"
                    @click="fetchOrders(pagination.current_page - 1)">
                    Trước
                </button>

                <span class="text-xs font-semibold text-slate-400">
                    Trang {{ pagination.current_page }} / {{ pagination.last_page }}
                </span>

                <button type="button"
                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="pagination.current_page >= pagination.last_page || actionLoading"
                    @click="fetchOrders(pagination.current_page + 1)">
                    Sau
                </button>
            </div>
        </div>

        <div v-else class="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <Icon icon="mdi:clipboard-text-off-outline" class="mx-auto text-5xl text-slate-300" />

            <h2 class="mt-5 text-base font-bold text-[#123d27]">
                Không tìm thấy đơn hàng
            </h2>

            <p class="mt-1 text-xs text-slate-400">
                Thử thay đổi trạng thái hoặc từ khóa tìm kiếm.
            </p>
        </div>
    </section>
</template>