import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import UserService from "@/services/admin/user.service";

export const useUserStore = defineStore("user", () => {
  const users = ref([]);
  const roles = ref([]);

  const selectedUser = ref(null);

  const loading = ref(false);
  const loadingOptions = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const showModal = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const avatarPreview = ref("");

  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const filters = reactive({
    search: "",
    role: "",
    is_active: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirmation: "",
    avatar: null,
    is_active: true,
    roles: [],
  });

  const activeUsers = computed(() => {
    return users.value.filter((user) => user.is_active);
  });

  const inactiveUsers = computed(() => {
    return users.value.filter((user) => !user.is_active);
  });

  const adminUsers = computed(() => {
    return users.value.filter(
      (user) => user.roles?.includes("admin") || user.role === "admin",
    );
  });

  const customerUsers = computed(() => {
    return users.value.filter(
      (user) => user.roles?.includes("customer") || user.role === "customer",
    );
  });

  function clearMessages() {
    message.value = "";
    errorMsg.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function setErrors(error) {
    clearMessages();

    const responseErrors = error.response?.data?.errors || {};

    Object.keys(responseErrors).forEach((key) => {
      errors[key] = responseErrors[key]?.[0] || "";
    });

    errorMsg.value =
      error.response?.data?.message ||
      Object.values(errors)[0] ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  function resetForm() {
    selectedUser.value = null;

    form.name = "";
    form.email = "";
    form.phone_number = "";
    form.password = "";
    form.password_confirmation = "";
    form.avatar = null;
    form.is_active = true;
    form.roles = [];

    if (avatarPreview.value && avatarPreview.value.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview.value);
    }

    avatarPreview.value = "";

    clearMessages();
  }

  function openCreateModal() {
    resetForm();
    showModal.value = true;
  }

  async function openEditModal(user) {
    loading.value = true;
    clearMessages();

    try {
      const response = await UserService.getUser(user.id);
      const data = response.data?.data || user;

      selectedUser.value = data;

      form.name = data.name || "";
      form.email = data.email || "";
      form.phone_number = data.phone_number || "";
      form.password = "";
      form.password_confirmation = "";
      form.avatar = null;
      form.is_active = Boolean(data.is_active);
      form.roles = Array.isArray(data.roles) ? [...data.roles] : [];

      avatarPreview.value = data.avatar_url || "";

      showModal.value = true;
    } catch (error) {
      setErrors(error);
    } finally {
      loading.value = false;
    }
  }

  function closeModal() {
    showModal.value = false;
    resetForm();
  }

  function setAvatar(file) {
    form.avatar = file || null;

    if (avatarPreview.value && avatarPreview.value.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview.value);
    }

    avatarPreview.value = file
      ? URL.createObjectURL(file)
      : selectedUser.value?.avatar_url || "";
  }

  function buildFormData() {
    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone_number", form.phone_number || "");
    formData.append("is_active", form.is_active ? "1" : "0");

    if (form.password) {
      formData.append("password", form.password);
      formData.append("password_confirmation", form.password_confirmation);
    }

    if (form.avatar) {
      formData.append("avatar", form.avatar);
    }

    formData.append("roles", JSON.stringify(form.roles));

    return formData;
  }

  async function fetchUsers() {
    loading.value = true;
    clearMessages();

    try {
      const response = await UserService.getUsers({
        search: filters.search || undefined,
        role: filters.role || undefined,
        is_active: filters.is_active !== "" ? filters.is_active : undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      users.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || users.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    loadingOptions.value = true;

    try {
      const response = await UserService.getRoles();

      roles.value = response.data?.data || [];

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingOptions.value = false;
    }
  }

  async function loadData() {
    await Promise.all([fetchUsers(), fetchRoles()]);
  }

  async function saveUser() {
    saving.value = true;
    clearMessages();

    try {
      const formData = buildFormData();
      let response;

      if (selectedUser.value) {
        response = await UserService.updateUser(
          selectedUser.value.id,
          formData,
        );
        message.value =
          response.data?.message || "Cập nhật người dùng thành công.";
      } else {
        response = await UserService.createUser(formData);
        message.value = response.data?.message || "Thêm người dùng thành công.";
      }

      const successMessage = message.value;

      await fetchUsers();

      showModal.value = false;
      resetForm();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteUser(user) {
    deleting.value = true;
    clearMessages();

    try {
      const response = await UserService.deleteUser(user.id);

      const successMessage =
        response.data?.message || "Xóa người dùng thành công.";

      await fetchUsers();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  async function updateUserStatus(user, isActive) {
    saving.value = true;
    clearMessages();

    try {
      const formData = new FormData();
      formData.append("is_active", isActive ? "1" : "0");

      const response = await UserService.updateUser(user.id, formData);

      const successMessage =
        response.data?.message ||
        (isActive
          ? "Mở khóa tài khoản thành công."
          : "Khóa tài khoản thành công.");

      await fetchUsers();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  function setPage(page) {
    filters.page = page;
    fetchUsers();
  }

  function resetFilters() {
    filters.search = "";
    filters.role = "";
    filters.is_active = "";
    filters.page = 1;
  }

  return {
    users,
    roles,

    selectedUser,

    loading,
    loadingOptions,
    saving,
    deleting,

    showModal,

    message,
    errorMsg,
    errors,

    avatarPreview,

    meta,
    filters,
    form,

    activeUsers,
    inactiveUsers,
    adminUsers,
    customerUsers,

    clearMessages,
    setErrors,
    fieldError,

    resetForm,
    openCreateModal,
    openEditModal,
    closeModal,

    setAvatar,

    fetchUsers,
    fetchRoles,
    loadData,

    saveUser,
    deleteUser,
    updateUserStatus,

    setPage,
    resetFilters,
  };
});
