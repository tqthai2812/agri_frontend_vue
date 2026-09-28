<script setup>
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import AuthLayout from "@/components/auth/AuthLayout.vue";
import AuthField from "@/components/auth/AuthField.vue";
import { authError, loginDestination } from "./authUi";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const remember = ref(false);
const busy = ref(false);
const errorMsg = ref("");
const errors = ref({});

async function handleLogin() {
    if (busy.value) return;

    busy.value = true;
    errorMsg.value = "";
    errors.value = {};

    try {
        await authStore.login(
            email.value.trim().toLowerCase(),
            password.value,
            remember.value,
        );

        await router.replace(
            loginDestination(
                route.query.redirect,
                authStore,
                router,
            ),
        );
    } catch (error) {
        errors.value = error.response?.data?.errors || {};

        errorMsg.value = authError(
            error,
            "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.",
        );
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <AuthLayout title="Đăng nhập">
        <p class="nf-kicker">
            CHÀO MỪNG BẠN TRỞ LẠI
        </p>

        <h1>Đăng nhập</h1>

        <p class="nf-intro">
            Tiếp tục mua sắm và theo dõi đơn hàng của bạn tại NFarmHouse.
        </p>

        <p v-if="route.query.reset === 'success'" class="nf-alert nf-alert-success" role="status">
            Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>

        <p v-if="errorMsg" class="nf-alert" role="alert">
            {{ errorMsg }}
        </p>

        <form class="nf-form" :aria-busy="busy" @submit.prevent="handleLogin">
            <AuthField id="login-email" v-model="email" label="Email" type="email" placeholder="Nhập email của bạn"
                autocomplete="email" :disabled="busy" :error="errors.email?.[0]" />

            <AuthField id="login-password" v-model="password" label="Mật khẩu" type="password"
                placeholder="Nhập mật khẩu" autocomplete="current-password" :disabled="busy"
                :error="errors.password?.[0]" />

            <div class="nf-row">
                <label class="nf-check">
                    <input v-model="remember" type="checkbox" :disabled="busy" />

                    Ghi nhớ đăng nhập
                </label>

                <RouterLink to="/forgot-password" class="nf-link">
                    Quên mật khẩu?
                </RouterLink>
            </div>

            <button type="submit" class="nf-button nf-primary" :disabled="busy">
                <span>
                    {{ busy ? "Đang đăng nhập..." : "Đăng nhập" }}
                </span>

                <span v-if="busy" class="nf-spinner"></span>

                <span v-else class="nf-button-arrow">
                    ›
                </span>
            </button>
        </form>

        <p class="nf-switch">
            Bạn mới đến NFarmHouse?

            <RouterLink to="/register" class="nf-link">
                Đăng ký ngay
            </RouterLink>
        </p>
    </AuthLayout>
</template>