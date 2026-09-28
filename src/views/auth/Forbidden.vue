<script setup>
import { RouterLink } from "vue-router";
import AuthLayout from "@/components/auth/AuthLayout.vue";
</script>

<template>
    <AuthLayout title="Quyền truy cập">
        <div class="nf-state-icon">
            ⊘
        </div>

        <p class="nf-kicker">
            THÔNG BÁO · 403
        </p>

        <h1>
            Bạn chưa có quyền<br />
            truy cập trang này
        </h1>

        <p class="nf-intro">
            Tài khoản hiện tại chưa được cấp quyền sử dụng chức năng này.
            Bạn vẫn có thể quay lại trang chủ để tiếp tục khám phá NFarmHouse.
        </p>

        <div class="nf-stack">
            <RouterLink to="/" class="nf-button nf-primary">
                <span>Về trang chủ</span>

                <span class="nf-button-arrow">
                    ›
                </span>
            </RouterLink>

            <a href="mailto:nfarmhouse@gmail.com" class="nf-button nf-secondary">
                Liên hệ hỗ trợ
            </a>
        </div>

        <p class="nf-note">
            Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ người quản trị.
        </p>
    </AuthLayout>
</template>