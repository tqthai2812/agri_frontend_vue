import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
import { useAuthStore } from "@/stores/shared/authStore";
import { getPendingAdjustment } from "@/composables/useInventoryAdjustment";

export function useInventoryPage() {
  const store = useInventoryStore();
  const authStore = useAuthStore();
  const adjustmentTarget = ref(null);
  const pendingAdjustment = ref(null);
  const lastAdjustment = ref(null);

  function syncPendingAdjustment() {
    pendingAdjustment.value = getPendingAdjustment(authStore.user?.id);
  }

  watch(
    () => authStore.user?.id,
    () => {
      adjustmentTarget.value = null;
      lastAdjustment.value = null;
      syncPendingAdjustment();
    },
    { immediate: true },
  );

  let searchTimer = null;

  const canCreate = computed(() => authStore.hasPermission("inventory.create"));

  function cancelSearch() {
    clearTimeout(searchTimer);
    searchTimer = null;
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

  async function openPanel(item, mode) {
    syncPendingAdjustment();
    if (mode === "adjustment" && pendingAdjustment.value) {
      resumeAdjustment();
      return;
    }

    await store.openPanel(item, mode);
  }

  function chooseAdjustment(lot) {
    if (!canCreate.value || store.formLocked || store.loadingDetail) return;
    syncPendingAdjustment();
    if (pendingAdjustment.value) {
      resumeAdjustment();
      return;
    }
    const target = {
      package_id: Number(store.selectedPackage.id),
      lot_id: Number(lot.id),
    };
    store.closePanel();
    adjustmentTarget.value = target;
  }

  function resumeAdjustment() {
    if (!canCreate.value || store.formLocked) return;
    syncPendingAdjustment();
    const payload = pendingAdjustment.value?.payload;
    if (!payload) return;
    store.closePanel();
    adjustmentTarget.value = {
      package_id: payload.package_id,
      lot_id: payload.lot_id,
    };
  }

  function closeAdjustment() {
    adjustmentTarget.value = null;
    syncPendingAdjustment();
  }

  async function adjustmentSaved(record) {
    closeAdjustment();
    lastAdjustment.value = record;
    store.message = `Đã ghi sổ điều chỉnh kho. Phiếu #${record.document_id}.`;
    if (!(await store.fetchInventory())) {
      store.errorMsg =
        "Điều chỉnh đã thành công nhưng chưa tải lại được tồn kho. Bấm Tải lại để cập nhật số liệu.";
    }
  }

  async function viewAdjustmentHistory() {
    const id = Number(lastAdjustment.value?.package_id);
    if (id) await openPanel({ id }, "history");
  }

  onMounted(() => {
    void store.loadData();
  });

  onUnmounted(() => {
    cancelSearch();

    // Không xóa payload chưa rõ kết quả khi chuyển trang.
    store.closePanel();
  });
  return {
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
  };
}
