<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";
import { useAuthStore } from "@/stores/shared/authStore";

import SupplierFilters from "@/components/admin/suppliers/SupplierFilters.vue";
import SupplierTable from "@/components/admin/suppliers/SupplierTable.vue";
import SupplierPagination from "@/components/admin/suppliers/SupplierPagination.vue";
import SupplierModal from "@/components/admin/suppliers/SupplierModal.vue";

const store = useSupplierStore();
const authStore = useAuthStore();

let searchTimer = null;
let productTimer = null;

const canCreate = computed(() =>
    authStore.hasPermission("inventory.create"),
);

const canUpdate = computed(() =>
    authStore.hasPermission("inventory.update"),
);

const canViewProducts = computed(() =>
    authStore.hasPermission("product.view"),
);

const canManageProducts = computed(() =>
    !store.readOnly &&
    canViewProducts.value &&
    store.productsLoaded &&
    store.detailReady,
);

const canSave = computed(() =>
    store.mode === "create"
        ? canCreate.value
        : store.mode === "edit" && canUpdate.value,
);

const modalTitle = computed(() => {
    return {
        create: "Thêm nhà cung cấp",
        edit: "Sửa nhà cung cấp",
        view: "Chi tiết nhà cung cấp",
    }[store.mode] || "";
});

function clearSearchTimer() {
    clearTimeout(searchTimer);
    searchTimer = null;
}

function clearProductTimer() {
    clearTimeout(productTimer);
    productTimer = null;
}

function handleSearch() {
    clearSearchTimer();

    searchTimer = setTimeout(() => {
        store.filters.page = 1;
        void store.fetchSuppliers();
    }, 350);
}

async function handleFilterChange() {
    clearSearchTimer();
    store.filters.page = 1;

    await store.fetchSuppliers();
}

async function handleResetFilters() {
    clearSearchTimer();
    store.resetFilters();

    await store.fetchSuppliers();
}

async function handlePageChange(page) {
    clearSearchTimer();

    await store.setPage(page);
}

async function handleReload() {
    clearSearchTimer();

    await store.fetchSuppliers();
}

function openCreate() {
    clearProductTimer();
    store.openCreate();
}

async function openDetail(supplier, mode = "view") {
    clearProductTimer();

    await store.openDetail(supplier, mode);
}

function closeModal() {
    clearProductTimer();
    store.closeDialog();
}

function handleProductSearch() {
    clearProductTimer();
    store.invalidateProductSearch();

    productTimer = setTimeout(() => {
        if (canManageProducts.value) {
            void store.searchProducts(1);
        }
    }, 350);
}

async function loadProducts(page = 1) {
    clearProductTimer();

    if (canManageProducts.value) {
        await store.searchProducts(page);
    }
}

async function handleSave() {
    if (!canSave.value) {
        return;
    }

    clearProductTimer();

    await store.saveSupplier();
}

async function handleDelete(supplier) {
    if (!canUpdate.value || store.busy) {
        return;
    }

    const confirmed = window.confirm(
        `Xóa nhà cung cấp "${supplier.name}"?\n\n` +
        "Nhà cung cấp đang liên kết sản phẩm, phiếu kho hoặc lô hàng " +
        "có thể không được xóa. Khi đó hãy sửa và bỏ chọn Đang hoạt động.",
    );

    if (confirmed) {
        await store.deleteSupplier(supplier);
    }
}

onMounted(() => {
    void store.fetchSuppliers();
});

onBeforeUnmount(() => {
    clearSearchTimer();
    clearProductTimer();
    store.closeDialog();
});
</script>

<template>
<div>
  <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="text-2xl font-bold">Quản lý nhà cung cấp</h1>
      <p class="text-sm text-text-light">{{ store.meta.total }} nhà cung cấp phù hợp bộ lọc</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.loading || store.busy" @click="handleReload">
        <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
        Tải lại
      </button>
      <button v-if="canCreate" type="button" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.busy" @click="openCreate">
        <Icon icon="solar:add-circle-bold" />
        Thêm nhà cung cấp
      </button>
    </div>
  </div>
  <div v-if="store.message" role="status" class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
    <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
    <span>{{ store.message }}</span>
  </div>
  <div v-if="store.errorMsg" role="alert" class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
    <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
    <span>{{ store.errorMsg }}</span>
  </div>
  <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <SupplierFilters @search="handleSearch" @change="handleFilterChange" @reset="handleResetFilters" />
    <SupplierTable :can-update="canUpdate" @detail="openDetail" @delete="handleDelete" />
    <SupplierPagination @change="handlePageChange" />
  </section>
  <SupplierModal v-if="store.dialogOpen" :modal-title="modalTitle" :can-save="canSave"
    :can-manage-products="canManageProducts" :can-view-products="canViewProducts"
    @close="closeModal" @save="handleSave" @product-search="handleProductSearch" @load-products="loadProducts" />
</div>
</template>