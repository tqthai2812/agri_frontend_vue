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

      <button class="btn-outline-sm" @click="handleReload">
        <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
        Tải lại
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="stat-card-info">
        <div class="stat-label">Danh mục</div>
        <div class="stat-value text-info">{{ store.totalCategories }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Danh mục con</div>
        <div class="stat-value text-success">{{ store.totalSubcategories }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Xuất xứ</div>
        <div class="stat-value">{{ store.totalOrigins }}</div>
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
      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-5 border-b border-border pb-4">
        <button v-for="tab in tabs" :key="tab.value" type="button" class="tab-btn"
          :class="{ active: store.activeTab === tab.value }" @click="store.activeTab = tab.value">
          <Icon :icon="tab.icon" class="text-lg" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Category toolbar -->
      <div v-if="store.activeTab === 'categories'" class="flex flex-col sm:flex-row gap-3 justify-between mb-5">
        <div class="search-box">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />

          <input v-model.trim="store.filters.categorySearch" type="text" placeholder="Tìm danh mục..."
            class="search-input" @input="handleSearch('category')" />
        </div>

        <button class="btn-primary" @click="store.openCreateModal('category')">
          <Icon icon="solar:add-circle-bold" />
          Thêm danh mục
        </button>
      </div>

      <!-- Subcategory toolbar -->
      <div v-if="store.activeTab === 'subcategories'" class="flex flex-col lg:flex-row gap-3 justify-between mb-5">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <div class="search-box">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />

            <input v-model.trim="store.filters.subcategorySearch" type="text" placeholder="Tìm danh mục con..."
              class="search-input" @input="handleSearch('subcategory')" />
          </div>

          <select v-model="store.filters.subcategoryCategoryId" class="filter-select"
            @change="store.fetchSubcategories">
            <option value="">Tất cả danh mục cha</option>
            <option v-for="category in store.categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <button class="btn-primary" @click="store.openCreateModal('subcategory')">
          <Icon icon="solar:add-circle-bold" />
          Thêm danh mục con
        </button>
      </div>

      <!-- Origin toolbar -->
      <div v-if="store.activeTab === 'origins'" class="flex flex-col sm:flex-row gap-3 justify-between mb-5">
        <div class="search-box">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />

          <input v-model.trim="store.filters.originSearch" type="text" placeholder="Tìm xuất xứ..." class="search-input"
            @input="handleSearch('origin')" />
        </div>

        <button class="btn-primary" @click="store.openCreateModal('origin')">
          <Icon icon="solar:add-circle-bold" />
          Thêm xuất xứ
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải dữ liệu...</p>
      </div>

      <!-- Categories table -->
      <div v-else-if="store.activeTab === 'categories'" class="overflow-x-auto">
        <table class="w-full min-w-[850px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Danh mục</th>
              <th class="table-th">Slug</th>
              <th class="table-th">Mô tả</th>
              <th class="table-th">Danh mục con</th>
              <th class="table-th">Sản phẩm</th>
              <th class="table-th">Ngày tạo</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="category in store.categories" :key="category.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div class="icon-box bg-primary/10 text-primary">
                    <Icon icon="solar:sort-bold-duotone" />
                  </div>

                  <div>
                    <div class="font-semibold">{{ category.name }}</div>
                    <div class="text-xs text-text-light">ID: {{ category.id }}</div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <span class="badge-gray">{{ category.slug }}</span>
              </td>

              <td class="table-td max-w-[260px]">
                <span class="line-clamp-2 text-sm text-text-sec">
                  {{ category.description || "Chưa có mô tả" }}
                </span>
              </td>

              <td class="table-td font-mono">
                {{ category.subcategories_count ?? category.subcategories?.length ?? 0 }}
              </td>

              <td class="table-td font-mono">
                {{ category.products_count ?? 0 }}
              </td>

              <td class="table-td text-sm text-text-light">
                {{ formatDate(category.created_at) }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Sửa danh mục"
                    @click="store.openEditModal('category', category)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button class="btn-danger-icon" title="Xóa danh mục" :disabled="store.deleting"
                    @click="handleDelete('category', category)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.categories.length">
              <td colspan="7" class="empty-cell">
                Chưa có danh mục nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Subcategories table -->
      <div v-else-if="store.activeTab === 'subcategories'" class="overflow-x-auto">
        <table class="w-full min-w-[850px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Danh mục con</th>
              <th class="table-th">Danh mục cha</th>
              <th class="table-th">Slug</th>
              <th class="table-th">Sản phẩm</th>
              <th class="table-th">Ngày tạo</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="subcategory in store.subcategories" :key="subcategory.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div class="icon-box bg-green-50 text-green-600">
                    <Icon icon="solar:folder-with-files-bold-duotone" />
                  </div>

                  <div>
                    <div class="font-semibold">{{ subcategory.name }}</div>
                    <div class="text-xs text-text-light">ID: {{ subcategory.id }}</div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                {{ subcategory.category_name || subcategory.category?.name || "Chưa có" }}
              </td>

              <td class="table-td">
                <span class="badge-gray">{{ subcategory.slug }}</span>
              </td>

              <td class="table-td font-mono">
                {{ subcategory.products_count ?? 0 }}
              </td>

              <td class="table-td text-sm text-text-light">
                {{ formatDate(subcategory.created_at) }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Sửa danh mục con"
                    @click="store.openEditModal('subcategory', subcategory)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button class="btn-danger-icon" title="Xóa danh mục con" :disabled="store.deleting"
                    @click="handleDelete('subcategory', subcategory)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.subcategories.length">
              <td colspan="6" class="empty-cell">
                Chưa có danh mục con nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Origins table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Xuất xứ</th>
              <th class="table-th">Hình ảnh</th>
              <th class="table-th">Sản phẩm</th>
              <th class="table-th">Ngày tạo</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="origin in store.origins" :key="origin.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div class="icon-box bg-yellow-50 text-yellow-600">
                    <Icon icon="solar:global-bold-duotone" />
                  </div>

                  <div>
                    <div class="font-semibold">{{ origin.origin_name }}</div>
                    <div class="text-xs text-text-light">ID: {{ origin.id }}</div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div
                  class="w-14 h-14 rounded-xl overflow-hidden bg-bg border border-border flex items-center justify-center">
                  <img v-if="origin.origin_image" :src="origin.origin_image" :alt="origin.origin_name"
                    class="w-full h-full object-cover" />

                  <Icon v-else icon="solar:gallery-minimalistic-bold-duotone" class="text-2xl text-text-light" />
                </div>
              </td>

              <td class="table-td font-mono">
                {{ origin.products_count ?? 0 }}
              </td>

              <td class="table-td text-sm text-text-light">
                {{ formatDate(origin.created_at) }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Sửa xuất xứ" @click="store.openEditModal('origin', origin)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button class="btn-danger-icon" title="Xóa xuất xứ" :disabled="store.deleting"
                    @click="handleDelete('origin', origin)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.origins.length">
              <td colspan="5" class="empty-cell">
                Chưa có xuất xứ nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="store.showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="store.closeModal">
      <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">{{ modalTitle }}</h2>
            <p class="text-sm text-text-light">{{ modalDescription }}</p>
          </div>

          <button class="btn-outline-icon" @click="store.closeModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <form class="p-6 space-y-5" @submit.prevent="handleSave">
          <div v-if="store.errorMsg"
            class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
          </div>

          <!-- Category form -->
          <template v-if="store.modalType === 'category'">
            <div class="form-group">
              <label class="form-label">
                Tên danh mục <span class="text-primary">*</span>
              </label>

              <input v-model.trim="store.categoryForm.category_name" class="form-control"
                placeholder="Ví dụ: Phân bón" />

              <p v-if="store.fieldError('category_name')" class="error-text">
                {{ store.fieldError("category_name") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Mô tả</label>

              <textarea v-model.trim="store.categoryForm.category_description" class="form-control" rows="4"
                placeholder="Mô tả ngắn về danh mục..."></textarea>

              <p v-if="store.fieldError('category_description')" class="error-text">
                {{ store.fieldError("category_description") }}
              </p>
            </div>
          </template>

          <!-- Subcategory form -->
          <template v-if="store.modalType === 'subcategory'">
            <div class="form-group">
              <label class="form-label">
                Danh mục cha <span class="text-primary">*</span>
              </label>

              <select v-model="store.subcategoryForm.category_id" class="form-control">
                <option value="">Chọn danh mục cha</option>
                <option v-for="category in store.categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>

              <p v-if="store.fieldError('category_id')" class="error-text">
                {{ store.fieldError("category_id") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Tên danh mục con <span class="text-primary">*</span>
              </label>

              <input v-model.trim="store.subcategoryForm.subcategory_name" class="form-control"
                placeholder="Ví dụ: Phân hữu cơ" />

              <p v-if="store.fieldError('subcategory_name')" class="error-text">
                {{ store.fieldError("subcategory_name") }}
              </p>
            </div>
          </template>

          <!-- Origin form -->
          <template v-if="store.modalType === 'origin'">
            <div class="form-group">
              <label class="form-label">
                Tên xuất xứ <span class="text-primary">*</span>
              </label>

              <input v-model.trim="store.originForm.origin_name" class="form-control" placeholder="Ví dụ: Việt Nam" />

              <p v-if="store.fieldError('origin_name')" class="error-text">
                {{ store.fieldError("origin_name") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Hình ảnh xuất xứ</label>

              <div class="upload-area cursor-pointer" @click="originFileInput?.click()">
                <Icon icon="solar:cloud-upload-bold" class="text-4xl mx-auto mb-2" />
                <p class="text-sm">
                  Bấm để <span class="text-primary font-semibold">chọn ảnh</span>
                </p>
                <p class="text-xs text-text-light mt-1">
                  JPG, JPEG, PNG, GIF. Tối đa 2MB.
                </p>

                <input ref="originFileInput" type="file" accept="image/jpeg,image/jpg,image/png,image/gif"
                  class="hidden" @change="handleOriginImageChange" />
              </div>

              <p v-if="store.fieldError('origin_image')" class="error-text">
                {{ store.fieldError("origin_image") }}
              </p>

              <div v-if="store.originForm.preview"
                class="mt-4 w-32 h-32 rounded-2xl overflow-hidden border border-border bg-bg">
                <img :src="store.originForm.preview" class="w-full h-full object-cover" alt="Origin preview" />
              </div>
            </div>
          </template>

          <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button type="button" class="btn-outline" @click="store.closeModal">
              Hủy
            </button>

            <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="store.saving">
              <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                :class="store.saving ? 'animate-spin' : ''" />

              {{ store.saving ? "Đang lưu..." : "Lưu" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useCatalogStore } from "@/stores/catalogStore";

const store = useCatalogStore();

const originFileInput = ref(null);
let searchTimer = null;

const tabs = [
  {
    value: "categories",
    label: "Danh mục",
    icon: "solar:sort-bold-duotone",
  },
  {
    value: "subcategories",
    label: "Danh mục con",
    icon: "solar:folder-with-files-bold-duotone",
  },
  {
    value: "origins",
    label: "Xuất xứ",
    icon: "solar:global-bold-duotone",
  },
];

const modalTitle = computed(() => {
  const action = store.selectedItem ? "Cập nhật" : "Thêm";

  if (store.modalType === "category") {
    return `${action} danh mục`;
  }

  if (store.modalType === "subcategory") {
    return `${action} danh mục con`;
  }

  return `${action} xuất xứ`;
});

const modalDescription = computed(() => {
  if (store.modalType === "category") {
    return "Danh mục cha dùng để nhóm các sản phẩm.";
  }

  if (store.modalType === "subcategory") {
    return "Danh mục con thuộc một danh mục cha.";
  }

  return "Xuất xứ dùng để gắn thông tin nguồn gốc sản phẩm.";
});

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

async function handleReload() {
  await store.loadData();
}

function handleSearch(type) {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(async () => {
    if (type === "category") {
      await store.fetchCategories();
    }

    if (type === "subcategory") {
      await store.fetchSubcategories();
    }

    if (type === "origin") {
      await store.fetchOrigins();
    }
  }, 350);
}

function handleOriginImageChange(event) {
  const file = event.target.files?.[0] || null;

  store.setOriginImage(file);
}

async function handleSave() {
  await store.saveItem();
}

async function handleDelete(type, item) {
  const labels = {
    category: item.name || item.category_name,
    subcategory: item.name || item.subcategory_name,
    origin: item.origin_name,
  };

  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa "${labels[type]}" không?`,
  );

  if (!confirmed) {
    return;
  }

  await store.deleteItem(type, item);
}

onMounted(async () => {
  await store.loadData();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-info {
  @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
}

.stat-card-success {
  @apply border-l-success;
}

.stat-card-warning {
  @apply border-l-warning;
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

.tab-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-text-sec hover:bg-primary/10 hover:text-primary transition;
}

.tab-btn.active {
  @apply bg-primary text-white hover:bg-primary hover:text-white;
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

.icon-box {
  @apply w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0;
}

.error-text {
  @apply text-danger text-sm mt-1;
}
</style>