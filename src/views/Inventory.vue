<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted } from "vue";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useInventoryStore();
const authStore = useAuthStore();

let searchTimer = null;
let historyTimer = null;

const canCreate = computed(() =>
  authStore.hasPermission("inventory.create"),
);

const canUpdate = computed(() =>
  authStore.hasPermission("inventory.update"),
);

const title = computed(() => {
  return {
    import: "Nhập kho",
    adjustment: "Điều chỉnh tồn lô",
    initialize: "Khởi tạo lô từ tồn cũ",
    lots: "Danh sách lô",
    edit: "Sửa thông tin lô",
    history: "Lịch sử kho",
  }[store.mode] || "";
});

const writable = computed(() =>
  ["import", "adjustment", "initialize", "edit"].includes(store.mode),
);

const allowedToSave = computed(() => {
  if (["import", "adjustment"].includes(store.mode)) {
    return canCreate.value;
  }

  return canUpdate.value;
});

const visiblePages = computed(() => {
  const pages = [];
  const current = store.meta.current_page;
  const last = store.meta.last_page;

  for (
    let page = Math.max(1, current - 2);
    page <= Math.min(last, current + 2);
    page += 1
  ) {
    pages.push(page);
  }

  return pages;
});

const lotStatuses = [
  { value: "available", label: "Khả dụng" },
  { value: "quarantined", label: "Cách ly" },
  { value: "blocked", label: "Bị khóa" },
];

function quantity(value) {
  return value === null || value === undefined ? "—" : value;
}

function money(value) {
  if (value === null || value === undefined || value === "") {
    return "Chưa rõ";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 4,
  }).format(amount);
}

function dateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("vi-VN");
}

function dateOnly(value) {
  if (!value) {
    return "Không có";
  }

  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");

  return parts.length === 3 ? parts.reverse().join("/") : raw;
}

function statusLabel(status) {
  return (
    lotStatuses.find((item) => item.value === status)?.label ||
    status ||
    "—"
  );
}

function stockBadge(status) {
  return {
    available: "badge-active",
    low: "badge-pending",
    out: "badge-inactive",
  }[status] || "badge-gray";
}

function canInitialize(item) {
  return (
    canUpdate.value &&
    item.lot_count === 0 &&
    item.quantity_available > 0
  );
}

function isLow(item) {
  return (
    item.quantity_available !== null &&
    item.reorder_level !== null &&
    item.quantity_available <= item.reorder_level
  );
}

function cancelSearch() {
  clearTimeout(searchTimer);
  searchTimer = null;
}

function cancelHistorySearch() {
  clearTimeout(historyTimer);
  historyTimer = null;
}

function search() {
  cancelSearch();

  searchTimer = setTimeout(() => {
    store.filters.page = 1;
    void store.fetchInventory();
  }, 350);
}

async function filterChanged() {
  cancelSearch();
  store.filters.page = 1;

  await store.fetchInventory();
}

async function resetFilters() {
  cancelSearch();
  store.resetFilters();

  await store.fetchInventory();
}

async function changePage(page) {
  cancelSearch();

  await store.setPage(page);
}

async function reload() {
  cancelSearch();

  await store.loadData();
}

function searchHistory() {
  cancelHistorySearch();

  historyTimer = setTimeout(() => {
    if (store.mode !== "history") {
      return;
    }

    store.transactionFilters.page = 1;
    void store.fetchTransactions();
  }, 350);
}

async function historyFilterChanged() {
  cancelHistorySearch();
  store.transactionFilters.page = 1;

  await store.fetchTransactions();
}

async function historyPageChanged(page) {
  cancelHistorySearch();

  await store.setTransactionPage(page);
}

function closePanel() {
  cancelHistorySearch();
  store.closePanel();
}

async function openPanel(item, mode) {
  cancelHistorySearch();

  await store.openPanel(item, mode);
}

async function save() {
  if (!allowedToSave.value) {
    return;
  }

  await store.save();
}

