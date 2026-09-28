<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import AuthLayout from "@/components/auth/AuthLayout.vue";

const authStore = useAuthStore();

const verified = computed(() => {
    return Boolean(authStore.user?.email_verified_at);
});
</script>

<template>
    <AuthLayout title="Xác thực email">
        <div class="nf-state-icon">
            {{ verified ? "✓" : "@" }}
        </div>

        <p class="nf-kicker">
            TÀI KHOẢN NFARMHOUSE
        </p>

        <h1>
            {{
                verified
                    ? "Email đã được xác thực"
                    : "Xác thực email"
            }}
        </h1>

        <template v-if="verified">
            <p class="nf-intro">
                Email của bạn đã được xác thực. Bạn có thể tiếp tục sử dụng tài khoản tại NFarmHouse.
            </p>

            <RouterLink to="/profile" class="nf-button">
                Về tài khoản của tôi
            </RouterLink>
        </template>

        <template v-else-if="authStore.isAuthenticated">
            <p class="nf-intro">
                Tài khoản hiện tại chưa ghi nhận xác thực email.
                Vui lòng liên hệ hỗ trợ để được kiểm tra.
            </p>

            <a href="mailto:nfarmhouse@gmail.com" class="nf-button">
                Liên hệ hỗ trợ
            </a>
        </template>

        <template v-else>
            <p class="nf-intro">
                NFarmHouse xác thực email bằng mã gồm 6 chữ số trong quá trình đăng ký.
                Hãy đến trang đăng ký để nhận và nhập mã xác thực.
            </p>

            <RouterLink to="/register" class="nf-button nf-primary">
                <span>Tiếp tục đăng ký</span>

                <span class="nf-button-arrow">
                    ›
                </span>
            </RouterLink>

            <p class="nf-switch">
                Đã có tài khoản?

                <RouterLink to="/login" class="nf-link">
                    Đăng nhập
                </RouterLink>
            </p>
        </template>

        <p class="nf-note">
            <RouterLink to="/" class="nf-link">
                ← Về trang chủ
            </RouterLink>
        </p>
    </AuthLayout>
</template>