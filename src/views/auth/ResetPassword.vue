<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4">
        <div
            class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface rounded-3xl shadow-xl border border-border overflow-hidden">
            <!-- Left -->
            <div class="hidden lg:flex flex-col justify-between bg-primary p-10 text-white">
                <div>
                    <div class="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                        <Icon icon="solar:lock-keyhole-bold-duotone" class="text-3xl" />
                    </div>

                    <h1 class="text-3xl font-bold mb-3">
                        Đặt lại mật khẩu
                    </h1>

                    <p class="text-white/80 leading-relaxed">
                        Tạo mật khẩu mới cho tài khoản của bạn. Sau khi hoàn tất, bạn có thể đăng nhập lại bằng mật khẩu
                        mới.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:shield-check-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Tăng bảo mật</h3>
                            <p class="text-sm text-white/70">Nên dùng mật khẩu mạnh và khó đoán.</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:login-3-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Đăng nhập lại</h3>
                            <p class="text-sm text-white/70">Sau khi đổi mật khẩu, quay lại trang login.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right -->
            <div class="p-6 sm:p-10">
                <div class="mb-8">
                    <div
                        class="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-5 text-white">
                        <Icon icon="solar:lock-keyhole-bold-duotone" class="text-2xl" />
                    </div>

                    <h2 class="text-2xl font-bold text-text">
                        Đặt lại mật khẩu
                    </h2>

                    <p class="text-sm text-text-light mt-1">
                        Nhập email và mật khẩu mới của bạn.
                    </p>
                </div>

                <form @submit.prevent="handleResetPassword" class="space-y-5">
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

                            <input v-model.trim="form.email" type="email" class="form-control !pl-12"
                                placeholder="Nhập email" autocomplete="email" />
                        </div>

                        <p v-if="errors.email" class="text-danger text-sm mt-1">
                            {{ errors.email }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mật khẩu mới</label>

                        <div class="relative">
                            <Icon icon="solar:lock-password-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                class="form-control !pl-12 !pr-12" placeholder="Nhập mật khẩu mới"
                                autocomplete="new-password" />

                            <button type="button"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition"
                                @click="showPassword = !showPassword">
                                <Icon :icon="showPassword ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'"
                                    class="text-xl" />
                            </button>
                        </div>

                        <p v-if="errors.password" class="text-danger text-sm mt-1">
                            {{ errors.password }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Nhập lại mật khẩu</label>

                        <div class="relative">
                            <Icon icon="solar:lock-keyhole-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model="form.password_confirmation"
                                :type="showPasswordConfirm ? 'text' : 'password'" class="form-control !pl-12 !pr-12"
                                placeholder="Nhập lại mật khẩu" autocomplete="new-password" />

                            <button type="button"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition"
                                @click="showPasswordConfirm = !showPasswordConfirm">
                                <Icon
                                    :icon="showPasswordConfirm ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'"
                                    class="text-xl" />
                            </button>
                        </div>
                    </div>

                    <button type="submit"
                        class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading">
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:lock-keyhole-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang xử lý..." : "Đặt lại mật khẩu" }}
                    </button>
                </form>

                <p class="text-center text-sm text-text-light mt-7">
                    Quay lại
                    <RouterLink to="/login" class="font-semibold text-primary hover:underline">
                        đăng nhập
                    </RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const errorMsg = ref("");

const errors = reactive({
    email: "",
    password: "",
});

const form = reactive({
    token: route.params.token,
    email: route.query.email || "",
    password: "",
    password_confirmation: "",
});

function clearErrors() {
    errorMsg.value = "";
    errors.email = "";
    errors.password = "";
}

async function handleResetPassword() {
    clearErrors();

    try {
        await authStore.resetPassword(form);
        router.push("/login");
    } catch (err) {
        const responseErrors = err.response?.data?.errors;

        errors.email = responseErrors?.email?.[0] || "";
        errors.password = responseErrors?.password?.[0] || "";

        errorMsg.value =
            err.response?.data?.message ||
            "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.";
    }
}
</script>