<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4">
        <div
            class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface rounded-3xl shadow-xl border border-border overflow-hidden">
            <!-- Left -->
            <div class="hidden lg:flex flex-col justify-between bg-primary p-10 text-white">
                <div>
                    <div class="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                        <Icon icon="solar:key-bold-duotone" class="text-3xl" />
                    </div>

                    <h1 class="text-3xl font-bold mb-3">
                        Khôi phục mật khẩu
                    </h1>

                    <p class="text-white/80 leading-relaxed">
                        Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu nếu tài khoản tồn tại.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:letter-unread-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Gửi qua email</h3>
                            <p class="text-sm text-white/70">Laravel sẽ gửi link reset password.</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:clock-circle-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Liên kết có thời hạn</h3>
                            <p class="text-sm text-white/70">Đảm bảo an toàn khi khôi phục tài khoản.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right -->
            <div class="p-6 sm:p-10">
                <div class="mb-8">
                    <div
                        class="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-5 text-white">
                        <Icon icon="solar:key-bold-duotone" class="text-2xl" />
                    </div>

                    <h2 class="text-2xl font-bold text-text">
                        Quên mật khẩu
                    </h2>

                    <p class="text-sm text-text-light mt-1">
                        Nhập email để nhận liên kết đặt lại mật khẩu.
                    </p>
                </div>

                <form @submit.prevent="handleForgotPassword" class="space-y-5">
                    <div v-if="successMsg"
                        class="flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm">
                        <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                        <span>{{ successMsg }}</span>
                    </div>

                    <div v-if="errorMsg"
                        class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                        <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                        <span>{{ errorMsg }}</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email</label>

                        <div class="relative">
                            <Icon icon="solar:letter-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model.trim="email" type="email" class="form-control !pl-12"
                                placeholder="Nhập email của bạn" autocomplete="email" />
                        </div>

                        <p v-if="emailError" class="text-danger text-sm mt-1">
                            {{ emailError }}
                        </p>
                    </div>

                    <button type="submit"
                        class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading">
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:letter-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang gửi..." : "Gửi liên kết đặt lại" }}
                    </button>
                </form>

                <p class="text-center text-sm text-text-light mt-7">
                    Nhớ mật khẩu rồi?
                    <RouterLink to="/login" class="font-semibold text-primary hover:underline">
                        Quay lại đăng nhập
                    </RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";

const authStore = useAuthStore();

const email = ref("");
const emailError = ref("");
const errorMsg = ref("");
const successMsg = ref("");

async function handleForgotPassword() {
    emailError.value = "";
    errorMsg.value = "";
    successMsg.value = "";

    try {
        const response = await authStore.forgotPassword(email.value);
        successMsg.value =
            response.data?.message ||
            response.data?.status ||
            "Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra email.";
    } catch (err) {
        emailError.value = err.response?.data?.errors?.email?.[0] || "";
        errorMsg.value =
            err.response?.data?.message ||
            "Không thể gửi liên kết đặt lại mật khẩu.";
    }
}
</script>