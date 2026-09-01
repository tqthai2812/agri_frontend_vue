<script setup>
import {
    onBeforeUnmount,
    watch,
} from 'vue'

import { Icon } from '@iconify/vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    article: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['update:modelValue'])

let previousOverflow = ''

function close() {
    emit('update:modelValue', false)
}

function handleKeydown(event) {
    if (
        event.key === 'Escape' &&
        props.modelValue
    ) {
        close()
    }
}

function formatDate(value) {
    if (!value) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value))
}

watch(
    () => props.modelValue,
    (isOpen) => {
        if (isOpen) {
            previousOverflow =
                document.body.style.overflow

            document.body.style.overflow = 'hidden'

            window.addEventListener(
                'keydown',
                handleKeydown,
            )

            return
        }

        document.body.style.overflow =
            previousOverflow

        window.removeEventListener(
            'keydown',
            handleKeydown,
        )
    },
)

onBeforeUnmount(() => {
    document.body.style.overflow =
        previousOverflow

    window.removeEventListener(
        'keydown',
        handleKeydown,
    )
})
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
            leave-active-class="transition duration-150" leave-to-class="opacity-0">
            <div v-if="modelValue && article" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
                role="dialog" aria-modal="true">
                <button type="button" class="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
                    aria-label="Đóng bài viết" @click="close"></button>

                <article
                    class="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
                    <button type="button"
                        class="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full bg-white/90 text-slate-600 shadow-md transition hover:bg-white hover:text-[#07532b]"
                        aria-label="Đóng" @click="close">
                        <Icon icon="mdi:close" class="text-xl" />
                    </button>

                    <div class="relative overflow-hidden rounded-t-3xl">
                        <img :src="article.title_image_url" :alt="article.title"
                            class="h-64 w-full object-cover sm:h-80" />

                        <div
                            class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent">
                        </div>

                        <div class="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                            <div class="mb-3 flex flex-wrap gap-2">
                                <span v-for="tag in article.tags" :key="tag.id"
                                    class="rounded-full bg-[#ffd326] px-3 py-1 text-[9px] font-bold text-[#07532b]">
                                    {{ tag.tag_name }}
                                </span>
                            </div>

                            <h1 class="max-w-3xl text-xl font-bold leading-8 sm:text-3xl sm:leading-10">
                                {{ article.title }}
                            </h1>
                        </div>
                    </div>

                    <div class="p-5 sm:p-8">
                        <div
                            class="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 pb-5 text-[10px] text-slate-400">
                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:account-edit-outline" class="text-base" />
                                {{ article.user?.name }}
                            </span>

                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:calendar-blank-outline" class="text-base" />
                                {{ formatDate(article.created_at) }}
                            </span>

                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:eye-outline" class="text-base" />
                                {{ article.views }} lượt xem
                            </span>

                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:comment-outline" class="text-base" />
                                {{ article.comments_count }} bình luận
                            </span>
                        </div>

                        <h2 class="mt-6 text-sm font-bold text-[#123d27]">
                            Tóm tắt bài viết
                        </h2>

                        <p class="mt-3 text-sm leading-7 text-slate-600">
                            {{ article.subtitle }}
                        </p>

                        <div v-if="article.images?.length" class="mt-6 grid gap-4 sm:grid-cols-2">
                            <img v-for="image in article.images" :key="image.id" :src="image.image_url"
                                :alt="article.title" class="h-56 w-full rounded-2xl object-cover" />
                        </div>

                        <div
                            class="mt-7 flex items-start gap-3 rounded-2xl bg-[#edf5f0] p-4 text-xs leading-5 text-[#315e44]">
                            <Icon icon="mdi:information-outline" class="mt-0.5 shrink-0 text-xl text-[#07532b]" />

                            <span>
                                Nội dung đầy đủ sẽ hiển thị tại đây
                                sau khi bảng
                                <strong>news</strong>
                                được bổ sung cột
                                <strong>content</strong>.
                            </span>
                        </div>
                    </div>
                </article>
            </div>
        </Transition>
    </Teleport>
</template>