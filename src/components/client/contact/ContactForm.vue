<script setup>
import {
    computed,
    reactive,
    ref,
} from 'vue'

import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/authStore'

const emit = defineEmits(['submitted'])

const authStore = useAuthStore()

const form = reactive({
    subject: '',
    message: '',
})

const errors = reactive({
    subject: '',
    message: '',
})

const submitting = ref(false)
const submittedContact = ref(null)

const currentUser = computed(() => {
    return authStore.user || {}
})

const subjectSuggestions = [
    'Tư vấn sản phẩm',
    'Hỗ trợ đơn hàng',
    'Chính sách đổi trả',
    'Hợp tác kinh doanh',
]

function clearErrors() {
    errors.subject = ''
    errors.message = ''
}

function validate() {
    clearErrors()

    if (form.subject.trim().length < 5) {
        errors.subject =
            'Chủ đề cần có ít nhất 5 ký tự.'
    }

    if (form.subject.trim().length > 150) {
        errors.subject =
            'Chủ đề không được vượt quá 150 ký tự.'
    }

    if (form.message.trim().length < 20) {
        errors.message =
            'Nội dung cần có ít nhất 20 ký tự.'
    }

    if (form.message.trim().length > 2000) {
        errors.message =
            'Nội dung không được vượt quá 2.000 ký tự.'
    }

    return !errors.subject && !errors.message
}

async function submitContact() {
    if (
        !authStore.isAuthenticated ||
        !validate()
    ) {
        return
    }

    submitting.value = true

    try {
        // Không gửi user_id và status từ frontend.
        // Laravel tự lấy auth()->id() và gán pending.
        const payload = {
            subject: form.subject.trim(),
            message: form.message.trim(),
        }

        // Khi nối backend:
        // const { data } = await apiClient.post(
        //   '/api/contacts',
        //   payload,
        // )

        await new Promise((resolve) => {
            window.setTimeout(resolve, 650)
        })

        submittedContact.value = {
            id: Math.floor(
                10000 + Math.random() * 90000,
            ),
            user_id: currentUser.value.id,
            ...payload,
            status: 'pending',
            created_at: new Date().toISOString(),
        }

        form.subject = ''
        form.message = ''

        clearErrors()

        emit(
            'submitted',
            submittedContact.value,
        )
    } finally {
        submitting.value = false
    }
}

function resetForm() {
    submittedContact.value = null
    clearErrors()
}
</script>

