<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4">
        <div class="w-full max-w-xl bg-surface rounded-3xl shadow-xl border border-border p-8 text-center">
            <div class="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                <Icon icon="solar:shield-cross-bold-duotone" class="text-4xl text-red-500" />
            </div>

            <h1 class="text-2xl font-bold text-text">
                Bạn không có quyền truy cập
            </h1>

            <p class="text-sm text-text-light mt-3">
                Tài khoản của bạn chưa được cấp quyền để vào chức năng này.
            </p>

            <RouterLink to="/login" class="btn-primary inline-flex justify-center mt-6 px-5 py-3 rounded-xl">
                Quay lại đăng nhập
            </RouterLink>
        </div>
    </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
</script>