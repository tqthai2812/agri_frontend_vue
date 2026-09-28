<script setup>
import {
    computed,
    onBeforeUnmount,
    reactive,
    ref,
} from "vue";

import {
    RouterLink,
    useRouter,
} from "vue-router";

import { useAuthStore } from "@/stores/shared/authStore";
import AuthLayout from "@/components/auth/AuthLayout.vue";
import AuthField from "@/components/auth/AuthField.vue";
import {
    authError,
    defaultDestination,
} from "./authUi";

const authStore = useAuthStore();
const router = useRouter();

const step = ref(1);
const busy = ref(false);
const errorMsg = ref("");
const successMsg = ref("");
const errors = ref({});

const verifiedEmail = ref("");
const sentEmail = ref("");
const seconds = ref(0);

let timer;

const form = reactive({
    email: "",
    code: "",
    name: "",
    password: "",
    password_confirmation: "",
});

const description = computed(() => {
    const descriptions = [
        "Bắt đầu bằng email của bạn để cùng NFarmHouse vun trồng mỗi ngày.",
        "Nhập mã gồm 6 chữ số trong email để tiếp tục.",
        "Chỉ còn một bước nữa. Hoàn tất thông tin để tạo tài khoản.",
    ];

    return descriptions[step.value - 1];
});

function clearMessages() {
    errorMsg.value = "";
    successMsg.value = "";
    errors.value = {};
}

function showError(error, fallback) {
    errors.value = error.response?.data?.errors || {};
    errorMsg.value = authError(error, fallback);
}

function startCooldown(value = 60) {
    clearInterval(timer);

    const until = Date.now() + value * 1000;
    seconds.value = value;

    timer = setInterval(() => {
        seconds.value = Math.max(
            0,
            Math.ceil((until - Date.now()) / 1000),
        );

        if (!seconds.value) {
            clearInterval(timer);
        }
    }, 1000);
}

onBeforeUnmount(() => {
    clearInterval(timer);
});

async function handleSendCode() {
    if (busy.value || seconds.value) return;

    clearMessages();

    const email = form.email.trim().toLowerCase();

    busy.value = true;
    verifiedEmail.value = "";

    try {
        const response = await authStore.sendRegisterCode(email);

        form.email = email;
        sentEmail.value = email;
        form.code = "";

        step.value = 2;

        successMsg.value =
            response.data?.message ||
            "Mã xác thực đã được gửi. Vui lòng kiểm tra email.";

        startCooldown();
    } catch (error) {
        showError(
            error,
            "Chưa gửi được mã. Vui lòng thử lại.",
        );

        if (error.response?.status === 429) {
            const retryAfter = Number(
                error.response?.headers?.["retry-after"],
            );

            startCooldown(
                Number.isFinite(retryAfter) && retryAfter > 0
                    ? Math.ceil(retryAfter)
                    : 60,
            );
        }
    } finally {
        busy.value = false;
    }
}

async function handleVerifyCode() {
    if (busy.value) return;

    clearMessages();

    if (!/^\d{6}$/.test(form.code)) {
        errors.value = {
            code: ["Vui lòng nhập đúng 6 chữ số."],
        };

        return;
    }

    busy.value = true;

    try {
        await authStore.verifyRegisterCode(
            sentEmail.value,
            form.code,
        );

        verifiedEmail.value = sentEmail.value;
        form.code = "";
        step.value = 3;
    } catch (error) {
        showError(
            error,
            "Không thể xác thực mã. Vui lòng thử lại.",
        );
    } finally {
        busy.value = false;
    }
}

async function handleRegister() {
    if (busy.value) return;

    clearMessages();

    if (
        !verifiedEmail.value ||
        verifiedEmail.value !== form.email.trim().toLowerCase()
    ) {
        step.value = 1;

        errorMsg.value =
            "Vui lòng xác thực lại email trước khi đăng ký.";

        return;
    }

    if (!form.name.trim()) {
        errors.value = {
            name: ["Vui lòng nhập họ tên."],
        };

        return;
    }

    if (form.password !== form.password_confirmation) {
        errors.value = {
            password_confirmation: [
                "Mật khẩu nhập lại chưa khớp.",
            ],
        };

        return;
    }

    busy.value = true;

    try {
        await authStore.register({
            ...form,
            email: verifiedEmail.value,
            name: form.name.trim(),
        });

        form.password = "";
        form.password_confirmation = "";

        await router.replace(
            defaultDestination(authStore, router),
        );
    } catch (error) {
        showError(
            error,
            "Chưa tạo được tài khoản. Vui lòng thử lại.",
        );

        if (errors.value.email) {
            verifiedEmail.value = "";
            form.code = "";
            step.value = 1;
        }
    } finally {
        busy.value = false;
    }
}

function backToEmail() {
    if (busy.value) return;

    clearMessages();
    verifiedEmail.value = "";
    form.code = "";
    step.value = 1;
}

