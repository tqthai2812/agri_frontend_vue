<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useOrderStore();
const authStore = useAuthStore();

const canEdit = computed(() =>
  authStore.hasPermission("order.update"),
);

const order = computed(() => store.selectedOrder);

const address = computed(
  () => order.value?.address || order.value?.receiver_address,
);

const nextStatuses = computed(() =>
  store.getNextStatuses(order.value),
);

const actionOpen = computed(
  () => store.showStatusModal || store.showCodModal,
);

const tabs = [
  { key: "", countKey: "all", label: "Tất cả" },
  { key: "pending", countKey: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", countKey: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", countKey: "shipping", label: "Đang giao" },
  { key: "completed", countKey: "completed", label: "Hoàn thành" },
  { key: "cancelled", countKey: "cancelled", label: "Đã hủy" },
];

const paymentMethods = [
  { value: "COD", label: "Thanh toán khi nhận hàng" },
  { value: "VNPAY", label: "VNPAY (chưa tích hợp)" },
];

const alerts = computed(() =>
  [
    { text: store.message, type: "success" },
    { text: store.warningMsg, type: "warning" },
    { text: store.errorMsg, type: "error" },
  ].filter((item) => item.text),
);

const visiblePages = computed(() => {
  const pages = [];

  for (
    let page = Math.max(1, store.meta.current_page - 2);
    page <= Math.min(store.meta.last_page, store.meta.current_page + 2);
    page++
  ) {
    pages.push(page);
  }

  return pages;
});

const merchandiseTotal = computed(() =>
  (order.value?.items || []).reduce(
    (sum, item) =>
      sum +
      Number(
        item.subtotal ??
        Number(item.price) * Number(item.quantity),
      ),
    0,
  ),
);

let searchTimer;

