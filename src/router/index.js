import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/views/Dashboard.vue"),
    meta: {
      title: "Bảng điều khiển",
    },
  },
  {
    path: "/products",
    name: "products",
    component: () => import("@/views/Products.vue"),
    meta: {
      title: "Quản lý sản phẩm",
    },
  },
  {
    path: "/categories",
    name: "categories",
    component: () => import("@/views/Categories.vue"),
    meta: {
      title: "Quản lý danh mục",
    },
  },
  {
    path: "/artisans",
    name: "artisans",
    component: () => import("@/views/Artisans.vue"),
    meta: {
      title: "Quản lý người dùng",
    },
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("@/views/Orders.vue"),
    meta: {
      title: "Quản lý đơn hàng",
    },
  },
  {
    path: "/inventory",
    name: "inventory",
    component: () => import("@/views/Inventory.vue"),
    meta: {
      title: "Hàng tồn kho",
    },
  },
  {
    path: "/gallery",
    name: "gallery",
    component: () => import("@/views/Gallery.vue"),
    meta: {
      title: "Phần trưng bày",
    },
  },
  {
    path: "/articles",
    name: "articles",
    component: () => import("@/views/Articles.vue"),
    meta: {
      title: "Bài viết",
    },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/Settings.vue"),
    meta: {
      title: "Cài đặt",
    },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/Login.vue"),
    meta: {
      title: "Đăng nhập",
    },
  },
];

const router = createRouter({
  history: createWebHistory("/admin"),
  routes,
});

export default router;
