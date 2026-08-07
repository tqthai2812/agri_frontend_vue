<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Hàng tồn kho</h1>
        <p class="text-text-light text-sm">
          Quản lý tồn kho theo từng SKU, quy cách và biến thể sản phẩm.
        </p>
      </div>

      <button class="btn-outline-sm" @click="handleReload">
        <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
        Tải lại
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="stat-card-info">
        <div class="stat-label">Tổng SKU</div>
        <div class="stat-value text-info">{{ store.meta.total }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Còn hàng</div>
        <div class="stat-value text-success">{{ store.availableItems.length }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Sắp hết</div>
        <div class="stat-value">{{ store.lowStockItems.length }}</div>
      </div>

      <div class="stat-card-danger">
        <div class="stat-label">Hết hàng</div>
        <div class="stat-value text-danger">{{ store.outStockItems.length }}</div>
      </div>
    </div>

    <!-- Message -->
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

          <input v-model.trim="store.filters.search" type="text" placeholder="Tìm sản phẩm, SKU, barcode..."
            class="search-input" @input="handleSearch" />
        </div>

        <select v-model="store.filters.category_id" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in store.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>

        <select v-model="store.filters.status" class="filter-select flex-1 sm:flex-none" @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="available">Còn hàng</option>
          <option value="low">Sắp hết</option>
          <option value="out">Hết hàng</option>
        </select>

        <button class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải tồn kho...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1150px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Sản phẩm</th>
              <th class="table-th">SKU</th>
              <th class="table-th">Danh mục</th>
              <th class="table-th">Quy cách</th>
              <th class="table-th">Giá</th>
              <th class="table-th">Tồn kho</th>
              <th class="table-th">Trạng thái</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in store.inventory" :key="item.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-xl overflow-hidden bg-bg border border-border shrink-0 flex items-center justify-center">
                    <img v-if="item.product?.primary_image" :src="item.product.primary_image" :alt="item.product?.name"
                      class="w-full h-full object-cover" />

                    <Icon v-else icon="solar:box-bold-duotone" class="text-2xl text-text-light" />
                  </div>

                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate max-w-[280px]">
                      {{ item.product?.name || "Không rõ sản phẩm" }}
                    </div>

                    <div class="text-xs text-text-light">
                      Biến thể: {{ item.variant?.name || "Không rõ" }}
                    </div>

                    <div class="text-xs text-text-light">
                      Package ID: {{ item.id }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div class="space-y-1">
                  <span class="badge-gray">{{ item.sku }}</span>

                  <div v-if="item.barcode" class="text-xs text-text-light">
                    Barcode: {{ item.barcode }}
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div class="space-y-1">
                  <div class="text-sm">
                    {{ item.category?.name || "Chưa có" }}
                  </div>

                  <div class="text-xs text-text-light">
                    {{ item.subcategory?.name || "Chưa có danh mục con" }}
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div class="font-mono text-sm">
                  {{ item.size }} {{ item.unit }}
                </div>
              </td>

              <td class="table-td font-mono text-sm">
                {{ formatVND(item.price) }}
              </td>

              <td class="table-td font-mono font-bold"
                :class="Number(item.quantity_available || 0) <= 5 ? 'text-danger' : ''">
                {{ item.quantity_available }}
              </td>

              <td class="table-td">
                <span :class="stockBadgeClass(item.stock_status)">
                  {{ item.stock_status_label }}
                </span>
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button v-if="authStore.hasPermission('inventory.create')" class="btn-outline-icon text-success"
                    title="Nhập kho" @click="store.openTransactionModal(item, 'import')">
                    <Icon icon="solar:add-square-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('inventory.create')" class="btn-outline-icon text-warning"
                    title="Xuất kho" @click="store.openTransactionModal(item, 'export')">
                    <Icon icon="solar:minus-square-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('inventory.create')" class="btn-outline-icon"
                    title="Điều chỉnh kho" @click="store.openTransactionModal(item, 'adjustment')">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button class="btn-outline-icon text-info" title="Lịch sử kho" @click="store.openHistoryModal(item)">
                    <Icon icon="solar:history-bold" />
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

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.inventory.length }} / {{ store.meta.total }} SKU
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

    <!-- Transaction Modal -->
    <div v-if="store.showTransactionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="store.closeTransactionModal">
      <div class="bg-surface rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">{{ transactionTitle }}</h2>
            <p class="text-sm text-text-light">
              {{ store.selectedPackage?.product?.name }} - {{ store.selectedPackage?.sku }}
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeTransactionModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <form class="p-6 space-y-5" @submit.prevent="handleSaveTransaction">
          <div v-if="store.errorMsg"
            class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
          </div>

          <div class="rounded-2xl border border-border p-4 bg-bg/40">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-text-light">Tồn kho hiện tại</div>
                <div class="text-2xl font-bold font-mono">
                  {{ store.selectedPackage?.quantity_available || 0 }}
                </div>
              </div>

              <div>
                <div class="text-xs text-text-light">Quy cách</div>
                <div class="text-lg font-bold font-mono">
                  {{ store.selectedPackage?.size }} {{ store.selectedPackage?.unit }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Loại giao dịch <span class="text-primary">*</span>
            </label>

            <select v-model="store.form.transaction_type" class="form-control">
              <option value="import">Nhập kho</option>
              <option value="export">Xuất kho</option>
              <option value="adjustment">Điều chỉnh</option>
            </select>

            <p v-if="store.fieldError('transaction_type')" class="error-text">
              {{ store.fieldError("transaction_type") }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Số lượng thay đổi <span class="text-primary">*</span>
            </label>

            <input v-model="store.form.quantity_change" type="number" step="1" class="form-control"
              :placeholder="quantityPlaceholder" />

            <p class="text-xs text-text-light mt-1">
              Với nhập kho và xuất kho, bạn nhập số dương. Backend sẽ tự xử lý xuất kho thành số âm.
              Với điều chỉnh, có thể nhập số âm hoặc dương.
            </p>

            <p v-if="store.fieldError('quantity_change')" class="error-text">
              {{ store.fieldError("quantity_change") }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Ghi chú</label>

            <textarea v-model.trim="store.form.note" class="form-control" rows="4"
              placeholder="Nhập ghi chú giao dịch kho..."></textarea>

            <p v-if="store.fieldError('note')" class="error-text">
              {{ store.fieldError("note") }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button type="button" class="btn-outline" @click="store.closeTransactionModal">
              Hủy
            </button>

            <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="store.saving">
              <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                :class="store.saving ? 'animate-spin' : ''" />

              {{ store.saving ? "Đang lưu..." : "Lưu giao dịch" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="store.showHistoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="store.closeHistoryModal">
      <div class="bg-surface rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">Lịch sử kho</h2>
            <p class="text-sm text-text-light">
              {{ store.selectedPackage?.product?.name }} - {{ store.selectedPackage?.sku }}
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeHistoryModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <div class="p-6">
          <div class="flex flex-col sm:flex-row gap-3 mb-5">
            <div class="search-box">
              <Icon icon="solar:magnifer-bold" class="text-text-light" />

              <input v-model.trim="store.transactionFilters.search" type="text"
                placeholder="Tìm ghi chú, SKU, sản phẩm..." class="search-input" @input="handleTransactionSearch" />
            </div>

            <select v-model="store.transactionFilters.transaction_type" class="filter-select"
              @change="handleTransactionFilterChange">
              <option value="">Tất cả giao dịch</option>
              <option value="import">Nhập kho</option>
              <option value="export">Xuất kho</option>
              <option value="adjustment">Điều chỉnh</option>
            </select>
          </div>

          <div v-if="store.loadingTransactions" class="py-8 text-center text-text-light">
            <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
            <p class="text-sm">Đang tải lịch sử kho...</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[760px]">
              <thead class="bg-bg">
                <tr>
                  <th class="table-th">Loại</th>
                  <th class="table-th">Số lượng</th>
                  <th class="table-th">Ghi chú</th>
                  <th class="table-th">Người thực hiện</th>
                  <th class="table-th">Thời gian</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="transaction in store.transactions" :key="transaction.id" class="table-row">
                  <td class="table-td">
                    <span :class="transactionBadgeClass(transaction.transaction_type)">
                      {{ transaction.transaction_type_label }}
                    </span>
                  </td>

                  <td class="table-td font-mono font-bold"
                    :class="Number(transaction.quantity_change) >= 0 ? 'text-success' : 'text-danger'">
                    {{ Number(transaction.quantity_change) > 0 ? "+" : "" }}{{ transaction.quantity_change }}
                  </td>

                  <td class="table-td text-sm">
                    {{ transaction.note || "Không có ghi chú" }}
                  </td>

                  <td class="table-td text-sm">
                    <div>{{ transaction.performer?.name || "Không rõ" }}</div>
                    <div class="text-xs text-text-light">
                      {{ transaction.performer?.email || "" }}
                    </div>
                  </td>

                  <td class="table-td text-sm text-text-light">
                    {{ formatDateTime(transaction.created_at) }}
                  </td>
                </tr>

                <tr v-if="!store.transactions.length">
                  <td colspan="5" class="empty-cell">
                    Chưa có lịch sử kho.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-2 mt-5">
            <button class="page-btn" :disabled="store.transactionMeta.current_page <= 1"
              @click="handleTransactionPageChange(store.transactionMeta.current_page - 1)">
              <Icon icon="solar:arrow-left-bold" />
            </button>

            <button class="page-btn" :disabled="store.transactionMeta.current_page >= store.transactionMeta.last_page"
              @click="handleTransactionPageChange(store.transactionMeta.current_page + 1)">
              <Icon icon="solar:arrow-right-bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted } from "vue";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";

const store = useInventoryStore();
const authStore = useAuthStore();

let searchTimer = null;
let transactionSearchTimer = null;

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

const transactionTitle = computed(() => {
  if (store.form.transaction_type === "import") {
    return "Nhập kho";
  }

  if (store.form.transaction_type === "export") {
    return "Xuất kho";
  }

  return "Điều chỉnh kho";
});

const quantityPlaceholder = computed(() => {
  if (store.form.transaction_type === "import") {
    return "Ví dụ: 20";
  }

  if (store.form.transaction_type === "export") {
    return "Ví dụ: 5";
  }

  return "Ví dụ: -3 hoặc 10";
});

function formatVND(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function stockBadgeClass(status) {
  if (status === "available") {
    return "badge-active";
  }

  if (status === "low") {
    return "badge-pending";
  }

  return "badge-inactive";
}

function transactionBadgeClass(type) {
  if (type === "import") {
    return "badge-active";
  }

  if (type === "export") {
    return "badge-inactive";
  }

  return "badge-pending";
}

async function handleReload() {
  await store.loadData();
}

function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(async () => {
    store.filters.page = 1;
    await store.fetchInventory();
  }, 350);
}

async function handleFilterChange() {
  store.filters.page = 1;
  await store.fetchInventory();
}

async function handleResetFilters() {
  store.resetFilters();
  await store.fetchInventory();
}

async function handlePageChange(page) {
  if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
    return;
  }

  store.setPage(page);
}

async function handleSaveTransaction() {
  await store.saveTransaction();
}

function handleTransactionSearch() {
  if (transactionSearchTimer) {
    clearTimeout(transactionSearchTimer);
  }

  transactionSearchTimer = setTimeout(async () => {
    store.transactionFilters.page = 1;
    await store.fetchTransactions();
  }, 350);
}

async function handleTransactionFilterChange() {
  store.transactionFilters.page = 1;
  await store.fetchTransactions();
}

async function handleTransactionPageChange(page) {
  if (
    page < 1 ||
    page > store.transactionMeta.last_page ||
    page === store.transactionMeta.current_page
  ) {
    return;
  }

  store.setTransactionPage(page);
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
</style>