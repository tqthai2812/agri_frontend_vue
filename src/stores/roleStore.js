import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import RoleService from "@/services/role.service";
import { useAuthStore } from "@/stores/shared/authStore";

export function accessError(
  error,
  fallback = "Không thể hoàn thành thao tác. Vui lòng thử lại.",
) {
  return (
    Object.values(error?.response?.data?.errors || {}).flat()[0] ||
    error?.response?.data?.message ||
    fallback
  );
}

export const useRoleStore = defineStore("role", () => {
  const roles = ref([]),
    permissionGroups = ref({}),
    users = ref([]),
    roleOptions = ref([]);
  const loading = reactive({
    roles: false,
    permissions: false,
    users: false,
    options: false,
  });
  const errors = reactive({
    roles: "",
    permissions: "",
    users: "",
    options: "",
  });
  const roleFilters = reactive({ search: "", type: "", per_page: 10, page: 1 });
  const userFilters = reactive({
    search: "",
    role: "",
    is_active: "",
    per_page: 15,
    page: 1,
  });
  const roleMeta = reactive({ current_page: 1, last_page: 1, total: 0 });
  const userMeta = reactive({ current_page: 1, last_page: 1, total: 0 });
  const auth = useAuthStore();
  const controllers = new Map();
  let catalogRequest = null;

  async function list(kind, call, assign) {
    controllers.get(kind)?.abort();
    const controller = new AbortController();
    controllers.set(kind, controller);
    loading[kind] = true;
    errors[kind] = "";
    try {
      const response = await call({ signal: controller.signal });
      if (controllers.get(kind) === controller) assign(response.data);
      return response;
    } catch (error) {
      if (controllers.get(kind) === controller && error.code !== "ERR_CANCELED")
        errors[kind] = accessError(error);
    } finally {
      if (controllers.get(kind) === controller) {
        loading[kind] = false;
        controllers.delete(kind);
      }
    }
  }
  const fetchRoles = () =>
    list(
      "roles",
      (config) => RoleService.getRoles({ ...roleFilters }, config),
      (body) => {
        roles.value = body.data || [];
        Object.assign(roleMeta, body.meta || {});
      },
    );
  const fetchUsers = () =>
    list(
      "users",
      (config) =>
        RoleService.getUsers(
          { ...userFilters, is_active: userFilters.is_active || undefined },
          config,
        ),
      (body) => {
        users.value = body.data || [];
        Object.assign(userMeta, body.meta || {});
      },
    );
  const fetchRoleOptions = () =>
    list(
      "options",
      (config) => RoleService.getRoles({ options: 1 }, config),
      (body) => {
        roleOptions.value = body.data || [];
      },
    );
  async function fetchPermissions() {
    if (catalogRequest) return catalogRequest;
    if (
      ![
        "permission.view",
        "role.assign-permission",
        "user.assign-permission",
      ].some(auth.hasPermission)
    )
      return;
    catalogRequest = list(
      "permissions",
      (config) => RoleService.getPermissions(config),
      (body) => {
        permissionGroups.value = body.data || {};
      },
    );
    try {
      return await catalogRequest;
    } finally {
      catalogRequest = null;
    }
  }
  async function refreshAuth() {
    try {
      await auth.fetchUser();
    } catch {
      /* AuthStore displays the verification failure; next guarded navigation retries. */
    }
    window.dispatchEvent(new Event("auth:changed"));
    localStorage.setItem("auth_sync", String(Date.now()));
  }
  function patchUser(data) {
    const index = users.value.findIndex((u) => u.id === data.id);
    if (index >= 0) users.value[index] = data;
  }
  function cancel(kind) {
    controllers.get(kind)?.abort();
    controllers.delete(kind);
    loading[kind] = false;
  }
  async function loadData() {
    await Promise.allSettled([
      auth.hasPermission("role.view") ? fetchRoles() : Promise.resolve(),
      fetchPermissions(),
    ]);
  }
  return {
    roles,
    permissionGroups,
    users,
    roleOptions,
    loading,
    errors,
    roleFilters,
    userFilters,
    roleMeta,
    userMeta,
    fetchRoles,
    fetchPermissions,
    fetchUsers,
    fetchRoleOptions,
    loadData,
    refreshAuth,
    patchUser,
    cancel,
  };
});