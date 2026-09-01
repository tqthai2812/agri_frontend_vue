<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const openId = ref(1)

const questions = [
    {
        id: 1,
        question:
            'NFarmHouse phản hồi yêu cầu liên hệ trong bao lâu?',
        answer:
            'Các yêu cầu gửi trong giờ làm việc thường được phản hồi trong vòng 24 giờ. Vấn đề liên quan đến đơn hàng đang giao sẽ được ưu tiên xử lý sớm hơn.',
    },
    {
        id: 2,
        question:
            'Tôi cần cung cấp gì khi hỏi về một đơn hàng?',
        answer:
            'Bạn nên ghi mã đơn hàng, số điện thoại nhận hàng và mô tả ngắn vấn đề. Không gửi mật khẩu hoặc mã OTP trong nội dung liên hệ.',
    },
    {
        id: 3,
        question:
            'Có thể nhận tư vấn cách sử dụng vật tư nông nghiệp không?',
        answer:
            'Có. Hãy ghi rõ tên sản phẩm, loại cây trồng, giai đoạn sinh trưởng và tình trạng thực tế để bộ phận kỹ thuật tư vấn chính xác hơn.',
    },
    {
        id: 4,
        question:
            'Tôi có thể liên hệ để hợp tác hoặc mua số lượng lớn không?',
        answer:
            'Có. Chọn chủ đề “Hợp tác kinh doanh” và cung cấp nhu cầu dự kiến. Bộ phận phụ trách sẽ chủ động liên hệ lại với bạn.',
    },
]
</script>

<template>
    <section>
        <div class="mx-auto mb-7 max-w-2xl text-center">
            <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d2a900]">
                Hỗ trợ nhanh
            </p>

            <h2 class="mt-2 text-2xl font-bold text-[#123d27]">
                Câu hỏi thường gặp
            </h2>

            <p class="mt-2 text-xs leading-5 text-slate-400">
                Một số thông tin có thể giúp bạn giải quyết
                vấn đề ngay lập tức.
            </p>
        </div>

        <div class="mx-auto max-w-4xl space-y-3">
            <article v-for="item in questions" :key="item.id"
                class="overflow-hidden rounded-2xl border bg-white transition" :class="openId === item.id
                    ? 'border-[#a9c9b4] shadow-sm'
                    : 'border-slate-200'
                    ">
                <button type="button" class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    :aria-expanded="openId === item.id" @click="
                        openId =
                        openId === item.id
                            ? null
                            : item.id
                        ">
                    <span class="flex items-center gap-3">
                        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                            <Icon icon="mdi:help-circle-outline" class="text-lg" />
                        </span>

                        <strong class="text-xs leading-5 text-slate-700">
                            {{ item.question }}
                        </strong>
                    </span>

                    <Icon icon="mdi:chevron-down" class="shrink-0 text-xl text-slate-400 transition-transform" :class="openId === item.id
                        ? 'rotate-180 text-[#07532b]'
                        : ''
                        " />
                </button>

                <Transition enter-active-class="transition duration-200" enter-from-class="-translate-y-1 opacity-0"
                    leave-active-class="transition duration-150" leave-to-class="-translate-y-1 opacity-0">
                    <div v-if="openId === item.id"
                        class="border-t border-slate-100 px-5 pb-5 pt-4 text-xs leading-6 text-slate-500 sm:pl-16">
                        {{ item.answer }}
                    </div>
                </Transition>
            </article>
        </div>
    </section>
</template>