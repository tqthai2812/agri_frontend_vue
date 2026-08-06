// ===== Lazy-load components =====
const Forbidden = () => import("@/views/auth/Forbidden.vue");

// ===== Routes dùng chung =====
const sharedRoutes = [
  {
    path: "/forbidden",
    name: "forbidden",
    component: Forbidden,
    meta: { title: "Không có quyền", requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "home" }, // Giả định bạn sẽ mở home sau
  },
];

export default sharedRoutes;
