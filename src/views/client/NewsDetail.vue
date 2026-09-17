<script setup>
import {
    computed,
    onMounted,
    ref,
    watch,
} from "vue";

import {
    useRoute,
    useRouter,
} from "vue-router";

import { Icon } from "@iconify/vue";
import ClientNewsService from "@/services/client/clientNews.service";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const errorMessage = ref("");
const article = ref(null);

const fallbackImage =
    "https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=1200&q=85";

const articleTitle = computed(() => {
    return article.value?.title || "Chi tiết bài viết";
});

const articleImage = computed(() => {
    return (
        article.value?.title_image_url ||
        article.value?.image_url ||
        article.value?.image ||
        fallbackImage
    );
});

const articleContent = computed(() => {
    return (
        article.value?.content ||
        article.value?.body ||
        "<p>Nội dung bài viết đang được cập nhật.</p>"
    );
});

const authorName = computed(() => {
    return (
        article.value?.author?.name ||
        article.value?.user?.name ||
        article.value?.created_by?.name ||
        "NFarmHouse"
    );
});

const publishedDate = computed(() => {
    const value =
        article.value?.published_at ||
        article.value?.published_date ||
        article.value?.created_at;

    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
});

const tags = computed(() => {
    return Array.isArray(article.value?.tags)
        ? article.value.tags
        : [];
});

function normalizeArticle(data) {
    return {
        ...data,
        title: data.title || "Bài viết",
        slug: data.slug || route.params.slug,
        excerpt: data.excerpt || data.subtitle || "",
        content: data.content || data.body || "",
        title_image_url:
            data.title_image_url ||
            data.image_url ||
            data.image ||
            null,
    };
}

async function fetchArticle() {
    const slug = route.params.slug;

    if (!slug) {
        errorMessage.value = "Không tìm thấy đường dẫn bài viết.";
        article.value = null;
        return;
    }

    loading.value = true;
    errorMessage.value = "";

    try {
        const response = await ClientNewsService.getNewsDetail(slug);
        const data = response.data?.data || response.data;

        article.value = normalizeArticle(data);

        document.title = `${article.value.title} | NFarmHouse`;
    } catch (error) {
        console.error("Lỗi tải chi tiết bài viết:", error);

        errorMessage.value =
            error.response?.data?.message ||
            "Không tải được bài viết. Bài viết có thể không tồn tại hoặc chưa được xuất bản.";

        article.value = null;
    } finally {
        loading.value = false;
    }
}

watch(
    () => route.params.slug,
    () => {
        fetchArticle();
    },
);

onMounted(() => {
    fetchArticle();
});
</script>

