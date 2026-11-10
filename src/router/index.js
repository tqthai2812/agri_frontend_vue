import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import { canVisit, firstDestination } from "./adminAccess";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/client";
import sharedRoutes from "./routes/shared";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    // Back/Forward: khôi phục vị trí mà Vue Router đã lưu.
    if (savedPosition) return savedPosition;

    // Đổi bộ lọc/query trên cùng một trang: giữ chỗ đang xem.
    if (to.path === from.path) return false;

    // Mở trang khác, kể cả đổi /products/1 sang /products/2.
    return { left: 0, top: 0 };
  },
  routes: [
    ...authRoutes,
    ...clientRoutes,
    ...adminRoutes,
    {
      path: "/session-unavailable",
      name: "session-unavailable",
      component: () => import("@/views/auth/SessionUnavailable.vue"),
      meta: { title: "Kiểm tra phiên đăng nhập" },
    },
    ...sharedRoutes,
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  document.title = to.meta.title || "NFarmHouse";
  if (to.name === "session-unavailable") return true;
  try {
    await auth.ensureSession();
  } catch {
    if (to.meta.requiresAuth || to.meta.guest)
      return { name: "session-unavailable", query: { redirect: to.fullPath } };
    return true; // Public storefront stays available during a session-probe failure.
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn)
    return { name: "login", query: { redirect: to.fullPath } };
  if (to.meta.guest && auth.isLoggedIn) return firstDestination(auth, router);
  if (to.path.replace(/\/$/, "") === "/admin")
    return firstDestination(auth, router);
  if (!canVisit(auth, to)) return { name: "forbidden" };
  return true;
});

export default router;