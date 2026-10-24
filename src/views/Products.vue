<script setup>
import { Icon } from "@iconify/vue";
import { onBeforeUnmount, onMounted } from "vue";
import { useProductStore } from "@/stores/admin/productStore";
import { useAuthStore } from "@/stores/shared/authStore";
import ProductStats from "@/components/admin/products/ProductStats.vue";
import ProductFilters from "@/components/admin/products/ProductFilters.vue";
import ProductTable from "@/components/admin/products/ProductTable.vue";
import ProductPagination from "@/components/admin/products/ProductPagination.vue";
import ProductModal from "@/components/admin/products/ProductModal.vue";

const store = useProductStore();
const authStore = useAuthStore();

let searchTimer;

// Store đã hiển thị lỗi API; tránh unhandled rejection ở event handler.
async function run(action) {
  try {
    await action();
  } catch {
    // store.errorMsg chứa thông báo để người dùng xem.
  }
}

function cancelSearch() {
  window.clearTimeout(searchTimer);
}

function handleReload() {
  cancelSearch();
  return run(() => store.loadData());
}

function handleSearch() {
  cancelSearch();

  searchTimer = window.setTimeout(() => {
    store.filters.page = 1;
    run(() => store.fetchProducts());
  }, 350);
}

function handleFilterChange() {
  cancelSearch();
  store.filters.page = 1;

  return run(() => store.fetchProducts());
}

function handleCategoryFilterChange() {
  cancelSearch();

  store.filters.page = 1;
  store.filters.subcategory_id = "";

  return run(async () => {
    await Promise.all([
      store.fetchSubcategories(store.filters.category_id, "filter"),
      store.fetchProducts(),
    ]);
  });
}

function handleResetFilters() {
  cancelSearch();
  store.resetFilters();

  return run(() => store.fetchProducts());
}

function handlePageChange(page) {
  if (
    store.loading ||
    page < 1 ||
    page > store.meta.last_page ||
    page === store.meta.current_page
  ) return;

  cancelSearch();
  return run(() => store.setPage(page));
}

function handleDelete(product) {
  if (store.deleting) return;

  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa sản phẩm "${product.product_name}" không?`,
  );

  if (confirmed) {
    return run(() => store.deleteProduct(product));
  }
}

onMounted(() => {
  run(() => store.loadData());
});

onBeforeUnmount(cancelSearch);
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Quản lý sản phẩm</h1>
        <p class="text-sm text-text-light">
          {{ store.meta.total }} sản phẩm phù hợp bộ lọc
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="store.loading || store.loadingOptions" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button v-if="authStore.hasPermission('product.create')" type="button"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving"
          @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm sản phẩm
        </button>
      </div>
    </div>

    <ProductStats />

    <div v-if="store.message" role="status"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
      <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.message }}</span>
    </div>

    <div v-if="store.errorMsg" role="alert"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.errorMsg }}</span>
    </div>

    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <ProductFilters @search="handleSearch" @category-change="handleCategoryFilterChange"
        @filter-change="handleFilterChange" @reset="handleResetFilters" />

      <ProductTable @delete="handleDelete" />

      <ProductPagination @change="handlePageChange" />
    </div>

    <ProductModal v-if="store.showProductModal" @close="store.closeModal" />
  </div>
</template>