<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Quản lý sản phẩm</h1>
        <p class="text-text-light text-sm">
          {{ store.meta.total }} sản phẩm trong hệ thống
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="btn-outline-sm" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button v-if="authStore.hasPermission('product.create')" class="btn-primary" @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm sản phẩm
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="stat-card-info">
        <div class="stat-label">Tổng sản phẩm</div>
        <div class="stat-value text-info">{{ store.meta.total }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Đang hiển thị</div>
        <div class="stat-value text-success">{{ store.visibleProducts.length }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Đang ẩn</div>
        <div class="stat-value">{{ store.hiddenProducts.length }}</div>
      </div>

      <div class="stat-card-danger">
        <div class="stat-label">Sắp hết hàng</div>
        <div class="stat-value text-danger">{{ store.lowStockProducts.length }}</div>
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
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[220px]">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />

          <input v-model.trim="store.filters.search" type="text" placeholder="Tìm tên sản phẩm, SKU, danh mục..."
            class="bg-transparent outline-none text-sm w-full" @input="handleSearch" />
        </div>

        <select v-model="store.filters.category_id" class="filter-select flex-1 sm:flex-none"
          @change="handleCategoryFilterChange">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in store.categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>

        <select v-model="store.filters.subcategory_id" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange">
          <option value="">Tất cả danh mục con</option>
          <option v-for="subcategory in store.subcategories" :key="subcategory.id" :value="subcategory.id">
            {{ subcategory.name }}
          </option>
        </select>

        <select v-model="store.filters.origin_id" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange">
          <option value="">Tất cả xuất xứ</option>
          <option v-for="origin in store.origins" :key="origin.id" :value="origin.id">
            {{ origin.origin_name }}
          </option>
        </select>

        <select v-model="store.filters.is_show" class="filter-select flex-1 sm:flex-none" @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hiển thị</option>
          <option value="0">Đang ẩn</option>
        </select>

        <button class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải sản phẩm...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs">Sản phẩm</th>
              <th class="p-3 text-left text-xs">Danh mục</th>
              <th class="p-3 text-left text-xs">Xuất xứ</th>
              <th class="p-3 text-left text-xs">Giá bán</th>
              <th class="p-3 text-left text-xs">Tồn kho</th>
              <th class="p-3 text-left text-xs">Biến thể</th>
              <th class="p-3 text-left text-xs">Trạng thái</th>
              <th class="p-3 text-left text-xs">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="product in store.products" :key="product.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-xl overflow-hidden bg-bg border border-border shrink-0 flex items-center justify-center">
                    <img v-if="product.primary_image" :src="product.primary_image" :alt="product.product_name"
                      class="w-full h-full object-cover" />

                    <Icon v-else icon="solar:box-bold-duotone" class="text-2xl text-text-light" />
                  </div>

                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate max-w-[260px]">
                      {{ product.product_name }}
                    </div>

                    <div class="text-xs text-text-light">
                      SKU: {{ product.first_sku || "Chưa có" }}
                    </div>

                    <div class="text-xs text-text-light">
                      ID: {{ product.id }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="p-3">
                <div class="space-y-1">
                  <span class="badge-gray">
                    {{ product.category?.name || "Chưa có danh mục" }}
                  </span>

                  <div class="text-xs text-text-light">
                    {{ product.subcategory?.name || "Chưa có danh mục con" }}
                  </div>
                </div>
              </td>

              <td class="p-3 text-sm">
                {{ product.origin?.name || "Chưa có" }}
              </td>

              <td class="p-3 font-mono text-sm">
                <template v-if="product.min_price || product.max_price">
                  <div v-if="product.min_price === product.max_price">
                    {{ formatVND(product.min_price) }}
                  </div>

                  <div v-else>
                    {{ formatVND(product.min_price) }} - {{ formatVND(product.max_price) }}
                  </div>
                </template>

                <span v-else class="text-text-light">Chưa có giá</span>
              </td>

              <td class="p-3 font-mono text-sm"
                :class="Number(product.total_stock || 0) < 5 ? 'text-danger font-bold' : ''">
                {{ product.total_stock || 0 }}
              </td>

              <td class="p-3 text-sm">
                <div class="space-y-1">
                  <div>{{ product.variant_count || 0 }} biến thể</div>
                  <div class="text-xs text-text-light">
                    {{ product.package_count || 0 }} quy cách
                  </div>
                </div>
              </td>

              <td class="p-3">
                <span :class="product.is_show ? 'badge-active' : 'badge-inactive'">
                  {{ product.is_show ? "Đang hiển thị" : "Đang ẩn" }}
                </span>
              </td>

              <td class="p-3">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Xem / sửa" @click="store.openEditModal(product)">
                    <Icon icon="solar:eye-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('product.update')" class="btn-outline-icon" title="Sửa sản phẩm"
                    @click="store.openEditModal(product)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('product.delete')" class="btn-danger-icon" title="Xóa sản phẩm"
                    :disabled="store.deleting" @click="handleDelete(product)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
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

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.products.length }} / {{ store.meta.total }} sản phẩm
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

    <ProductModal v-if="store.showProductModal" @close="store.closeModal" />
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useAuthStore } from "@/stores/authStore";
import ProductModal from "@/components/ui/ProductModal.vue";

const store = useProductStore();
const authStore = useAuthStore();

let searchTimer = null;

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

async function handleReload() {
  await store.loadData();
}

function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(async () => {
    store.filters.page = 1;
    await store.fetchProducts();
  }, 350);
}

async function handleFilterChange() {
  store.filters.page = 1;
  await store.fetchProducts();
}

async function handleCategoryFilterChange() {
  store.filters.page = 1;
  store.filters.subcategory_id = "";

  await store.fetchSubcategories(store.filters.category_id);
  await store.fetchProducts();
}

async function handleResetFilters() {
  store.resetFilters();
  await store.fetchProducts();
}

async function handlePageChange(page) {
  if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
    return;
  }

  store.setPage(page);
}

async function handleDelete(product) {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa sản phẩm "${product.product_name}" không?`,
  );

  if (!confirmed) {
    return;
  }

  await store.deleteProduct(product);
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
</style>