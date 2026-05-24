<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4">
        <div
            class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface rounded-3xl shadow-xl border border-border overflow-hidden">
            <!-- Left -->
            <div class="hidden lg:flex flex-col justify-between bg-primary p-10 text-white">
                <div>
                    <div class="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                        <Icon icon="solar:t-shirt-bold" class="text-3xl" />
                    </div>

                    <h1 class="text-3xl font-bold mb-3">
                        EVDesign Admin
                    </h1>

                    <p class="text-white/80 leading-relaxed">
                        Đăng nhập để quản lý sản phẩm, danh mục, đơn hàng, tồn kho và nội dung hệ thống.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:shield-check-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Bảo mật với Laravel Sanctum</h3>
                            <p class="text-sm text-white/70">Đăng nhập bằng session cookie an toàn.</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:chart-2-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Quản trị tập trung</h3>
                            <p class="text-sm text-white/70">Theo dõi dữ liệu trong dashboard.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right -->
            <div class="p-6 sm:p-10">
                <div class="mb-8">
                    <div
                        class="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-5 text-white">
                        <Icon icon="solar:t-shirt-bold" class="text-2xl" />
                    </div>

                    <h2 class="text-2xl font-bold text-text">
                        Đăng nhập
                    </h2>

                    <p class="text-sm text-text-light mt-1">
                        Sử dụng tài khoản admin hoặc người dùng để tiếp tục.
                    </p>
                </div>

                <form @submit.prevent="handleLogin" class="space-y-5">
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

                            <input v-model.trim="email" type="email" class="form-control !pl-[40px]"
                                placeholder="Nhập email" autocomplete="email" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mật khẩu</label>

                        <div class="relative">
                            <Icon icon="solar:lock-password-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model="password" :type="showPassword ? 'text' : 'password'"
                                class="form-control !pl-[40px] !pr-12" placeholder="Nhập mật khẩu"
                                autocomplete="current-password" />

                            <button type="button"
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition"
                                @click="showPassword = !showPassword">
                                <Icon :icon="showPassword ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'"
                                    class="text-xl" />
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <label class="flex items-center gap-2 text-sm text-text-sec cursor-pointer">
                            <input v-model="remember" type="checkbox" class="w-4 h-4 accent-primary" />
                            Ghi nhớ đăng nhập
                        </label>

                        <RouterLink to="/forgot-password" class="text-sm font-medium text-primary hover:underline">
                            Quên mật khẩu?
                        </RouterLink>
                    </div>

                    <button type="submit"
                        class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading">
                        <Icon v-if="!authStore.loading" icon="solar:login-3-bold-duotone" class="text-xl" />

                        <Icon v-else icon="solar:refresh-bold" class="text-xl animate-spin" />

                        {{ authStore.loading ? "Đang xử lý..." : "Đăng nhập" }}
                    </button>
                </form>

                <!-- Breeze actions -->
                <div class="mt-7">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="h-px bg-border flex-1"></div>
                        <span class="text-xs uppercase tracking-wide text-text-light">
                            Tác vụ khác
                        </span>
                        <div class="h-px bg-border flex-1"></div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <RouterLink to="/register"
                            class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-sec hover:bg-primary/10 hover:text-primary transition">
                            <Icon icon="solar:user-plus-bold-duotone" class="text-xl" />
                            Đăng ký
                        </RouterLink>

                        <RouterLink to="/forgot-password"
                            class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-sec hover:bg-primary/10 hover:text-primary transition">
                            <Icon icon="solar:key-bold-duotone" class="text-xl" />
                            Quên mật khẩu
                        </RouterLink>
                    </div>
                </div>

                <p class="text-center text-xs text-text-light mt-8">
                    © 2026 EVDesign. Admin Dashboard.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const remember = ref(false);
const showPassword = ref(false);
const errorMsg = ref("");

async function handleLogin() {
    errorMsg.value = "";

    try {
        await authStore.login(email.value, password.value, remember.value);

        const redirect = route.query.redirect;

        // Nếu là admin
        if (authStore.isAdmin) {
            // Nếu trước đó admin đang cố vào trang admin thì quay lại trang đó
            if (redirect && String(redirect).startsWith("/admin")) {
                router.push(String(redirect));
                return;
            }

            // Còn không thì về dashboard admin
            router.push({ name: "admin-dashboard" });
            return;
        }

        // Nếu là user thường
        if (redirect && !String(redirect).startsWith("/admin")) {
            router.push(String(redirect));
            return;
        }

        router.push({ name: "profile" });
    } catch (err) {
        errorMsg.value =
            err.response?.data?.message ||
            err.response?.data?.errors?.email?.[0] ||
            "Sai email hoặc mật khẩu";
    }
}
</script>