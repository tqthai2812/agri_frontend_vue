<script setup>
import { Icon } from "@iconify/vue";
import { onBeforeUnmount, onMounted } from "vue";
import { useUserStore } from "@/stores/admin/userStore";
import { useAuthStore } from "@/stores/shared/authStore";
import UserStats from "@/components/admin/users/UserStats.vue";
import UserFilters from "@/components/admin/users/UserFilters.vue";
import UserTable from "@/components/admin/users/UserTable.vue";
import UserPagination from "@/components/admin/users/UserPagination.vue";
import UserModal from "@/components/admin/users/UserModal.vue";

const store = useUserStore();
const authStore = useAuthStore();
let searchTimer = null;

function cancelSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = null;
}

async function runStoreAction(action) {
  try {
    await action();
  } catch {
    // Các thao tác của store đã ghi lỗi vào errorMsg.
  }
}

async function handleReload() {
  cancelSearch();
  await runStoreAction(() => store.loadData());
}

function handleSearch() {
  cancelSearch();
  searchTimer = setTimeout(async () => {
    searchTimer = null;
    store.filters.page = 1;
    await runStoreAction(() => store.fetchUsers());
  }, 350);
}

async function handleFilterChange() {
  cancelSearch();
  store.filters.page = 1;
  await runStoreAction(() => store.fetchUsers());
}

async function handleResetFilters() {
  cancelSearch();
  store.resetFilters();
  await runStoreAction(() => store.fetchUsers());
}

async function handleToggleStatus(user, status) {
  if (store.saving || !authStore.hasPermission("user.update")) return;
  const text = status ? "mở khóa" : "khóa";
  if (!window.confirm(`Bạn có chắc muốn ${text} tài khoản "${user.name}" không?`)) return;
  await runStoreAction(() => store.updateUserStatus(user, status));
}

async function handleDelete(user) {
  if (store.deleting || !authStore.hasPermission("user.delete")) return;
  if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}" không?`)) return;
  await runStoreAction(() => store.deleteUser(user));
}

async function handlePageChange(page) {
  if (store.loading || page < 1 || page > store.meta.last_page || page === store.meta.current_page) return;
  cancelSearch();
  store.filters.page = page;
  await runStoreAction(() => store.fetchUsers());
}

onMounted(() => runStoreAction(() => store.loadData()));
onBeforeUnmount(cancelSearch);
</script>

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
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="store.loading || store.loadingOptions" @click="handleReload">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button type="button" v-if="authStore.hasPermission('user.create')"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving"
          @click="store.openCreateModal">
          <Icon icon="solar:add-circle-bold" />
          Thêm người dùng
        </button>
      </div>
    </div>

    <UserStats />

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
      <UserFilters @search="handleSearch" @filter-change="handleFilterChange" @reset="handleResetFilters" />
      <UserTable @delete="handleDelete" @toggle-status="handleToggleStatus" />
      <UserPagination @change="handlePageChange" />
    </div>
    <UserModal v-if="store.showModal" />
  </div>
</template>