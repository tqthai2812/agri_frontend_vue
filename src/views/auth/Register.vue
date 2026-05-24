<template>
    <div class="fixed inset-0 bg-bg flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
        <div
            class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface rounded-3xl shadow-xl border border-border overflow-hidden">
            <!-- Left -->
            <div class="hidden lg:flex flex-col justify-between bg-primary p-10 text-white">
                <div>
                    <div class="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                        <Icon icon="solar:user-plus-bold-duotone" class="text-3xl" />
                    </div>

                    <h1 class="text-3xl font-bold mb-3">
                        Tạo tài khoản EVDesign
                    </h1>

                    <p class="text-white/80 leading-relaxed">
                        Đăng ký tài khoản bằng email. Hệ thống sẽ gửi mã OTP về Gmail trước khi tạo tài khoản.
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:letter-unread-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Xác thực Gmail</h3>
                            <p class="text-sm text-white/70">Email phải được xác thực trước khi đăng ký.</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:lock-keyhole-bold-duotone" class="text-2xl" />
                        </div>
                        <div>
                            <h3 class="font-semibold">Bảo mật tài khoản</h3>
                            <p class="text-sm text-white/70">Tài khoản được xử lý bởi Laravel Breeze API.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right -->
            <div class="p-6 sm:p-10">
                <div class="mb-8">
                    <div
                        class="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-5 text-white">
                        <Icon icon="solar:user-plus-bold-duotone" class="text-2xl" />
                    </div>

                    <h2 class="text-2xl font-bold text-text">
                        Đăng ký tài khoản
                    </h2>

                    <p class="text-sm text-text-light mt-1">
                        {{ stepDescription }}
                    </p>
                </div>

                <!-- Step indicator -->
                <div class="grid grid-cols-3 gap-3 mb-7">
                    <div class="rounded-2xl px-3 py-2 text-center text-xs font-semibold border"
                        :class="step >= 1 ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-text-light'">
                        1. Email
                    </div>

                    <div class="rounded-2xl px-3 py-2 text-center text-xs font-semibold border"
                        :class="step >= 2 ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-text-light'">
                        2. OTP
                    </div>

                    <div class="rounded-2xl px-3 py-2 text-center text-xs font-semibold border"
                        :class="step >= 3 ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-text-light'">
                        3. Tài khoản
                    </div>
                </div>

                <div v-if="successMsg"
                    class="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm">
                    <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ successMsg }}</span>
                </div>

                <div v-if="errorMsg"
                    class="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                    <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ errorMsg }}</span>
                </div>

                <!-- STEP 1: Nhập email -->
                <form v-if="step === 1" @submit.prevent="handleSendCode" class="space-y-5">
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

                    <button type="submit"
                        class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading">
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:letter-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang gửi mã..." : "Gửi mã xác thực" }}
                    </button>
                </form>

                <!-- STEP 2: Nhập OTP -->
                <form v-if="step === 2" @submit.prevent="handleVerifyCode" class="space-y-5">
                    <div class="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-text-sec">
                        Mã xác thực đã được gửi đến:
                        <span class="font-semibold text-primary">{{ form.email }}</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mã OTP</label>

                        <div class="relative">
                            <Icon icon="solar:shield-check-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model.trim="form.code" type="text" maxlength="6" class="form-control !pl-12"
                                placeholder="Nhập mã 6 số" autocomplete="one-time-code" />
                        </div>

                        <p v-if="errors.code" class="text-danger text-sm mt-1">
                            {{ errors.code }}
                        </p>
                    </div>

                    <button type="submit"
                        class="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="authStore.loading">
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:shield-check-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang xác thực..." : "Xác thực mã" }}
                    </button>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button type="button"
                            class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-sec hover:bg-primary/10 hover:text-primary transition"
                            @click="backToEmail">
                            <Icon icon="solar:arrow-left-bold-duotone" class="text-xl" />
                            Đổi email
                        </button>

                        <button type="button"
                            class="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-sec hover:bg-primary/10 hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="authStore.loading" @click="handleSendCode">
                            <Icon icon="solar:refresh-bold-duotone" class="text-xl" />
                            Gửi lại mã
                        </button>
                    </div>
                </form>

                <!-- STEP 3: Nhập thông tin tài khoản -->
                <form v-if="step === 3" @submit.prevent="handleRegister" class="space-y-5">
                    <div class="rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-600">
                        Email <span class="font-semibold">{{ form.email }}</span> đã được xác thực.
                    </div>

                    <div class="form-group">
                        <label class="form-label">Họ tên</label>

                        <div class="relative">
                            <Icon icon="solar:user-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model.trim="form.name" type="text" class="form-control !pl-12"
                                placeholder="Nhập họ tên" autocomplete="name" />
                        </div>

                        <p v-if="errors.name" class="text-danger text-sm mt-1">
                            {{ errors.name }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mật khẩu</label>

                        <div class="relative">
                            <Icon icon="solar:lock-password-bold-duotone"
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-light" />

                            <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                class="form-control !pl-12 !pr-12" placeholder="Nhập mật khẩu"
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
                        <Icon :icon="authStore.loading ? 'solar:refresh-bold' : 'solar:user-plus-bold-duotone'"
                            class="text-xl" :class="authStore.loading ? 'animate-spin' : ''" />

                        {{ authStore.loading ? "Đang tạo tài khoản..." : "Đăng ký" }}
                    </button>

                    <button type="button"
                        class="w-full flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-sec hover:bg-primary/10 hover:text-primary transition"
                        @click="backToOtp">
                        <Icon icon="solar:arrow-left-bold-duotone" class="text-xl" />
                        Quay lại nhập OTP
                    </button>
                </form>

                <p class="text-center text-sm text-text-light mt-7">
                    Đã có tài khoản?
                    <RouterLink to="/login" class="font-semibold text-primary hover:underline">
                        Đăng nhập
                    </RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const step = ref(1);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const errors = reactive({
    name: "",
    email: "",
    code: "",
    password: "",
});

const form = reactive({
    name: "",
    email: "",
    code: "",
    password: "",
    password_confirmation: "",
});

const stepDescription = computed(() => {
    if (step.value === 1) {
        return "Nhập email để nhận mã xác thực.";
    }

    if (step.value === 2) {
        return "Nhập mã OTP đã được gửi về Gmail.";
    }

    return "Hoàn tất thông tin tài khoản để đăng ký.";
});

function clearMessages() {
    errorMsg.value = "";
    successMsg.value = "";
    errors.name = "";
    errors.email = "";
    errors.code = "";
    errors.password = "";
}

function setBackendErrors(err) {
    const responseErrors = err.response?.data?.errors;

    errors.name = responseErrors?.name?.[0] || "";
    errors.email = responseErrors?.email?.[0] || "";
    errors.code = responseErrors?.code?.[0] || "";
    errors.password = responseErrors?.password?.[0] || "";

    errorMsg.value =
        err.response?.data?.message ||
        errors.email ||
        errors.code ||
        errors.password ||
        errors.name ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
}

async function handleSendCode() {
    clearMessages();

    try {
        const response = await authStore.sendRegisterCode(form.email);

        successMsg.value =
            response.data?.message ||
            "Mã xác thực đã được gửi đến email.";

        step.value = 2;
    } catch (err) {
        setBackendErrors(err);
    }
}

async function handleVerifyCode() {
    clearMessages();

    try {
        const response = await authStore.verifyRegisterCode(form.email, form.code);

        successMsg.value =
            response.data?.message ||
            "Xác thực email thành công.";

        step.value = 3;
    } catch (err) {
        setBackendErrors(err);
    }
}

async function handleRegister() {
    clearMessages();

    try {
        await authStore.register(form);

        if (authStore.isAdmin) {
            router.push({ name: "admin-dashboard" });
            return;
        }

        router.push({ name: "profile" });
    } catch (err) {
        setBackendErrors(err);
    }
}

function backToEmail() {
    clearMessages();
    step.value = 1;
    form.code = "";
}

function backToOtp() {
    clearMessages();
    step.value = 2;
}
</script>