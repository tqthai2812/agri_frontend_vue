const ClientLayout = () =>
  import("@/components/layout/client/ClientLayout.vue");

const AccountLayout = () =>
  import("@/components/layout/client/AccountLayout.vue");

const Home = () => import("@/views/client/Home.vue");

const ClientProducts = () => import("@/views/client/Products.vue");

const ProductDetail = () => import("@/views/client/ProductDetail.vue");

const Cart = () => import("@/views/client/Cart.vue");

const Checkout = () => import("@/views/client/Checkout.vue");

const Profile = () => import("@/views/client/Profile.vue");

const Addresses = () => import("@/views/client/Addresses.vue");

const ChangePassword = () => import("@/views/client/ChangePassword.vue");

const MyOrders = () => import("@/views/client/MyOrders.vue");

const OrderDetail = () => import("@/views/client/OrderDetail.vue");

const Wishlist = () => import("@/views/client/Wishlist.vue");

const News = () => import("@/views/client/News.vue");

const Contact = () => import("@/views/client/Contact.vue");

const Diagnosis = () => import("@/views/client/Diagnosis.vue");

const clientRoutes = [
  {
    path: "/",
    component: ClientLayout,

    meta: {
      area: "client",
    },

    children: [
      {
        path: "",
        name: "home",
        component: Home,

        meta: {
          title: "Trang chủ",
          public: true,
        },
      },

      {
        path: "products",
        name: "client-products",
        component: ClientProducts,

        meta: {
          title: "Sản phẩm",
          public: true,
        },
      },

      {
        path: "products/:id",
        name: "client-product-detail",
        component: ProductDetail,

        meta: {
          title: "Chi tiết sản phẩm",
          public: true,
        },
      },

      {
        path: "cart",
        name: "cart",
        component: Cart,

        meta: {
          title: "Giỏ hàng",
          requiresAuth: true,
        },
      },

      {
        path: "diagnosis",
        name: "diagnosis",
        component: Diagnosis,
        meta: {
          title: "Chẩn đoán bệnh lúa",
          public: true,
        },
      },

      {
        path: "wishlist",
        name: "wishlist",
        component: Wishlist,
        meta: {
          title: "Danh sách yêu thích",
          requiresAuth: true,
        },
      },

      {
        path: "contact",
        name: "contact",
        component: Contact,
        meta: {
          title: "Liên hệ NFarmHouse",
          public: true,
        },
      },

      {
        path: "news",
        name: "news",
        component: News,
        meta: {
          title: "Tin tức nông nghiệp",
          public: true,
        },
      },

      {
        path: "checkout",
        name: "checkout",
        component: Checkout,

        meta: {
          title: "Thanh toán",
          requiresAuth: true,
        },
      },

      {
        path: "account",
        component: AccountLayout,
        redirect: {
          name: "profile",
        },

        meta: {
          requiresAuth: true,
        },

        children: [
          {
            path: "profile",
            alias: "/profile",
            name: "profile",
            component: Profile,

            meta: {
              title: "Hồ sơ của tôi",
            },
          },

          {
            path: "addresses",
            name: "account-addresses",
            component: Addresses,

            meta: {
              title: "Địa chỉ của tôi",
            },
          },

          {
            path: "password",
            name: "account-password",
            component: ChangePassword,

            meta: {
              title: "Đổi mật khẩu",
            },
          },

          {
            path: "orders",
            alias: "/my-orders",
            name: "my-orders",
            component: MyOrders,

            meta: {
              title: "Đơn mua của tôi",
            },
          },

          {
            path: "orders/:id",
            name: "order-detail",
            component: OrderDetail,
            meta: {
              title: "Chi tiết đơn hàng",
            },
          },
        ],
      },
    ],
  },
];

export default clientRoutes;
