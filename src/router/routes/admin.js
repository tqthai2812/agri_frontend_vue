// ===== Khai báo lazy-load components (giúp debug dễ dàng) =====
const Dashboard = () => import("@/views/Dashboard.vue");
const Products = () => import("@/views/Products.vue");
const Categories = () => import("@/views/Categories.vue");
const Artisans = () => import("@/views/Artisans.vue");
const Orders = () => import("@/views/Orders.vue");
const Inventory = () => import("@/views/Inventory.vue");
const Gallery = () => import("@/views/Gallery.vue");
const Articles = () => import("@/views/Articles.vue");
const Settings = () => import("@/views/Settings.vue");
const Roles = () => import("@/views/Roles.vue");
const DeliveryMethods = () => import("@/views/DeliveryMethods.vue");
const Discounts = () => import("@/views/Discounts.vue");

// ===== Mảng routes gốc (chưa xử lý meta) =====
const rawAdminRoutes = [
  {
    path: "/admin/dashboard",
    name: "admin-dashboard",
    component: Dashboard,
    meta: { title: "Bảng điều khiển", requiredPermission: "dashboard.view" },
  },
  {
    path: "/admin/products",
    name: "admin-products",
    component: Products,
    meta: { title: "Quản lý sản phẩm", requiredPermission: "product.view" },
  },
  {
    path: "/admin/categories",
    name: "admin-categories",
    component: Categories,
    meta: { title: "Quản lý danh mục", requiredPermission: "category.view" },
  },
  {
    path: "/admin/artisans",
    name: "admin-artisans",
    component: Artisans,
    meta: { title: "Quản lý người dùng", requiredPermission: "user.view" },
  },
  {
    path: "/admin/orders",
    name: "admin-orders",
    component: Orders,
    meta: { title: "Quản lý đơn hàng", requiredPermission: "order.view" },
  },
  {
    path: "/admin/inventory",
    name: "admin-inventory",
    component: Inventory,
    meta: { title: "Hàng tồn kho", requiredPermission: "inventory.view" },
  },
  {
    path: "/admin/gallery",
    name: "admin-gallery",
    component: Gallery,
    meta: { title: "Phần trưng bày", requiredPermission: "gallery.view" },
  },
  {
    path: "/admin/articles",
    name: "admin-articles",
    component: Articles,
    meta: { title: "Bài viết", requiredPermission: "article.view" },
  },
  {
    path: "/admin/settings",
    name: "admin-settings",
    component: Settings,
    meta: { title: "Cài đặt", requiredPermission: "settings.view" },
  },
  {
    path: "/admin/roles",
    name: "admin-roles",
    component: Roles,
    meta: { title: "Quản lý phân quyền", requiredPermission: "role.view" },
  },
  {
    path: "/admin/delivery-methods",
    name: "admin-delivery-methods",
    component: DeliveryMethods,
    meta: {
      title: "Phương thức giao hàng",
      requiredPermission: "delivery-method.view",
    },
  },
  {
    path: "/admin/discounts",
    name: "admin-discounts",
    component: Discounts,
    meta: {
      title: "Quản lý giảm giá",
      requiredPermission: "discount.view",
    },
  },
];

// ===== Xử lý map để thêm requiresAuth và area =====
const adminRoutes = rawAdminRoutes.map((route) => ({
  ...route,
  meta: {
    ...route.meta,
    requiresAuth: true,
    area: "admin",
  },
}));

// Thêm route redirect /admin -> dashboard
adminRoutes.unshift({
  path: "/admin",
  redirect: { name: "admin-dashboard" },
});

export default adminRoutes;
