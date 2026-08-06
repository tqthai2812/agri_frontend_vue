<template>
    <div>
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold">Quản lý phân quyền</h1>
                <p class="text-text-light text-sm">
                    Tạo vai trò, gán quyền và phân quyền cho người dùng.
                </p>
            </div>

            <button class="btn-primary" @click="handleReload">
                <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
                Tải lại
            </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="stat-card-info">
                <div class="stat-label">Tổng vai trò</div>
                <div class="stat-value text-info">{{ store.groupedRoleStats.roles }}</div>
            </div>

            <div class="stat-card-success">
                <div class="stat-label">Role admin</div>
                <div class="stat-value text-success">{{ store.groupedRoleStats.admin }}</div>
            </div>

            <div class="stat-card-warning">
                <div class="stat-label">Role tùy chỉnh</div>
                <div class="stat-value">{{ store.groupedRoleStats.custom }}</div>
            </div>

            <div class="stat-card-danger">
                <div class="stat-label">Tổng quyền</div>
                <div class="stat-value text-danger">{{ store.groupedRoleStats.permissions }}</div>
            </div>
        </div>

        <!-- Messages -->
        <div v-if="store.message"
            class="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm">
            <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.message }}</span>
        </div>

        <div v-if="store.errorMsg"
            class="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Left: Role form -->
            <div class="xl:col-span-1 space-y-6">
                <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border">
                    <div class="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 class="text-lg font-bold">
                                {{ store.selectedRole ? "Cập nhật vai trò" : "Tạo vai trò" }}
                            </h2>
                            <p class="text-sm text-text-light">
                                Chọn các quyền được phép sử dụng.
                            </p>
                        </div>

                        <button v-if="store.selectedRole" type="button" class="btn-outline-icon"
                            @click="store.resetForm">
                            <Icon icon="solar:close-circle-bold" />
                        </button>
                    </div>

                    <form @submit.prevent="handleSaveRole" class="space-y-5">
                        <div class="form-group">
                            <label class="form-label">Tên vai trò</label>

                            <div class="relative">
                                <Icon icon="solar:shield-user-bold-duotone"
                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                                <input v-model.trim="store.form.name" type="text" class="form-control !pl-12"
                                    placeholder="Ví dụ: manager, staff, seller"
                                    :disabled="store.selectedRole?.name === 'admin'" />
                            </div>

                            <p v-if="store.errors.name" class="text-danger text-sm mt-1">
                                {{ store.errors.name }}
                            </p>
                        </div>

                        <div class="form-group">
                            <div class="flex items-center justify-between mb-2">
                                <label class="form-label mb-0">Danh sách quyền</label>
                                <span class="text-xs text-text-light">
                                    Đã chọn {{ store.form.permissions.length }} quyền
                                </span>
                            </div>

                            <div class="max-h-[420px] overflow-y-auto pr-1 space-y-4">
                                <div v-for="(permissions, groupName) in store.permissionGroups" :key="groupName"
                                    class="rounded-2xl border border-border p-4">
                                    <div class="flex items-center gap-2 mb-3">
                                        <div
                                            class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Icon :icon="getGroupIcon(groupName)" class="text-xl" />
                                        </div>
                                        <h3 class="font-semibold capitalize">{{ groupName }}</h3>
                                    </div>

                                    <div class="space-y-2">
                                        <label v-for="permission in permissions" :key="permission.id"
                                            class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary/5 cursor-pointer">
                                            <input type="checkbox" class="w-4 h-4 accent-primary"
                                                :checked="store.hasPermissionSelected(permission.name)"
                                                :disabled="store.selectedRole?.name === 'admin'"
                                                @change="store.togglePermission(permission.name)" />

                                            <span class="text-sm font-medium text-text-sec">
                                                {{ permission.name }}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <p v-if="store.errors.permissions" class="text-danger text-sm mt-1">
                                {{ store.errors.permissions }}
                            </p>
                        </div>

                        <button type="submit"
                            class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="store.savingRole || store.selectedRole?.name === 'admin'">
                            <Icon :icon="store.savingRole ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                                class="text-xl" :class="store.savingRole ? 'animate-spin' : ''" />

                            {{ store.savingRole ? "Đang lưu..." : store.selectedRole ? "Cập nhật vai trò" : "Tạo vaitrò"
                            }}
                        </button>
                    </form>
                </div>

                <!-- Assign role -->
                <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border">
                    <div class="mb-5">
                        <h2 class="text-lg font-bold">Gán vai trò cho user</h2>
                        <p class="text-sm text-text-light">
                            Dùng để test API PUT /api/v1/users/:id/roles.
                        </p>
                    </div>

                    <form @submit.prevent="handleAssignRole" class="space-y-5">
                        <div class="form-group">
                            <label class="form-label">Chọn người dùng</label>

                            <div class="relative">
                                <Icon icon="solar:user-id-bold-duotone"
                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                                <input v-model.trim="store.userSearch" type="text" class="form-control !pl-12 pr-12"
                                    placeholder="Nhập tên hoặc email để tìm user" @input="handleSearchUsers"
                                    @focus="showUserDropdown = true" />

                                <button v-if="store.selectedUser" type="button"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-danger transition"
                                    @click="handleClearSelectedUser">
                                    <Icon icon="solar:close-circle-bold" class="text-xl" />
                                </button>

                                <div v-if="showUserDropdown"
                                    class="absolute left-0 right-0 top-[calc(100%+8px)] z-30 bg-surface border border-border rounded-2xl shadow-xl max-h-72 overflow-y-auto">
                                    <div v-if="store.loadingUsers" class="px-4 py-3 text-sm text-text-light">
                                        Đang tải người dùng...
                                    </div>

                                    <button v-for="user in store.users" :key="user.id" type="button"
                                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 text-left border-b border-border last:border-b-0"
                                        @click="handleSelectUser(user)">
                                        <div
                                            class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                            {{ getUserInitial(user.name) }}
                                        </div>

                                        <div class="min-w-0 flex-1">
                                            <div class="font-semibold text-sm truncate">
                                                {{ user.name }}
                                            </div>

                                            <div class="text-xs text-text-light truncate">
                                                {{ user.email }}
                                            </div>

                                            <div class="flex flex-wrap gap-1 mt-1">
                                                <span v-for="roleName in user.roles" :key="roleName"
                                                    class="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium">
                                                    {{ roleName }}
                                                </span>

                                                <span v-if="!user.roles?.length" class="text-[11px] text-text-light">
                                                    Chưa có role
                                                </span>
                                            </div>
                                        </div>

                                        <span class="text-xs text-text-light">
                                            ID: {{ user.id }}
                                        </span>
                                    </button>

                                    <div v-if="!store.loadingUsers && !store.users.length"
                                        class="px-4 py-3 text-sm text-text-light">
                                        Không tìm thấy người dùng.
                                    </div>
                                </div>
                            </div>

                            <p v-if="store.selectedUser" class="text-xs text-text-light mt-2">
                                Đang chọn:
                                <span class="font-semibold text-primary">
                                    {{ store.selectedUser.name }} - {{ store.selectedUser.email }}
                                </span>
                            </p>

                            <p v-if="store.errors.user_id" class="text-danger text-sm mt-1">
                                {{ store.errors.user_id }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Chọn vai trò</label>

                            <div class="space-y-2">
                                <label v-for="role in store.roles" :key="role.id"
                                    class="flex items-center gap-3 rounded-xl border border-border px-3 py-2 hover:bg-primary/5 cursor-pointer">
                                    <input type="checkbox" class="w-4 h-4 accent-primary"
                                        :checked="store.hasAssignRoleSelected(role.name)"
                                        @change="store.toggleAssignRole(role.name)" />

                                    <span class="text-sm font-semibold">{{ role.name }}</span>
                                </label>
                            </div>

                            <p v-if="store.errors.roles" class="text-danger text-sm mt-1">
                                {{ store.errors.roles }}
                            </p>
                        </div>

                        <button type="submit"
                            class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="store.assigningRole">
                            <Icon :icon="store.assigningRole ? 'solar:refresh-bold' : 'solar:user-check-bold-duotone'"
                                class="text-xl" :class="store.assigningRole ? 'animate-spin' : ''" />

                            {{ store.assigningRole ? "Đang gán..." : "Gán vai trò" }}
                        </button>
                    </form>
                </div>
            </div>

            <!-- Right: Role table -->
            <div class="xl:col-span-2">
                <div class="bg-surface rounded-2xl p-5 shadow-sm overflow-x-auto border border-border">
                    <div class="flex flex-col sm:flex-row gap-3 mb-5">
                        <div
                            class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[180px]">
                            <Icon icon="solar:magnifer-bold" class="text-text-light" />
                            <input v-model.trim="keyword" type="text" placeholder="Tìm role..."
                                class="bg-transparent outline-none text-sm w-full" />
                        </div>

                        <select v-model="filterType" class="filter-select">
                            <option value="all">Tất cả vai trò</option>
                            <option value="admin">Admin</option>
                            <option value="custom">Role tùy chỉnh</option>
                        </select>
                    </div>

                    <table class="w-full min-w-[850px]">
                        <thead class="bg-bg">
                            <tr>
                                <th class="p-3 text-left text-xs">Vai trò</th>
                                <th class="p-3 text-left text-xs">Guard</th>
                                <th class="p-3 text-left text-xs">Số quyền</th>
                                <th class="p-3 text-left text-xs">Quyền</th>
                                <th class="p-3 text-left text-xs">Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="role in filteredRoles" :key="role.id"
                                class="border-b border-border hover:bg-primary/5">
                                <td class="p-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            :class="role.name === 'admin' ? 'bg-danger' : 'bg-primary'">
                                            {{ getRoleInitial(role.name) }}
                                        </div>

                                        <div>
                                            <div class="font-semibold text-sm">{{ role.name }}</div>
                                            <div class="text-xs text-text-light">ID: {{ role.id }}</div>
                                        </div>
                                    </div>
                                </td>

                                <td class="p-3 text-sm">
                                    <span class="badge-active">{{ role.guard_name }}</span>
                                </td>

                                <td class="p-3 font-mono text-sm">
                                    {{ role.permissions?.length || 0 }} quyền
                                </td>

                                <td class="p-3">
                                    <div class="flex flex-wrap gap-2 max-w-[380px]">
                                        <span v-for="permission in visiblePermissions(role)" :key="permission.id"
                                            class="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                            {{ permission.name }}
                                        </span>

                                        <span v-if="hiddenPermissionCount(role) > 0"
                                            class="px-2 py-1 rounded-lg bg-bg text-text-light text-xs font-medium">
                                            +{{ hiddenPermissionCount(role) }} quyền
                                        </span>

                                        <span v-if="!role.permissions?.length" class="text-xs text-text-light">
                                            Chưa có quyền
                                        </span>
                                    </div>
                                </td>

                                <td class="p-3">
                                    <div class="flex gap-2">
                                        <button class="btn-outline-icon" title="Sửa" @click="store.fillForm(role)">
                                            <Icon icon="solar:pen-bold" />
                                        </button>

                                        <button class="btn-danger-icon" title="Xóa" :disabled="role.name === 'admin'"
                                            :class="role.name === 'admin' ? 'opacity-50 cursor-not-allowed' : ''"
                                            @click="handleDeleteRole(role)">
                                            <Icon icon="solar:trash-bin-trash-bold" />
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="!filteredRoles.length">
                                <td colspan="5" class="p-6 text-center text-text-light">
                                    Không tìm thấy vai trò nào.
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
                        <span class="text-sm text-text-light">
                            Hiển thị {{ filteredRoles.length }} / {{ store.roles.length }} vai trò
                        </span>

                        <div class="flex gap-2">
                            <button class="page-btn active">1</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Permission preview -->
        <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border mt-6">
            <div class="mb-5">
                <h2 class="text-lg font-bold">Danh sách quyền trong hệ thống</h2>
                <p class="text-sm text-text-light">
                    Các quyền này được lấy từ API /api/v1/permissions.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div v-for="(permissions, groupName) in store.permissionGroups" :key="groupName"
                    class="rounded-2xl border border-border p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon :icon="getGroupIcon(groupName)" class="text-xl" />
                        </div>

                        <h3 class="font-semibold capitalize">{{ groupName }}</h3>
                    </div>

                    <div class="space-y-2">
                        <div v-for="permission in permissions" :key="permission.id"
                            class="text-xs text-text-sec bg-bg rounded-lg px-3 py-2">
                            {{ permission.name }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRoleStore } from "@/stores/roleStore";

const store = useRoleStore();

const keyword = ref("");
const filterType = ref("all");
const showUserDropdown = ref(false);

let searchTimer = null;

const filteredRoles = computed(() => {
    let data = store.roles;

    if (filterType.value === "admin") {
        data = data.filter((role) => role.name === "admin");
    }

    if (filterType.value === "custom") {
        data = data.filter((role) => role.name !== "admin");
    }

    if (keyword.value) {
        const search = keyword.value.toLowerCase();
        data = data.filter((role) => role.name.toLowerCase().includes(search));
    }

    return data;
});

function getRoleInitial(name) {
    return String(name || "?").charAt(0).toUpperCase();
}

function getUserInitial(name) {
    return String(name || "?").charAt(0).toUpperCase();
}

function getGroupIcon(groupName) {
    const icons = {
        dashboard: "solar:chart-2-bold-duotone",
        category: "solar:widget-bold-duotone",
        subcategory: "solar:layers-bold-duotone",
        origin: "solar:map-point-bold-duotone",
        product: "solar:box-bold-duotone",
        order: "solar:cart-large-bold-duotone",
        user: "solar:users-group-rounded-bold-duotone",
        role: "solar:shield-user-bold-duotone",
        permission: "solar:key-bold-duotone",
    };

    return icons[groupName] || "solar:key-bold-duotone";
}

function visiblePermissions(role) {
    return role.permissions?.slice(0, 6) || [];
}

function hiddenPermissionCount(role) {
    const total = role.permissions?.length || 0;
    return total > 6 ? total - 6 : 0;
}

function handleSelectUser(user) {
    store.selectUser(user);
    showUserDropdown.value = false;
}

function handleClearSelectedUser() {
    store.clearSelectedUser();
    showUserDropdown.value = true;
    store.fetchUsers();
}

function handleSearchUsers() {
    showUserDropdown.value = true;

    if (searchTimer) {
        clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
        store.fetchUsers(store.userSearch);
    }, 350);
}

async function handleReload() {
    await store.loadData();
}

async function handleSaveRole() {
    await store.saveRole();
}

async function handleAssignRole() {
    await store.assignRolesToUser();
}

async function handleDeleteRole(role) {
    if (role.name === "admin") {
        return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa vai trò "${role.name}" không?`);

    if (!confirmed) {
        return;
    }

    await store.deleteRole(role);
}

watch(
    () => store.userSearch,
    (value) => {
        if (!value) {
            store.clearSelectedUser();
            store.fetchUsers();
        }
    },
);

onMounted(async () => {
    await store.loadData();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
    @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
}

.stat-card-success {
    @apply border-l-success;
}

.stat-card-warning {
    @apply border-l-warning;
}

.stat-card-danger {
    @apply border-l-danger;
}

.stat-card-info {
    @apply border-l-info;
}

.stat-label {
    @apply text-text-light text-xs font-medium;
}

.stat-value {
    @apply text-2xl font-bold font-mono;
}
</style>