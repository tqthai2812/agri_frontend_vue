<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useProductStore } from "@/stores/admin/productStore";
import { useAuthStore } from "@/stores/shared/authStore";
import ProductModal from "@/components/ui/ProductModal.vue";

const store = useProductStore();
const authStore = useAuthStore();

let searchTimer;

const visiblePages = computed(() => {
  const current = store.meta.current_page;
  const last = store.meta.last_page;
  const pages = [];

  for (
    let page = Math.max(1, current - 2);
    page <= Math.min(last, current + 2);
    page++
  ) {
    pages.push(page);
  }

  return pages;
});

function formatVND(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

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
        <button type="button" class="btn-outline-sm" :disabled="store.loading || store.loadingOptions"
          @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button v-if="authStore.hasPermission('product.create')" type="button" class="btn-primary"
          :disabled="store.saving" @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm sản phẩm
        </button>
      </div>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Theo bộ lọc</div>
        <div class="font-mono text-2xl font-bold text-info">
          {{ store.meta.total }}
        </div>
      </div>

      <div class="rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Hiển thị · trang này</div>
        <div class="font-mono text-2xl font-bold text-success">
          {{ store.visibleProducts.length }}
        </div>
      </div>

      <div class="rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Đang ẩn · trang này</div>
        <div class="font-mono text-2xl font-bold">
          {{ store.hiddenProducts.length }}
        </div>
      </div>

      <div class="rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Sắp hết · trang này</div>
        <div class="font-mono text-2xl font-bold text-danger">
          {{ store.lowStockProducts.length }}
        </div>
      </div>
    </div>

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
      <div class="mb-5 flex flex-wrap gap-3">
        <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />
          <input v-model.trim="store.filters.search" type="search" maxlength="255" aria-label="Tìm sản phẩm"
            placeholder="Tìm tên sản phẩm, SKU, danh mục..." class="w-full bg-transparent text-sm outline-none"
            @input="handleSearch" />
        </div>

        <select v-model="store.filters.category_id" class="filter-select flex-1 sm:flex-none" aria-label="Danh mục"
          @change="handleCategoryFilterChange">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in store.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>

        <select v-model="store.filters.subcategory_id" class="filter-select flex-1 sm:flex-none"
          aria-label="Danh mục con" :disabled="!store.filters.category_id" @change="handleFilterChange">
          <option value="">Tất cả danh mục con</option>
          <option v-for="subcategory in store.filterSubcategories" :key="subcategory.id" :value="subcategory.id">
            {{ subcategory.name }}
          </option>
        </select>

        <select v-model="store.filters.origin_id" class="filter-select flex-1 sm:flex-none" aria-label="Xuất xứ"
          @change="handleFilterChange">
          <option value="">Tất cả xuất xứ</option>
          <option v-for="origin in store.origins" :key="origin.id" :value="origin.id">
            {{ origin.origin_name }}
          </option>
        </select>

        <select v-model="store.filters.is_show" class="filter-select flex-1 sm:flex-none"
          aria-label="Trạng thái hiển thị" @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hiển thị</option>
          <option value="0">Đang ẩn</option>
        </select>

        <button type="button" class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        <p class="text-sm">Đang tải sản phẩm...</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs">Sản phẩm</th>
              <th class="p-3 text-left text-xs">Danh mục</th>
              <th class="p-3 text-left text-xs">Xuất xứ</th>
              <th class="p-3 text-left text-xs">Giá bán</th>
              <th class="p-3 text-left text-xs">Tồn vật lý</th>
              <th class="p-3 text-left text-xs">Biến thể</th>
              <th class="p-3 text-left text-xs">Trạng thái</th>
              <th class="p-3 text-left text-xs">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="product in store.products" :key="product.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg">
                    <img v-if="product.primary_image" :src="product.primary_image" :alt="product.product_name"
                      loading="lazy" class="h-full w-full object-cover" />
                    <Icon v-else icon="solar:box-bold-duotone" class="text-2xl text-text-light" />
                  </div>

                  <div class="min-w-0">
                    <div class="max-w-[260px] truncate text-sm font-semibold">
                      {{ product.product_name }}
                    </div>
                    <div v-if="product.brand" class="text-xs text-text-light">
                      {{ product.brand }}
                    </div>
                    <div class="text-xs text-text-light">
                      SKU: {{ product.first_sku || "Chưa có" }}
                    </div>
                    <div class="text-xs text-text-light">ID: {{ product.id }}</div>
                  </div>
                </div>
              </td>

              <td class="p-3">
                <span class="badge-gray">
                  {{ product.category?.name || "Chưa có danh mục" }}
                </span>
                <div class="mt-1 text-xs text-text-light">
                  {{ product.subcategory?.name || "Chưa có danh mục con" }}
                </div>
              </td>

              <td class="p-3 text-sm">
                {{ product.origin?.name || "Chưa có" }}
              </td>

              <td class="p-3 font-mono text-sm">
                <template v-if="Number(product.package_count) > 0">
                  <div v-if="Number(product.min_price) === Number(product.max_price)">
                    {{ formatVND(product.min_price) }}
                  </div>
                  <div v-else>
                    {{ formatVND(product.min_price) }} –
                    {{ formatVND(product.max_price) }}
                  </div>
                </template>
                <span v-else class="text-text-light">Chưa có quy cách</span>
              </td>

              <td class="p-3 text-sm" :class="store.isLowStock(product) ? 'font-bold text-danger' : ''">
                <div class="font-mono">{{ product.total_stock ?? 0 }}</div>
                <span v-if="store.isLowStock(product)" class="text-[10px]">
                  Có quy cách dưới ngưỡng
                </span>
              </td>

              <td class="p-3 text-sm">
                <div>{{ product.variant_count ?? 0 }} biến thể</div>
                <div class="mt-1 text-xs text-text-light">
                  {{ product.package_count ?? 0 }} quy cách
                </div>
              </td>

              <td class="p-3">
                <span :class="product.is_show ? 'badge-active' : 'badge-inactive'">
                  {{ product.is_show ? "Đang hiển thị" : "Đang ẩn" }}
                </span>
              </td>

              <td class="p-3">
                <div class="flex gap-2">
                  <button v-if="authStore.hasPermission('product.update')" type="button" class="btn-outline-icon"
                    title="Sửa sản phẩm" aria-label="Sửa sản phẩm" :disabled="store.saving"
                    @click="store.openEditModal(product)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('product.delete')" type="button" class="btn-danger-icon"
                    title="Xóa sản phẩm" aria-label="Xóa sản phẩm" :disabled="store.deleting"
                    @click="handleDelete(product)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>

                  <span v-if="!authStore.hasPermission('product.update') &&
                    !authStore.hasPermission('product.delete')" class="text-xs text-text-light">
                    Chỉ xem
                  </span>
                </div>
              </td>
            </tr>

            <tr v-if="!store.products.length">
              <td colspan="8" class="p-8 text-center text-text-light">
                Không có sản phẩm nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.products.length }} / {{ store.meta.total }} sản phẩm
        </span>

        <div class="flex flex-wrap justify-center gap-2">
          <button type="button" class="page-btn" aria-label="Trang trước"
            :disabled="store.loading || store.meta.current_page <= 1"
            @click="handlePageChange(store.meta.current_page - 1)">
            <Icon icon="solar:arrow-left-bold" />
          </button>

          <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
            :class="{ active: page === store.meta.current_page }"
            :aria-current="page === store.meta.current_page ? 'page' : undefined" :disabled="store.loading"
            @click="handlePageChange(page)">
            {{ page }}
          </button>

          <button type="button" class="page-btn" aria-label="Trang sau"
            :disabled="store.loading || store.meta.current_page >= store.meta.last_page"
            @click="handlePageChange(store.meta.current_page + 1)">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </div>
      </div>
    </div>

    <ProductModal v-if="store.showProductModal" @close="store.closeModal" />
  </div>
</template>