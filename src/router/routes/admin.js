// ===== Admin layout =====

const AppLayout = () => import("@/components/layout/AppLayout.vue");

// ===== Lazy-load admin pages =====

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

// ===== Admin routes =====

const adminRoutes = [
  {
    path: "/admin",
    component: AppLayout,

    redirect: {
      name: "admin-dashboard",
    },

    meta: {
      requiresAuth: true,
      area: "admin",
    },

    children: [
      {
        path: "dashboard",
        name: "admin-dashboard",
        component: Dashboard,
        meta: {
          title: "Bảng điều khiển",
          requiredPermission: "dashboard.view",
        },
      },

      {
        path: "products",
        name: "admin-products",
        component: Products,
        meta: {
          title: "Quản lý sản phẩm",
          requiredPermission: "product.view",
        },
      },

      {
        path: "categories",
        name: "admin-categories",
        component: Categories,
        meta: {
          title: "Quản lý danh mục",
          requiredPermission: "category.view",
        },
      },

      {
        path: "artisans",
        name: "admin-artisans",
        component: Artisans,
        meta: {
          title: "Quản lý người dùng",
          requiredPermission: "user.view",
        },
      },

      {
        path: "orders",
        name: "admin-orders",
        component: Orders,
        meta: {
          title: "Quản lý đơn hàng",
          requiredPermission: "order.view",
        },
      },

      {
        path: "inventory",
        name: "admin-inventory",
        component: Inventory,
        meta: {
          title: "Hàng tồn kho",
          requiredPermission: "inventory.view",
        },
      },

      {
        path: "gallery",
        name: "admin-gallery",
        component: Gallery,
        meta: {
          title: "Phần trưng bày",
          requiredPermission: "gallery.view",
        },
      },

      {
        path: "articles",
        name: "admin-articles",
        component: Articles,
        meta: {
          title: "Bài viết",
          requiredPermission: "article.view",
        },
      },

      {
        path: "settings",
        name: "admin-settings",
        component: Settings,
        meta: {
          title: "Cài đặt",
          requiredPermission: "settings.view",
        },
      },

      {
        path: "roles",
        name: "admin-roles",
        component: Roles,
        meta: {
          title: "Quản lý phân quyền",
          requiredPermission: "role.view",
        },
      },

      {
        path: "delivery-methods",
        name: "admin-delivery-methods",
        component: DeliveryMethods,
        meta: {
          title: "Phương thức giao hàng",
          requiredPermission: "delivery-method.view",
        },
      },

      {
        path: "discounts",
        name: "admin-discounts",
        component: Discounts,
        meta: {
          title: "Quản lý giảm giá",
          requiredPermission: "discount.view",
        },
      },
    ],
  },
];

export default adminRoutes;
