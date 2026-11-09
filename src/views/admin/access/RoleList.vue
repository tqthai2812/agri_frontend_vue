<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useRoleStore, accessError } from "@/stores/roleStore";
import Service from "@/services/role.service";
import AccessShell from "@/components/access/AccessShell.vue";
import AccessDialog from "@/components/access/AccessDialog.vue";
import AccessFeedback from "@/components/access/AccessFeedback.vue";
import AccessPagination from "@/components/access/AccessPagination.vue";
import RoleForm from "./RoleForm.vue";
const auth = useAuthStore(),
  store = useRoleStore();
const editor = ref(null),
  deleting = ref(null),
  busy = ref(false),
  error = ref(""),
  success = ref("");
let timer;
const system = (role) => ["admin", "staff", "customer"].includes(role.name);
function search() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    store.roleFilters.page = 1;
    void store.fetchRoles();
  }, 300);
}
function page(value) {
  clearTimeout(timer);
  store.roleFilters.page = value;
  void store.fetchRoles();
}
async function saved(message) {
  editor.value = null;
  success.value = message;
  await store.fetchRoles();
}
async function remove() {
  busy.value = true;
  error.value = "";
  try {
    const response = await Service.deleteRole(deleting.value.id);
    deleting.value = null;
    success.value = response.data.message;
    if (store.roles.length === 1 && store.roleFilters.page > 1)
      store.roleFilters.page--;
    await store.fetchRoles();
    await store.refreshAuth();
  } catch (e) {
    error.value = accessError(e);
  } finally {
    busy.value = false;
  }
}
onMounted(() => {
  void store.fetchRoles();
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  store.cancel("roles");
});
</script>
<template>
  <AccessShell
    title="Quản lý vai trò"
    description="Nhóm các quyền theo công việc, rồi gán một hoặc nhiều vai trò cho tài khoản."
  >
    <template #actions
      ><button
        v-if="auth.hasPermission('role.create')"
        class="ac-btn ac-btn-primary"
        @click="editor = { mode: 'create' }"
      >
        <Icon icon="solar:add-circle-bold" />Tạo vai trò
      </button></template
    >
    <AccessFeedback
      :error="error || store.errors.roles"
      :success="success"
      @dismiss="
        error = '';
        success = '';
        store.errors.roles = '';
      "
    />
    <div class="ac-panel">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label class="w-full sm:max-w-xs"
          ><span class="sr-only">Tìm vai trò</span
          ><input
            v-model="store.roleFilters.search"
            type="search"
            class="ac-input"
            placeholder="Tìm tên vai trò…"
            @input="search"
        /></label>
        <div class="flex gap-2">
          <select
            v-model="store.roleFilters.type"
            aria-label="Loại vai trò"
            class="ac-input"
            @change="page(1)"
          >
            <option value="">Tất cả vai trò</option>
            <option value="system">Vai trò hệ thống</option>
            <option value="custom">Vai trò tùy chỉnh</option></select
          ><button
            class="ac-btn shrink-0"
            :disabled="store.loading.roles"
            @click="store.fetchRoles"
          >
            Tải lại
          </button>
        </div>
      </div>
      <div v-if="store.loading.roles" aria-busy="true" class="space-y-3">
        <div v-for="n in 5" :key="n" class="ac-skeleton h-16" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="ac-table min-w-[650px]">
          <thead>
            <tr>
              <th>Vai trò</th>
              <th>Quyền</th>
              <th>Tài khoản</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in store.roles" :key="role.id">
              <td>
                <button
                  class="font-semibold text-left cursor-pointer hover:text-primary"
                  @click="editor = { mode: 'view', role }"
                >
                  {{ role.name }}</button
                ><span class="block mt-2 text-xs text-text-light">{{
                  system(role) ? "Vai trò hệ thống" : "Vai trò tùy chỉnh"
                }}</span>
              </td>
              <td>
                <span class="ac-badge">{{
                  role.name === "admin"
                    ? "Toàn quyền"
                    : `${role.permissions?.length || 0} quyền`
                }}</span>
              </td>
              <td>{{ role.users_count || 0 }} tài khoản</td>
              <td>
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    class="ac-icon"
                    :aria-label="`Xem ${role.name}`"
                    title="Xem chi tiết và thành viên"
                    @click="editor = { mode: 'view', role }"
                  >
                    <Icon icon="solar:eye-bold" />
                  </button>
                  <button
                    v-if="
                      auth.hasPermission('role.update') && role.name !== 'admin'
                    "
                    class="ac-icon"
                    :aria-label="`Sửa ${role.name}`"
                    title="Sửa vai trò"
                    @click="editor = { mode: 'edit', role }"
                  >
                    <Icon icon="solar:pen-bold" />
                  </button>
                  <button
                    v-if="
                      auth.hasPermission('role.create') &&
                      role.name !== 'admin' &&
                      (!role.permissions?.length ||
                        auth.hasPermission('role.assign-permission'))
                    "
                    class="ac-icon"
                    :aria-label="`Sao chép ${role.name}`"
                    title="Sao chép cấu hình"
                    @click="editor = { mode: 'clone', role }"
                  >
                    <Icon icon="solar:copy-bold" />
                  </button>
                  <button
                    v-if="auth.hasPermission('role.delete') && !system(role)"
                    class="ac-icon text-red-600"
                    :aria-label="`Xóa ${role.name}`"
                    :disabled="role.users_count > 0"
                    :title="
                      role.users_count
                        ? 'Cần chuyển các tài khoản khỏi vai trò này trước'
                        : 'Xóa vai trò'
                    "
                    @click="
                      error = '';
                      deleting = role;
                    "
                  >
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.roles.length">
              <td colspan="4" class="ac-empty">
                Không có vai trò phù hợp. Thử tên khác hoặc tạo vai trò mới.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AccessPagination
        :meta="store.roleMeta"
        :busy="store.loading.roles"
        @change="page"
      />
    </div>
    <RoleForm
      v-if="editor"
      :role="editor.role"
      :mode="editor.mode"
      @close="editor = null"
      @saved="saved"
    />
    <AccessDialog
      v-if="deleting"
      title="Xóa vai trò"
      :busy="busy"
      @close="deleting = null"
    >
      <p class="text-sm">
        Xóa vai trò “{{ deleting.name }}”? Vai trò này hiện không có tài khoản
        sử dụng.
      </p>
      <AccessFeedback :error="error" class="mt-4" @dismiss="error = ''" />
      <template #footer
        ><button class="ac-btn" :disabled="busy" @click="deleting = null">
          Hủy</button
        ><button class="ac-btn ac-btn-danger" :disabled="busy" @click="remove">
          {{ busy ? "Đang xóa…" : "Xóa vai trò" }}
        </button></template
      >
    </AccessDialog>
  </AccessShell>
</template>