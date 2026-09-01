<script setup>
import { Icon } from '@iconify/vue'

defineProps({
    article: {
        type: Object,
        required: true,
    },
})

defineEmits(['open'])

function formatDate(value) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function formatViews(value) {
    return new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
    }).format(Number(value || 0))
}
</script>

<template>
    <article
        class="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_7px_24px_rgba(6,75,38,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#b8d1c0] hover:shadow-[0_18px_42px_rgba(6,75,38,0.11)]">
        <button type="button" class="relative block overflow-hidden bg-[#edf4ef] text-left"
            @click="$emit('open', article)">
            <img :src="article.title_image_url" :alt="article.title" loading="lazy"
                class="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />

            <span class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/45 to-transparent"></span>

            <span v-if="article.tags?.length"
                class="absolute bottom-3 left-3 rounded-full bg-[#ffd326] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-[#07532b]">
                {{ article.tags[0].tag_name }}
            </span>
        </button>

        <div class="flex flex-1 flex-col p-5">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                <span class="flex items-center gap-1">
                    <Icon icon="mdi:calendar-blank-outline" class="text-sm" />
                    {{ formatDate(article.created_at) }}
                </span>

                <span class="flex items-center gap-1">
                    <Icon icon="mdi:eye-outline" class="text-sm" />
                    {{ formatViews(article.views) }} lượt xem
                </span>
            </div>

            <button type="button"
                class="mt-3 line-clamp-2 text-left text-base font-bold leading-6 text-[#123d27] transition group-hover:text-[#087239]"
                @click="$emit('open', article)">
                {{ article.title }}
            </button>

            <p class="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                {{ article.subtitle }}
            </p>

            <div class="mt-auto flex items-center justify-between gap-3 pt-5">
                <div class="flex min-w-0 items-center gap-2">
                    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                        <Icon icon="mdi:account-edit-outline" class="text-base" />
                    </span>

                    <span class="truncate text-[10px] font-semibold text-slate-500">
                        {{ article.user?.name }}
                    </span>
                </div>

                <button type="button"
                    class="flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#07532b] transition hover:text-[#d2a900]"
                    @click="$emit('open', article)">
                    Xem nhanh
                    <Icon icon="mdi:arrow-right" class="text-sm" />
                </button>
            </div>
        </div>
    </article>
</template>