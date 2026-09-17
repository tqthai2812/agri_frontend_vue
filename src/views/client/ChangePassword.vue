<script setup>
import { computed, reactive, ref } from "vue";
import { Icon } from "@iconify/vue";

import ProfileService from "@/services/client/profile.service";

const form = reactive({
    current_password: "",
    password: "",
    password_confirmation: "",
});

const show = reactive({
    current: false,
    password: false,
    confirmation: false,
});

const saving = ref(false);
const message = ref("");
const error = ref("");
const errors = ref({});

const passwordStrength = computed(() => {
    const password = form.password;
    let score = 0;

    if (password.length >= 8) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }

    const labels = [
        "Chưa nhập",
        "Yếu",
        "Trung bình",
        "Khá",
        "Mạnh",
    ];

    const colors = [
        "bg-slate-200",
        "bg-red-400",
        "bg-amber-400",
        "bg-blue-500",
        "bg-emerald-500",
    ];

    return {
        score,
        label: labels[score],
        color: colors[score],
    };
});

function firstValidationError(payload) {
    const validationErrors = payload?.errors || {};
    const firstKey = Object.keys(validationErrors)[0];

    return firstKey ? validationErrors[firstKey]?.[0] : null;
}

function fieldError(field) {
    return errors.value?.[field]?.[0] || "";
}

function resetForm() {
    Object.assign(form, {
        current_password: "",
        password: "",
        password_confirmation: "",
    });
}

