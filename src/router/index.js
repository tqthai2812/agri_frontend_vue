import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

// Import các module routes
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/client";
import sharedRoutes from "./routes/shared";

// Gộp tất cả routes
const routes = [
  ...authRoutes, // Login/Register trước để tránh conflict với path "/"
  ...clientRoutes,
  ...adminRoutes,
  ...sharedRoutes, // Catch-all 404 luôn ở cuối
];

// Khởi tạo router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ===== Navigation Guard =====
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Set title
  document.title = to.meta.title || "EVDesign";

  // Load user từ storage (nếu có)
  authStore.loadUserFromStorage();

  const requiresAuth = to.meta.requiresAuth === true;
  const isGuestPage = to.meta.guest === true;
  const requiredPermission = to.meta.requiredPermission;

  // 1. Yêu cầu đăng nhập nhưng chưa đăng nhập -> redirect login
  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  // 2. Guest page (login, register) nhưng đã đăng nhập -> redirect
  if (isGuestPage && authStore.isAuthenticated) {
    if (authStore.hasPermission("dashboard.view")) {
      return { name: "admin-dashboard" };
    }
    return { name: "profile" };
  }

  // 3. Kiểm tra quyền (permission)
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
