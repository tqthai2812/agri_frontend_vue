<script setup>
import { Icon } from "@iconify/vue";
const items = [
    { label: "Điện thoại", value: "+84 334 745 378", href: "tel:+84334745378", icon: "mdi:phone-outline" },
    { label: "Email", value: "nfarmhouse@gmail.com", href: "mailto:nfarmhouse@gmail.com", icon: "mdi:email-outline" },
];
</script>
<template>
    <aside class="space-y-5">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-bold text-[#123d27]">Kết nối với cửa hàng</h2><a v-for="item in items"
                :key="item.label" :href="item.href" class="mt-5 flex items-center gap-3"><span
                    class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#07532b]">
                    <Icon :icon="item.icon" class="text-xl" />
                </span><span class="min-w-0"><span class="block text-xs text-slate-400">{{ item.label }}</span><strong
                        class="mt-1 block break-all text-sm text-[#123d27]">{{ item.value }}</strong></span></a>
            <p class="mt-5 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">Với yêu cầu gấp liên quan
                đến đơn hàng đang giao, bạn nên gọi trực tiếp và cung cấp mã đơn.</p>
        </section>
        <section class="rounded-3xl bg-[#07532b] p-6 text-white">
            <h2 class="flex items-center gap-2 font-bold">
                <Icon icon="mdi:clock-outline" />Giờ hỗ trợ
            </h2>
            <dl class="mt-5 space-y-4 text-sm">
                <div class="flex justify-between gap-3">
                    <dt class="text-white/70">Thứ Hai – Thứ Sáu</dt>
                    <dd class="font-semibold text-[#ffd326]">08:00 – 17:00</dd>
                </div>
                <div class="flex justify-between gap-3">
                    <dt class="text-white/70">Thứ Bảy</dt>
                    <dd class="font-semibold text-[#ffd326]">08:00 – 12:00</dd>
                </div>
                <div class="flex justify-between gap-3">
                    <dt class="text-white/70">Chủ Nhật</dt>
                    <dd>Nghỉ</dd>
                </div>
            </dl>
            <p class="mt-5 border-t border-white/20 pt-4 text-xs leading-6 text-white/70">Yêu cầu gửi ngoài giờ được
                tiếp nhận trên website và xử lý khi cửa hàng làm việc.</p>
        </section>
    </aside>
</template>