<template>
    <section
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_15px_45px_rgba(6,75,38,0.07)]">
        <header class="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <div class="flex items-center gap-3">
                <span class="grid size-11 place-items-center rounded-2xl bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:message-text-outline" class="text-2xl" />
                </span>

                <div>
                    <h2 class="text-lg font-bold text-[#123d27]">
                        Gửi yêu cầu hỗ trợ
                    </h2>

                    <p class="mt-0.5 text-[10px] text-slate-400">
                        Chúng tôi sẽ phản hồi trong thời gian
                        sớm nhất.
                    </p>
                </div>
            </div>
        </header>

        <!-- Chưa đăng nhập -->
        <div v-if="!authStore.isAuthenticated" class="px-5 py-10 text-center sm:px-7 sm:py-14">
            <span class="mx-auto grid size-20 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                <Icon icon="mdi:account-lock-outline" class="text-4xl" />
            </span>

            <h3 class="mt-5 text-base font-bold text-[#123d27]">
                Đăng nhập để gửi liên hệ
            </h3>

            <p class="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                CSDL hiện tại liên kết mỗi yêu cầu với một
                tài khoản. Bạn vẫn có thể gọi điện hoặc gửi
                email trực tiếp nếu chưa đăng nhập.
            </p>

            <RouterLink :to="{
                name: 'login',
                query: {
                    redirect: '/contact',
                },
            }"
                class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#064522]">
                <Icon icon="mdi:login" class="text-lg" />
                Đăng nhập ngay
            </RouterLink>
        </div>

        <!-- Thành công -->
        <div v-else-if="submittedContact" class="px-5 py-10 text-center sm:px-7 sm:py-14">
            <span class="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon icon="mdi:check-decagram-outline" class="text-4xl" />
            </span>

            <h3 class="mt-5 text-lg font-bold text-[#123d27]">
                Đã gửi yêu cầu thành công
            </h3>

            <p class="mt-2 text-xs leading-5 text-slate-400">
                Mã yêu cầu của bạn là

                <strong class="text-[#07532b]">
                    #{{ submittedContact.id }}
                </strong>.

                Trạng thái hiện tại:

                <strong class="text-amber-600">
                    Chờ xử lý
                </strong>.
            </p>

            <button type="button"
                class="mt-6 rounded-full border border-[#07532b] px-5 py-2.5 text-xs font-bold text-[#07532b] transition hover:bg-[#edf5f0]"
                @click="resetForm">
                Gửi yêu cầu khác
            </button>
        </div>

        <!-- Form -->
        <form v-else class="space-y-5 p-5 sm:p-7" @submit.prevent="submitContact">
            <div class="flex items-center gap-3 rounded-2xl bg-[#f5f8f6] p-4">
                <span
                    class="grid size-10 shrink-0 place-items-center rounded-full bg-[#07532b] text-sm font-bold text-white">
                    {{
                        currentUser.name
                            ?.charAt(0)
                            ?.toUpperCase() || 'U'
                    }}
                </span>

                <div class="min-w-0 flex-1">
                    <strong class="block truncate text-xs text-slate-700">
                        {{ currentUser.name }}
                    </strong>

                    <span class="mt-0.5 block truncate text-[10px] text-slate-400">
                        {{ currentUser.email }}
                    </span>
                </div>

                <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
                    Đã xác thực
                </span>
            </div>

            <div>
                <label for="contact-subject" class="text-xs font-bold text-slate-700">
                    Chủ đề
                    <span class="text-red-500">*</span>
                </label>

                <div class="mt-2 flex flex-wrap gap-2">
                    <button v-for="suggestion in subjectSuggestions" :key="suggestion" type="button"
                        class="rounded-full border px-3 py-1.5 text-[9px] font-semibold transition" :class="form.subject === suggestion
                            ? 'border-[#07532b] bg-[#07532b] text-white'
                            : 'border-slate-200 text-slate-500 hover:border-[#9dbba8] hover:text-[#07532b]'
                            " @click="form.subject = suggestion">
                        {{ suggestion }}
                    </button>
                </div>

                <div class="relative mt-3">
                    <Icon icon="mdi:text-box-outline"
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

                    <input id="contact-subject" v-model.trim="form.subject" type="text" maxlength="150"
                        class="h-12 w-full rounded-2xl border bg-[#fafcfb] pl-12 pr-14 text-sm outline-none transition focus:bg-white focus:ring-4"
                        :class="errors.subject
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-[#0a7139] focus:ring-[#0a7139]/10'
                            " placeholder="Nhập chủ đề cần hỗ trợ" @input="errors.subject = ''" />

                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-300">
                        {{ form.subject.length }}/150
                    </span>
                </div>

                <p v-if="errors.subject" class="mt-1.5 flex items-center gap-1 text-[10px] text-red-500">
                    <Icon icon="mdi:alert-circle-outline" />
                    {{ errors.subject }}
                </p>
            </div>

            <div>
                <div class="flex items-center justify-between gap-3">
                    <label for="contact-message" class="text-xs font-bold text-slate-700">
                        Nội dung
                        <span class="text-red-500">*</span>
                    </label>

                    <span class="text-[9px] text-slate-300">
                        {{ form.message.length }}/2000
                    </span>
                </div>

                <textarea id="contact-message" v-model.trim="form.message" rows="7" maxlength="2000"
                    class="mt-2 w-full resize-none rounded-2xl border bg-[#fafcfb] px-4 py-3 text-sm leading-6 outline-none transition focus:bg-white focus:ring-4"
                    :class="errors.message
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-[#0a7139] focus:ring-[#0a7139]/10'
                        " placeholder="Mô tả rõ vấn đề bạn đang cần NFarmHouse hỗ trợ..."
                    @input="errors.message = ''"></textarea>

                <p v-if="errors.message" class="mt-1.5 flex items-center gap-1 text-[10px] text-red-500">
                    <Icon icon="mdi:alert-circle-outline" />
                    {{ errors.message }}
                </p>
            </div>

            <div
                class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p class="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <Icon icon="mdi:shield-check-outline" class="text-base text-[#07532b]" />
                    Thông tin của bạn được bảo mật.
                </p>

                <button type="submit"
                    class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#07532b] px-7 text-xs font-bold text-white shadow-[0_10px_24px_rgba(7,83,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#064522] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    :disabled="submitting">
                    <Icon :icon="submitting
                        ? 'mdi:loading'
                        : 'mdi:send-outline'
                        " class="text-lg" :class="submitting ? 'animate-spin' : ''
                            " />

                    {{
                        submitting
                            ? 'Đang gửi...'
                            : 'Gửi yêu cầu'
                    }}
                </button>
            </div>
        </form>
    </section>
</template>