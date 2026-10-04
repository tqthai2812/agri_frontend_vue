<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useClientContactStore } from "@/stores/client/contactStore";
const authStore = useAuthStore();
const store = useClientContactStore();
const emit = defineEmits(["submitted"]);
const user = computed(() => authStore.user || {});
const subjects = ["Tư vấn sản phẩm", "Hỗ trợ đơn hàng", "Thanh toán", "Hợp tác kinh doanh"];
async function submitContact() {
    if (!authStore.isAuthenticated) return;
    const contact = await store.submit();
    if (contact) emit("submitted", contact);
}
</script>
<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 p-6">
            <h2 class="flex items-center gap-2 text-lg font-bold text-[#123d27]">
                <Icon icon="mdi:message-text-outline" />Gửi yêu cầu hỗ trợ
            </h2>
            <p class="mt-2 text-xs leading-5 text-slate-500">Mô tả vấn đề để cửa hàng có thể hỗ trợ bạn.</p>
        </header>
        <div v-if="!authStore.isAuthenticated" class="p-8 text-center">
            <Icon icon="mdi:account-lock-outline" class="mx-auto text-5xl text-[#07532b]" />
            <h3 class="mt-4 font-bold">Đăng nhập để gửi và theo dõi liên hệ</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">Bạn vẫn có thể gọi điện hoặc gửi email trực tiếp cho cửa
                hàng.</p>
            <RouterLink :to="{ name: 'login', query: { redirect: '/contact' } }"
                class="mt-5 inline-flex rounded-full bg-[#07532b] px-6 py-3 text-sm font-bold text-white">Đăng nhập
            </RouterLink>
        </div>
        <div v-else-if="store.receipt" role="status" class="p-8 text-center">
            <Icon icon="mdi:check-decagram-outline" class="mx-auto text-5xl text-green-600" />
            <h3 class="mt-4 text-lg font-bold text-[#123d27]">Đã tiếp nhận yêu cầu</h3>
            <p class="mt-3 text-sm text-slate-500">Mã yêu cầu <strong class="text-[#07532b]">{{ store.receipt.code
            }}</strong> · {{ store.receipt.status_label }}</p>
            <p class="mt-2 text-xs leading-6 text-slate-500">Bạn có thể theo dõi trạng thái trong phần Lịch sử liên hệ
                bên dưới.</p>
            <button type="button" :disabled="store.submitting" @click="store.newRequest"
                class="mt-5 rounded-full border border-[#07532b] px-5 py-2 text-sm font-semibold text-[#07532b] disabled:opacity-50">Gửi
                yêu cầu khác</button>
        </div>
        <form v-else class="space-y-5 p-6" @submit.prevent="submitContact">
            <div class="rounded-2xl bg-[#f3f8f5] p-4">
                <p class="text-sm font-bold text-[#123d27]">{{ user.name }}</p>
                <p class="mt-1 break-all text-xs text-slate-500">{{ user.email }}<span v-if="user.phone_number"> · {{
                    user.phone_number }}</span></p>
                <p class="mt-2 text-xs leading-5 text-slate-500">Cửa hàng dùng thông tin tài khoản để liên hệ lại.
                    <RouterLink :to="{ name: 'profile' }" class="font-semibold text-[#07532b] underline">Kiểm tra thông
                        tin</RouterLink>
                </p>
            </div>
            <p v-if="store.error" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">{{ store.error }}
            </p>
            <div><label for="contact-subject" class="text-sm font-semibold">Chủ đề <span
                        class="text-red-500">*</span></label>
                <div class="my-3 flex flex-wrap gap-2"><button v-for="subject in subjects" :key="subject" type="button"
                        :disabled="store.submitting" @click="store.form.subject = subject"
                        class="rounded-full border px-3 py-1.5 text-xs disabled:opacity-50"
                        :class="store.form.subject === subject ? 'border-[#07532b] bg-[#edf5f0] text-[#07532b]' : 'border-slate-200 text-slate-500'">{{
                            subject }}</button></div>
                <input id="contact-subject" v-model="store.form.subject" :disabled="store.submitting" required
                    minlength="5" maxlength="150" placeholder="Nhập chủ đề cần hỗ trợ"
                    class="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#07532b] disabled:opacity-50" />
                <p v-if="store.fieldErrors.subject" class="mt-1 text-xs text-red-600">{{ store.fieldErrors.subject }}
                </p>
            </div>
            <div><label for="contact-message" class="text-sm font-semibold">Nội dung <span
                        class="text-red-500">*</span></label><textarea id="contact-message" v-model="store.form.message"
                    :disabled="store.submitting" required minlength="20" maxlength="2000" rows="6"
                    placeholder="Nếu cần hỗ trợ đơn hàng, vui lòng ghi mã đơn và vấn đề bạn gặp..."
                    class="mt-2 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-[#07532b] disabled:opacity-50"></textarea>
                <p class="text-right text-xs text-slate-400">{{ Array.from(store.form.message).length }} / 2.000 ký tự
                </p>
                <p v-if="store.fieldErrors.message" class="mt-1 text-xs text-red-600">{{ store.fieldErrors.message }}
                </p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <p class="max-w-sm text-xs leading-5 text-slate-500">Không gửi mật khẩu, mã OTP hoặc thông tin thẻ trong
                    nội dung liên hệ.</p><button type="submit" :disabled="store.submitting"
                    class="inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
                    <Icon :icon="store.submitting ? 'mdi:loading' : 'mdi:send-outline'"
                        :class="{ 'animate-spin': store.submitting }" />
                    {{ store.submitting ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                </button>
            </div>
        </form>
    </section>
</template>