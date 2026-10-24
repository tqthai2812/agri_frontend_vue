<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useCatalogStore } from "@/stores/admin/catalogStore";
import CategoryStats from "@/components/admin/categories/CategoryStats.vue";
import CategoryTabs from "@/components/admin/categories/CategoryTabs.vue";
import CategoryFilters from "@/components/admin/categories/CategoryFilters.vue";
import CategoryTable from "@/components/admin/categories/CategoryTable.vue";
import CategoryModal from "@/components/admin/categories/CategoryModal.vue";

const store = useCatalogStore();
let searchTimer = null;

const activeEntity = computed(() => {
  const entities = {
    categories: { type: "category", label: "danh mục" },
    subcategories: { type: "subcategory", label: "danh mục con" },
    origins: { type: "origin", label: "xuất xứ" },
  };
  return entities[store.activeTab] || entities.categories;
});

async function handleReload() {
  cancelSearch();
  await store.loadData();
}

function cancelSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = null;
}

function handleSearch(type) {
  cancelSearch();
  searchTimer = setTimeout(async () => {
    searchTimer = null;
    try {
      if (type === "category") await store.fetchCategories();
      if (type === "subcategory") await store.fetchSubcategories();
      if (type === "origin") await store.fetchOrigins();
    } catch {
      store.errorMsg = "Không thể tải kết quả tìm kiếm. Vui lòng thử lại.";
    }
  }, 350);
}

async function handleDelete(type, item) {
  const labels = {
    category: item.name || item.category_name,
    subcategory: item.name || item.subcategory_name,
    origin: item.origin_name,
  };
  if (!window.confirm(`Bạn có chắc muốn xóa "${labels[type]}" không?`)) return;
  try {
    await store.deleteItem(type, item);
  } catch {
    // Store đã ghi lỗi để hiển thị trên trang.
  }
}

onMounted(async () => {
  await store.loadData();
});
onBeforeUnmount(cancelSearch);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Quản lý danh mục sản phẩm</h1>
        <p class="text-text-light text-sm">
          Quản lý danh mục, danh mục con và xuất xứ dùng cho sản phẩm.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="store.loading" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button type="button" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving"
          @click="store.openCreateModal(activeEntity.type)">
          <Icon icon="solar:add-circle-bold" />
          Thêm {{ activeEntity.label }}
        </button>
      </div>
    </div>

    <!-- Stats -->

    <CategoryStats />


    <!-- Message -->
    <div v-if="store.message" role="status"
      class="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-700 text-sm">
      <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
      <span>{{ store.message }}</span>
    </div>

    <div v-if="store.errorMsg" role="alert"
      class="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
      <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
      <span>{{ store.errorMsg }}</span>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border">
      <CategoryTabs />
      <CategoryFilters @search="handleSearch" />
      <CategoryTable @delete="handleDelete" />
    </div>

    <CategoryModal v-if="store.showModal" />
  </div>
</template>