function backToOtp() {
    if (busy.value) return;

    clearMessages();
    verifiedEmail.value = "";
    form.code = "";
    step.value = 2;
}
</script>

<template>
    <AuthLayout title="Đăng ký">
        <p class="nf-kicker">
            CHÀO MỪNG ĐẾN NFARMHOUSE
        </p>

        <h1>Tạo tài khoản</h1>

        <p class="nf-intro">
            {{ description }}
        </p>

        <ol class="nf-steps" aria-label="Các bước đăng ký">
            <li v-for="(label, index) in [
                'Email',
                'Xác thực',
                'Tài khoản',
            ]" :key="label" :class="{ 'is-active': step >= index + 1 }" :aria-current="step === index + 1
                ? 'step'
                : undefined
                ">
                0{{ index + 1 }} · {{ label }}
            </li>
        </ol>

        <p v-if="successMsg" class="nf-alert nf-alert-success" role="status">
            {{ successMsg }}
        </p>

        <p v-if="errorMsg" class="nf-alert" role="alert">
            {{ errorMsg }}
        </p>

        <!-- Bước 1 -->
        <form v-if="step === 1" class="nf-form" :aria-busy="busy" @submit.prevent="handleSendCode">
            <AuthField id="register-email" v-model="form.email" label="Email của bạn" type="email"
                placeholder="Nhập email để nhận mã xác thực" autocomplete="email" :disabled="busy"
                :error="errors.email?.[0]" />

            <button type="submit" class="nf-button nf-primary" :disabled="busy || seconds > 0">
                <span>
                    {{
                        busy
                            ? "Đang gửi mã..."
                            : seconds
                                ? `Gửi lại sau ${seconds}s`
                                : "Gửi mã xác thực"
                    }}
                </span>

                <span class="nf-button-arrow">
                    ›
                </span>
            </button>

            <p class="nf-note">
                Email được dùng để xác thực tài khoản và nhận thông tin đơn hàng.
            </p>
        </form>

        <!-- Bước 2 -->
        <template v-else-if="step === 2">
            <p class="nf-email-note">
                Mã xác thực đã được gửi đến

                <strong>
                    {{ sentEmail }}
                </strong>
            </p>

            <form class="nf-form" :aria-busy="busy" @submit.prevent="handleVerifyCode">
                <AuthField id="register-otp" v-model="form.code" label="Mã xác thực" placeholder="Nhập 6 chữ số"
                    autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" :maxlength="6" :disabled="busy"
                    :error="errors.code?.[0]" />

                <button type="submit" class="nf-button nf-primary" :disabled="busy">
                    <span>
                        {{
                            busy
                                ? "Đang xử lý..."
                                : "Xác thực email"
                        }}
                    </span>

                    <span class="nf-button-arrow">
                        ›
                    </span>
                </button>

                <div class="nf-row">
                    <button type="button" class="nf-text-button" :disabled="busy" @click="backToEmail">
                        ← Đổi email
                    </button>

                    <button type="button" class="nf-text-button" :disabled="busy || seconds > 0"
                        @click="handleSendCode">
                        {{
                            seconds
                                ? `Gửi lại sau ${seconds}s`
                                : "Gửi lại mã"
                        }}
                    </button>
                </div>
            </form>

            <p class="nf-note">
                Chưa thấy email? Hãy kiểm tra thêm thư mục thư rác.
            </p>
        </template>

        <!-- Bước 3 -->
        <template v-else>
            <p class="nf-email-note">
                ✓ Email đã được xác thực

                <strong>
                    {{ verifiedEmail }}
                </strong>
            </p>

            <form class="nf-form" :aria-busy="busy" @submit.prevent="handleRegister">
                <AuthField id="register-name" v-model="form.name" label="Họ và tên" placeholder="Nhập họ tên của bạn"
                    autocomplete="name" :maxlength="255" :disabled="busy" :error="errors.name?.[0]" />

                <AuthField id="register-password" v-model="form.password" label="Mật khẩu" type="password"
                    placeholder="Tạo mật khẩu" autocomplete="new-password" :disabled="busy"
                    :error="errors.password?.[0]" />

                <AuthField id="register-confirm" v-model="form.password_confirmation" label="Nhập lại mật khẩu"
                    type="password" placeholder="Nhập lại mật khẩu" autocomplete="new-password" :disabled="busy"
                    :error="errors.password_confirmation?.[0]" />

                <button type="submit" class="nf-button nf-primary" :disabled="busy">
                    <span>
                        {{
                            busy
                                ? "Đang tạo tài khoản..."
                                : "Tạo tài khoản"
                        }}
                    </span>

                    <span class="nf-button-arrow">
                        ›
                    </span>
                </button>

                <button type="button" class="nf-text-button" :disabled="busy" @click="backToOtp">
                    ← Xác thực lại email
                </button>
            </form>
        </template>

        <p class="nf-switch">
            Đã có tài khoản?

            <RouterLink to="/login" class="nf-link">
                Đăng nhập
            </RouterLink>
        </p>
    </AuthLayout>
</template>