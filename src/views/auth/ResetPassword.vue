<script setup>
import {
    computed,
    reactive,
    ref,
    watch,
} from "vue";

import {
    RouterLink,
    useRoute,
    useRouter,
} from "vue-router";

import { useAuthStore } from "@/stores/shared/authStore";
import AuthLayout from "@/components/auth/AuthLayout.vue";
import AuthField from "@/components/auth/AuthField.vue";
import { authError } from "./authUi";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const busy = ref(false);
const errorMsg = ref("");
const errors = ref({});

const form = reactive({
    email: "",
    password: "",
    password_confirmation: "",
});

const token = computed(() => {
    return typeof route.params.token === "string"
        ? route.params.token
        : "";
});

watch(
    () => [route.params.token, route.query.email],
    () => {
        form.email =
            typeof route.query.email === "string"
                ? route.query.email
                : "";

        form.password = "";
        form.password_confirmation = "";
        errorMsg.value = "";
        errors.value = {};
    },
    {
        immediate: true,
    },
);

async function handleResetPassword() {
    if (busy.value || !token.value) return;

    errors.value = {};
    errorMsg.value = "";

    if (form.password !== form.password_confirmation) {
        errors.value = {
            password_confirmation: [
                "Mật khẩu nhập lại chưa khớp.",
            ],
        };

        return;
    }

    busy.value = true;

    try {
        await authStore.resetPassword({
            ...form,
            token: token.value,
            email: form.email.trim().toLowerCase(),
        });

        await router.replace({
            name: "login",
            query: {
                reset: "success",
            },
        });
    } catch (error) {
        errors.value = error.response?.data?.errors || {};

        errorMsg.value = authError(
            error,
            "Không thể đặt lại mật khẩu. Vui lòng kiểm tra liên kết.",
        );
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <AuthLayout title="Đặt lại mật khẩu">
        <p class="nf-kicker">
            MỘT KHỞI ĐẦU MỚI
        </p>

        <h1>Đặt lại mật khẩu</h1>

        <p class="nf-intro">
            Tạo mật khẩu mới để tiếp tục đồng hành cùng NFarmHouse.
        </p>

        <p v-if="!token" class="nf-alert" role="alert">
            Liên kết thiếu mã đặt lại mật khẩu. Vui lòng yêu cầu một liên kết mới.
        </p>

        <p v-if="errorMsg" class="nf-alert" role="alert">
            {{ errorMsg }}
        </p>

        <form class="nf-form" :aria-busy="busy" @submit.prevent="handleResetPassword">
            <AuthField id="reset-email" v-model="form.email" label="Email" type="email" placeholder="Email đã đăng ký"
                autocomplete="email" :error="errors.email?.[0]" :disabled="busy" />

            <AuthField id="reset-password" v-model="form.password" label="Mật khẩu mới" type="password"
                placeholder="Nhập mật khẩu mới" autocomplete="new-password" :error="errors.password?.[0]"
                :disabled="busy" />

            <AuthField id="reset-confirm" v-model="form.password_confirmation" label="Nhập lại mật khẩu" type="password"
                placeholder="Nhập lại mật khẩu mới" autocomplete="new-password"
                :error="errors.password_confirmation?.[0]" :disabled="busy" />

            <button type="submit" class="nf-button nf-primary" :disabled="busy || !token">
                <span>
                    {{
                        busy
                            ? "Đang cập nhật..."
                            : "Lưu mật khẩu mới"
                    }}
                </span>

                <span class="nf-button-arrow">
                    ›
                </span>
            </button>
        </form>

        <p class="nf-note">
            <RouterLink to="/forgot-password" class="nf-link">
                Yêu cầu liên kết mới
            </RouterLink>
        </p>

        <p class="nf-switch">
            Quay lại

            <RouterLink to="/login" class="nf-link">
                đăng nhập
            </RouterLink>
        </p>
    </AuthLayout>
</template>