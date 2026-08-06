// ===== Lazy-load components =====
const Login = () => import("@/views/auth/Login.vue");
const Register = () => import("@/views/auth/Register.vue");
const ForgotPassword = () => import("@/views/auth/ForgotPassword.vue");
const ResetPassword = () => import("@/views/auth/ResetPassword.vue");

// ===== Auth routes =====
const authRoutes = [
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { title: "Đăng nhập", guest: true, area: "auth" },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { title: "Đăng ký", guest: true, area: "auth" },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPassword,
    meta: { title: "Quên mật khẩu", guest: true, area: "auth" },
  },
  {
    path: "/reset-password/:token",
    name: "reset-password",
    component: ResetPassword,
    meta: { title: "Đặt lại mật khẩu", guest: true, area: "auth" },
  },
  {
    path: "/password-reset/:token",
    name: "password-reset",
    component: ResetPassword,
    meta: { title: "Đặt lại mật khẩu", guest: true, area: "auth" },
  },
];

export default authRoutes;
