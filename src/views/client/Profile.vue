<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import { useAuthStore } from "@/stores/shared/authStore";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ProfileService from "@/services/client/profile.service";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
    name: "",
    email: "",
    phone_number: "",
    avatar: "",
    avatar_file: null,
});

const avatarInput = ref(null);
const avatarPreview = ref("");
const loading = ref(false);
const saving = ref(false);
const message = ref("");
const error = ref("");
const errors = ref({});
const showLogoutModal = ref(false);

let objectUrl = null;

const fallbackAvatar = computed(() => {
    return "https://i.pravatar.cc/300?img=12";
});

function firstValidationError(payload) {
    const validationErrors = payload?.errors || {};
    const firstKey = Object.keys(validationErrors)[0];

    return firstKey ? validationErrors[firstKey]?.[0] : null;
}

function fieldError(field) {
    return errors.value?.[field]?.[0] || "";
}

function fillForm(user = {}) {
    form.name = user.name || "";
    form.email = user.email || "";
    form.phone_number = user.phone_number || "";
    form.avatar = user.avatar || "";
    form.avatar_file = null;

    avatarPreview.value = user.avatar || fallbackAvatar.value;
}

function syncAuthUser(user) {
    if (!user) {
        return;
    }

    authStore.user = {
        ...(authStore.user || {}),
        ...user,
    };

    localStorage.setItem("auth_user", JSON.stringify(authStore.user));
}

async function fetchProfile() {
    loading.value = true;
    error.value = "";

    try {
        if (authStore.user) {
            fillForm(authStore.user);
        }

        const response = await ProfileService.getProfile();

        const user =
            response.data?.user ||
            response.data?.data?.user ||
            response.data?.data ||
            null;

        if (user) {
            fillForm(user);
            syncAuthUser(user);
        }
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            "Không tải được thông tin hồ sơ.";
    } finally {
        loading.value = false;
    }
}

function chooseAvatar() {
    avatarInput.value?.click();
}

function handleAvatar(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        window.alert("Vui lòng chọn đúng định dạng ảnh.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        window.alert("Ảnh đại diện không được vượt quá 2MB.");
        return;
    }

    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
    }

    objectUrl = URL.createObjectURL(file);
    avatarPreview.value = objectUrl;
    form.avatar_file = file;
}

async function saveProfile() {
    message.value = "";
    error.value = "";
    errors.value = {};
    saving.value = true;

    try {
        const formData = new FormData();

        formData.append("name", form.name || "");
        formData.append("phone_number", form.phone_number || "");

        if (form.avatar_file) {
            formData.append("avatar", form.avatar_file);
        }

        const response = await ProfileService.updateProfile(formData);

        const user =
            response.data?.user ||
            response.data?.data?.user ||
            response.data?.data ||
            null;

        if (user) {
            fillForm(user);
            syncAuthUser(user);
        }

        message.value =
            response.data?.message || "Cập nhật hồ sơ thành công.";
    } catch (err) {
        errors.value = err.response?.data?.errors || {};

        error.value =
            firstValidationError(err.response?.data) ||
            err.response?.data?.message ||
            "Không cập nhật được hồ sơ.";
    } finally {
        saving.value = false;
    }
}

async function handleLogout() {
    try {
        await authStore.logout();

        await router.replace({
            name: "login",
        });
    } catch (err) {
        console.error("Lỗi đăng xuất:", err);
    } finally {
        showLogoutModal.value = false;
    }
}

onMounted(() => {
    fetchProfile();
});

