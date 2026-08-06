// ===== Lazy-load components =====
// Uncomment khi bạn mở lại các route này
// const Home = () => import("@/views/client/Home.vue");
// const ClientProducts = () => import("@/views/client/Products.vue");
// const ProductDetail = () => import("@/views/client/ProductDetail.vue");
const Profile = () => import("@/views/client/Profile.vue");
// const MyOrders = () => import("@/views/client/MyOrders.vue");

// ===== Client routes =====
const clientRoutes = [
  // Public routes (comment lại theo đúng yêu cầu của bạn)
  // {
  //   path: "/",
  //   name: "home",
  //   component: Home,
  //   meta: { title: "Trang chủ", public: true, area: "client" },
  // },
  // {
  //   path: "/products",
  //   name: "client-products",
  //   component: ClientProducts,
  //   meta: { title: "Sản phẩm", public: true, area: "client" },
  // },
  // {
  //   path: "/products/:id",
  //   name: "client-product-detail",
  //   component: ProductDetail,
  //   meta: { title: "Chi tiết sản phẩm", public: true, area: "client" },
  // },

  // Private routes (yêu cầu đăng nhập)
  {
    path: "/profile",
    name: "profile",
    component: Profile,
    meta: { title: "Tài khoản", requiresAuth: true, area: "client" },
  },
  // {
  //   path: "/my-orders",
  //   name: "my-orders",
  //   component: MyOrders,
  //   meta: { title: "Đơn hàng của tôi", requiresAuth: true, area: "client" },
  // },
];

export default clientRoutes;
