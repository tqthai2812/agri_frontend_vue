<script setup>
import { Icon } from '@iconify/vue'

const contactItems = [
    {
        label: 'Điện thoại',
        value: '+84 334 745 378',
        description: 'Tư vấn sản phẩm và đơn hàng',
        icon: 'mdi:phone-outline',
        href: 'tel:+84334745378',
    },
    {
        label: 'Email',
        value: 'nfarmhouse@gmail.com',
        description: 'Phản hồi trong vòng 24 giờ',
        icon: 'mdi:email-outline',
        href: 'mailto:nfarmhouse@gmail.com',
    },
    {
        label: 'Địa chỉ',
        value:
            '30/4, phường Hưng Lợi, quận Ninh Kiều, Cần Thơ',
        description: 'Cửa hàng và điểm tư vấn',
        icon: 'mdi:map-marker-outline',
        href:
            'https://www.google.com/maps/search/?api=1&query=30%2F4%20H%C6%B0ng%20L%E1%BB%A3i%20Ninh%20Ki%E1%BB%81u%20C%E1%BA%A7n%20Th%C6%A1',
    },
]

const socials = [
    {
        label: 'Facebook',
        icon: 'mdi:facebook',
        href: '#',
    },
    {
        label: 'Instagram',
        icon: 'mdi:instagram',
        href: '#',
    },
    {
        label: 'Messenger',
        icon: 'mdi:facebook-messenger',
        href: '#',
    },
    {
        label: 'Youtube',
        icon: 'mdi:youtube',
        href: '#',
    },
]
</script>

<template>
    <div class="space-y-5">
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header class="border-b border-slate-100 px-5 py-5 sm:px-6">
                <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                    Kết nối cùng chúng tôi
                </p>

                <h2 class="mt-1.5 text-lg font-bold text-[#123d27]">
                    Thông tin liên hệ
                </h2>
            </header>

            <div class="divide-y divide-slate-100 px-5 sm:px-6">
                <a v-for="item in contactItems" :key="item.label" :href="item.href" :target="item.label === 'Địa chỉ'
                    ? '_blank'
                    : undefined
                    " :rel="item.label === 'Địa chỉ'
                        ? 'noopener noreferrer'
                        : undefined
                        " class="group flex items-start gap-4 py-5">
                    <span
                        class="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#edf5f0] text-[#07532b] transition group-hover:bg-[#07532b] group-hover:text-white">
                        <Icon :icon="item.icon" class="text-xl" />
                    </span>

                    <span class="min-w-0">
                        <small class="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            {{ item.label }}
                        </small>

                        <strong
                            class="mt-1 block text-xs leading-5 text-slate-700 transition group-hover:text-[#07532b]">
                            {{ item.value }}
                        </strong>

                        <small class="mt-1 block text-[10px] text-slate-400">
                            {{ item.description }}
                        </small>
                    </span>
                </a>
            </div>
        </section>

        <section
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064b26] to-[#0a7139] p-5 text-white shadow-lg sm:p-6">
            <div class="absolute -right-10 -top-10 size-32 rounded-full bg-[#ffd326]/15"></div>

            <div class="relative flex items-start gap-3">
                <span
                    class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#ffd326] ring-1 ring-white/10">
                    <Icon icon="mdi:clock-outline" class="text-2xl" />
                </span>

                <div>
                    <h2 class="text-sm font-bold">
                        Thời gian làm việc
                    </h2>

                    <p class="mt-1 text-[10px] text-white/60">
                        Hỗ trợ trực tiếp và qua điện thoại
                    </p>
                </div>
            </div>

            <dl class="relative mt-5 space-y-3 text-xs">
                <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                    <dt class="text-white/65">
                        Thứ Hai – Thứ Sáu
                    </dt>

                    <dd class="font-bold text-[#ffd326]">
                        08:00 – 17:00
                    </dd>
                </div>

                <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                    <dt class="text-white/65">
                        Thứ Bảy
                    </dt>

                    <dd class="font-bold text-[#ffd326]">
                        08:00 – 12:00
                    </dd>
                </div>

                <div class="flex items-center justify-between gap-4">
                    <dt class="text-white/65">
                        Chủ Nhật
                    </dt>

                    <dd class="font-semibold text-white/50">
                        Nghỉ
                    </dd>
                </div>
            </dl>

            <div class="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-5">
                <a v-for="social in socials" :key="social.label" :href="social.href" :aria-label="social.label"
                    class="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-[#ffd326] hover:text-[#07532b]">
                    <Icon :icon="social.icon" class="text-lg" />
                </a>
            </div>
        </section>
    </div>
</template>