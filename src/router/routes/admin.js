const AppLayout = () => import("@/components/layout/AppLayout.vue");

const Dashboard = () => import("@/views/Dashboard.vue");
const Products = () => import("@/views/Products.vue");
const Categories = () => import("@/views/Categories.vue");
const Suppliers = () => import("@/views/Suppliers.vue");
const Artisans = () => import("@/views/Artisans.vue");
const Orders = () => import("@/views/Orders.vue");
const Contacts = () => import("@/views/Contacts.vue");
const ProductReviews = () => import("@/views/ProductReviews.vue");
const Inventory = () => import("@/views/Inventory.vue");
const Gallery = () => import("@/views/Gallery.vue");
const Articles = () => import("@/views/Articles.vue");
const Settings = () => import("@/views/Settings.vue");
const Roles = () => import("@/views/Roles.vue");
const DeliveryMethods = () => import("@/views/DeliveryMethods.vue");
const Discounts = () => import("@/views/Discounts.vue");

const Expenses = () => import("@/views/Expenses.vue");
const ExpenseCategories = () => import("@/views/ExpenseCategories.vue");
const ProfitReport = () => import("@/views/ProfitReport.vue");

const adminRoutes = [
  {
    path: "/admin",
    component: AppLayout,
    redirect: { name: "admin-dashboard" },
    meta: { requiresAuth: true, area: "admin" },
    children: [
      {
        path: "expenses",
        name: "admin-expenses",
        component: Expenses,
        meta: { title: "Chi phí", requiredPermission: "expense.view" },
      },
      {
        path: "expense-categories",
        name: "admin-expense-categories",
        component: ExpenseCategories,
        meta: { title: "Danh mục chi phí", requiredPermission: "expense.view" },
      },
      {
        path: "reports/profit",
        name: "admin-profit-report",
        component: ProfitReport,
        meta: {
          title: "Báo cáo lợi nhuận",
          requiredPermission: "report.profit.view",
        },
      },
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
        meta: { title: "Quản lý sản phẩm", requiredPermission: "product.view" },
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
        path: "suppliers",
        name: "admin-suppliers",
        component: Suppliers,
        meta: { title: "Nhà cung cấp", requiredPermission: "inventory.view" },
      },
      {
        path: "artisans",
        name: "admin-artisans",
        component: Artisans,
        meta: { title: "Quản lý người dùng", requiredPermission: "user.view" },
      },
      {
        path: "orders",
        name: "admin-orders",
        component: Orders,
        meta: { title: "Quản lý đơn hàng", requiredPermission: "order.view" },
      },
      {
        path: "contacts",
        name: "admin-contacts",
        component: Contacts,
        meta: { title: "Quản lý liên hệ", requiredPermission: "contact.view" },
      },
      {
        path: "reviews",
        name: "admin-reviews",
        component: ProductReviews,
        meta: { title: "Quản lý đánh giá", requiredPermission: "review.view" },
      },
      {
        path: "inventory",
        name: "admin-inventory",
        component: Inventory,
        meta: { title: "Hàng tồn kho", requiredPermission: "inventory.view" },
      },
      {
        path: "gallery",
        name: "admin-gallery",
        component: Gallery,
        meta: { title: "Phần trưng bày", requiredPermission: "gallery.view" },
      },
      {
        path: "articles",
        name: "admin-articles",
        component: Articles,
        meta: { title: "Bài viết", requiredPermission: "article.view" },
      },
      {
        path: "settings",
        name: "admin-settings",
        component: Settings,
        meta: { title: "Cài đặt", requiredPermission: "settings.view" },
      },
      {
        path: "roles",
        name: "admin-roles",
        component: Roles,
        meta: { title: "Quản lý phân quyền", requiredPermission: "role.view" },
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
