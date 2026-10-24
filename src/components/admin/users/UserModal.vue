<script setup>
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useUserStore } from "@/stores/admin/userStore";

const store = useUserStore();
import { useAuthStore } from "@/stores/shared/authStore";
const authStore = useAuthStore();

const avatarInput = ref(null);

const canSave = computed(() => {
    if (store.selectedUser) {
        return authStore.hasPermission("user.update");
    }

    return authStore.hasPermission("user.create");
});

function getInitials(name) {
    return String(name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
}

function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null;
    store.setAvatar(file);
}

async function handleSave() {
    if (!canSave.value || store.saving) return;
    try {
        await store.saveUser();
    } catch {
        // Store đã ghi lỗi để hiển thị trong form.
    }
}

function requestClose() {
    if (!store.saving) store.closeModal();
}
</script>

<template>
    <div v-if="store.showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="requestClose">
        <div class="bg-surface rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
                <div>
                    <h2 class="text-xl font-bold">
                        {{ store.selectedUser ? "Cập nhật người dùng" : "Thêm người dùng mới" }}
                    </h2>
                    <p class="text-sm text-text-light">
                        Quản lý thông tin tài khoản, trạng thái và vai trò.
                    </p>
                </div>

                <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Đóng" @click="requestClose" :disabled="store.saving">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </div>

            <form class="p-6 space-y-6" @submit.prevent="handleSave">
                <div v-if="store.errorMsg"
                    class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                    <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ store.errorMsg }}</span>
                </div>

                <!-- Avatar -->
                <div class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="section-title">Avatar</h3>
                            <p class="section-desc">Ảnh đại diện người dùng.</p>
                        </div>

                        <div class="flex items-center gap-3">
                            <span class="text-sm text-text-sec">Tài khoản hoạt động</span>
                            <label class="toggle">
                                <input v-model="store.form.is_active" type="checkbox"
                                    aria-label="Tài khoản hoạt động" />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div
                            class="w-24 h-24 rounded-2xl overflow-hidden bg-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
                            <img v-if="store.avatarPreview" :src="store.avatarPreview"
                                class="w-full h-full object-cover" alt="Avatar preview" />

                            <span v-else>{{ getInitials(store.form.name || "U") }}</span>
                        </div>

                        <div>
                            <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                                @click="avatarInput?.click()">
                                <Icon icon="solar:cloud-upload-bold" />
                                Chọn avatar
                            </button>

                            <input ref="avatarInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                                class="hidden" @change="handleAvatarChange" />

                            <p class="text-xs text-text-light mt-2">
                                JPG, JPEG, PNG, WEBP. Tối đa 2MB.
                            </p>

                            <p v-if="store.fieldError('avatar')" class="error-text">
                                {{ store.fieldError("avatar") }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="section-title">Thông tin tài khoản</h3>
                            <p class="section-desc">Thông tin cơ bản của người dùng.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">
                                Họ tên <span class="text-primary">*</span>
                            </label>

                            <input v-model.trim="store.form.name" class="form-control" placeholder="Nguyễn Văn A" />

                            <p v-if="store.fieldError('name')" class="error-text">
                                {{ store.fieldError("name") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                Email <span class="text-primary">*</span>
                            </label>

                            <input v-model.trim="store.form.email" type="email" class="form-control"
                                placeholder="example@gmail.com" />

                            <p v-if="store.fieldError('email')" class="error-text">
                                {{ store.fieldError("email") }}
                            </p>
                        </div>

                        <div class="form-group md:col-span-2">
                            <label class="form-label">Số điện thoại</label>

                            <input v-model.trim="store.form.phone_number" class="form-control"
                                placeholder="090xxxxxxx" />

                            <p v-if="store.fieldError('phone_number')" class="error-text">
                                {{ store.fieldError("phone_number") }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Password -->
                <div class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="section-title">Mật khẩu</h3>
                            <p class="section-desc">
                                {{ store.selectedUser ? "Bỏ trống nếu không muốn đổi mật khẩu." :
                                    "Tạo mật khẩu cho tài khoản mới." }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">
                                Mật khẩu
                                <span v-if="!store.selectedUser" class="text-primary">*</span>
                            </label>

                            <input v-model="store.form.password" type="password" class="form-control"
                                placeholder="Tối thiểu 8 ký tự" />

                            <p v-if="store.fieldError('password')" class="error-text">
                                {{ store.fieldError("password") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                Xác nhận mật khẩu
                                <span v-if="!store.selectedUser" class="text-primary">*</span>
                            </label>

                            <input v-model="store.form.password_confirmation" type="password" class="form-control"
                                placeholder="Nhập lại mật khẩu" />
                        </div>
                    </div>
                </div>

                <!-- Roles -->
                <div class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="section-title">Vai trò</h3>
                            <p class="section-desc">Chọn vai trò cho người dùng.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <label v-for="role in store.roles" :key="role.id" class="role-option"
                            :class="{ active: store.form.roles.includes(role.name) }">
                            <input v-model="store.form.roles" type="checkbox" :value="role.name" class="hidden" />

                            <Icon icon="solar:shield-bold-duotone" class="text-xl" />
                            <span>{{ role.name }}</span>
                        </label>
                    </div>

                    <p v-if="store.fieldError('roles')" class="error-text">
                        {{ store.fieldError("roles") }}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                    <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                        @click="requestClose" :disabled="store.saving">
                        Hủy
                    </button>

                    <button type="submit"
                        class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        :disabled="store.saving || !canSave">
                        <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                            :class="store.saving ? 'animate-spin' : ''" />

                        {{ store.saving ? "Đang lưu..." : "Lưu người dùng" }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.section-card {
    @apply rounded-2xl border border-border p-5 bg-surface shadow-sm;
}

.section-header {
    @apply flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5;
}

.section-title {
    @apply text-lg font-bold text-text;
}

.section-desc {
    @apply text-sm text-text-light;
}

.error-text {
    @apply text-danger text-sm mt-1;
}

.role-option {
    @apply flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold cursor-pointer hover:border-primary hover:text-primary transition;
}

.role-option.active {
    @apply bg-primary/10 border-primary text-primary;
}
</style>