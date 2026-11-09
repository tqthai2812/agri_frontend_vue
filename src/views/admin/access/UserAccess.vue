<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { accessError, useRoleStore } from "@/stores/roleStore";
import Service from "@/services/role.service";
import AccessShell from "@/components/access/AccessShell.vue";
import AccessFeedback from "@/components/access/AccessFeedback.vue";
import AccessPagination from "@/components/access/AccessPagination.vue";
import AccessDialog from "@/components/access/AccessDialog.vue";
import RoleAssignModal from "@/components/access/RoleAssignModal.vue";
import UserPermissionDrawer from "@/components/access/UserPermissionDrawer.vue";
const auth = useAuthStore(),
  store = useRoleStore();
const selected = ref(null),
  mode = ref(""),
  opening = ref(null),
  error = ref(""),
  success = ref("");
const selectedSearch = ref("");
const effective = computed(() =>
  (selected.value?.permissions || []).filter((name) =>
    name.toLowerCase().includes(selectedSearch.value.toLowerCase()),
  ),
);
let timer,
  openSequence = 0;
function search() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    store.userFilters.page = 1;
    void store.fetchUsers();
  }, 300);
}
function page(value) {
  clearTimeout(timer);
  store.userFilters.page = value;
  void store.fetchUsers();
}
async function open(user, nextMode) {
  const sequence = ++openSequence;
  opening.value = user.id;
  error.value = "";
  try {
    const response = await Service.getUser(user.id);
    if (sequence !== openSequence) return;
    selected.value = response.data.data;
    mode.value = nextMode;
    selectedSearch.value = "";
  } catch (e) {
    if (sequence === openSequence) error.value = accessError(e);
  } finally {
    if (sequence === openSequence) opening.value = null;
  }
}
function saved(user) {
  store.patchUser(user);
  selected.value = null;
  mode.value = "";
  success.value = "Đã cập nhật quyền truy cập của tài khoản.";
}
onMounted(() => {
  void store.fetchUsers();
  void store.fetchRoleOptions();
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  openSequence++;
  store.cancel("users");
});
</script>
<template>
  <AccessShell
    title="Phân quyền tài khoản"
    description="Xem quyền thực tế, gán nhiều vai trò và bổ sung quyền trực tiếp cho các trường hợp cần thiết."
  >
    <AccessFeedback
      :error="error || store.errors.users"
      :success="success"
      @dismiss="
        error = '';
        success = '';
        store.errors.users = '';
      "
    />
    <div class="ac-panel">
      <div
        class="grid gap-3 mb-5 sm:grid-cols-2 xl:grid-cols-[1fr_200px_180px_auto]"
      >
        <label
          ><span class="sr-only">Tìm tài khoản</span
          ><input
            v-model="store.userFilters.search"
            type="search"
            class="ac-input"
            placeholder="Tìm tên hoặc email…"
            @input="search"
        /></label>
        <select
          v-model="store.userFilters.role"
          class="ac-input"
          aria-label="Lọc vai trò"
          :disabled="store.loading.options"
          @change="page(1)"
        >
          <option value="">Tất cả vai trò</option>
          <option
            v-for="role in store.roleOptions"
            :key="role.id"
            :value="role.name"
          >
            {{ role.name }}
          </option>
        </select>
        <select
          v-model="store.userFilters.is_active"
          class="ac-input"
          aria-label="Lọc trạng thái"
          @change="page(1)"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đã khóa</option>
        </select>
        <button
          class="ac-btn"
          :disabled="store.loading.users"
          @click="store.fetchUsers"
        >
          Tải lại
        </button>
      </div>
      <p
        v-if="store.errors.options"
        class="text-sm text-red-600 mb-3"
        role="alert"
      >
        {{ store.errors.options }}
      </p>
      <div v-if="store.loading.users" class="space-y-3" aria-busy="true">
        <div v-for="n in 5" :key="n" class="ac-skeleton h-16" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="ac-table min-w-[760px]">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Vai trò</th>
              <th>Quyền thực tế</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in store.users" :key="user.id">
              <td>
                <div class="flex gap-3 items-center">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.name"
                    class="size-10 object-cover rounded-full"
                  /><span
                    v-else
                    class="size-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center font-bold"
                    >{{ user.name?.slice(0, 1) }}</span
                  >
                  <div>
                    <strong>{{ user.name }}</strong
                    ><span
                      v-if="user.id === auth.user?.id"
                      class="ml-2 text-xs text-primary"
                      >Bạn</span
                    >
                    <p class="text-xs text-text-light mt-1">{{ user.email }}</p>
                    <p
                      class="text-xs mt-1"
                      :class="
                        user.is_active ? 'text-green-700' : 'text-text-light'
                      "
                    >
                      {{ user.is_active ? "Đang hoạt động" : "Đã khóa" }}
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in user.roles"
                    :key="role"
                    class="ac-badge"
                    >{{ role }}</span
                  ><span
                    v-if="!user.roles?.length"
                    class="text-text-light text-xs"
                    >Chưa có vai trò</span
                  >
                </div>
              </td>
              <td>
                <span class="font-semibold">{{
                  user.is_super_admin
                    ? "Toàn quyền"
                    : `${user.permissions.length} quyền`
                }}</span>
                <p class="text-xs text-text-light mt-1">
                  {{ user.direct_permissions.length }} quyền trực tiếp
                </p>
              </td>
              <td>
                <div class="flex justify-end flex-wrap gap-2">
                  <button
                    class="ac-btn"
                    :disabled="opening === user.id"
                    @click="open(user, 'view')"
                  >
                    Xem quyền
                  </button>
                  <button
                    v-if="auth.hasPermission('user.assign-role')"
                    class="ac-btn"
                    :disabled="opening === user.id || !user.can_assign_roles"
                    @click="open(user, 'roles')"
                  >
                    Gán vai trò
                  </button>
                  <button
                    v-if="auth.hasPermission('user.assign-permission')"
                    class="ac-btn"
                    :disabled="
                      opening === user.id || !user.can_assign_permissions
                    "
                    @click="open(user, 'direct')"
                  >
                    Quyền trực tiếp
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.users.length">
              <td colspan="4" class="ac-empty">Không có tài khoản phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AccessPagination
        :meta="store.userMeta"
        :busy="store.loading.users"
        @change="page"
      />
    </div>
    <RoleAssignModal
      v-if="selected && mode === 'roles'"
      :user="selected"
      @close="selected = null"
      @saved="saved"
    />
    <UserPermissionDrawer
      v-if="selected && mode === 'direct'"
      :user="selected"
      @close="selected = null"
      @saved="saved"
    />
    <AccessDialog
      v-if="selected && mode === 'view'"
      title="Quyền truy cập thực tế"
      wide
      @close="selected = null"
    >
      <div class="space-y-5">
        <div>
          <h3 class="font-semibold">{{ selected.name }}</h3>
          <p class="text-xs text-text-light mt-1">{{ selected.email }}</p>
        </div>
        <p
          v-if="selected.is_super_admin"
          class="rounded-xl bg-primary/5 text-primary p-4 text-sm"
        >
          Admin có toàn quyền hệ thống qua Gate.
        </p>
        <section>
          <h3 class="text-sm font-bold mb-3">Quyền kế thừa theo vai trò</h3>
          <details
            v-for="role in selected.role_permissions"
            :key="role.id"
            class="rounded-xl border border-border p-4 mb-2"
          >
            <summary class="text-sm font-semibold cursor-pointer">
              {{ role.name }}
              <span class="text-text-light font-normal"
                >· {{ role.permissions.length }} quyền tường minh</span
              >
            </summary>
            <div class="flex flex-wrap gap-2 mt-3">
              <code
                v-for="name in role.permissions"
                :key="name"
                class="ac-badge break-all"
                >{{ name }}</code
              ><span
                v-if="!role.permissions.length"
                class="text-xs text-text-light"
                >Vai trò chưa gán quyền tường minh.</span
              >
            </div>
          </details>
          <p
            v-if="!selected.role_permissions.length"
            class="text-sm text-text-light"
          >
            Chưa có vai trò.
          </p>
        </section>
        <section>
          <h3 class="text-sm font-bold mb-3">
            Quyền cấp trực tiếp · {{ selected.direct_permissions.length }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <code
              v-for="name in selected.direct_permissions"
              :key="name"
              class="ac-badge break-all"
              >{{ name }}</code
            ><span
              v-if="!selected.direct_permissions.length"
              class="text-xs text-text-light"
              >Chưa có quyền trực tiếp.</span
            >
          </div>
        </section>
        <section class="border-t border-border pt-4">
          <h3 class="text-sm font-bold mb-3">
            Tổng quyền thực tế · {{ selected.permissions.length }}
          </h3>
          <input
            v-model="selectedSearch"
            type="search"
            class="ac-input mb-3"
            aria-label="Tìm quyền thực tế"
            placeholder="Tìm mã quyền…"
          />
          <ul class="grid sm:grid-cols-2 gap-2">
            <li
              v-for="name in effective"
              :key="name"
              class="rounded-lg border border-border px-3 py-2 text-xs"
            >
              <code class="break-all">{{ name }}</code
              ><span class="block mt-1 text-text-light">{{
                selected.is_super_admin
                  ? "Admin / Gate"
                  : [
                      selected.inherited_permissions.includes(name)
                        ? "Từ vai trò"
                        : "",
                      selected.direct_permissions.includes(name)
                        ? "Trực tiếp"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" + ")
              }}</span>
            </li>
          </ul>
          <p v-if="!effective.length" class="text-sm text-text-light">
            Không có quyền phù hợp.
          </p>
        </section>
      </div>
      <template #footer
        ><button class="ac-btn" @click="selected = null">Đóng</button></template
      >
    </AccessDialog>
  </AccessShell>
</template>