function money(value) {
  if (value === null || value === undefined || value === "") {
    return "Chưa xác định";
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
    : "Chưa xác định";
}

function dateTime(value) {
  if (!value) return "—";

  const date = new Date(String(value).replace(" ", "T"));

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("vi-VN");
}

function code(value) {
  return (
    value?.order_code ||
    value?.invoice_code ||
    (value?.id
      ? `DH${String(value.id).padStart(6, "0")}`
      : "—")
  );
}

function statusLabel(status) {
  return (
    tabs.find((tab) => tab.key === status)?.label ||
    status ||
    "—"
  );
}

function statusClass(status) {
  return (
    {
      pending: "badge-pending",
      confirmed: "badge-info-b",
      shipping: "badge-gray",
      completed: "badge-active",
      cancelled: "badge-inactive",
    }[status] || "badge-gray"
  );
}

function paymentLabel(value) {
  return (
    paymentMethods.find((method) => method.value === value)?.label ||
    value ||
    "—"
  );
}

function paymentStatus(value) {
  return (
    {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Không thành công",
    }[value] ||
    value ||
    "—"
  );
}

function paymentSummary(value) {
  if (!store.paymentKnown(value)) {
    return "Chưa xác định thanh toán";
  }

  return store.isPaid(value)
    ? "Đã thanh toán"
    : "Chưa thanh toán";
}

function fullAddress(value) {
  if (!value) return "Chưa có địa chỉ";

  return (
    value.full_address ||
    [
      value.address_detail,
      value.ward,
      value.district,
      value.province,
    ]
      .filter(Boolean)
      .join(", ")
  );
}

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
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Quản lý đơn hàng</h1>
        <p class="text-sm text-text-light">
          Theo dõi giao hàng và xác nhận các khoản tiền đã thu.
        </p>
      </div>

      <button type="button" class="btn-outline-sm" :disabled="store.busy || store.loading || store.loadingCounts"
        @click="reload">
        <Icon icon="solar:refresh-bold" :class="{
          'animate-spin': store.loading || store.loadingCounts,
        }" />
        Tải lại
      </button>
    </header>

    <div class="mb-2 grid grid-cols-2 gap-3 lg:grid-cols-6">
      <div v-for="tab in tabs" :key="tab.countKey" class="stat-card">
        <div class="text-xs text-text-light">{{ tab.label }}</div>
        <div class="mt-1 font-mono text-2xl font-bold">
          {{ store.statusCounts[tab.countKey] }}
        </div>
      </div>
    </div>

    <p class="mb-5 text-xs text-text-light">
      Số lượng trên là tổng toàn hệ thống, không thay đổi theo bộ lọc.
    </p>

    <div v-for="alert in alerts" :key="alert.type" role="status" class="notice" :class="alert.type">
      {{ alert.text }}
    </div>

    <div class="mb-5 flex flex-wrap gap-2">
      <button v-for="tab in tabs" :key="tab.countKey" type="button" class="rounded-lg border px-4 py-2 text-sm" :class="store.filters.order_status === tab.key
        ? 'border-primary font-bold text-primary'
        : 'border-border text-text-light'
        " :disabled="store.busy" @click="selectTab(tab.key)">
        {{ tab.label }}
      </button>
    </div>

    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <fieldset :disabled="store.busy" class="mb-5 flex flex-wrap items-end gap-3">
        <label class="min-w-[220px] flex-1">
          <span class="mb-1 block text-xs text-text-light">
            Tìm kiếm
          </span>
          <input v-model.trim="store.filters.search" class="form-control w-full"
            placeholder="Mã đơn, khách hàng, sản phẩm, SKU..." @input="search" />
        </label>

        <label>
          <span class="mb-1 block text-xs text-text-light">
            Phương thức thanh toán
          </span>
          <select v-model="store.filters.payment_method" class="filter-select" @change="applyFilters">
            <option value="">Tất cả</option>
            <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
              {{ method.label }}
            </option>
          </select>
        </label>

        <label>
          <span class="mb-1 block text-xs text-text-light">
            Từ ngày
          </span>
          <input v-model="store.filters.date_from" type="date" class="filter-select" @change="applyFilters" />
        </label>

        <label>
          <span class="mb-1 block text-xs text-text-light">
            Đến ngày
          </span>
          <input v-model="store.filters.date_to" type="date" class="filter-select"
            :min="store.filters.date_from || undefined" @change="applyFilters" />
        </label>

        <button type="button" class="btn-outline-sm" @click="resetFilters">
          Xóa lọc
        </button>
      </fieldset>

      <div v-if="store.loading" class="py-12 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        Đang tải đơn hàng...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead>
            <tr>
              <th>Mã đơn / Ngày tạo</th>
              <th>Khách hàng</th>
              <th>Người nhận</th>
              <th>Tổng thanh toán</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Mặt hàng</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in store.orders" :key="item.id">
              <td>
                <strong>{{ code(item) }}</strong>
                <div class="muted">{{ dateTime(item.created_at) }}</div>
              </td>

              <td>
                {{ item.user?.name || "—" }}
                <div class="muted">{{ item.user?.email || "—" }}</div>
              </td>

              <td>
                {{
                  (item.address || item.receiver_address)?.receiver_name ||
                  "—"
                }}
                <div class="muted">
                  {{
                    (item.address || item.receiver_address)?.receiver_phone ||
                    "—"
                  }}
                </div>
              </td>

              <td class="font-semibold">
                {{ money(item.total_payment) }}
                <div v-if="Number(item.discount_amount) > 0" class="muted">
                  Giảm {{ money(item.discount_amount) }}
                </div>
              </td>

              <td>
                {{ item.payment_method }}
                <div class="text-xs" :class="store.isPaid(item)
                  ? 'text-success'
                  : 'text-text-light'
                  ">
                  {{ paymentSummary(item) }}
                </div>
              </td>

              <td>
                <span :class="statusClass(item.order_status)">
                  {{
                    item.order_status_label ||
                    statusLabel(item.order_status)
                  }}
                </span>
              </td>

              <td>
                {{ item.items_count ?? item.items?.length ?? 0 }}
              </td>

              <td>
                <button type="button" class="btn-outline-sm" :disabled="store.busy" @click="openDetail(item)">
                  Chi tiết
                </button>
              </td>
            </tr>

            <tr v-if="!store.orders.length">
              <td colspan="8" class="py-10 text-center text-text-light">
                Không có đơn hàng phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-text-light">
          Hiển thị {{ store.orders.length }} / {{ store.meta.total }}
          đơn phù hợp
        </p>

        <div class="flex gap-2">
          <button type="button" class="page-btn" :disabled="store.busy ||
            store.loading ||
            store.meta.current_page <= 1
            " @click="changePage(store.meta.current_page - 1)">
            ‹
          </button>

          <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
            :class="{ active: page === store.meta.current_page }" :disabled="store.busy || store.loading"
            @click="changePage(page)">
            {{ page }}
          </button>

          <button type="button" class="page-btn" :disabled="store.busy ||
            store.loading ||
            store.meta.current_page >= store.meta.last_page
            " @click="changePage(store.meta.current_page + 1)">
            ›
          </button>
        </div>
      </footer>
    </section>

    <Teleport to="body">
      <div v-if="store.showDetailModal" class="modal-backdrop z-50" @click.self="store.closeDetailModal">
        <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" class="modal-panel max-w-6xl">
          <header class="modal-header">
            <div>
              <h2 id="order-detail-title" class="text-xl font-bold">
                Đơn hàng {{ code(order) }}
              </h2>
              <p class="muted">{{ dateTime(order?.created_at) }}</p>
            </div>

            <div class="flex gap-2">
              <button type="button" class="btn-outline-sm" :disabled="store.busy || actionOpen || store.loadingDetail
                " @click="reloadDetail">
                Tải lại chi tiết
              </button>

              <button type="button" class="btn-outline-icon" aria-label="Đóng chi tiết"
                :disabled="store.busy || actionOpen" @click="store.closeDetailModal">
                <Icon icon="solar:close-circle-bold" />
              </button>
            </div>
          </header>

          <div class="space-y-5 p-5 sm:p-6">
            <div v-for="alert in alerts" :key="alert.type" role="status" class="notice" :class="alert.type">
              {{ alert.text }}
            </div>

            <p v-if="store.loadingDetail" class="py-10 text-center">
              Đang tải chi tiết...
            </p>

            <p v-else-if="store.detailError" role="alert" class="notice error">
              {{ store.detailError }}
            </p>

            <template v-else-if="store.detailReady && order">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span :class="statusClass(order.order_status)">
                  {{
                    order.order_status_label ||
                    statusLabel(order.order_status)
                  }}
                </span>

                <div v-if="canEdit" class="flex flex-wrap gap-2">
                  <button v-if="store.canUpdateStatus(order)" type="button" class="btn-outline-sm"
                    :disabled="store.busy || actionOpen" @click="store.openStatusModal">
                    Cập nhật trạng thái
                  </button>

                  <button v-if="store.canConfirmCodPayment(order)" type="button" class="btn-primary"
                    :disabled="store.busy || actionOpen" @click="store.openCodModal">
                    Xác nhận đã thu COD
                  </button>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <article class="detail-card">
                  <h3>Khách hàng</h3>
                  <p>{{ order.user?.name || "—" }}</p>
                  <p class="muted">{{ order.user?.email || "—" }}</p>
                  <p class="muted">
                    {{ order.user?.phone_number || "—" }}
                  </p>
                </article>

                <article class="detail-card">
                  <h3>Địa chỉ nhận hàng</h3>
                  <p>{{ address?.receiver_name || "—" }}</p>
                  <p>{{ address?.receiver_phone || "—" }}</p>
                  <p class="muted">{{ fullAddress(address) }}</p>
                </article>

                <article class="detail-card">
                  <h3>Thanh toán</h3>
                  <p>{{ paymentLabel(order.payment_method) }}</p>

                  <p class="mt-2 font-semibold" :class="store.isPaid(order)
                    ? 'text-success'
                    : 'text-warning'
                    ">
                    {{ paymentSummary(order) }}
                  </p>

                  <p v-if="
                    order.payment_method === 'COD' &&
                    !store.isPaid(order)
                  " class="muted mt-2">
                    Trạng thái giao hàng và xác nhận thu tiền
                    được theo dõi riêng.
                  </p>
                </article>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <article class="detail-card">
                  <h3>Giao hàng</h3>
                  <p>{{ order.delivery_method?.name || "—" }}</p>
                  <p class="muted">
                    {{ order.delivery_method?.description }}
                  </p>

                  <div class="summary-row">
                    <span>Phí giao hàng của đơn</span>
                    <strong>{{ money(order.delivery_cost) }}</strong>
                  </div>

                  <p v-if="order.note" class="mt-3 whitespace-pre-wrap text-sm">
                    <strong>Ghi chú khách hàng:</strong>
                    {{ order.note }}
                  </p>
                </article>

                <article class="detail-card">
                  <h3>Chi tiết số tiền</h3>

                  <div class="summary-row">
                    <span>Tiền hàng</span>
                    <span>{{ money(merchandiseTotal) }}</span>
                  </div>

                  <div class="summary-row">
                    <span>
                      Giảm giá
                      <span v-if="order.discount?.discount_code">
                        ({{ order.discount.discount_code }})
                      </span>
                    </span>
                    <span>-{{ money(order.discount_amount) }}</span>
                  </div>

                  <div class="summary-row">
                    <span>Phí giao hàng</span>
                    <span>{{ money(order.delivery_cost) }}</span>
                  </div>

                  <div class="summary-row font-bold">
                    <span>Tổng thanh toán</span>
                    <span>{{ money(order.total_payment) }}</span>
                  </div>

                  <p class="muted mt-2">
                    Tổng số lượng: {{ order.total_quantity }}
                    · Hoàn thành lúc:
                    {{ dateTime(order.completed_at) }}
                  </p>
                </article>
              </div>

              <section>
                <h3 class="mb-3 font-bold">Sản phẩm trong đơn</h3>

                <div class="overflow-x-auto">
                  <table class="w-full min-w-[1000px]">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Tiền hàng</th>
                        <th>Giảm giá</th>
                        <th>Sau giảm giá</th>
                        <th>Giá vốn</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="item in order.items || []" :key="item.id">
                        <td>
                          <div class="flex items-center gap-3">
                            <img v-if="item.product?.primary_image" :src="item.product.primary_image" alt=""
                              class="h-12 w-12 shrink-0 rounded-lg object-contain" />

                            <div>
                              <strong>
                                {{
                                  item.product_name ||
                                  item.product?.name ||
                                  "Sản phẩm"
                                }}
                              </strong>

                              <div class="muted">
                                {{
                                  item.variant_name ||
                                  item.variant?.name ||
                                  "Mặc định"
                                }}
                                ·
                                {{ item.size ?? item.package?.size }}
                                {{ item.unit || item.package?.unit }}
                              </div>

                              <div class="muted">
                                SKU:
                                {{ item.sku || item.package?.sku || "—" }}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>{{ item.quantity }}</td>
                        <td>{{ money(item.price) }}</td>
                        <td>{{ money(item.subtotal) }}</td>
                        <td>{{ money(item.discount_amount) }}</td>
                        <td>{{ money(item.net_sales_amount) }}</td>
                        <td>{{ money(item.cost_total) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 class="mb-3 font-bold">Các bản ghi thanh toán</h3>

                <div class="overflow-x-auto">
                  <table class="w-full min-w-[650px]">
                    <thead>
                      <tr>
                        <th>Phương thức</th>
                        <th>Mã giao dịch</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Thời điểm thu</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="payment in order.payments || []" :key="payment.id">
                        <td>{{ payment.payment_method }}</td>
                        <td>{{ payment.transaction_id || "—" }}</td>
                        <td>{{ money(payment.amount) }}</td>

                        <td>
                          <span :class="payment.status === 'paid'
                            ? 'text-success'
                            : 'text-text-light'
                            ">
                            {{
                              payment.status_label ||
                              paymentStatus(payment.status)
                            }}
                          </span>

                          <p v-if="payment.failed_reason" class="muted max-w-xs">
                            {{ payment.failed_reason }}
                          </p>
                        </td>

                        <td>{{ dateTime(payment.paid_at) }}</td>
                      </tr>

                      <tr v-if="!order.payments?.length">
                        <td colspan="5" class="text-center text-text-light">
                          Chưa có bản ghi thanh toán.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 class="mb-3 font-bold">Lịch sử đơn hàng</h3>

                <div class="space-y-3">
                  <article v-for="history in order.histories || []" :key="history.id" class="detail-card">
                    <div class="flex flex-wrap justify-between gap-2">
                      <strong>
                        {{
                          history.order_status_label ||
                          statusLabel(history.order_status)
                        }}
                      </strong>
                      <span class="muted">
                        {{ dateTime(history.created_at) }}
                      </span>
                    </div>

                    <p v-if="history.note" class="mt-2 whitespace-pre-wrap text-sm">
                      {{ history.note }}
                    </p>

                    <p class="muted mt-2">
                      Người thực hiện:
                      {{ history.creator?.name || "Hệ thống" }}
                    </p>
                  </article>

                  <p v-if="!order.histories?.length" class="muted">
                    Chưa có lịch sử.
                  </p>
                </div>
              </section>
            </template>
          </div>
        </section>
      </div>

      <div v-if="store.showStatusModal" class="modal-backdrop z-[60]" @click.self="store.closeStatusModal">
        <section role="dialog" aria-modal="true" aria-labelledby="order-status-title" class="modal-panel max-w-lg">
          <header class="modal-header">
            <h2 id="order-status-title" class="text-lg font-bold">
              Cập nhật {{ code(order) }}
            </h2>

            <button type="button" class="btn-outline-icon" aria-label="Đóng cập nhật" :disabled="store.busy"
              @click="store.closeStatusModal">
              <Icon icon="solar:close-circle-bold" />
            </button>
          </header>

          <form class="space-y-4 p-6" @submit.prevent="run(() => store.updateOrderStatus())">
            <p v-if="store.errorMsg" role="alert" class="notice error">
              {{ store.errorMsg }}
            </p>

            <p class="text-sm">
              Hiện tại:
              <strong>{{ statusLabel(order?.order_status) }}</strong>
            </p>

            <label class="block">
              <span class="form-label">Trạng thái mới</span>

              <select v-model="store.statusForm.order_status" class="form-control w-full" :disabled="store.busy"
                required>
                <option v-for="status in nextStatuses" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </label>

            <p v-if="store.statusForm.order_status === 'shipping'" class="text-sm text-text-light">
              Chuyển sang đang giao sẽ xuất kho.
              Đơn đang giao không thể hủy bằng thao tác này.
            </p>

            <p v-if="store.statusForm.order_status === 'cancelled'" class="text-sm text-text-light">
              Hủy đơn sẽ giải phóng hàng đang giữ.
              Đơn đã hủy không thể mở lại.
            </p>

            <p v-if="
              store.statusForm.order_status === 'completed' &&
              order?.payment_method === 'COD' &&
              !store.isPaid(order)
            " class="text-sm text-text-light">
              Hoàn thành ghi nhận đã giao hàng.
              Tiền COD cần được xác nhận riêng khi đã thực thu.
            </p>

            <label class="block">
              <span class="form-label">Ghi chú</span>
              <textarea v-model="store.statusForm.note" rows="3" maxlength="1000" class="form-control w-full"
                :disabled="store.busy"></textarea>
            </label>

            <div class="flex justify-end gap-3">
              <button type="button" class="btn-outline" :disabled="store.busy" @click="store.closeStatusModal">
                Hủy
              </button>

              <button type="submit" class="btn-primary" :disabled="!canEdit ||
                store.busy ||
                !store.detailReady ||
                !nextStatuses.some(
                  (item) => item.value === store.statusForm.order_status
                )
                ">
                {{
                  store.savingStatus
                    ? "Đang lưu..."
                    : "Lưu trạng thái"
                }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div v-if="store.showCodModal" class="modal-backdrop z-[60]" @click.self="store.closeCodModal">
        <section role="dialog" aria-modal="true" aria-labelledby="order-cod-title" class="modal-panel max-w-lg">
          <header class="modal-header">
            <h2 id="order-cod-title" class="text-lg font-bold">
              Xác nhận thu COD
            </h2>

            <button type="button" class="btn-outline-icon" aria-label="Đóng xác nhận COD" :disabled="store.busy"
              @click="store.closeCodModal">
              <Icon icon="solar:close-circle-bold" />
            </button>
          </header>

          <form class="space-y-5 p-6" @submit.prevent="run(() => store.confirmCodPayment())">
            <p v-if="store.errorMsg" role="alert" class="notice error">
              {{ store.errorMsg }}
            </p>

            <div class="detail-card">
              <p>Đơn <strong>{{ code(order) }}</strong></p>
              <p class="mt-2 text-xl font-bold">
                {{ money(order?.total_payment) }}
              </p>
            </div>

            <p class="text-sm text-text-light">
              Chỉ xác nhận khi đã nhận đủ tiền từ khách hàng hoặc
              đơn vị vận chuyển. Thao tác này ghi nhận khoản đã thu,
              không đổi trạng thái giao hàng.
            </p>

            <label class="flex items-start gap-3 text-sm">
              <input v-model="store.codForm.received_payment" type="checkbox" class="mt-1" :disabled="store.busy"
                required />
              <span>
                Tôi xác nhận đã thực thu đủ
                {{ money(order?.total_payment) }} cho đơn này.
              </span>
            </label>

            <div class="flex justify-end gap-3">
              <button type="button" class="btn-outline" :disabled="store.busy" @click="store.closeCodModal">
                Hủy
              </button>

              <button type="submit" class="btn-primary" :disabled="!canEdit ||
                store.busy ||
                !store.detailReady ||
                !store.codForm.received_payment ||
                !store.canConfirmCodPayment(order)
                ">
                {{
                  store.confirmingPayment
                    ? "Đang xác nhận..."
                    : "Xác nhận đã thu"
                }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@reference "../style.css";

.stat-card {
  @apply rounded-2xl border border-border bg-surface p-4 shadow-sm;
}

th {
  @apply bg-bg p-3 text-left text-xs font-bold uppercase text-text-light;
}

td {
  @apply border-b border-border p-3 align-middle text-sm;
}

.muted {
  @apply text-xs leading-5 text-text-light;
}

.detail-card {
  @apply rounded-2xl border border-border p-4;
}

.detail-card h3 {
  @apply mb-3 text-sm font-bold text-text-light;
}

.summary-row {
  @apply flex justify-between gap-4 border-b border-border py-2 text-sm;
}

.notice {
  @apply mb-4 rounded-xl border px-4 py-3 text-sm;
}

.notice.success {
  @apply border-green-200 bg-green-50 text-green-700;
}

.notice.warning {
  @apply border-amber-200 bg-amber-50 text-amber-800;
}

.notice.error {
  @apply border-red-200 bg-red-50 text-red-700;
}

.modal-backdrop {
  @apply fixed inset-0 flex items-center justify-center bg-black/50 p-4;
}

.modal-panel {
  @apply max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-surface shadow-xl;
}

.modal-header {
  @apply sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface p-5;
}

button:disabled {
  @apply cursor-not-allowed opacity-50;
}
</style>