<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import AuthLayout from "@/components/auth/AuthLayout.vue";
import AuthField from "@/components/auth/AuthField.vue";
import { authError } from "./authUi";

const authStore = useAuthStore();

const email = ref("");
const busy = ref(false);
const errorMsg = ref("");
const successMsg = ref("");
const emailError = ref("");

async function handleForgotPassword() {
    if (busy.value) return;

    busy.value = true;
    errorMsg.value = "";
    successMsg.value = "";
    emailError.value = "";

    try {
        await authStore.forgotPassword(
            email.value.trim().toLowerCase(),
        );

        successMsg.value =
            "Yêu cầu đã được xử lý. Vui lòng kiểm tra hộp thư và thư rác để tìm liên kết đặt lại mật khẩu.";
    } catch (error) {
        emailError.value =
            error.response?.data?.errors?.email?.[0] || "";

        errorMsg.value = authError(
            error,
            "Chưa gửi được liên kết. Vui lòng thử lại.",
        );
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <AuthLayout title="Quên mật khẩu">
        <div class="nf-state-icon">↗</div>

        <p class="nf-kicker">
            KHÔI PHỤC TÀI KHOẢN
        </p>

        <h1>Quên mật khẩu?</h1>

        <p class="nf-intro">
            Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn để bạn tạo mật khẩu mới.
        </p>

        <p v-if="successMsg" class="nf-alert nf-alert-success" role="status">
            {{ successMsg }}
        </p>

        <p v-if="errorMsg" class="nf-alert" role="alert">
            {{ errorMsg }}
        </p>

        <form class="nf-form" :aria-busy="busy" @submit.prevent="handleForgotPassword">
            <AuthField id="forgot-email" v-model="email" label="Email đăng ký" type="email"
                placeholder="Nhập email của bạn" autocomplete="email" :error="emailError" :disabled="busy" />

            <button type="submit" class="nf-button nf-primary" :disabled="busy">
                <span>
                    {{
                        busy
                            ? "Đang gửi..."
                            : "Gửi liên kết đặt lại"
                    }}
                </span>

                <span class="nf-button-arrow">
                    ›
                </span>
            </button>
        </form>

        <p class="nf-switch">
            Nhớ mật khẩu rồi?

            <RouterLink to="/login" class="nf-link">
                Đăng nhập
            </RouterLink>
        </p>
    </AuthLayout>
</template>