onBeforeUnmount(() => {
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
    }
});
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:account-edit-outline" class="text-2xl" />
                </span>

                <div>
                    <h1 class="text-lg font-bold text-[#123d27]">
                        Hồ sơ của tôi
                    </h1>

                    <p class="mt-0.5 text-xs text-slate-400">
                        Quản lý thông tin cá nhân để bảo mật tài khoản.
                    </p>
                </div>
            </div>
        </header>

        <div v-if="loading" class="grid min-h-72 place-items-center">
            <div class="text-center">
                <Icon icon="mdi:loading" class="mx-auto text-5xl text-[#07532b] animate-spin" />

                <p class="mt-3 text-xs font-semibold text-slate-400">
                    Đang tải hồ sơ...
                </p>
            </div>
        </div>

        <form v-else class="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_250px]" @submit.prevent="saveProfile">
            <div class="space-y-5">
                <div v-if="message"
                    class="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
                    <Icon icon="mdi:check-circle-outline" class="text-xl" />
                    {{ message }}
                </div>

                <div v-if="error"
                    class="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                    <Icon icon="mdi:alert-circle-outline" class="text-xl" />
                    {{ error }}
                </div>

                <label class="block">
                    <span class="profile-label">Họ và tên</span>

                    <div class="relative">
                        <Icon icon="mdi:account-outline" class="profile-icon" />

                        <input v-model.trim="form.name" class="profile-input" placeholder="Nhập họ và tên" />
                    </div>

                    <small v-if="fieldError('name')" class="mt-1.5 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("name") }}
                    </small>
                </label>

                <label class="block">
                    <span class="profile-label">Email</span>

                    <div class="relative">
                        <Icon icon="mdi:email-outline" class="profile-icon" />

                        <input v-model.trim="form.email" type="email" class="profile-input bg-slate-50" readonly />
                    </div>

                    <small class="mt-1.5 block text-[10px] text-slate-400">
                        Email đăng nhập không thể tự thay đổi.
                    </small>
                </label>

                <label class="block">
                    <span class="profile-label">Số điện thoại</span>

                    <div class="relative">
                        <Icon icon="mdi:phone-outline" class="profile-icon" />

                        <input v-model.trim="form.phone_number" inputmode="tel" class="profile-input"
                            placeholder="Nhập số điện thoại" />
                    </div>

                    <small v-if="fieldError('phone_number')"
                        class="mt-1.5 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("phone_number") }}
                    </small>
                </label>

                <div class="flex flex-wrap items-center gap-3 pt-1">
                    <button type="submit"
                        class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#07532b] px-6 text-sm font-bold text-white shadow-[0_9px_22px_rgba(7,83,43,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="saving">
                        <Icon :icon="saving ? 'mdi:loading' : 'mdi:content-save-outline'" :class="[
                            'text-lg',
                            saving ? 'animate-spin' : '',
                        ]" />

                        {{
                            saving
                                ? "Đang lưu..."
                                : "Lưu thay đổi"
                        }}
                    </button>

                    <button type="button"
                        class="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 text-sm font-bold text-red-500 transition hover:border-red-300 hover:bg-red-50"
                        @click="showLogoutModal = true">
                        <Icon icon="mdi:logout" class="text-lg" />
                        Đăng xuất
                    </button>
                </div>
            </div>

            <div class="border-slate-100 lg:border-l lg:pl-8">
                <div class="flex flex-col items-center text-center">
                    <div class="relative">
                        <img :src="avatarPreview || fallbackAvatar" :alt="form.name || 'Avatar'"
                            class="size-32 rounded-full border-4 border-[#edf5f0] object-cover shadow-lg" />

                        <button type="button"
                            class="absolute bottom-1 right-1 grid size-9 place-items-center rounded-full bg-[#ffd326] text-[#07532b] shadow-md ring-4 ring-white transition hover:scale-105"
                            aria-label="Chọn ảnh đại diện" @click="chooseAvatar">
                            <Icon icon="mdi:camera-outline" class="text-xl" />
                        </button>
                    </div>

                    <strong class="mt-4 text-sm text-[#123d27]">
                        Ảnh đại diện
                    </strong>

                    <p class="mt-2 text-[10px] leading-4 text-slate-400">
                        Dung lượng tối đa 2MB.<br />
                        Định dạng JPG, JPEG, PNG hoặc WEBP.
                    </p>

                    <small v-if="fieldError('avatar')" class="mt-2 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("avatar") }}
                    </small>

                    <button type="button"
                        class="mt-4 rounded-full border border-[#9dbba8] px-4 py-2 text-xs font-semibold text-[#07532b] transition hover:bg-[#edf5f0]"
                        @click="chooseAvatar">
                        Chọn ảnh
                    </button>

                    <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden"
                        @change="handleAvatar" />
                </div>
            </div>
        </form>
    </section>

    <ConfirmModal v-model="showLogoutModal" title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản NFarmHouse không?" confirm-text="Đăng xuất"
        cancel-text="Ở lại" loading-text="Đang đăng xuất..." type="danger" icon="mdi:logout"
        :loading="authStore.loading" @confirm="handleLogout" />
</template>

<style scoped>
@reference "../../style.css";

.profile-label {
    @apply mb-2 block text-xs font-semibold text-slate-600;
}

.profile-input {
    @apply h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10;
}

.profile-icon {
    @apply absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-slate-400;
}
</style>