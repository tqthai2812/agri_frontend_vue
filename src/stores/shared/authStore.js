import { defineStore } from "pinia";
import { ref, computed } from "vue";
import AuthService from "@/services/shared/auth.service";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);

  const isLoggedIn = computed(() => isAuthenticated.value && !!user.value);

  const isAdmin = computed(() => {
    return user.value?.roles?.includes("admin") || user.value?.role === "admin";
  });

  function saveUserToStorage(userData) {
    if (userData) {
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("auth_user");
    }
  }

  function clearAuthData() {
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem("auth_user");
  }

  function hasRole(role) {
    return user.value?.roles?.includes(role) || user.value?.role === role;
  }

  function hasPermission(permission) {
    return user.value?.permissions?.includes(permission);
  }

  function loadUserFromStorage() {
    const stored = localStorage.getItem("auth_user");

    if (!stored || stored === "undefined" || stored === "null") {
      clearAuthData();
      return;
    }

    try {
      const parsedUser = JSON.parse(stored);

      user.value = parsedUser;
      isAuthenticated.value = !!parsedUser;
    } catch (error) {
      console.error("Lỗi đọc auth_user từ localStorage:", error);
      clearAuthData();
    }
  }

  async function sendRegisterCode(email) {
    loading.value = true;

    try {
      return await AuthService.sendRegisterCode(email);
    } catch (error) {
      console.error("Send register code failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function verifyRegisterCode(email, code) {
    loading.value = true;

    try {
      return await AuthService.verifyRegisterCode(email, code);
    } catch (error) {
      console.error("Verify register code failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function register(form) {
    loading.value = true;

    try {
      const response = await AuthService.register(form);

      user.value = response.data.user || null;
      isAuthenticated.value = !!user.value;

      saveUserToStorage(user.value);

      return response;
    } catch (error) {
      console.error("Register failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function login(email, password, remember = false) {
    loading.value = true;

    try {
      await AuthService.login(email, password, remember);

      const userData = await fetchUser();

      if (!userData) {
        throw new Error(
          "Không thể lấy thông tin người dùng sau đăng nhập. Kiểm tra cookie.",
        );
      }

      return {
        data: {
          user: userData,
        },
      };
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;

    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearAuthData();
      loading.value = false;
    }
  }

  async function fetchUser() {
    try {
      const response = await AuthService.getUser();

      const userData = response.data?.user || response.data || null;

      user.value = userData;
      isAuthenticated.value = !!user.value;

      saveUserToStorage(user.value);

      return userData;
    } catch (error) {
      clearAuthData();
      return null;
    }
  }

  async function forgotPassword(email) {
    loading.value = true;

    try {
      return await AuthService.forgotPassword(email);
    } catch (error) {
      console.error("Forgot password failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(form) {
    loading.value = true;

    try {
      return await AuthService.resetPassword(form);
    } catch (error) {
      console.error("Reset password failed", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    isAuthenticated,
    loading,

    isLoggedIn,
    isAdmin,
    hasRole,
    hasPermission,

    sendRegisterCode,
    verifyRegisterCode,
    register,
    login,
    logout,
    fetchUser,
    forgotPassword,
    resetPassword,
    loadUserFromStorage,
    clearAuthData,
  };
});
