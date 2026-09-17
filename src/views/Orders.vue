<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Quản lý đơn hàng</h1>
        <p class="text-text-light text-sm">
          Theo dõi đơn hàng, thanh toán, địa chỉ giao hàng và cập nhật trạng thái.
        </p>
      </div>

      <button class="btn-outline-sm" @click="handleReload">
        <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
        Tải lại
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="stat-card-info">
        <div class="stat-label">Tổng đơn</div>
        <div class="stat-value text-info">{{ store.statusCounts.all }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Chờ xác nhận</div>
        <div class="stat-value">{{ store.statusCounts.pending }}</div>
      </div>

      <div class="stat-card-info">
        <div class="stat-label">Đã xác nhận</div>
        <div class="stat-value">{{ store.statusCounts.confirmed }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Đang giao</div>
        <div class="stat-value text-success">{{ store.statusCounts.shipping }}</div>
      </div>

      <div class="stat-card-danger">
        <div class="stat-label">Đã hủy</div>
        <div class="stat-value text-danger">{{ store.statusCounts.cancelled }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap border-b border-border mb-5">
      <button v-for="tab in orderTabs" :key="tab.key"
        class="px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px" :class="store.filters.order_status === tab.key
          ? 'text-primary border-primary'
          : 'text-text-light border-transparent hover:text-primary'" @click="handleTabChange(tab.key)">
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <!-- Messages -->
    <div v-if="store.message"
      class="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm">
      <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
      <span>{{ store.message }}</span>
    </div>

    <div v-if="store.errorMsg"
      class="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
      <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
      <span>{{ store.errorMsg }}</span>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border">
      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="search-box">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />

          <input v-model.trim="store.filters.search" type="text" placeholder="Tìm mã đơn, tên, email, SĐT..."
            class="search-input" @input="handleSearch" />
        </div>

        <select v-model="store.filters.payment_method" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange">
          <option value="">Tất cả thanh toán</option>
          <option value="COD">COD</option>
          <option value="VNPAY">VNPay</option>
        </select>

        <input v-model="store.filters.date_from" type="date" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange" />

        <input v-model="store.filters.date_to" type="date" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange" />

        <button class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải đơn hàng...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1150px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Mã đơn</th>
              <th class="table-th">Ngày đặt</th>
              <th class="table-th">Khách hàng</th>
              <th class="table-th">Người nhận</th>
              <th class="table-th">Tổng tiền</th>
              <th class="table-th">Thanh toán</th>
              <th class="table-th">Trạng thái</th>
              <th class="table-th">Sản phẩm</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="order in store.orders" :key="order.id" class="table-row">
              <td class="table-td">
                <div class="font-mono font-bold text-primary">
                  {{ order.invoice_code }}
                </div>

                <div class="text-xs text-text-light">
                  ID: {{ order.id }}
                </div>
              </td>

              <td class="table-td">
                <div class="text-sm">
                  {{ formatDate(order.created_at) }}
                </div>

                <div class="text-xs text-text-light">
                  {{ formatTime(order.created_at) }}
                </div>
              </td>

              <td class="table-td">
                <div class="font-semibold text-sm">
                  {{ order.user?.name || "Không rõ" }}
                </div>

                <div class="text-xs text-text-light">
                  {{ order.user?.email || "—" }}
                </div>
              </td>

              <td class="table-td">
                <div class="font-semibold text-sm">
                  {{ order.address?.receiver_name || "—" }}
                </div>

                <div class="text-xs text-text-light">
                  {{ order.address?.receiver_phone || "—" }}
                </div>
              </td>

              <td class="table-td">
                <div class="font-mono font-bold">
                  {{ formatVND(order.total_payment) }}
                </div>

                <div v-if="Number(order.discount_amount || 0) > 0" class="text-xs text-success">
                  Đã giảm {{ formatVND(order.discount_amount) }}
                </div>
              </td>

              <td class="table-td">
                <span class="badge-gray">
                  {{ order.payment_method }}
                </span>

                <div class="text-xs text-text-light mt-1">
                  {{ order.payment?.status_label || "—" }}
                </div>
              </td>

              <td class="table-td">
                <span :class="statusBadgeClass(order.order_status)">
                  {{ order.order_status_label }}
                </span>
              </td>

              <td class="table-td font-mono">
                {{ order.items_count ?? 0 }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Xem chi tiết" @click="store.openDetailModal(order)">
                    <Icon icon="solar:eye-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('order.update') && store.canUpdateStatus(order)"
                    class="btn-outline-icon text-success" title="Cập nhật trạng thái"
                    @click="store.openStatusModal(order)">
                    <Icon icon="solar:refresh-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.orders.length">
              <td colspan="9" class="empty-cell">
                Không có đơn hàng nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.orders.length }} / {{ store.meta.total }} đơn hàng
        </span>

        <div class="flex flex-wrap justify-center gap-2">
          <button class="page-btn" :disabled="store.meta.current_page <= 1"
            @click="handlePageChange(store.meta.current_page - 1)">
            <Icon icon="solar:arrow-left-bold" />
          </button>

          <button v-for="page in visiblePages" :key="page" class="page-btn"
            :class="{ active: page === store.meta.current_page }" @click="handlePageChange(page)">
            {{ page }}
          </button>

          <button class="page-btn" :disabled="store.meta.current_page >= store.meta.last_page"
            @click="handlePageChange(store.meta.current_page + 1)">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="store.showDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="store.closeDetailModal">
      <div class="bg-surface rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">
              Chi tiết đơn hàng {{ store.selectedOrder?.invoice_code }}
            </h2>

            <p class="text-sm text-text-light">
              Ngày đặt: {{ formatDateTime(store.selectedOrder?.created_at) }}
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeDetailModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <div v-if="store.loadingDetail" class="py-12 text-center text-text-light">
          <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
          <p class="text-sm">Đang tải chi tiết đơn hàng...</p>
        </div>

        <div v-else-if="store.selectedOrder" class="p-6 space-y-6">
          <!-- Basic info -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="detail-card">
              <div class="detail-title">Khách hàng</div>

              <div class="font-semibold">
                {{ store.selectedOrder.user?.name || "Không rõ" }}
              </div>

              <div class="text-sm text-text-light">
                {{ store.selectedOrder.user?.email || "—" }}
              </div>

              <div class="text-sm text-text-light">
                {{ store.selectedOrder.user?.phone_number || "—" }}
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-title">Người nhận</div>

              <div class="font-semibold">
                {{ store.selectedOrder.address?.receiver_name || "—" }}
              </div>

              <div class="text-sm text-text-light">
                {{ store.selectedOrder.address?.receiver_phone || "—" }}
              </div>

              <div class="text-sm text-text-light">
                {{ store.selectedOrder.address?.full_address || "—" }}
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-title">Thanh toán</div>

              <div class="font-semibold">
                {{ store.selectedOrder.payment_method_label }}
              </div>

              <div class="text-sm text-text-light">
                Trạng thái:
                {{ store.selectedOrder.payment?.status_label || "—" }}
              </div>

              <div class="text-sm text-text-light">
                Mã giao dịch:
                {{ store.selectedOrder.payment?.transaction_id || "—" }}
              </div>
            </div>
          </div>

          <!-- Order summary -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="detail-card">
              <div class="detail-title">Thông tin giao hàng</div>

              <div class="summary-row">
                <span>Phương thức:</span>
                <strong>{{ store.selectedOrder.delivery_method?.name || "—" }}</strong>
              </div>

              <div class="summary-row">
                <span>Khu vực:</span>
                <strong>{{ store.selectedOrder.delivery_method?.region || "—" }}</strong>
              </div>

              <div class="summary-row">
                <span>Phí giao hàng:</span>
                <strong>{{ formatVND(store.selectedOrder.delivery_cost) }}</strong>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-title">Tổng kết đơn hàng</div>

              <div class="summary-row">
                <span>Tổng số lượng:</span>
                <strong>{{ store.selectedOrder.total_quantity }}</strong>
              </div>

              <div class="summary-row">
                <span>Mã giảm giá:</span>
                <strong>{{ store.selectedOrder.discount?.discount_code || "Không áp dụng" }}</strong>
              </div>

              <div class="summary-row">
                <span>Tiền giảm:</span>
                <strong class="text-success">
                  -{{ formatVND(store.selectedOrder.discount_amount) }}
                </strong>
              </div>

              <div class="summary-row">
                <span>Thanh toán:</span>
                <strong class="text-primary text-lg">
                  {{ formatVND(store.selectedOrder.total_payment) }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div v-if="store.selectedOrder.note" class="detail-card">
            <div class="detail-title">Ghi chú khách hàng</div>
            <p class="text-sm">{{ store.selectedOrder.note }}</p>
          </div>

          <!-- Items -->
          <div class="detail-card">
            <div class="detail-title mb-4">Sản phẩm trong đơn</div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[800px]">
                <thead class="bg-bg">
                  <tr>
                    <th class="table-th">Sản phẩm</th>
                    <th class="table-th">SKU</th>
                    <th class="table-th">Quy cách</th>
                    <th class="table-th">Số lượng</th>
                    <th class="table-th">Đơn giá</th>
                    <th class="table-th">Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="item in store.selectedOrder.items" :key="item.id" class="table-row">
                    <td class="table-td">
                      <div class="flex items-center gap-3">
                        <img v-if="item.product?.primary_image" :src="item.product.primary_image"
                          :alt="item.product?.name" class="w-12 h-12 rounded-lg object-cover border border-border" />

                        <div v-else class="w-12 h-12 rounded-lg bg-bg flex items-center justify-center text-text-light">
                          <Icon icon="solar:box-bold-duotone" class="text-xl" />
                        </div>

                        <div>
                          <div class="font-semibold text-sm">
                            {{ item.product?.name || "Không rõ sản phẩm" }}
                          </div>

                          <div class="text-xs text-text-light">
                            {{ item.variant?.name || "—" }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="table-td font-mono">
                      {{ item.package?.sku || "—" }}
                    </td>

                    <td class="table-td">
                      {{ item.package?.size }} {{ item.package?.unit }}
                    </td>

                    <td class="table-td font-mono">
                      {{ item.quantity }}
                    </td>

                    <td class="table-td font-mono">
                      {{ formatVND(item.price) }}
                    </td>

                    <td class="table-td font-mono font-bold">
                      {{ formatVND(item.subtotal) }}
                    </td>
                  </tr>

                  <tr v-if="!store.selectedOrder.items?.length">
                    <td colspan="6" class="empty-cell">
                      Không có sản phẩm trong đơn.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Histories -->
          <div class="detail-card">
            <div class="flex justify-between items-center mb-4">
              <div class="detail-title">Lịch sử trạng thái</div>

              <button v-if="authStore.hasPermission('order.update') && store.canUpdateStatus(store.selectedOrder)"
                class="btn-primary-sm" @click="store.openStatusModal(store.selectedOrder)">
                <Icon icon="solar:refresh-bold" />
                Cập nhật trạng thái
              </button>
            </div>

            <div class="space-y-3">
              <div v-for="history in store.selectedOrder.histories" :key="history.id" class="history-item">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <span :class="statusBadgeClass(history.order_status)">
                      {{ history.order_status_label }}
                    </span>

                    <p v-if="history.note" class="text-sm mt-2">
                      {{ history.note }}
                    </p>

                    <p class="text-xs text-text-light mt-1">
                      Người cập nhật:
                      {{ history.creator?.name || "Không rõ" }}
                    </p>
                  </div>

                  <div class="text-xs text-text-light whitespace-nowrap">
                    {{ formatDateTime(history.created_at) }}
                  </div>
                </div>
              </div>

              <div v-if="!store.selectedOrder.histories?.length" class="text-sm text-text-light">
                Chưa có lịch sử trạng thái.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div v-if="store.showStatusModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      @click.self="store.closeStatusModal">
      <div class="bg-surface rounded-2xl max-w-lg w-full">
        <div class="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">Cập nhật trạng thái</h2>
            <p class="text-sm text-text-light">
              Đơn hàng {{ store.selectedOrder?.invoice_code }}
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeStatusModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <form class="p-6 space-y-5" @submit.prevent="handleUpdateStatus">
          <div v-if="store.errorMsg"
            class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Trạng thái hiện tại</label>

            <div>
              <span :class="statusBadgeClass(store.selectedOrder?.order_status)">
                {{ store.selectedOrder?.order_status_label }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Chuyển sang <span class="text-primary">*</span>
            </label>

            <select v-model="store.statusForm.order_status" class="form-control">
              <option value="">Chọn trạng thái</option>

              <option v-for="status in store.getNextStatuses(store.selectedOrder?.order_status)" :key="status.value"
                :value="status.value">
                {{ status.label }}
              </option>
            </select>

            <p v-if="store.fieldError('order_status')" class="error-text">
              {{ store.fieldError("order_status") }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Ghi chú</label>

            <textarea v-model.trim="store.statusForm.note" class="form-control" rows="4"
              placeholder="Ví dụ: Admin xác nhận đơn hàng, đơn đang được giao..."></textarea>

            <p v-if="store.fieldError('note')" class="error-text">
              {{ store.fieldError("note") }}
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" class="btn-outline" @click="store.closeStatusModal">
              Hủy
            </button>

            <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="store.savingStatus || !store.statusForm.order_status">
              <Icon :icon="store.savingStatus ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                :class="store.savingStatus ? 'animate-spin' : ''" />

              {{ store.savingStatus ? "Đang lưu..." : "Lưu trạng thái" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted } from "vue";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useOrderStore();
const authStore = useAuthStore();

let searchTimer = null;

const orderTabs = computed(() => [
  {
    key: "",
    label: "Tất cả",
    count: store.statusCounts.all,
  },
  {
    key: "pending",
    label: "Chờ xác nhận",
    count: store.statusCounts.pending,
  },
  {
    key: "confirmed",
    label: "Đã xác nhận",
    count: store.statusCounts.confirmed,
  },
  {
    key: "shipping",
    label: "Đang giao",
    count: store.statusCounts.shipping,
  },
  {
    key: "completed",
    label: "Hoàn thành",
    count: store.statusCounts.completed,
  },
  {
    key: "cancelled",
    label: "Đã hủy",
    count: store.statusCounts.cancelled,
  },
]);

const visiblePages = computed(() => {
  const current = store.meta.current_page;
  const last = store.meta.last_page;
  const pages = [];

  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  return pages;
});

function formatVND(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function statusBadgeClass(status) {
  const map = {
    pending: "badge-pending",
    confirmed: "badge-info-b",
    shipping: "badge-gray",
    completed: "badge-active",
    cancelled: "badge-inactive",
  };

  return map[status] || "badge-gray";
}

async function handleReload() {
  await store.loadData();
}

async function handleTabChange(status) {
  store.filters.order_status = status;
  store.filters.page = 1;

  await store.fetchOrders();
}

function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(async () => {
    store.filters.page = 1;
    await store.fetchOrders();
  }, 350);
}

async function handleFilterChange() {
  store.filters.page = 1;
  await store.fetchOrders();
}

async function handleResetFilters() {
  store.resetFilters();
  await store.loadData();
}

async function handleUpdateStatus() {
  await store.updateOrderStatus();
}

function handlePageChange(page) {
  if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
    return;
  }

  store.setPage(page);
}

onMounted(async () => {
  await store.loadData();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
  @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
}

.stat-card-success {
  @apply border-l-success;
}

.stat-card-warning {
  @apply border-l-warning;
}

.stat-card-danger {
  @apply border-l-danger;
}

.stat-card-info {
  @apply border-l-info;
}

.stat-label {
  @apply text-text-light text-xs font-medium;
}

.stat-value {
  @apply text-2xl font-bold font-mono;
}

.search-box {
  @apply flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[220px];
}

.search-input {
  @apply bg-transparent outline-none text-sm w-full;
}

.table-th {
  @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
  @apply p-3 align-middle;
}

.table-row {
  @apply border-b border-border hover:bg-primary/5 transition;
}

.empty-cell {
  @apply p-8 text-center text-text-light;
}

.error-text {
  @apply text-danger text-sm mt-1;
}

.detail-card {
  @apply rounded-2xl border border-border bg-bg/30 p-4;
}

.detail-title {
  @apply text-sm font-bold uppercase tracking-wide text-text-light mb-2;
}

.summary-row {
  @apply flex justify-between gap-4 py-2 border-b border-border last:border-b-0 text-sm;
}

.history-item {
  @apply rounded-xl border border-border bg-surface p-4;
}
</style>