<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Quản lý bài viết</h1>
        <p class="text-text-light text-sm">
          Tạo, chỉnh sửa, xuất bản bài viết kiến thức nhà nông.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="btn-outline-sm" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button v-if="authStore.hasPermission('article.create')" class="btn-primary" @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm bài viết
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="stat-card-info">
        <div class="stat-label">Tổng bài viết</div>
        <div class="stat-value text-info">{{ store.statusCounts.all }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Đã xuất bản</div>
        <div class="stat-value text-success">{{ store.statusCounts.published }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Bản nháp</div>
        <div class="stat-value">{{ store.statusCounts.draft }}</div>
      </div>

      <div class="stat-card-danger">
        <div class="stat-label">Đã ẩn</div>
        <div class="stat-value text-danger">{{ store.statusCounts.hidden }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-5 flex flex-wrap border-b border-border">
      <button v-for="tab in statusTabs" :key="tab.key"
        class="-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition" :class="store.filters.status === tab.key
          ? 'border-primary text-primary'
          : 'border-transparent text-text-light hover:text-primary'" @click="handleTabChange(tab.key)">
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <!-- Messages -->
    <div v-if="store.message"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
      <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.message }}</span>
    </div>

    <div v-if="store.errorMsg"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.errorMsg }}</span>
    </div>

    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <!-- Filters -->
      <div class="mb-5 flex flex-wrap gap-3">
        <div class="search-box">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />

          <input v-model.trim="store.filters.search" type="text" placeholder="Tìm tiêu đề, slug, tag, tác giả..."
            class="search-input" @input="handleSearch" />
        </div>

        <input v-model="store.filters.date_from" type="date" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange" />

        <input v-model="store.filters.date_to" type="date" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange" />

        <button class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        <p class="text-sm">Đang tải bài viết...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1200px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Bài viết</th>
              <th class="table-th">Slug</th>
              <th class="table-th">Tag</th>
              <th class="table-th">Tác giả</th>
              <th class="table-th">Trạng thái</th>
              <th class="table-th">Ngày xuất bản</th>
              <th class="table-th">Lượt xem</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in store.news" :key="item.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <img v-if="item.title_image_url" :src="item.title_image_url" :alt="item.title"
                    class="h-14 w-20 rounded-xl border border-border object-cover" />

                  <div v-else
                    class="flex h-14 w-20 items-center justify-center rounded-xl border border-border bg-bg text-text-light">
                    <Icon icon="solar:gallery-bold-duotone" class="text-2xl" />
                  </div>

                  <div class="min-w-0">
                    <div class="line-clamp-2 font-semibold text-sm">
                      {{ item.title }}
                    </div>

                    <p class="mt-1 line-clamp-1 text-xs text-text-light">
                      {{ item.subtitle || item.excerpt || "Không có mô tả ngắn" }}
                    </p>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <span class="badge-gray font-mono">
                  {{ item.slug }}
                </span>
              </td>

              <td class="table-td">
                <div class="flex max-w-[220px] flex-wrap gap-1">
                  <span v-for="tag in item.tags" :key="tag.id"
                    class="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                    #{{ tag.tag_name }}
                  </span>

                  <span v-if="!item.tags?.length" class="text-xs text-text-light">
                    —
                  </span>
                </div>
              </td>

              <td class="table-td">
                <div class="font-semibold text-sm">
                  {{ item.user?.name || "Không rõ" }}
                </div>

                <div class="text-xs text-text-light">
                  {{ item.user?.email || "—" }}
                </div>
              </td>

              <td class="table-td">
                <span :class="statusBadgeClass(item.status)">
                  {{ item.status_label }}
                </span>
              </td>

              <td class="table-td">
                <div class="text-sm">
                  {{ formatDate(item.published_at) }}
                </div>

                <div class="text-xs text-text-light">
                  Tạo: {{ formatDate(item.created_at) }}
                </div>
              </td>

              <td class="table-td font-mono">
                {{ item.views || 0 }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button v-if="authStore.hasPermission('article.update')" class="btn-outline-icon" title="Sửa"
                    @click="store.openEditModal(item)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('article.update') && item.status !== 'published'"
                    class="btn-outline-icon text-success" title="Xuất bản nhanh" :disabled="store.saving"
                    @click="handleQuickPublish(item)">
                    <Icon icon="solar:check-circle-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('article.delete')" class="btn-danger-icon" title="Xóa"
                    :disabled="store.deleting" @click="handleDelete(item)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.news.length">
              <td colspan="8" class="empty-cell">
                Chưa có bài viết nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.news.length }} / {{ store.meta.total }} bài viết
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

    <!-- Modal -->
    <div v-if="store.showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="store.closeModal">
      <div class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-surface">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-6">
          <div>
            <h2 class="text-xl font-bold">
              {{ store.selectedNews ? "Cập nhật bài viết" : "Thêm bài viết" }}
            </h2>

            <p class="text-sm text-text-light">
              Nhập nội dung bài viết, ảnh đại diện, tag và trạng thái xuất bản.
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <form class="p-6" @submit.prevent="handleSave">
          <div v-if="store.errorMsg"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
            <span>{{ store.errorMsg }}</span>
          </div>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <!-- Left -->
            <div class="space-y-5">
              <div class="form-group">
                <label class="form-label">
                  Tiêu đề <span class="text-primary">*</span>
                </label>

                <input v-model.trim="store.form.title" class="form-control"
                  placeholder="Ví dụ: Cách nhận biết sâu bệnh trên cây lúa" @blur="store.generateSlugFromTitle" />

                <p v-if="store.fieldError('title')" class="error-text">
                  {{ store.fieldError("title") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Slug</label>

                <input v-model.trim="store.form.slug" class="form-control font-mono"
                  placeholder="tu-dong-tao-tu-tieu-de" />

                <p class="mt-1 text-xs text-text-light">
                  Để trống thì hệ thống tự tạo từ tiêu đề.
                </p>

                <p v-if="store.fieldError('slug')" class="error-text">
                  {{ store.fieldError("slug") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Mô tả ngắn</label>

                <input v-model.trim="store.form.subtitle" class="form-control"
                  placeholder="Mô tả ngắn hiển thị ngoài danh sách bài viết" />

                <p v-if="store.fieldError('subtitle')" class="error-text">
                  {{ store.fieldError("subtitle") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Nội dung</label>

                <textarea v-model="store.form.content" class="form-control min-h-[260px]"
                  placeholder="Nhập nội dung bài viết..."></textarea>

                <p v-if="store.fieldError('content')" class="error-text">
                  {{ store.fieldError("content") }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Meta title</label>

                  <input v-model.trim="store.form.meta_title" class="form-control" placeholder="Tiêu đề SEO" />
                </div>

                <div class="form-group">
                  <label class="form-label">Meta description</label>

                  <input v-model.trim="store.form.meta_description" class="form-control" placeholder="Mô tả SEO" />
                </div>
              </div>
            </div>

            <!-- Right -->
            <div class="space-y-5">
              <div class="form-group">
                <label class="form-label">Trạng thái</label>

                <select v-model="store.form.status" class="form-control">
                  <option value="draft">Bản nháp</option>
                  <option value="published">Xuất bản</option>
                  <option value="hidden">Ẩn bài viết</option>
                </select>
              </div>

              <div v-if="store.form.status === 'published'" class="form-group">
                <label class="form-label">Ngày xuất bản</label>

                <input v-model="store.form.published_at" type="datetime-local" class="form-control" />

                <p class="mt-1 text-xs text-text-light">
                  Để trống thì backend tự lấy thời gian hiện tại.
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Tag</label>

                <input v-model.trim="store.form.tag_names_text" class="form-control"
                  placeholder="lúa, phân bón, sâu bệnh" />

                <p class="mt-1 text-xs text-text-light">
                  Nhập nhiều tag, cách nhau bằng dấu phẩy.
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Ảnh đại diện</label>

                <input type="file" accept="image/*" class="form-control" @change="handleTitleImageChange" />

                <div v-if="titleImagePreview || store.form.title_image_url"
                  class="mt-3 overflow-hidden rounded-2xl border border-border">
                  <img :src="titleImagePreview || store.form.title_image_url" alt="Ảnh đại diện"
                    class="h-52 w-full object-cover" />
                </div>

                <button v-if="store.form.title_image_url && !store.form.remove_title_image" type="button"
                  class="mt-2 text-xs font-semibold text-danger hover:underline" @click="removeTitleImage">
                  Xóa ảnh đại diện hiện tại
                </button>

                <p v-if="store.form.remove_title_image" class="mt-2 text-xs text-danger">
                  Ảnh đại diện hiện tại sẽ bị xóa khi lưu.
                </p>

                <p v-if="store.fieldError('title_image')" class="error-text">
                  {{ store.fieldError("title_image") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">Ảnh phụ</label>

                <input type="file" accept="image/*" multiple class="form-control" @change="handleImagesChange" />

                <div v-if="store.form.existing_images.length || imagePreviews.length"
                  class="mt-3 grid grid-cols-2 gap-3">
                  <div v-for="image in store.form.existing_images" :key="image.id"
                    class="relative overflow-hidden rounded-xl border border-border">
                    <img :src="image.image_url" alt="Ảnh phụ" class="h-28 w-full object-cover" />

                    <button type="button"
                      class="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-red-500 text-white"
                      @click="store.markDeleteImage(image.id)">
                      <Icon icon="solar:close-circle-bold" />
                    </button>
                  </div>

                  <div v-for="(image, index) in imagePreviews" :key="image.url"
                    class="relative overflow-hidden rounded-xl border border-border">
                    <img :src="image.url" alt="Ảnh phụ mới" class="h-28 w-full object-cover" />

                    <button type="button"
                      class="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-red-500 text-white"
                      @click="removeSelectedImage(index)">
                      <Icon icon="solar:close-circle-bold" />
                    </button>
                  </div>
                </div>

                <p v-if="store.fieldError('images')" class="error-text">
                  {{ store.fieldError("images") }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col justify-end gap-3 border-t border-border pt-5 sm:flex-row">
            <button type="button" class="btn-outline" @click="store.closeModal">
              Hủy
            </button>

            <button type="submit" class="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="store.saving">
              <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                :class="store.saving ? 'animate-spin' : ''" />

              {{ store.saving ? "Đang lưu..." : "Lưu bài viết" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNewsStore } from "@/stores/newsStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useNewsStore();
const authStore = useAuthStore();

const titleImagePreview = ref("");
const imagePreviews = ref([]);

let searchTimer = null;

const statusTabs = computed(() => [
  {
    key: "",
    label: "Tất cả",
    count: store.statusCounts.all,
  },
  {
    key: "published",
    label: "Đã xuất bản",
    count: store.statusCounts.published,
  },
  {
    key: "draft",
    label: "Bản nháp",
    count: store.statusCounts.draft,
  },
  {
    key: "hidden",
    label: "Đã ẩn",
    count: store.statusCounts.hidden,
  },
]);

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

function clearPreviewUrls() {
  if (titleImagePreview.value) {
    URL.revokeObjectURL(titleImagePreview.value);
    titleImagePreview.value = "";
  }

  imagePreviews.value.forEach((image) => {
    URL.revokeObjectURL(image.url);
  });

  imagePreviews.value = [];
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

function statusBadgeClass(status) {
  const map = {
    published: "badge-active",
    draft: "badge-pending",
    hidden: "badge-inactive",
  };

  return map[status] || "badge-gray";
}

function handleTitleImageChange(event) {
  const file = event.target.files?.[0] || null;

  store.form.title_image = file;
  store.form.remove_title_image = false;

  if (titleImagePreview.value) {
    URL.revokeObjectURL(titleImagePreview.value);
  }

  titleImagePreview.value = file ? URL.createObjectURL(file) : "";
}

function removeTitleImage() {
  store.form.title_image = null;
  store.form.remove_title_image = true;

  if (titleImagePreview.value) {
    URL.revokeObjectURL(titleImagePreview.value);
    titleImagePreview.value = "";
  }
}

function handleImagesChange(event) {
  const files = Array.from(event.target.files || []);

  store.form.images = files;

  imagePreviews.value.forEach((image) => {
    URL.revokeObjectURL(image.url);
  });

  imagePreviews.value = files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  }));
}

function removeSelectedImage(index) {
  const preview = imagePreviews.value[index];

  if (preview?.url) {
    URL.revokeObjectURL(preview.url);
  }

  imagePreviews.value.splice(index, 1);
  store.removeSelectedImage(index);
}

async function handleReload() {
  await store.loadData();
}

async function handleTabChange(status) {
  store.filters.status = status;
  store.filters.page = 1;

  await store.fetchNews();
}

function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(async () => {
    store.filters.page = 1;
    await store.fetchNews();
  }, 350);
}

async function handleFilterChange() {
  store.filters.page = 1;
  await store.fetchNews();
}

async function handleResetFilters() {
  store.resetFilters();
  await store.loadData();
}

async function handleSave() {
  await store.saveNews();
  clearPreviewUrls();
}

async function handleQuickPublish(item) {
  const confirmed = window.confirm(`Xuất bản bài viết "${item.title}"?`);

  if (!confirmed) {
    return;
  }

  await store.publishNews(item);
}

async function handleDelete(item) {
  const confirmed = window.confirm(`Bạn có chắc muốn xóa bài viết "${item.title}" không?`);

  if (!confirmed) {
    return;
  }

  await store.deleteNews(item);
}

function handlePageChange(page) {
  if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
    return;
  }

  store.setPage(page);
}

onMounted(async () => {
  await store.loadData();
});

onBeforeUnmount(() => {
  clearPreviewUrls();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
  @apply rounded-2xl border-l-4 bg-surface p-4 shadow-sm;
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
  @apply text-xs font-medium text-text-light;
}

.stat-value {
  @apply font-mono text-2xl font-bold;
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
  @apply p-3 align-middle;
}

.table-row {
  @apply border-b border-border transition hover:bg-primary/5;
}

.empty-cell {
  @apply p-8 text-center text-text-light;
}

.error-text {
  @apply mt-1 text-sm text-danger;
}
</style>