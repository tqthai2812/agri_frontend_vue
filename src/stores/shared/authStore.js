import { defineStore } from "pinia";
import { computed, ref } from "vue";
import AuthService from "@/services/shared/auth.service";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const initialized = ref(false);
  const syncError = ref("");
  const lastCheckedAt = ref(0);
  let pending = null;
  let generation = 0;
  const isLoggedIn = computed(() => isAuthenticated.value && !!user.value);
  const isAdmin = computed(() => user.value?.roles?.includes("admin") === true);
  const hasRole = (role) => user.value?.roles?.includes(role) === true;
  const hasPermission = (permission) =>
    user.value?.permissions?.includes(permission) === true;

  function acceptUser(data) {
    user.value = data?.id
      ? {
          ...data,
          roles: data.roles || [],
          permissions: data.permissions || [],
        }
      : null;
    isAuthenticated.value = !!user.value;
    initialized.value = true;
    syncError.value = "";
    lastCheckedAt.value = Date.now();
    localStorage.removeItem("auth_user");
    return user.value;
  }

  function clearAuthData() {
    generation++;
    acceptUser(null);
  }

  // Compatibility method: the server is the only source of session/access state.
  function loadUserFromStorage() {
    return ensureSession();
  }

  async function fetchUser({ force = true } = {}) {
    if (pending) return pending;
    if (
      !force &&
      initialized.value &&
      Date.now() - lastCheckedAt.value < 30_000
    )
      return user.value;
    const epoch = generation;
    const request = (async () => {
      try {
        const response = await AuthService.getUser();
        if (epoch !== generation) return user.value;
        return acceptUser(response.data?.user ?? response.data);
      } catch (error) {
        if (epoch !== generation) return user.value;
        if (
          error.response?.status === 401 ||
          error.response?.data?.code === "ACCOUNT_INACTIVE"
        )
          return acceptUser(null);
        // A network/server error must not impersonate a logged-out session.
        syncError.value =
          "Không thể xác minh phiên đăng nhập. Vui lòng thử lại.";
        throw error;
      }
    })();
    pending = request;
    try {
      return await request;
    } finally {
      if (pending === request) pending = null;
    }
  }

  const ensureSession = () => fetchUser({ force: false });
  async function action(callback) {
    loading.value = true;
    try {
      return await callback();
    } finally {
      loading.value = false;
    }
  }
  const sendRegisterCode = (email) =>
    action(() => AuthService.sendRegisterCode(email));
  const verifyRegisterCode = (email, code) =>
    action(() => AuthService.verifyRegisterCode(email, code));
  const forgotPassword = (email) =>
    action(() => AuthService.forgotPassword(email));
  const resetPassword = (form) => action(() => AuthService.resetPassword(form));
  const register = (form) =>
    action(async () => {
      const response = await AuthService.register(form);
      generation++;
      acceptUser(response.data?.user);
      return response;
    });
  const login = (email, password, remember = false) =>
    action(async () => {
      const response = await AuthService.login(email, password, remember);
      generation++;
      if (response.data?.user?.id)
        return { data: { user: acceptUser(response.data.user) } };
      const data = await fetchUser();
      if (!data)
        throw new Error(
          "Không thể xác minh phiên đăng nhập sau khi đăng nhập.",
        );
      return { data: { user: data } };
    });
  const logout = () =>
    action(async () => {
      // Keep local authentication on a network failure so the user can retry logout.
      try {
        await AuthService.logout();
      } catch (error) {
        if (error.response?.status !== 401) throw error;
      }
      clearAuthData();
      window.dispatchEvent(new Event("auth:changed"));
      localStorage.setItem("auth_sync", String(Date.now()));
    });

  return {
    user,
    isAuthenticated,
    loading,
    initialized,
    syncError,
    lastCheckedAt,
    isLoggedIn,
    isAdmin,
    hasRole,
    hasPermission,
    fetchUser,
    ensureSession,
    loadUserFromStorage,
    clearAuthData,
    sendRegisterCode,
    verifyRegisterCode,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };
});