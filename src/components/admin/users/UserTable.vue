<script setup>
import { Icon } from "@iconify/vue";
import { useUserStore } from "@/stores/admin/userStore";

const store = useUserStore();
import { useAuthStore } from "@/stores/shared/authStore";
const authStore = useAuthStore();

const emit = defineEmits(["delete", "toggle-status"]);

function getInitials(name) {
    return String(name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("vi-VN");
}
</script>

<template>
    <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
        <p class="text-sm">Đang tải người dùng...</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
            <thead class="bg-bg">
                <tr>
                    <th class="table-th">Người dùng</th>
                    <th class="table-th">Liên hệ</th>
                    <th class="table-th">Vai trò</th>
                    <th class="table-th">Trạng thái</th>
                    <th class="table-th">Email xác thực</th>
                    <th class="table-th">Ngày tạo</th>
                    <th class="table-th">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="user in store.users" :key="user.id" class="table-row">
                    <td class="table-td">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-11 h-11 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold shrink-0">
                                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name"
                                    class="w-full h-full object-cover" />

                                <span v-else>{{ getInitials(user.name) }}</span>
                            </div>

                            <div class="min-w-0">
                                <div class="font-semibold text-sm truncate max-w-[260px]">
                                    {{ user.name }}
                                </div>

                                <div class="text-xs text-text-light">
                                    ID: {{ user.id }}
                                </div>

                                <div class="text-xs text-text-light">
                                    {{ user.role || "customer" }}
                                </div>
                            </div>
                        </div>
                    </td>

                    <td class="table-td">
                        <div class="space-y-1">
                            <div class="text-sm">{{ user.email }}</div>

                            <a v-if="user.phone_number" :href="`tel:${user.phone_number}`" class="text-primary text-xs">
                                {{ user.phone_number }}
                            </a>

                            <span v-else class="text-xs text-text-light">Chưa có số điện thoại</span>
                        </div>
                    </td>

                    <td class="table-td">
                        <div class="flex flex-wrap gap-1">
                            <span v-for="role in user.roles" :key="role" class="badge-gray">
                                {{ role }}
                            </span>

                            <span v-if="!user.roles?.length" class="text-sm text-text-light">
                                Chưa có vai trò
                            </span>
                        </div>
                    </td>

                    <td class="table-td">
                        <span :class="user.is_active ? 'badge-active' : 'badge-inactive'">
                            {{ user.is_active ? "Đang hoạt động" : "Đã khóa" }}
                        </span>
                    </td>

                    <td class="table-td">
                        <span :class="user.email_verified_at ? 'badge-active' : 'badge-pending'">
                            {{ user.email_verified_at ? "Đã xác thực" : "Chưa xác thực" }}
                        </span>
                    </td>

                    <td class="table-td text-sm text-text-light">
                        {{ formatDate(user.created_at) }}
                    </td>

                    <td class="table-td">
                        <div class="flex gap-2">
                            <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Xem người dùng" aria-label="Xem người dùng" @click="store.openEditModal(user)"
                                :disabled="store.saving">
                                <Icon icon="solar:eye-bold" />
                            </button>

                            <button type="button" v-if="authStore.hasPermission('user.update')"
                                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Sửa người dùng" aria-label="Sửa người dùng" @click="store.openEditModal(user)"
                                :disabled="store.saving">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button type="button" v-if="authStore.hasPermission('user.update') && user.is_active"
                                class="btn-outline-icon text-warning cursor-pointer disabled:cursor-not-allowed"
                                title="Khóa tài khoản" aria-label="Khóa tài khoản" :disabled="store.saving"
                                @click="emit('toggle-status', user, false)">
                                <Icon icon="solar:lock-keyhole-bold-duotone" />
                            </button>

                            <button type="button" v-if="authStore.hasPermission('user.update') && !user.is_active"
                                class="btn-outline-icon text-success cursor-pointer disabled:cursor-not-allowed"
                                title="Mở khóa tài khoản" aria-label="Mở khóa tài khoản" :disabled="store.saving"
                                @click="emit('toggle-status', user, true)">
                                <Icon icon="solar:lock-keyhole-unlocked-bold-duotone" />
                            </button>

                            <button type="button" v-if="authStore.hasPermission('user.delete')"
                                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                title="Xóa người dùng" aria-label="Xóa người dùng" :disabled="store.deleting"
                                @click="emit('delete', user)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.users.length">
                    <td colspan="7" class="empty-cell">
                        Không có người dùng nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.table-th {
    @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
    @apply p-3 align-middle;
}

.table-row {
    @apply border-b border-border hover:bg-primary/5 transition;
}

.empty-cell {
    @apply p-8 text-center text-text-light;
}
</style>