async function submit() {
    error.value = "";
    message.value = "";
    errors.value = {};

    if (form.password.length < 8) {
        error.value = "Mật khẩu mới phải có ít nhất 8 ký tự.";
        return;
    }

    if (form.password !== form.password_confirmation) {
        error.value = "Xác nhận mật khẩu không khớp.";
        return;
    }

    saving.value = true;

    try {
        const response = await ProfileService.changePassword(form);

        message.value =
            response.data?.message || "Đổi mật khẩu thành công.";

        resetForm();
    } catch (err) {
        errors.value = err.response?.data?.errors || {};

        error.value =
            firstValidationError(err.response?.data) ||
            err.response?.data?.message ||
            "Không đổi được mật khẩu.";
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:lock-reset" class="text-2xl" />
                </span>

                <div>
                    <h1 class="text-lg font-bold text-[#123d27]">
                        Đổi mật khẩu
                    </h1>

                    <p class="mt-0.5 text-xs text-slate-400">
                        Sử dụng mật khẩu mạnh để bảo vệ tài khoản.
                    </p>
                </div>
            </div>
        </header>

        <div class="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]">
            <form class="space-y-5" @submit.prevent="submit">
                <div v-if="message"
                    class="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
                    <Icon icon="mdi:check-circle-outline" class="text-xl" />
                    {{ message }}
                </div>

                <div v-if="error"
                    class="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                    <Icon icon="mdi:alert-circle-outline" class="text-xl" />
                    {{ error }}
                </div>

                <label class="block">
                    <span class="password-label">
                        Mật khẩu hiện tại
                    </span>

                    <div class="relative">
                        <Icon icon="mdi:lock-outline" class="password-left-icon" />

                        <input v-model="form.current_password" :type="show.current ? 'text' : 'password'"
                            class="password-input" autocomplete="current-password"
                            placeholder="Nhập mật khẩu hiện tại" />

                        <button type="button" class="password-eye" @click="show.current = !show.current">
                            <Icon :icon="show.current
                                ? 'mdi:eye-off-outline'
                                : 'mdi:eye-outline'" />
                        </button>
                    </div>

                    <small v-if="fieldError('current_password')"
                        class="mt-1.5 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("current_password") }}
                    </small>
                </label>

                <label class="block">
                    <span class="password-label">
                        Mật khẩu mới
                    </span>

                    <div class="relative">
                        <Icon icon="mdi:key-outline" class="password-left-icon" />

                        <input v-model="form.password" :type="show.password ? 'text' : 'password'"
                            class="password-input" autocomplete="new-password" placeholder="Nhập mật khẩu mới" />

                        <button type="button" class="password-eye" @click="show.password = !show.password">
                            <Icon :icon="show.password
                                ? 'mdi:eye-off-outline'
                                : 'mdi:eye-outline'" />
                        </button>
                    </div>

                    <small v-if="fieldError('password')" class="mt-1.5 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("password") }}
                    </small>

                    <div class="mt-2 flex items-center gap-3">
                        <div class="grid flex-1 grid-cols-4 gap-1">
                            <span v-for="index in 4" :key="index" class="h-1.5 rounded-full" :class="index <= passwordStrength.score
                                ? passwordStrength.color
                                : 'bg-slate-200'"></span>
                        </div>

                        <span class="w-16 text-right text-[10px] font-semibold text-slate-400">
                            {{ passwordStrength.label }}
                        </span>
                    </div>
                </label>

                <label class="block">
                    <span class="password-label">
                        Xác nhận mật khẩu mới
                    </span>

                    <div class="relative">
                        <Icon icon="mdi:key-check-outline" class="password-left-icon" />

                        <input v-model="form.password_confirmation" :type="show.confirmation ? 'text' : 'password'"
                            class="password-input" autocomplete="new-password" placeholder="Nhập lại mật khẩu mới" />

                        <button type="button" class="password-eye" @click="show.confirmation = !show.confirmation">
                            <Icon :icon="show.confirmation
                                ? 'mdi:eye-off-outline'
                                : 'mdi:eye-outline'" />
                        </button>
                    </div>

                    <small v-if="fieldError('password_confirmation')"
                        class="mt-1.5 block text-[10px] font-semibold text-red-500">
                        {{ fieldError("password_confirmation") }}
                    </small>
                </label>

                <button type="submit"
                    class="inline-flex h-11 items-center gap-2 rounded-full bg-[#07532b] px-6 text-sm font-bold text-white transition hover:bg-[#0a6837] disabled:opacity-50"
                    :disabled="saving">
                    <Icon :icon="saving
                        ? 'mdi:loading'
                        : 'mdi:shield-key-outline'" :class="saving
                            ? 'animate-spin text-lg'
                            : 'text-lg'" />

                    {{
                        saving
                            ? "Đang cập nhật..."
                            : "Cập nhật mật khẩu"
                    }}
                </button>
            </form>

            <aside class="rounded-2xl bg-[#f2f8f4] p-5">
                <Icon icon="mdi:shield-check-outline" class="text-4xl text-[#0a7139]" />

                <h2 class="mt-4 text-sm font-bold text-[#123d27]">
                    Mật khẩu an toàn
                </h2>

                <ul class="mt-4 space-y-3 text-[11px] leading-5 text-slate-500">
                    <li class="flex gap-2">
                        <Icon icon="mdi:check-circle" class="mt-0.5 text-base text-[#0a7139]" />
                        Ít nhất 8 ký tự.
                    </li>

                    <li class="flex gap-2">
                        <Icon icon="mdi:check-circle" class="mt-0.5 text-base text-[#0a7139]" />
                        Kết hợp chữ hoa, chữ thường và số.
                    </li>

                    <li class="flex gap-2">
                        <Icon icon="mdi:check-circle" class="mt-0.5 text-base text-[#0a7139]" />
                        Không dùng lại mật khẩu ở dịch vụ khác.
                    </li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<style scoped>
@reference "../../style.css";

.password-label {
    @apply mb-2 block text-xs font-semibold text-slate-600;
}

.password-input {
    @apply h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-300 focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10;
}

.password-left-icon {
    @apply absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-slate-400;
}

.password-eye {
    @apply absolute right-3.5 top-1/2 -translate-y-1/2 text-xl text-slate-400 transition hover:text-[#07532b];
}
</style>