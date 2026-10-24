<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import OrderStats from "@/components/admin/orders/OrderStats.vue";
import OrderNotices from "@/components/admin/orders/OrderNotices.vue";
import OrderTabs from "@/components/admin/orders/OrderTabs.vue";
import OrderFilters from "@/components/admin/orders/OrderFilters.vue";
import OrderTable from "@/components/admin/orders/OrderTable.vue";
import OrderPagination from "@/components/admin/orders/OrderPagination.vue";
import OrderDetailModal from "@/components/admin/orders/OrderDetailModal.vue";
import OrderStatusModal from "@/components/admin/orders/OrderStatusModal.vue";
import OrderCodModal from "@/components/admin/orders/OrderCodModal.vue";

const store = useOrderStore();

const order = computed(() => store.selectedOrder);
const actionOpen = computed(() => store.showStatusModal || store.showCodModal);
let searchTimer;
// Các action đọc đã ghi lỗi vào store.
// Bắt ở đây để tránh promise không được xử lý trong event handler.
async function run(action) {
  try {
    return await action();
  } catch {
    return null;
  }
}
function reload() {
  window.clearTimeout(searchTimer);
  if (!store.busy) {
    return run(() => store.loadData());
  }
}
function applyFilters() {
  window.clearTimeout(searchTimer);
  if (store.busy) return;
  store.filters.page = 1;
  store.clearMessages();
  return run(() => store.fetchOrders());
}
function search() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(applyFilters, 350);
}
function selectTab(status) {
  if (store.busy) return;
  store.filters.order_status = status;
  return applyFilters();
}
function resetFilters() {
  store.resetFilters();
  return applyFilters();
}
function changePage(page) {
  window.clearTimeout(searchTimer);
  if (
    store.busy ||
    store.loading ||
    page === store.meta.current_page
  ) {
    return;
  }
  store.clearMessages();
  return run(() => store.setPage(page));
}
function openDetail(value) {
  window.clearTimeout(searchTimer);
  return run(() => store.openDetailModal(value));
}
function reloadDetail() {
  if (
    store.busy ||
    actionOpen.value ||
    !order.value
  ) {
    return;
  }
  store.clearMessages();
  return run(() => store.fetchOrderDetail(order.value.id));
}
onMounted(reload);
onBeforeUnmount(() => {
  window.clearTimeout(searchTimer);
  store.closeStatusModal();
  store.closeCodModal();
  store.closeDetailModal();
});
</script>

<template>
  <div>
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Quản lý đơn hàng</h1>
        <p class="text-sm text-text-light">
          Theo dõi giao hàng và xác nhận các khoản tiền đã thu.
        </p>
      </div>
      <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        :disabled="store.busy || store.loading || store.loadingCounts" @click="reload">
        <Icon icon="solar:refresh-bold" :class="{
          'animate-spin': store.loading || store.loadingCounts,
        }" />
        Tải lại
      </button>
    </header>
    <OrderStats />
    <OrderNotices />
    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <OrderTabs @select="selectTab" />
      <OrderFilters @search="search" @change="applyFilters" @reset="resetFilters" />
      <OrderTable @detail="openDetail" />
      <OrderPagination @change="changePage" />
    </section>
    <OrderDetailModal @reload="reloadDetail" />
    <OrderStatusModal @save="run(() => store.updateOrderStatus())" />
    <OrderCodModal @confirm="run(() => store.confirmCodPayment())" />
  </div>
</template>