<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Quản lý người dùng</h1>
        <p class="text-text-light text-sm">
          Quản lý tài khoản, trạng thái và vai trò người dùng.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="btn-outline-sm" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button v-if="authStore.hasPermission('user.create')" class="btn-primary" @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm người dùng
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="stat-card-info">
        <div class="stat-label">Tổng người dùng</div>
        <div class="stat-value text-info">{{ store.meta.total }}</div>
      </div>

      <div class="stat-card-success">
        <div class="stat-label">Đang hoạt động</div>
        <div class="stat-value text-success">{{ store.activeUsers.length }}</div>
      </div>

      <div class="stat-card-danger">
        <div class="stat-label">Đã khóa</div>
        <div class="stat-value text-danger">{{ store.inactiveUsers.length }}</div>
      </div>

      <div class="stat-card-warning">
        <div class="stat-label">Admin</div>
        <div class="stat-value">{{ store.adminUsers.length }}</div>
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

          <input v-model.trim="store.filters.search" type="text" placeholder="Tìm tên, email, số điện thoại..."
            class="search-input" @input="handleSearch" />
        </div>

        <select v-model="store.filters.role" class="filter-select flex-1 sm:flex-none" @change="handleFilterChange">
          <option value="">Tất cả vai trò</option>
          <option v-for="role in store.roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>

        <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
          @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đã khóa</option>
        </select>

        <button class="btn-outline-sm" @click="handleResetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải người dùng...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead class="bg-bg">
            <tr>
              <th class="table-th">Người dùng</th>
              <th class="table-th">Liên hệ</th>
              <th class="table-th">Vai trò</th>
              <th class="table-th">Trạng thái</th>
              <th class="table-th">Email xác thực</th>
              <th class="table-th">Ngày tạo</th>
              <th class="table-th">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in store.users" :key="user.id" class="table-row">
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold shrink-0">
                    <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name"
                      class="w-full h-full object-cover" />

                    <span v-else>{{ getInitials(user.name) }}</span>
                  </div>

                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate max-w-[260px]">
                      {{ user.name }}
                    </div>

                    <div class="text-xs text-text-light">
                      ID: {{ user.id }}
                    </div>

                    <div class="text-xs text-text-light">
                      {{ user.role || "customer" }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="table-td">
                <div class="space-y-1">
                  <div class="text-sm">{{ user.email }}</div>

                  <a v-if="user.phone_number" :href="`tel:${user.phone_number}`" class="text-primary text-xs">
                    {{ user.phone_number }}
                  </a>

                  <span v-else class="text-xs text-text-light">Chưa có số điện thoại</span>
                </div>
              </td>

              <td class="table-td">
                <div class="flex flex-wrap gap-1">
                  <span v-for="role in user.roles" :key="role" class="badge-gray">
                    {{ role }}
                  </span>

                  <span v-if="!user.roles?.length" class="text-sm text-text-light">
                    Chưa có vai trò
                  </span>
                </div>
              </td>

              <td class="table-td">
                <span :class="user.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ user.is_active ? "Đang hoạt động" : "Đã khóa" }}
                </span>
              </td>

              <td class="table-td">
                <span :class="user.email_verified_at ? 'badge-active' : 'badge-pending'">
                  {{ user.email_verified_at ? "Đã xác thực" : "Chưa xác thực" }}
                </span>
              </td>

              <td class="table-td text-sm text-text-light">
                {{ formatDate(user.created_at) }}
              </td>

              <td class="table-td">
                <div class="flex gap-2">
                  <button class="btn-outline-icon" title="Xem / sửa" @click="store.openEditModal(user)">
                    <Icon icon="solar:eye-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('user.update')" class="btn-outline-icon" title="Sửa người dùng"
                    @click="store.openEditModal(user)">
                    <Icon icon="solar:pen-bold" />
                  </button>

                  <button v-if="authStore.hasPermission('user.update') && user.is_active"
                    class="btn-outline-icon text-warning" title="Khóa tài khoản" :disabled="store.saving"
                    @click="handleToggleStatus(user, false)">
                    <Icon icon="solar:lock-keyhole-bold-duotone" />
                  </button>

                  <button v-if="authStore.hasPermission('user.update') && !user.is_active"
                    class="btn-outline-icon text-success" title="Mở khóa tài khoản" :disabled="store.saving"
                    @click="handleToggleStatus(user, true)">
                    <Icon icon="solar:lock-keyhole-unlocked-bold-duotone" />
                  </button>

                  <button v-if="authStore.hasPermission('user.delete')" class="btn-danger-icon" title="Xóa người dùng"
                    :disabled="store.deleting" @click="handleDelete(user)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!store.users.length">
              <td colspan="7" class="empty-cell">
                Không có người dùng nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.users.length }} / {{ store.meta.total }} người dùng
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

    <!-- User Modal -->
    <div v-if="store.showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="store.closeModal">
      <div class="bg-surface rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 class="text-xl font-bold">
              {{ store.selectedUser ? "Cập nhật người dùng" : "Thêm người dùng mới" }}
            </h2>
            <p class="text-sm text-text-light">
              Quản lý thông tin tài khoản, trạng thái và vai trò.
            </p>
          </div>

          <button class="btn-outline-icon" @click="store.closeModal">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </div>

        <form class="p-6 space-y-6" @submit.prevent="handleSave">
          <div v-if="store.errorMsg"
            class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
          </div>

          <!-- Avatar -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Avatar</h3>
                <p class="section-desc">Ảnh đại diện người dùng.</p>
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <span class="text-sm text-text-sec">Tài khoản hoạt động</span>
                <label class="toggle">
                  <input v-model="store.form.is_active" type="checkbox" />
                  <span class="toggle-slider"></span>
                </label>
              </label>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                class="w-24 h-24 rounded-2xl overflow-hidden bg-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
                <img v-if="store.avatarPreview" :src="store.avatarPreview" class="w-full h-full object-cover"
                  alt="Avatar preview" />

                <span v-else>{{ getInitials(store.form.name || "U") }}</span>
              </div>

              <div>
                <button type="button" class="btn-outline-sm" @click="avatarInput?.click()">
                  <Icon icon="solar:cloud-upload-bold" />
                  Chọn avatar
                </button>

                <input ref="avatarInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" class="hidden"
                  @change="handleAvatarChange" />

                <p class="text-xs text-text-light mt-2">
                  JPG, JPEG, PNG, WEBP. Tối đa 2MB.
                </p>

                <p v-if="store.fieldError('avatar')" class="error-text">
                  {{ store.fieldError("avatar") }}
                </p>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Thông tin tài khoản</h3>
                <p class="section-desc">Thông tin cơ bản của người dùng.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">
                  Họ tên <span class="text-primary">*</span>
                </label>

                <input v-model.trim="store.form.name" class="form-control" placeholder="Nguyễn Văn A" />

                <p v-if="store.fieldError('name')" class="error-text">
                  {{ store.fieldError("name") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Email <span class="text-primary">*</span>
                </label>

                <input v-model.trim="store.form.email" type="email" class="form-control"
                  placeholder="example@gmail.com" />

                <p v-if="store.fieldError('email')" class="error-text">
                  {{ store.fieldError("email") }}
                </p>
              </div>

              <div class="form-group md:col-span-2">
                <label class="form-label">Số điện thoại</label>

                <input v-model.trim="store.form.phone_number" class="form-control" placeholder="090xxxxxxx" />

                <p v-if="store.fieldError('phone_number')" class="error-text">
                  {{ store.fieldError("phone_number") }}
                </p>
              </div>
            </div>
          </div>

          <!-- Password -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Mật khẩu</h3>
                <p class="section-desc">
                  {{ store.selectedUser ? "Bỏ trống nếu không muốn đổi mật khẩu." : "Tạo mật khẩu cho tài khoản mới." }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">
                  Mật khẩu
                  <span v-if="!store.selectedUser" class="text-primary">*</span>
                </label>

                <input v-model="store.form.password" type="password" class="form-control"
                  placeholder="Tối thiểu 8 ký tự" />

                <p v-if="store.fieldError('password')" class="error-text">
                  {{ store.fieldError("password") }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Xác nhận mật khẩu
                  <span v-if="!store.selectedUser" class="text-primary">*</span>
                </label>

                <input v-model="store.form.password_confirmation" type="password" class="form-control"
                  placeholder="Nhập lại mật khẩu" />
              </div>
            </div>
          </div>

          <!-- Roles -->
          <div class="section-card">
            <div class="section-header">
              <div>
                <h3 class="section-title">Vai trò</h3>
                <p class="section-desc">Chọn vai trò cho người dùng.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label v-for="role in store.roles" :key="role.id" class="role-option"
                :class="{ active: store.form.roles.includes(role.name) }">
                <input v-model="store.form.roles" type="checkbox" :value="role.name" class="hidden" />

                <Icon icon="solar:shield-bold-duotone" class="text-xl" />
                <span>{{ role.name }}</span>
              </label>
            </div>

            <p v-if="store.fieldError('roles')" class="error-text">
              {{ store.fieldError("roles") }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button type="button" class="btn-outline" @click="store.closeModal">
              Hủy
            </button>

            <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="store.saving || !canSave">
              <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                :class="store.saving ? 'animate-spin' : ''" />

              {{ store.saving ? "Đang lưu..." : "Lưu người dùng" }}
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
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";

const store = useUserStore();
const authStore = useAuthStore();

const avatarInput = ref(null);
let searchTimer = null;

const canSave = computed(() => {
  if (store.selectedUser) {
    return authStore.hasPermission("user.update");
  }

  return authStore.hasPermission("user.create");
});

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

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("vi-VN");
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
    await store.fetchUsers();
  }, 350);
}

async function handleFilterChange() {
  store.filters.page = 1;
  await store.fetchUsers();
}

async function handleResetFilters() {
  store.resetFilters();
  await store.fetchUsers();
}

function handleAvatarChange(event) {
  const file = event.target.files?.[0] || null;
  store.setAvatar(file);
}

async function handleSave() {
  await store.saveUser();
}

async function handleToggleStatus(user, status) {
  const text = status ? "mở khóa" : "khóa";

  const confirmed = window.confirm(
    `Bạn có chắc muốn ${text} tài khoản "${user.name}" không?`,
  );

  if (!confirmed) {
    return;
  }

  await store.updateUserStatus(user, status);
}

async function handleDelete(user) {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa người dùng "${user.name}" không?`,
  );

  if (!confirmed) {
    return;
  }

  await store.deleteUser(user);
}

async function handlePageChange(page) {
  if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
    return;
  }

  store.setPage(page);
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

.section-card {
  @apply rounded-2xl border border-border p-5 bg-surface shadow-sm;
}

.section-header {
  @apply flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5;
}

.section-title {
  @apply text-lg font-bold text-text;
}

.section-desc {
  @apply text-sm text-text-light;
}

.error-text {
  @apply text-danger text-sm mt-1;
}

.role-option {
  @apply flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold cursor-pointer hover:border-primary hover:text-primary transition;
}

.role-option.active {
  @apply bg-primary/10 border-primary text-primary;
}
</style>