async function finishReconciliation() {
  const confirmed = window.confirm(
    "Chỉ đóng sau khi bạn đã kiểm tra lịch sử kho hoặc danh sách lô " +
    "để biết yêu cầu trước đã được ghi nhận hay chưa. " +
    "Bạn xác nhận đã kiểm tra?",
  );

  if (!confirmed) {
    return;
  }

  store.dismissPendingWrite();
  await store.fetchInventory();
}

onMounted(() => {
  void store.loadData();
});

onUnmounted(() => {
  cancelSearch();
  cancelHistorySearch();

  // Không xóa payload chưa rõ kết quả khi chuyển trang.
  store.closePanel();
});
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Hàng tồn kho</h1>
        <p class="text-sm text-text-light">
          Quản lý tồn vật lý, lô hàng và lượng có thể bán theo SKU.
        </p>
      </div>

      <button type="button" class="btn-outline-sm" :disabled="store.loading" @click="reload">
        <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
        Tải lại
      </button>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="stat-card">
        <div class="stat-label">Tổng SKU theo bộ lọc</div>
        <div class="stat-value">{{ store.meta.total }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Còn hàng · trang hiện tại</div>
        <div class="stat-value text-success">
          {{ store.availableItems.length }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sắp hết · trang hiện tại</div>
        <div class="stat-value text-warning">
          {{ store.lowStockItems.length }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Hết tồn · trang hiện tại</div>
        <div class="stat-value text-danger">
          {{ store.outStockItems.length }}
        </div>
      </div>
    </div>

    <p class="mb-4 text-sm text-text-light">
      Trạng thái và bộ lọc tồn kho dựa trên tồn vật lý, với ngưỡng cảnh báo
      riêng của SKU. Lượng có thể bán được tính từ lô hợp lệ trừ hàng đang giữ.
    </p>

    <div v-if="store.message" class="notice-success mb-4" role="status">
      {{ store.message }}
    </div>

    <div v-if="store.errorMsg" class="notice-error mb-4" role="alert">
      {{ store.errorMsg }}
    </div>

    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap gap-3">
        <div class="search-box">
          <Icon icon="solar:magnifer-bold" />
          <input v-model.trim="store.filters.search" class="search-input" placeholder="Tìm sản phẩm, SKU, barcode..."
            aria-label="Tìm tồn kho" @input="search" />
        </div>

        <select v-model="store.filters.category_id" class="filter-select" aria-label="Lọc danh mục"
          :disabled="store.loadingOptions" @change="filterChanged">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in store.categories" :key="category.id" :value="category.id">
            {{ category.name || category.category_name }}
          </option>
        </select>

        <select v-model="store.filters.status" class="filter-select" aria-label="Lọc tồn vật lý"
          @change="filterChanged">
          <option value="">Tất cả tồn vật lý</option>
          <option value="available">Còn hàng</option>
          <option value="low">Sắp hết</option>
          <option value="out">Hết tồn</option>
        </select>

        <button type="button" class="btn-outline-sm" @click="resetFilters">
          Xóa lọc
        </button>
      </div>

      <div v-if="store.loading" class="empty-cell">
        Đang tải tồn kho...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1200px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Sản phẩm / SKU</th>
              <th class="table-th">Danh mục</th>
              <th class="table-th">Quy cách / Giá</th>
              <th class="table-th">Tồn vật lý</th>
              <th class="table-th">Đang giữ</th>
              <th class="table-th">Có thể bán</th>
              <th class="table-th">Lô / Đối soát</th>
              <th class="table-th">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in store.inventory" :key="item.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div
                    class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-bg">
                    <img v-if="item.product?.primary_image" :src="item.product.primary_image"
                      :alt="item.product?.name || 'Sản phẩm'" class="size-full object-cover" />
                    <Icon v-else icon="solar:box-bold-duotone" />
                  </div>

                  <div>
                    <div class="max-w-[240px] truncate font-semibold">
                      {{ item.product?.name || "Không rõ sản phẩm" }}
                    </div>
                    <div class="text-xs text-text-light">
                      {{ item.variant?.name || "—" }}
                    </div>
                    <div class="font-mono text-xs">{{ item.sku }}</div>
                    <div v-if="item.barcode" class="text-xs text-text-light">
                      Barcode: {{ item.barcode }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div>{{ item.category?.name || "—" }}</div>
                <div class="text-xs text-text-light">
                  {{ item.subcategory?.name || "—" }}
                </div>
              </td>

              <td class="table-td">
                <div>{{ item.size }} {{ item.unit }}</div>
                <div class="font-mono text-xs">{{ money(item.price) }}</div>
              </td>

              <td class="table-td">
                <div class="font-mono font-bold" :class="{ 'text-danger': isLow(item) }">
                  {{ quantity(item.quantity_available) }}
                </div>
                <span :class="stockBadge(item.stock_status)">
                  {{ item.stock_status_label || "Chưa xác định" }}
                </span>
                <div class="mt-1 text-xs text-text-light">
                  Ngưỡng: {{ quantity(item.reorder_level) }}
                </div>
              </td>

              <td class="table-td font-mono">
                {{ quantity(item.reserved_quantity) }}
              </td>

              <td class="table-td">
                <strong class="font-mono" :class="{
                  'text-danger': item.available_to_sell === 0,
                  'text-success': item.available_to_sell > 0,
                }">
                  {{ quantity(item.available_to_sell) }}
                </strong>
                <div v-if="item.available_to_sell === null" class="text-xs text-text-light">
                  API chưa trả số liệu
                </div>
              </td>

              <td class="table-td">
                <div>{{ quantity(item.lot_count) }} lô</div>
                <div class="text-xs text-text-light">
                  Tổng tồn lô: {{ quantity(item.lot_quantity) }}
                </div>
                <div v-if="item.stock_consistent === false" class="text-xs text-danger">
                  Tồn SKU không khớp tổng lô
                </div>
              </td>

              <td class="table-td">
                <div class="flex max-w-[280px] flex-wrap gap-2">
                  <button type="button" class="btn-outline-sm" @click="openPanel(item, 'lots')">
                    Xem lô
                  </button>

                  <button v-if="canInitialize(item)" type="button" class="btn-outline-sm text-warning"
                    @click="openPanel(item, 'initialize')">
                    Khởi tạo lô
                  </button>

                  <button v-if="canCreate" type="button" class="btn-outline-sm text-success"
                    :disabled="item.stock_consistent !== true" title="Chỉ nhập khi tồn SKU đã khớp tổng tồn lô"
                    @click="openPanel(item, 'import')">
                    Nhập kho
                  </button>

                  <button v-if="canCreate" type="button" class="btn-outline-sm"
                    :disabled="item.stock_consistent !== true || !item.lot_count"
                    @click="openPanel(item, 'adjustment')">
                    Điều chỉnh
                  </button>

                  <button type="button" class="btn-outline-sm" @click="openPanel(item, 'history')">
                    Lịch sử
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.inventory.length">
              <td colspan="8" class="empty-cell">
                Không có dữ liệu tồn kho.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.inventory.length }} / {{ store.meta.total }} SKU
        </span>

        <div class="flex gap-2">
          <button type="button" class="page-btn" :disabled="store.loading || store.meta.current_page <= 1"
            aria-label="Trang trước" @click="changePage(store.meta.current_page - 1)">
            ‹
          </button>

          <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
            :class="{ active: page === store.meta.current_page }" :disabled="store.loading" @click="changePage(page)">
            {{ page }}
          </button>

          <button type="button" class="page-btn"
            :disabled="store.loading || store.meta.current_page >= store.meta.last_page" aria-label="Trang sau"
            @click="changePage(store.meta.current_page + 1)">
            ›
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="store.mode" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closePanel">
        <section role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title"
          class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-surface" @keydown.esc="closePanel">
          <header
            class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-surface p-5">
            <div>
              <h2 id="inventory-dialog-title" class="text-xl font-bold">
                {{ title }}
              </h2>
              <p class="text-sm text-text-light">
                {{ store.selectedPackage?.product?.name }}
                · {{ store.selectedPackage?.sku }}
              </p>
            </div>

            <button type="button" class="btn-outline-icon" aria-label="Đóng" :disabled="store.formLocked"
              @click="closePanel">
              <Icon icon="solar:close-circle-bold" />
            </button>
          </header>

          <div class="space-y-5 p-5">
            <div v-if="store.dialogError" class="notice-error" role="alert">
              {{ store.dialogError }}
              <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
                <li v-for="(error, field) in store.errors" :key="field">
                  {{ error }}
                </li>
              </ul>
            </div>

            <div v-if="store.pendingWrite && !store.saving" class="notice-warning">
              <p>
                Yêu cầu trước chưa được xác nhận thành công. Nội dung đang được
                giữ nguyên; thử lại sẽ dùng đúng payload và mã giao dịch cũ.
                Nếu API báo đã tồn tại, hãy đối chiếu lịch sử/lô ở tab khác
                trước khi đóng.
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-outline-sm" :disabled="!allowedToSave" @click="save">
                  Thử lại yêu cầu cũ
                </button>

                <button type="button" class="btn-outline-sm" @click="finishReconciliation">
                  Đã đối chiếu, đóng
                </button>
              </div>
            </div>

            <div v-if="store.loadingDetail" class="empty-cell">
              Đang tải chi tiết...
            </div>

            <template v-else>
              <div class="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg p-4 sm:grid-cols-4">
                <div>
                  <p class="text-xs text-text-light">Tồn vật lý</p>
                  <strong>{{ quantity(store.selectedPackage?.quantity_available) }}</strong>
                </div>
                <div>
                  <p class="text-xs text-text-light">Tổng tồn lô</p>
                  <strong>{{ quantity(store.selectedPackage?.lot_quantity) }}</strong>
                </div>
                <div>
                  <p class="text-xs text-text-light">Đang giữ</p>
                  <strong>{{ quantity(store.selectedPackage?.reserved_quantity) }}</strong>
                </div>
                <div>
                  <p class="text-xs text-text-light">Có thể bán</p>
                  <strong>{{ quantity(store.selectedPackage?.available_to_sell) }}</strong>
                </div>
              </div>

              <!-- Danh sách lô / chọn lô điều chỉnh -->
              <div v-if="['lots', 'adjustment'].includes(store.mode)">
                <p v-if="store.mode === 'adjustment'" class="mb-3 text-sm">
                  Chọn đúng lô cần điều chỉnh. Có thể chuyển trang để tìm lô.
                </p>

                <div v-if="store.loadingLots" class="empty-cell">
                  Đang tải lô...
                </div>

                <div v-else class="overflow-x-auto">
                  <table class="w-full min-w-[800px]">
                    <thead class="bg-bg">
                      <tr>
                        <th class="table-th">Lô</th>
                        <th class="table-th">Tồn lô</th>
                        <th class="table-th">Giá vốn</th>
                        <th class="table-th">Hạn dùng</th>
                        <th class="table-th">Trạng thái</th>
                        <th class="table-th">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="lot in store.lots" :key="lot.id" class="table-row">
                        <td class="table-td">
                          <strong>{{ lot.lot_code }}</strong>
                          <div class="text-xs text-text-light">ID: {{ lot.id }}</div>
                          <div class="text-xs text-text-light">
                            Nhập: {{ dateTime(lot.received_at) }}
                          </div>
                        </td>
                        <td class="table-td">{{ lot.quantity_on_hand }}</td>
                        <td class="table-td">{{ money(lot.unit_cost) }}</td>
                        <td class="table-td">{{ dateOnly(lot.expires_on) }}</td>
                        <td class="table-td">{{ statusLabel(lot.status) }}</td>
                        <td class="table-td">
                          <button v-if="store.mode === 'adjustment'" type="button" class="btn-outline-sm"
                            :disabled="store.formLocked" @click="store.selectAdjustmentLot(lot)">
                            {{ Number(store.form.lot_id) === Number(lot.id) ? "Đã chọn" : "Chọn lô" }}
                          </button>

                          <button v-else-if="canUpdate" type="button" class="btn-outline-sm"
                            @click="store.editLot(lot)">
                            Sửa thông tin
                          </button>
                        </td>
                      </tr>

                      <tr v-if="!store.lots.length">
                        <td colspan="6" class="empty-cell">Chưa có lô hàng.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="mt-3 flex items-center justify-end gap-3">
                  <span class="text-xs text-text-light">
                    Trang {{ store.lotMeta.current_page }} / {{ store.lotMeta.last_page }}
                  </span>
                  <button type="button" class="page-btn"
                    :disabled="store.loadingLots || store.formLocked || store.lotMeta.current_page <= 1"
                    @click="store.fetchLots(store.lotMeta.current_page - 1)">
                    ‹
                  </button>
                  <button type="button" class="page-btn"
                    :disabled="store.loadingLots || store.formLocked || store.lotMeta.current_page >= store.lotMeta.last_page"
                    @click="store.fetchLots(store.lotMeta.current_page + 1)">
                    ›
                  </button>
                </div>

                <p class="mt-3 text-xs text-text-light">
                  “Khả dụng” không đồng nghĩa còn bán được: lô hết hạn vẫn bị
                  loại khỏi lượng có thể bán.
                </p>
              </div>

              <!-- Form ghi dữ liệu -->
              <form v-if="writable" @submit.prevent="save">
                <fieldset :disabled="store.formLocked" class="space-y-5">
                  <!-- Nhập kho -->
                  <template v-if="store.mode === 'import'">
                    <div class="notice-warning">
                      Thao tác này ghi sổ nhập kho ngay, không lưu phiếu nháp.
                      Mỗi lần nhập tạo một lô mới.
                    </div>

                    <div class="field-grid">
                      <label class="field">
                        <span>Nhà cung cấp *</span>
                        <select v-model="store.form.supplier_id" class="form-control" required
                          :disabled="store.loadingSuppliers">
                          <option value="">
                            {{ store.loadingSuppliers ? "Đang tải..." : "Chọn nhà cung cấp" }}
                          </option>
                          <option v-for="supplier in store.suppliers" :key="supplier.id" :value="supplier.id">
                            {{ supplier.supplier_code }} · {{ supplier.name }}
                          </option>
                        </select>
                      </label>

                      <label class="field">
                        <span>Mã lô *</span>
                        <input v-model.trim="store.form.lot_code" class="form-control" maxlength="100" required />
                      </label>

                      <label class="field">
                        <span>Số lượng nhập *</span>
                        <input v-model="store.form.quantity_change" type="number" min="1" max="2147483647" step="1"
                          class="form-control" required />
                      </label>

                      <label class="field">
                        <span>Giá vốn / một đơn vị SKU *</span>
                        <input v-model="store.form.unit_cost" type="number" min="0" max="9999999999.99" step="0.01"
                          class="form-control" required />
                      </label>

                      <label class="field">
                        <span>Ngày sản xuất</span>
                        <input v-model="store.form.manufactured_on" type="date" class="form-control" />
                      </label>

                      <label class="field">
                        <span>Hạn sử dụng</span>
                        <input v-model="store.form.expires_on" type="date"
                          :min="store.form.manufactured_on || undefined" class="form-control" />
                      </label>

                      <label class="field">
                        <span>Trạng thái lô *</span>
                        <select v-model="store.form.lot_status" class="form-control">
                          <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                            {{ status.label }}
                          </option>
                        </select>
                      </label>
                    </div>

                    <p v-if="!store.loadingSuppliers && !store.suppliers.length" class="text-sm text-warning">
                      Chưa tải được nhà cung cấp đang hoạt động hoặc chưa có
                      nhà cung cấp. Cần tạo/kích hoạt nhà cung cấp trước khi nhập.
                    </p>
                  </template>

                  <!-- Điều chỉnh -->
                  <template v-if="store.mode === 'adjustment'">
                    <div class="notice-warning">
                      Điều chỉnh thay đổi tồn của lô đã chọn và tồn vật lý SKU.
                      Không dùng để xuất bán. Điều chỉnh giảm cần giá vốn đã biết
                      và danh mục chi phí hợp lệ theo API hiện tại.
                    </div>

                    <p class="text-sm">
                      Lô đã chọn:
                      <strong>
                        {{ store.selectedLot?.lot_code || "Chưa chọn" }}
                      </strong>
                      <span v-if="store.selectedLot">
                        · ID {{ store.selectedLot.id }}
                        · Tồn {{ store.selectedLot.quantity_on_hand }}
                      </span>
                    </p>

                    <div class="field-grid">
                      <label class="field">
                        <span>Số lượng thay đổi *</span>
                        <input v-model="store.form.quantity_change" type="number" min="-2147483647" max="2147483647"
                          step="1" placeholder="Ví dụ: -3 hoặc 10" class="form-control" required />
                        <small class="text-text-light">
                          Dương để tăng, âm để giảm; không được bằng 0.
                        </small>
                      </label>

                      <label v-if="Number(store.form.quantity_change) < 0" class="field">
                        <span>ID danh mục chi phí *</span>
                        <input v-model="store.form.expense_category_id" type="number" min="1" step="1"
                          class="form-control" required />
                        <small class="text-text-light">
                          Nhập ID có thật trong expense_categories, đang hoạt động.
                          Chưa tích hợp danh sách chọn vì chưa có API này.
                        </small>
                      </label>
                    </div>
                  </template>

                  <label v-if="['import', 'adjustment'].includes(store.mode)" class="field">
                    <span>
                      Ghi chú {{ store.mode === "adjustment" ? "*" : "" }}
                    </span>
                    <textarea v-model.trim="store.form.note" class="form-control" rows="3" maxlength="1000"
                      :required="store.mode === 'adjustment'" placeholder="Ghi rõ lý do nghiệp vụ..."></textarea>
                  </label>

                  <!-- Khởi tạo tồn cũ -->
                  <template v-if="store.mode === 'initialize'">
                    <div class="notice-warning">
                      Chỉ phân bổ tồn vật lý cũ vào các lô, không nhập thêm hàng.
                      Tổng số lượng các lô phải đúng bằng tồn hiện tại.
                      Backend sẽ từ chối nếu đã có lô hoặc còn nghiệp vụ cũ
                      chưa được đối soát.
                    </div>

                    <label class="field">
                      <span>Lý do / ghi chú chuyển đổi *</span>
                      <textarea v-model.trim="store.initialization.note" class="form-control" rows="3" maxlength="1000"
                        required></textarea>
                    </label>

                    <article v-for="(lot, index) in store.initialization.lots" :key="index"
                      class="space-y-4 rounded-xl border border-border p-4">
                      <div class="flex items-center justify-between">
                        <h3 class="font-semibold">Lô {{ index + 1 }}</h3>
                        <button type="button" class="btn-outline-sm text-danger"
                          :disabled="store.initialization.lots.length <= 1"
                          @click="store.removeInitializationLot(index)">
                          Bỏ dòng
                        </button>
                      </div>

                      <div class="field-grid">
                        <label class="field">
                          <span>Mã lô *</span>
                          <input v-model.trim="lot.lot_code" class="form-control" maxlength="100" required />
                        </label>

                        <label class="field">
                          <span>Số lượng *</span>
                          <input v-model="lot.quantity_on_hand" type="number" min="1" max="2147483647" step="1"
                            class="form-control" required />
                        </label>

                        <label class="field">
                          <span>Thời điểm nhập *</span>
                          <input v-model="lot.received_at" type="datetime-local" step="1" class="form-control"
                            required />
                        </label>

                        <label class="field">
                          <span>Giá vốn / đơn vị SKU</span>
                          <input v-model="lot.unit_cost" type="number" min="0" max="9999999999.99" step="0.01"
                            class="form-control" placeholder="Không biết thì để trống" />
                          <small class="text-text-light">
                            Để trống là chưa rõ giá vốn, không phải 0 đồng.
                          </small>
                        </label>

                        <label class="field">
                          <span>Ngày sản xuất</span>
                          <input v-model="lot.manufactured_on" type="date" class="form-control" />
                        </label>

                        <label class="field">
                          <span>Hạn sử dụng</span>
                          <input v-model="lot.expires_on" type="date" :min="lot.manufactured_on || undefined"
                            class="form-control" />
                        </label>

                        <label class="field">
                          <span>Trạng thái *</span>
                          <select v-model="lot.status" class="form-control">
                            <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                              {{ status.label }}
                            </option>
                          </select>
                        </label>
                      </div>
                    </article>

                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <button type="button" class="btn-outline-sm" :disabled="store.initialization.lots.length >= 100"
                        @click="store.addInitializationLot">
                        Thêm lô
                      </button>

                      <strong :class="store.initializedQuantity === store.selectedPackage?.quantity_available
                        ? 'text-success'
                        : 'text-danger'">
                        Đã phân bổ {{ store.initializedQuantity }}
                        / {{ quantity(store.selectedPackage?.quantity_available) }}
                      </strong>
                    </div>
                  </template>

                  <!-- Sửa metadata lô -->
                  <template v-if="store.mode === 'edit'">
                    <div class="notice-warning">
                      Chỉ sửa thông tin lô. Không sửa trực tiếp số lượng, giá vốn,
                      nhà cung cấp hoặc liên kết phiếu nhập.
                      Khóa lô hoặc đổi hạn dùng có thể ảnh hưởng lượng có thể bán;
                      backend kiểm tra hàng đang giữ trước khi chấp nhận.
                    </div>

                    <div class="field-grid">
                      <label class="field">
                        <span>Mã lô *</span>
                        <input v-model.trim="store.lotForm.lot_code" maxlength="100" class="form-control" required />
                      </label>

                      <label class="field">
                        <span>Trạng thái *</span>
                        <select v-model="store.lotForm.status" class="form-control">
                          <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                            {{ status.label }}
                          </option>
                        </select>
                      </label>

                      <label class="field">
                        <span>Ngày sản xuất</span>
                        <input v-model="store.lotForm.manufactured_on" type="date" class="form-control" />
                      </label>

                      <label class="field">
                        <span>Hạn sử dụng</span>
                        <input v-model="store.lotForm.expires_on" type="date"
                          :min="store.lotForm.manufactured_on || undefined" class="form-control" />
                      </label>
                    </div>

                    <label class="field">
                      <span>Ghi chú</span>
                      <textarea v-model.trim="store.lotForm.note" rows="3" maxlength="1000"
                        class="form-control"></textarea>
                    </label>
                  </template>
                </fieldset>

                <div class="mt-5 flex justify-end gap-3 border-t border-border pt-4">
                  <button v-if="store.mode === 'edit'" type="button" class="btn-outline" :disabled="store.formLocked"
                    @click="store.backToLots">
                    Quay lại
                  </button>

                  <button v-else type="button" class="btn-outline" :disabled="store.formLocked" @click="closePanel">
                    Hủy
                  </button>

                  <button type="submit" class="btn-primary" :disabled="!allowedToSave ||
                    store.formLocked ||
                    store.loadingSuppliers ||
                    (store.mode === 'adjustment' && !store.form.lot_id)
                    ">
                    {{ store.saving ? "Đang lưu..." : "Lưu" }}
                  </button>
                </div>
              </form>

              <!-- Lịch sử chỉ đọc -->
              <div v-if="store.mode === 'history'">
                <p class="mb-4 text-sm text-text-light">
                  Lịch sử đã ghi sổ không được sửa hoặc xóa.
                  Sai số được xử lý bằng giao dịch điều chỉnh mới có lý do.
                </p>

                <div class="mb-4 flex flex-wrap gap-3">
                  <input v-model.trim="store.transactionFilters.search" class="form-control flex-1"
                    placeholder="Tìm ghi chú, SKU..." aria-label="Tìm lịch sử" @input="searchHistory" />

                  <select v-model="store.transactionFilters.transaction_type" class="filter-select"
                    aria-label="Loại giao dịch" @change="historyFilterChanged">
                    <option value="">Tất cả giao dịch</option>
                    <option value="import">Nhập kho</option>
                    <option value="export">Xuất kho</option>
                    <option value="adjustment">Điều chỉnh</option>
                    <option value="opening_balance">Tồn đầu kỳ</option>
                  </select>
                </div>

                <div v-if="store.loadingTransactions" class="empty-cell">
                  Đang tải lịch sử...
                </div>

                <div v-else class="overflow-x-auto">
                  <table class="w-full min-w-[850px]">
                    <thead class="bg-bg">
                      <tr>
                        <th class="table-th">Loại / ID</th>
                        <th class="table-th">Thay đổi</th>
                        <th class="table-th">Trước → Sau</th>
                        <th class="table-th">Ghi chú</th>
                        <th class="table-th">Người thực hiện</th>
                        <th class="table-th">Thời điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="transaction in store.transactions" :key="transaction.id" class="table-row">
                        <td class="table-td">
                          <div>
                            {{ transaction.transaction_type_label || transaction.transaction_type }}
                          </div>
                          <div class="text-xs text-text-light">
                            #{{ transaction.id }}
                          </div>
                        </td>

                        <td class="table-td font-mono font-bold" :class="Number(transaction.quantity_change) > 0
                          ? 'text-success'
                          : 'text-danger'">
                          {{ Number(transaction.quantity_change) > 0 ? "+" : "" }}{{ transaction.quantity_change }}
                        </td>

                        <td class="table-td font-mono">
                          {{ quantity(transaction.quantity_before) }}
                          →
                          {{ quantity(transaction.quantity_after) }}
                        </td>

                        <td class="table-td max-w-[260px] whitespace-pre-line break-words">
                          {{ transaction.note || "—" }}
                        </td>

                        <td class="table-td">
                          {{ transaction.performer?.name || "Không rõ" }}
                        </td>

                        <td class="table-td">
                          {{ dateTime(transaction.occurred_at || transaction.created_at) }}
                          <div v-if="!transaction.occurred_at" class="text-xs text-text-light">
                            Thời gian tạo bản ghi
                          </div>
                        </td>
                      </tr>

                      <tr v-if="!store.transactions.length">
                        <td colspan="6" class="empty-cell">
                          Chưa có lịch sử phù hợp.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="mt-4 flex items-center justify-end gap-3">
                  <span class="text-sm text-text-light">
                    Trang {{ store.transactionMeta.current_page }}
                    / {{ store.transactionMeta.last_page }}
                  </span>

                  <button type="button" class="page-btn"
                    :disabled="store.loadingTransactions || store.transactionMeta.current_page <= 1"
                    @click="historyPageChanged(store.transactionMeta.current_page - 1)">
                    ‹
                  </button>

                  <button type="button" class="page-btn"
                    :disabled="store.loadingTransactions || store.transactionMeta.current_page >= store.transactionMeta.last_page"
                    @click="historyPageChanged(store.transactionMeta.current_page + 1)">
                    ›
                  </button>
                </div>
              </div>
            </template>
          </div>
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

.stat-label {
  @apply text-xs font-medium text-text-light;
}

.stat-value {
  @apply mt-1 font-mono text-2xl font-bold;
}

.search-box {
  @apply flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2;
}

.search-input {
  @apply w-full bg-transparent text-sm outline-none;
}

.table-th {
  @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
  @apply p-3 align-middle text-sm;
}

.table-row {
  @apply border-b border-border transition hover:bg-primary/5;
}

.empty-cell {
  @apply p-8 text-center text-sm text-text-light;
}

.field-grid {
  @apply grid gap-4 sm:grid-cols-2;
}

.field {
  @apply flex flex-col gap-2 text-sm;
}

.notice-error {
  @apply rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700;
}

.notice-success {
  @apply rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700;
}

.notice-warning {
  @apply rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900;
}

button:disabled {
  @apply cursor-not-allowed opacity-50;
}
</style>