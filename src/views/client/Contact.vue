<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useClientContactStore } from "@/stores/client/contactStore";
import ContactInfo from "@/components/client/contact/ContactInfo.vue";
import ContactForm from "@/components/client/contact/ContactForm.vue";
import ContactFaq from "@/components/client/contact/ContactFaq.vue";
import ContactHistory from "@/components/client/contact/ContactHistory.vue";
const authStore = useAuthStore(), store = useClientContactStore();
const toast = ref("");
let timer;
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=30%2F4%20H%C6%B0ng%20L%E1%BB%A3i%20Ninh%20Ki%E1%BB%81u%20C%E1%BA%A7n%20Th%C6%A1";
function handleSubmitted(contact) {
    toast.value = `Yêu cầu ${contact.code} đã được tiếp nhận.`;
    clearTimeout(timer); timer = setTimeout(() => { toast.value = ""; }, 4000);
}
watch([() => authStore.isAuthenticated, () => authStore.user?.id], () => {
    clearTimeout(timer); toast.value = ""; store.reset();
    if (authStore.isAuthenticated && authStore.user?.id) store.fetchContacts(1);
}, { immediate: true, flush: "sync" });
onBeforeUnmount(() => { clearTimeout(timer); store.reset(); });
</script>
<template>
    <div class="min-h-[70vh] bg-[#f6f8f6] text-slate-800">
        <section class="bg-gradient-to-br from-[#053f21] to-[#0a7139] text-white">
            <div class="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
                <nav aria-label="Đường dẫn" class="text-xs text-white/70">
                    <RouterLink to="/" class="hover:underline">Trang chủ</RouterLink> / Liên hệ
                </nav>
                <p class="mt-8 text-xs font-bold uppercase tracking-widest text-[#ffd326]">NFarmHouse luôn lắng nghe</p>
                <h1 class="mt-3 text-3xl font-bold sm:text-4xl">Bạn cần hỗ trợ điều gì?</h1>
                <p class="mt-4 max-w-2xl text-sm leading-7 text-white/75">Tư vấn vật tư nông nghiệp, hỗ trợ đơn hàng và
                    thanh toán. Gửi yêu cầu để cửa hàng liên hệ lại qua thông tin tài khoản của bạn.</p>
                <div class="mt-6 flex flex-wrap gap-3"><a href="tel:+84334745378"
                        class="inline-flex items-center gap-2 rounded-full bg-[#ffd326] px-5 py-3 text-sm font-bold text-[#07532b]">
                        <Icon icon="mdi:phone" />Gọi tư vấn
                    </a><a href="https://mail.google.com/mail/?view=cm&fs=1&to=nfarmhouse%40gmail.com" target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full border border-white/30 px-5 py-3 text-sm font-bold">Soạn email trong
                        Gmail</a></div>
            </div>
        </section>
        <main class="mx-auto max-w-[1320px] space-y-10 px-4 py-10 sm:px-6 lg:px-8">
            <div class="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <ContactInfo />
                <ContactForm @submitted="handleSubmitted" />
            </div>
            <ContactHistory v-if="authStore.isAuthenticated" />
            <section
                class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6">
                <div>
                    <h2 class="text-lg font-bold text-[#123d27]">Ghé thăm cửa hàng</h2>
                    <p class="mt-2 text-sm text-slate-500">30/4, phường Hưng Lợi, quận Ninh Kiều, Cần Thơ.</p>
                </div><a :href="mapsUrl" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-full border border-[#07532b] px-5 py-3 text-xs font-bold text-[#07532b]">Mở
                    Google Maps
                    <Icon icon="mdi:open-in-new" />
                </a>
            </section>
            <ContactFaq />
        </main>
        <div v-if="toast" role="status"
            class="fixed bottom-5 left-1/2 z-[80] w-max max-w-[92vw] -translate-x-1/2 rounded-2xl bg-[#063f22] px-5 py-3 text-sm text-white shadow-xl">
            {{ toast }}</div>
    </div>
</template>