<template>
    <div class="min-h-screen bg-[#f7faf8] text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <RouterLink :to="{ name: 'news' }" class="transition hover:text-[#07532b]">
                        Tin tức
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="max-w-[220px] truncate font-semibold text-[#174e31]">
                        {{ articleTitle }}
                    </span>
                </nav>
            </div>
        </div>

        <main class="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <button type="button"
                class="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-[#07532b]"
                @click="router.push({ name: 'news' })">
                <Icon icon="mdi:arrow-left" class="text-base" />
                Quay lại tin tức
            </button>

            <div v-if="loading" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div class="h-[360px] animate-pulse bg-slate-100"></div>

                <div class="space-y-4 p-6 sm:p-8">
                    <div class="h-4 w-36 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-10 w-4/5 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-4 w-full animate-pulse rounded bg-slate-100"></div>
                    <div class="h-4 w-5/6 animate-pulse rounded bg-slate-100"></div>
                    <div class="h-4 w-2/3 animate-pulse rounded bg-slate-100"></div>
                </div>
            </div>

            <div v-else-if="errorMessage"
                class="rounded-3xl border border-red-100 bg-white px-5 py-16 text-center shadow-sm">
                <span class="mx-auto grid size-20 place-items-center rounded-full bg-red-50 text-red-500">
                    <Icon icon="mdi:file-alert-outline" class="text-4xl" />
                </span>

                <h1 class="mt-5 text-xl font-bold text-[#123d27]">
                    Không mở được bài viết
                </h1>

                <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {{ errorMessage }}
                </p>

                <RouterLink :to="{ name: 'news' }"
                    class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#064522]">
                    Xem danh sách tin tức
                    <Icon icon="mdi:arrow-right" />
                </RouterLink>
            </div>

            <article v-else-if="article" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <header>
                    <div class="relative overflow-hidden bg-slate-900">
                        <img :src="articleImage" :alt="article.title"
                            class="h-[260px] w-full object-cover opacity-85 sm:h-[380px] lg:h-[460px]" />

                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>

                        <div class="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-10">
                            <div class="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/75">
                                <span class="inline-flex items-center gap-1.5">
                                    <Icon icon="mdi:account-outline" class="text-base" />
                                    {{ authorName }}
                                </span>

                                <span class="size-1 rounded-full bg-white/40"></span>

                                <span class="inline-flex items-center gap-1.5">
                                    <Icon icon="mdi:calendar-blank-outline" class="text-base" />
                                    {{ publishedDate }}
                                </span>
                            </div>

                            <h1 class="mt-3 max-w-4xl text-2xl font-bold leading-tight sm:text-4xl">
                                {{ article.title }}
                            </h1>

                            <p v-if="article.excerpt" class="mt-3 max-w-3xl text-sm leading-6 text-white/75">
                                {{ article.excerpt }}
                            </p>
                        </div>
                    </div>
                </header>

                <div class="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-10">
                    <div class="min-w-0">
                        <div class="news-content max-w-none text-sm leading-7 text-slate-700 sm:text-base sm:leading-8"
                            v-html="articleContent"></div>
                    </div>

                    <aside class="space-y-5 lg:sticky lg:top-6 lg:self-start">
                        <section class="rounded-2xl border border-slate-200 bg-[#fafcfb] p-5">
                            <h2 class="text-sm font-bold text-[#123d27]">
                                Thông tin bài viết
                            </h2>

                            <div class="mt-4 space-y-3 text-xs text-slate-500">
                                <div class="flex items-center gap-2">
                                    <Icon icon="mdi:account-outline" class="text-lg text-[#07532b]" />
                                    {{ authorName }}
                                </div>

                                <div class="flex items-center gap-2">
                                    <Icon icon="mdi:calendar-blank-outline" class="text-lg text-[#07532b]" />
                                    {{ publishedDate }}
                                </div>
                            </div>
                        </section>

                        <section v-if="tags.length" class="rounded-2xl border border-slate-200 bg-[#fafcfb] p-5">
                            <h2 class="text-sm font-bold text-[#123d27]">
                                Chủ đề
                            </h2>

                            <div class="mt-4 flex flex-wrap gap-2">
                                <span v-for="tag in tags" :key="tag.id || tag.name || tag"
                                    class="rounded-full bg-[#edf5f0] px-3 py-1.5 text-[10px] font-semibold text-[#07532b]">
                                    {{ tag.name || tag.tag_name || tag }}
                                </span>
                            </div>
                        </section>

                        <RouterLink :to="{ name: 'client-products' }"
                            class="block rounded-2xl bg-[#07532b] p-5 text-white transition hover:bg-[#064522]">
                            <Icon icon="mdi:shopping-outline" class="text-3xl text-[#ffd326]" />

                            <strong class="mt-3 block text-sm">
                                Xem vật tư nông nghiệp
                            </strong>

                            <span class="mt-1 block text-[11px] leading-5 text-white/65">
                                Tìm sản phẩm phù hợp cho mùa vụ của bạn.
                            </span>
                        </RouterLink>
                    </aside>
                </div>
            </article>
        </main>
    </div>
</template>

<style scoped>
@reference "../../style.css";

.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3) {
    @apply mb-3 mt-7 font-bold text-[#123d27];
}

.news-content :deep(h1) {
    @apply text-3xl;
}

.news-content :deep(h2) {
    @apply text-2xl;
}

.news-content :deep(h3) {
    @apply text-xl;
}

.news-content :deep(p) {
    @apply mb-4;
}

.news-content :deep(img) {
    @apply my-6 rounded-2xl;
}

.news-content :deep(ul) {
    @apply mb-4 list-disc space-y-2 pl-6;
}

.news-content :deep(ol) {
    @apply mb-4 list-decimal space-y-2 pl-6;
}

.news-content :deep(blockquote) {
    @apply my-5 border-l-4 border-[#07532b] bg-[#f2f8f4] px-5 py-4 italic text-slate-600;
}

.news-content :deep(a) {
    @apply font-semibold text-[#07532b] underline;
}
</style>