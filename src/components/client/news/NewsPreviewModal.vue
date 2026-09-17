<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },

    article: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits([
    "update:modelValue",
    "view-detail",
]);

const fallbackImage =
    "https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=900&q=85";

const articleTitle = computed(() => {
    return props.article?.title || "Bài viết";
});

const articleImage = computed(() => {
    return (
        props.article?.title_image_url ||
        props.article?.image_url ||
        props.article?.image ||
        fallbackImage
    );
});

const articleSubtitle = computed(() => {
    return props.article?.subtitle || props.article?.excerpt || "";
});

const articleContent = computed(() => {
    const content = props.article?.content || "";

    if (!content) {
        return "Nội dung bài viết đang được cập nhật.";
    }

    return stripHtml(content).slice(0, 420);
});

const authorName = computed(() => {
    return (
        props.article?.author?.name ||
        props.article?.user?.name ||
        "NFarmHouse"
    );
});

const publishedDate = computed(() => {
    const value =
        props.article?.published_date ||
        props.article?.published_at ||
        props.article?.created_at;

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
});

const tags = computed(() => {
    return Array.isArray(props.article?.tags)
        ? props.article.tags
        : [];
});

function stripHtml(value) {
    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function close() {
    emit("update:modelValue", false);
}

function viewDetail() {
    emit("view-detail", props.article);
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="modelValue && article"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:p-5"
                @click.self="close">
                <div
                    class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <header class="relative">
                        <img :src="articleImage" :alt="articleTitle" class="h-60 w-full object-cover sm:h-72" />

                        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>

                        <button type="button"
                            class="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
                            aria-label="Đóng" @click="close">
                            <Icon icon="mdi:close" class="text-2xl" />
                        </button>

                        <div class="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                            <div class="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/75">
                                <span class="inline-flex items-center gap-1.5">
                                    <Icon icon="mdi:account-edit-outline" />
                                    {{ authorName }}
                                </span>

                                <span class="size-1 rounded-full bg-white/40"></span>

                                <span class="inline-flex items-center gap-1.5">
                                    <Icon icon="mdi:calendar-blank-outline" />
                                    {{ publishedDate }}
                                </span>

                                <span v-if="Number(article.views || 0)" class="inline-flex items-center gap-1.5">
                                    <Icon icon="mdi:eye-outline" />
                                    {{ article.views }} lượt xem
                                </span>
                            </div>

                            <h2 class="mt-3 line-clamp-2 text-2xl font-bold leading-tight sm:text-3xl">
                                {{ articleTitle }}
                            </h2>
                        </div>
                    </header>

                    <div class="flex-1 overflow-y-auto p-5 sm:p-6">
                        <p v-if="articleSubtitle"
                            class="rounded-2xl bg-[#f3f8f5] px-4 py-3 text-sm font-medium leading-6 text-[#315c43]">
                            {{ articleSubtitle }}
                        </p>

                        <div v-if="tags.length" class="mt-4 flex flex-wrap gap-2">
                            <span v-for="tag in tags.slice(0, 5)" :key="tag.id || tag.name || tag.tag_name || tag"
                                class="rounded-full bg-[#edf5f0] px-3 py-1.5 text-[10px] font-bold text-[#07532b]">
                                {{ tag.tag_name || tag.name || tag }}
                            </span>
                        </div>

                        <div class="mt-5">
                            <h3 class="text-sm font-bold text-[#123d27]">
                                Xem nhanh nội dung
                            </h3>

                            <p class="mt-2 text-sm leading-7 text-slate-600">
                                {{ articleContent }}
                                <span v-if="articleContent.length >= 420">...</span>
                            </p>
                        </div>
                    </div>

                    <footer
                        class="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <button type="button"
                            class="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            @click="close">
                            <Icon icon="mdi:close" class="text-lg" />
                            Đóng
                        </button>

                        <button type="button"
                            class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#07532b] px-6 text-xs font-bold text-white transition hover:bg-[#064522]"
                            @click="viewDetail">
                            Xem chi tiết bài viết
                            <Icon icon="mdi:arrow-right" class="text-lg" />
                        </button>
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>