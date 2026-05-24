<template>
    <div class="min-h-screen bg-bg p-6">
        <div class="max-w-5xl mx-auto">
            <div class="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
                <div class="bg-primary p-8 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div
                            class="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center text-3xl font-bold">
                            {{ initials }}
                        </div>

                        <div>
                            <h1 class="text-2xl font-bold">
                                {{ authStore.user?.name || "Tài khoản" }}
                            </h1>

                            <p class="text-white/80 mt-1">
                                {{ authStore.user?.email || "Chưa có email" }}
                            </p>

                            <div class="inline-flex items-center gap-2 mt-3 bg-white/15 rounded-full px-3 py-1 text-sm">
                                <Icon icon="solar:shield-user-bold-duotone" class="text-lg" />
                                {{ authStore.user?.role || "user" }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="rounded-2xl border border-border p-6">
                            <h2 class="text-lg font-bold text-text mb-5">
                                Thông tin tài khoản
                            </h2>

                            <div class="space-y-4">
                                <div class="flex items-center gap-4">
                                    <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon icon="solar:user-bold-duotone" class="text-2xl text-primary" />
                                    </div>

                                    <div>
                                        <p class="text-xs text-text-light">Họ tên</p>
                                        <p class="font-semibold text-text">{{ authStore.user?.name || "—" }}</p>
                                    </div>
                                </div>

                                <div class="flex items-center gap-4">
                                    <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon icon="solar:letter-bold-duotone" class="text-2xl text-primary" />
                                    </div>

                                    <div>
                                        <p class="text-xs text-text-light">Email</p>
                                        <p class="font-semibold text-text">{{ authStore.user?.email || "—" }}</p>
                                    </div>
                                </div>

                                <div class="flex items-center gap-4">
                                    <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon icon="solar:shield-keyhole-bold-duotone" class="text-2xl text-primary" />
                                    </div>

                                    <div>
                                        <p class="text-xs text-text-light">Vai trò</p>
                                        <p class="font-semibold text-text">{{ authStore.user?.role || "user" }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-border p-6">
                            <h2 class="text-lg font-bold text-text mb-2">
                                Gợi ý
                            </h2>

                            <p class="text-sm text-text-light leading-relaxed">
                                Nếu tài khoản này là admin, bạn có thể truy cập bảng điều khiển.
                                Nếu là user thường, hệ thống có thể điều hướng đến giao diện người dùng riêng.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <RouterLink v-if="authStore.isAdmin" to="/dashboard"
                            class="btn-primary w-full justify-center py-3 rounded-xl">
                            <Icon icon="solar:home-2-bold-duotone" class="text-xl" />
                            Về dashboard
                        </RouterLink>

                        <RouterLink to="/verify-email"
                            class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-sec hover:bg-primary/10 hover:text-primary transition">
                            <Icon icon="solar:letter-unread-bold-duotone" class="text-xl" />
                            Xác thực email
                        </RouterLink>

                        <button type="button"
                            class="w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-100 transition"
                            @click="handleLogout">
                            <Icon icon="solar:logout-2-bold-duotone" class="text-xl" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmModal v-model="showLogoutModal" title="Xác nhận đăng xuất"
            message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?" confirm-text="Đăng xuất"
            cancel-text="Ở lại" loading-text="Đang đăng xuất..." type="danger" icon="solar:logout-2-bold-duotone"
            :loading="authStore.loading" @confirm="confirmLogout" />
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";
import ConfirmModal from "@/components/common/ConfirmModal.vue";

const router = useRouter();
const authStore = useAuthStore();

const showLogoutModal = ref(false);

const initials = computed(() => {
    const name = authStore.user?.name || authStore.user?.email || "EV";
    return name
        .split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
});

function handleLogout() {
    showLogoutModal.value = true;
}

async function confirmLogout() {
    showLogoutModal.value = false;

    await authStore.logout();
    router.push("/login");
}
</script>