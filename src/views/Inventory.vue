<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { useInventoryPage } from "@/composables/useInventoryPage";
import InventoryTable from "@/components/admin/inventory/InventoryTable.vue";
import InventoryPanel from "@/components/admin/inventory/InventoryPanel.vue";
import InventoryAdjustmentDialog from "@/components/admin/inventory/InventoryAdjustmentDialog.vue";
import "@/components/admin/inventory/inventory.css";
const {
  store,
  authStore,
  canCreate,
  adjustmentTarget,
  pendingAdjustment,
  lastAdjustment,
  search,
  filterChanged,
  resetFilters,
  changePage,
  reload,
  openPanel,
  chooseAdjustment,
  resumeAdjustment,
  closeAdjustment,
  adjustmentSaved,
  syncPendingAdjustment,
  viewAdjustmentHistory,
} = useInventoryPage();
</script>

<template>
  <div class="inventory-page product-admin">
    <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Hàng tồn kho</h1>
        <p class="text-sm text-text-light">
          Quản lý tồn vật lý, lô hàng và lượng có thể bán theo SKU.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <RouterLink :to="{ name: 'admin-inventory-documents' }" class="btn-outline-sm cursor-pointer">
          <Icon icon="solar:clipboard-list-bold-duotone" />
          Phiếu kho
        </RouterLink>
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.loading" @click="reload">
          <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
          Tải lại
        </button>
      </div>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="stat-card border-l-4 border-l-info">
        <div class="stat-label">Tổng SKU theo bộ lọc</div>
        <div class="stat-value">{{ store.meta.total }}</div>
      </div>

      <div class="stat-card border-l-4 border-l-success">
        <div class="stat-label">Còn hàng · trang hiện tại</div>
        <div class="stat-value text-success">
          {{ store.availableItems.length }}
        </div>
      </div>

      <div class="stat-card border-l-4 border-l-warning">
        <div class="stat-label">Sắp hết · trang hiện tại</div>
        <div class="stat-value text-warning">
          {{ store.lowStockItems.length }}
        </div>
      </div>

      <div class="stat-card border-l-4 border-l-danger">
        <div class="stat-label">Hết tồn · trang hiện tại</div>
        <div class="stat-value text-danger">
          {{ store.outStockItems.length }}
        </div>
      </div>
    </div>


    <div v-if="store.message" class="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4" role="status">
      {{ store.message }}
      <button v-if="lastAdjustment" type="button" class="btn-outline-sm ml-3 cursor-pointer disabled:cursor-not-allowed" @click="viewAdjustmentHistory">
        Xem lịch sử điều chỉnh
      </button>
    </div>

    <div v-if="pendingAdjustment && canCreate" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4" role="status">
      <p>
        Một điều chỉnh kho chưa xác định kết quả: {{ pendingAdjustment.sku }} ·
        lô {{ pendingAdjustment.lot_code }}.
      </p>
      <button type="button" class="btn-outline-sm mt-3 cursor-pointer disabled:cursor-not-allowed" :disabled="store.formLocked" @click="resumeAdjustment">
        Kiểm tra thao tác đang lưu
      </button>
    </div>

    <div v-if="store.errorMsg" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4" role="alert">
      {{ store.errorMsg }}
    </div>

    <InventoryTable @search="search" @filter-change="filterChanged" @reset-filters="resetFilters"
      @change-page="changePage" @open-panel="openPanel" />

    <InventoryPanel v-if="store.mode" @adjust="chooseAdjustment" />
    <InventoryAdjustmentDialog v-if="adjustmentTarget"
      :key="`${authStore.user?.id}:${adjustmentTarget.package_id}:${adjustmentTarget.lot_id}`"
      :target="adjustmentTarget" @close="closeAdjustment" @saved="adjustmentSaved"
      @pending-change="syncPendingAdjustment" />
  </div>
</template>