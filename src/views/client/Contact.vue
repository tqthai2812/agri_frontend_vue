<script setup>
import {
    onBeforeUnmount,
    ref,
} from 'vue'

import { Icon } from '@iconify/vue'

import ContactInfo from '@/components/client/contact/ContactInfo.vue'
import ContactForm from '@/components/client/contact/ContactForm.vue'
import ContactFaq from '@/components/client/contact/ContactFaq.vue'

const toast = ref('')
let toastTimer = null

function handleSubmitted(contact) {
    toast.value =
        `Yêu cầu #${contact.id} đã được tiếp nhận.`

    window.clearTimeout(toastTimer)

    toastTimer = window.setTimeout(() => {
        toast.value = ''
    }, 3000)
}

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer)
})
</script>

<template>
    <div class="min-h-[70vh] bg-[#f6f8f6] font-sans text-slate-800">
        <section
            class="relative overflow-hidden bg-gradient-to-br from-[#053f21] via-[#07572c] to-[#0a7139] text-white">
            <div class="absolute -right-20 -top-28 size-80 rounded-full bg-[#ffd326]/10"></div>

            <div class="absolute -bottom-32 left-1/3 size-72 rounded-full bg-white/5"></div>

            <Icon icon="mdi:leaf"
                class="absolute right-[8%] top-1/2 hidden -translate-y-1/2 text-[180px] text-white/[0.04] lg:block" />

            <div class="relative mx-auto max-w-[1320px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <nav class="flex items-center gap-2 text-[10px] text-white/45" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#ffd326]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-semibold text-white/80">
                        Liên hệ
                    </span>
                </nav>

                <div class="mt-8 max-w-3xl">
                    <span
                        class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#ffd326] ring-1 ring-white/10">
                        <Icon icon="mdi:sprout-outline" class="text-sm" />
                        NFarmHouse luôn lắng nghe
                    </span>

                    <h1 class="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
                        Chúng tôi sẵn sàng
                        <br class="hidden sm:block" />

                        <span class="text-[#ffd326]">
                            đồng hành cùng bạn
                        </span>
                    </h1>

                    <p class="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                        Liên hệ để được tư vấn sản phẩm, hỗ trợ
                        đơn hàng hoặc trao đổi giải pháp vật tư
                        phù hợp với mùa vụ của bạn.
                    </p>

                    <div class="mt-7 flex flex-wrap gap-3">
                        <a href="tel:+84334745378"
                            class="inline-flex h-11 items-center gap-2 rounded-full bg-[#ffd326] px-5 text-xs font-bold text-[#07532b] transition hover:-translate-y-0.5 hover:bg-white">
                            <Icon icon="mdi:phone" class="text-lg" />
                            Gọi tư vấn ngay
                        </a>

                        <a href="mailto:nfarmhouse@gmail.com"
                            class="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-xs font-bold text-white transition hover:border-white/40 hover:bg-white/10">
                            <Icon icon="mdi:email-outline" class="text-lg" />
                            Gửi email
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <main class="mx-auto max-w-[1320px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
            <section class="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
                <ContactInfo />

                <ContactForm @submitted="handleSubmitted" />
            </section>

            <section class="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:mt-16">
                <div class="grid lg:grid-cols-[0.75fr_1.25fr]">
                    <div class="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                        <span class="grid size-12 place-items-center rounded-2xl bg-[#edf5f0] text-[#07532b]">
                            <Icon icon="mdi:map-search-outline" class="text-2xl" />
                        </span>

                        <p class="mt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                            Ghé thăm NFarmHouse
                        </p>

                        <h2 class="mt-2 text-2xl font-bold text-[#123d27]">
                            Tìm chúng tôi trên bản đồ
                        </h2>

                        <p class="mt-3 text-xs leading-6 text-slate-500">
                            30/4, phường Hưng Lợi, quận Ninh
                            Kiều, thành phố Cần Thơ.
                        </p>

                        <a href="https://www.google.com/maps/search/?api=1&query=30%2F4%20H%C6%B0ng%20L%E1%BB%A3i%20Ninh%20Ki%E1%BB%81u%20C%E1%BA%A7n%20Th%C6%A1"
                            target="_blank" rel="noopener noreferrer"
                            class="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#07532b] px-5 py-2.5 text-xs font-bold text-[#07532b] transition hover:bg-[#edf5f0]">
                            Mở Google Maps
                            <Icon icon="mdi:open-in-new" />
                        </a>
                    </div>

                    <div class="min-h-[360px] overflow-hidden bg-slate-100">
                        <iframe title="Bản đồ NFarmHouse tại Cần Thơ"
                            src="https://www.google.com/maps?q=30%2F4%20H%C6%B0ng%20L%E1%BB%A3i%20Ninh%20Ki%E1%BB%81u%20C%E1%BA%A7n%20Th%C6%A1&output=embed"
                            class="h-full min-h-[360px] w-full border-0" loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
                    </div>
                </div>
            </section>

            <div class="mt-14 lg:mt-16">
                <ContactFaq />
            </div>
        </main>

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            leave-active-class="transition duration-150" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />
                {{ toast }}
            </div>
        </Transition>
    </div>
</template>