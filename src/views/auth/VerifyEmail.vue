<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4">
        <div class="w-full max-w-3xl bg-surface rounded-3xl shadow-xl border border-border overflow-hidden">
            <div class="p-8 sm:p-10 text-center">
                <div class="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Icon icon="solar:letter-unread-bold-duotone" class="text-4xl text-primary" />
                </div>

                <h1 class="text-2xl font-bold text-text">
                    Xác thực email
                </h1>

                <p class="text-sm text-text-light mt-3 max-w-xl mx-auto leading-relaxed">
                    Tài khoản của bạn cần xác thực email trước khi sử dụng đầy đủ chức năng.
                    Vui lòng kiểm tra hộp thư hoặc bấm nút bên dưới để gửi lại email xác thực.
                </p>

                <div v-if="successMsg"
                    class="mt-6 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm text-left">
                    <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ successMsg }}</span>
                </div>

                <div v-if="errorMsg"
                    class="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm text-left">
                    <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ errorMsg }}</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                    <button type="button"
                        class="btn-primary justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading" @click="handleSendVerificationEmail">
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:letter-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang gửi..." : "Gửi lại email" }}
                    </button>

                    <RouterLink to="/login"
                        class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-sec hover:bg-primary/10 hover:text-primary transition">
                        <Icon icon="solar:home-2-bold-duotone" class="text-xl" />
                        Về dashboard
                    </RouterLink>
                </div>

                <button type="button" class="mt-5 text-sm font-semibold text-red-500 hover:underline"
                    @click="handleLogout">
                    Đăng xuất tài khoản hiện tại
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";

const router = useRouter();
const authStore = useAuthStore();

const successMsg = ref("");
const errorMsg = ref("");

async function handleSendVerificationEmail() {
    successMsg.value = "";
    errorMsg.value = "";

    try {
        const response = await authStore.sendVerificationEmail();

        successMsg.value =
            response.data?.message ||
            "Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.";
    } catch (err) {
        errorMsg.value =
            err.response?.data?.message ||
            "Không thể gửi email xác thực. Vui lòng thử lại.";
    }
}

async function handleLogout() {
    await authStore.logout();
    router.push("/login");
}
</script>