import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import RoleService from "@/services/role.service";

export const useRoleStore = defineStore("role", () => {
  const roles = ref([]);
  const users = ref([]);
  const permissionGroups = ref({});

  const loading = ref(false);
  const loadingUsers = ref(false);

  // Tách loading riêng
  const savingRole = ref(false);
  const assigningRole = ref(false);

  const selectedRole = ref(null);
  const selectedUser = ref(null);
  const userSearch = ref("");

  const form = reactive({
    name: "",
    permissions: [],
  });

  const assignForm = reactive({
    user_id: "",
    roles: [],
  });

  const message = ref("");
  const errorMsg = ref("");

  const errors = reactive({
    name: "",
    permissions: "",
    user_id: "",
    roles: "",
  });

  const totalRoles = computed(() => roles.value.length);

  const totalPermissions = computed(() => {
    return Object.values(permissionGroups.value).reduce((total, group) => {
      return total + group.length;
    }, 0);
  });

  const groupedRoleStats = computed(() => {
    return {
      admin: roles.value.filter((role) => role.name === "admin").length,
      custom: roles.value.filter((role) => role.name !== "admin").length,
      permissions: totalPermissions.value,
      roles: totalRoles.value,
    };
  });

  function clearMessages() {
    message.value = "";
    errorMsg.value = "";

    errors.name = "";
    errors.permissions = "";
    errors.user_id = "";
    errors.roles = "";
  }

  function setErrors(error) {
    const responseErrors = error.response?.data?.errors;

    errors.name = responseErrors?.name?.[0] || "";
    errors.permissions =
      responseErrors?.permissions?.[0] ||
      responseErrors?.["permissions.0"]?.[0] ||
      "";

    errors.user_id = responseErrors?.user_id?.[0] || "";
    errors.roles =
      responseErrors?.roles?.[0] || responseErrors?.["roles.0"]?.[0] || "";

    errorMsg.value =
      error.response?.data?.message ||
      errors.name ||
      errors.permissions ||
      errors.user_id ||
      errors.roles ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  function resetForm() {
    selectedRole.value = null;
    form.name = "";
    form.permissions = [];
    clearMessages();
  }

  function fillForm(role) {
    selectedRole.value = role;
    form.name = role.name;
    form.permissions =
      role.permissions?.map((permission) => permission.name) || [];
    clearMessages();
  }

  function togglePermission(permissionName) {
    const index = form.permissions.indexOf(permissionName);

    if (index >= 0) {
      form.permissions.splice(index, 1);
      return;
    }

    form.permissions.push(permissionName);
  }

  function hasPermissionSelected(permissionName) {
    return form.permissions.includes(permissionName);
  }

  function selectUser(user) {
    selectedUser.value = user;
    assignForm.user_id = user.id;
    assignForm.roles = user.roles ? [...user.roles] : [];
    userSearch.value = `${user.name} - ${user.email}`;
    clearMessages();
  }

  function clearSelectedUser() {
    selectedUser.value = null;
    assignForm.user_id = "";
    assignForm.roles = [];
    userSearch.value = "";
    clearMessages();
  }

  function toggleAssignRole(roleName) {
    const index = assignForm.roles.indexOf(roleName);

    if (index >= 0) {
      assignForm.roles.splice(index, 1);
      return;
    }

    assignForm.roles.push(roleName);
  }

  function hasAssignRoleSelected(roleName) {
    return assignForm.roles.includes(roleName);
  }

  function resetAssignForm() {
    assignForm.user_id = "";
    assignForm.roles = [];
    selectedUser.value = null;
    userSearch.value = "";
    clearMessages();
  }

  async function fetchRoles() {
    loading.value = true;
    clearMessages();

    try {
      const response = await RoleService.getAll();
      roles.value = response.data?.data || [];
      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPermissions() {
    loading.value = true;
    clearMessages();

    try {
      const response = await RoleService.getPermissions();
      permissionGroups.value = response.data?.data || {};
      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUsers(search = "") {
    loadingUsers.value = true;
    clearMessages();

    try {
      const response = await RoleService.getUsers({
        search,
        per_page: 20,
      });

      users.value = response.data?.data || [];

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingUsers.value = false;
    }
  }

  async function loadData() {
    loading.value = true;
    clearMessages();

    try {
      const [rolesResponse, permissionsResponse, usersResponse] =
        await Promise.all([
          RoleService.getAll(),
          RoleService.getPermissions(),
          RoleService.getUsers({
            per_page: 20,
          }),
        ]);

      roles.value = rolesResponse.data?.data || [];
      permissionGroups.value = permissionsResponse.data?.data || {};
      users.value = usersResponse.data?.data || [];

      return {
        roles: rolesResponse,
        permissions: permissionsResponse,
        users: usersResponse,
      };
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function saveRole() {
    savingRole.value = true;
    clearMessages();

    try {
      let response;

      if (selectedRole.value) {
        response = await RoleService.update(selectedRole.value.id, {
          name: form.name,
          permissions: form.permissions,
        });

        message.value =
          response.data?.message || "Cập nhật vai trò thành công.";
      } else {
        response = await RoleService.create({
          name: form.name,
          permissions: form.permissions,
        });

        message.value = response.data?.message || "Tạo vai trò thành công.";
      }

      await fetchRoles();
      resetForm();

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      savingRole.value = false;
    }
  }

  async function deleteRole(role) {
    savingRole.value = true;
    clearMessages();

    try {
      const response = await RoleService.delete(role.id);

      message.value = response.data?.message || "Xóa vai trò thành công.";

      if (selectedRole.value?.id === role.id) {
        resetForm();
      }

      await fetchRoles();

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      savingRole.value = false;
    }
  }

  async function assignRolesToUser() {
    assigningRole.value = true;
    clearMessages();

    try {
      const response = await RoleService.assignRolesToUser(
        assignForm.user_id,
        assignForm.roles,
      );

      message.value =
        response.data?.message || "Gán vai trò cho người dùng thành công.";

      await fetchUsers();

      resetAssignForm();

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      assigningRole.value = false;
    }
  }

  return {
    roles,
    users,
    permissionGroups,

    loading,
    loadingUsers,
    savingRole,
    assigningRole,

    selectedRole,
    selectedUser,
    userSearch,

    form,
    assignForm,

    message,
    errorMsg,
    errors,

    totalRoles,
    totalPermissions,
    groupedRoleStats,

    clearMessages,
    resetForm,
    fillForm,
    togglePermission,
    hasPermissionSelected,

    selectUser,
    clearSelectedUser,
    toggleAssignRole,
    hasAssignRoleSelected,
    resetAssignForm,

    fetchRoles,
    fetchPermissions,
    fetchUsers,
    loadData,
    saveRole,
    deleteRole,
    assignRolesToUser,
  };
});
