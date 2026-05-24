import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const adminRoutes = [
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: () => import("@/views/Dashboard.vue"),
    meta: {
      title: "Bảng điều khiển",
    },
  },
  {
    path: "/admin/products",
    name: "admin-products",
    component: () => import("@/views/Products.vue"),
    meta: {
      title: "Quản lý sản phẩm",
    },
  },
  {
    path: "/admin/categories",
    name: "admin-categories",
    component: () => import("@/views/Categories.vue"),
    meta: {
      title: "Quản lý danh mục",
    },
  },
  {
    path: "/admin/artisans",
    name: "admin-artisans",
    component: () => import("@/views/Artisans.vue"),
    meta: {
      title: "Quản lý người dùng",
    },
  },
  {
    path: "/admin/orders",
    name: "admin-orders",
    component: () => import("@/views/Orders.vue"),
    meta: {
      title: "Quản lý đơn hàng",
    },
  },
  {
    path: "/admin/inventory",
    name: "admin-inventory",
    component: () => import("@/views/Inventory.vue"),
    meta: {
      title: "Hàng tồn kho",
    },
  },
  {
    path: "/admin/gallery",
    name: "admin-gallery",
    component: () => import("@/views/Gallery.vue"),
    meta: {
      title: "Phần trưng bày",
    },
  },
  {
    path: "/admin/articles",
    name: "admin-articles",
    component: () => import("@/views/Articles.vue"),
    meta: {
      title: "Bài viết",
    },
  },
  {
    path: "/admin/settings",
    name: "admin-settings",
    component: () => import("@/views/Settings.vue"),
    meta: {
      title: "Cài đặt",
    },
  },
].map((route) => ({
  ...route,
  meta: {
    ...route.meta,
    requiresAuth: true,
    requiresAdmin: true,
    area: "admin",
  },
}));

const routes = [
  // USER PUBLIC
  // {
  //   path: "/",
  //   name: "home",
  //   component: () => import("@/views/client/Home.vue"),
  //   meta: {
  //     title: "Trang chủ",
  //     public: true,
  //     area: "client",
  //   },
  // },
  // {
  //   path: "/products",
  //   name: "client-products",
  //   component: () => import("@/views/client/Products.vue"),
  //   meta: {
  //     title: "Sản phẩm",
  //     public: true,
  //     area: "client",
  //   },
  // },
  // {
  //   path: "/products/:id",
  //   name: "client-product-detail",
  //   component: () => import("@/views/client/ProductDetail.vue"),
  //   meta: {
  //     title: "Chi tiết sản phẩm",
  //     public: true,
  //     area: "client",
  //   },
  // },

  // AUTH DÙNG CHUNG
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/Login.vue"),
    meta: {
      title: "Đăng nhập",
      guest: true,
      area: "auth",
    },
  },

  // Nếu bạn lỡ gõ /admin/login thì chuyển về /login
  {
    path: "/admin/login",
    redirect: {
      name: "login",
    },
  },

  {
    path: "/register",
    name: "register",
    component: () => import("@/views/auth/Register.vue"),
    meta: {
      title: "Đăng ký",
      guest: true,
      area: "auth",
    },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/views/auth/ForgotPassword.vue"),
    meta: {
      title: "Quên mật khẩu",
      guest: true,
      area: "auth",
    },
  },
  {
    path: "/reset-password/:token",
    name: "reset-password",
    component: () => import("@/views/auth/ResetPassword.vue"),
    meta: {
      title: "Đặt lại mật khẩu",
      guest: true,
      area: "auth",
    },
  },
  {
    path: "/password-reset/:token",
    name: "password-reset",
    component: () => import("@/views/auth/ResetPassword.vue"),
    meta: {
      title: "Đặt lại mật khẩu",
      guest: true,
      area: "auth",
    },
  },

  // USER ĐÃ ĐĂNG NHẬP
  {
    path: "/profile",
    name: "profile",
    component: () => import("@/views/client/Profile.vue"),
    meta: {
      title: "Tài khoản",
      requiresAuth: true,
      area: "client",
    },
  },
  // {
  //   path: "/my-orders",
  //   name: "my-orders",
  //   component: () => import("@/views/client/MyOrders.vue"),
  //   meta: {
  //     title: "Đơn hàng của tôi",
  //     requiresAuth: true,
  //     area: "client",
  //   },
  // },
  // {
  //   path: "/verify-email",
  //   name: "verify-email",
  //   component: () => import("@/views/auth/VerifyEmail.vue"),
  //   meta: {
  //     title: "Xác thực email",
  //     requiresAuth: true,
  //     area: "auth",
  //   },
  // },

  // ADMIN
  {
    path: "/admin",
    redirect: {
      name: "admin-dashboard",
    },
  },

  ...adminRoutes,

  {
    path: "/:pathMatch(.*)*",
    redirect: {
      name: "home",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  document.title = to.meta.title || "EVDesign";

  authStore.loadUserFromStorage();

  const requiresAuth = to.meta.requiresAuth === true;
  const requiresAdmin = to.meta.requiresAdmin === true;
  const isGuestPage = to.meta.guest === true;

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (isGuestPage && authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      return {
        name: "admin-dashboard",
      };
    }

    return {
      name: "profile",
    };
  }

  if (requiresAdmin && !authStore.isAdmin) {
    return {
      name: "home",
    };
  }

  return true;
});

export default router;
