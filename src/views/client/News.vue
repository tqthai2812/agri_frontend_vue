<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from "vue";

import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import NewsArticleCard from "@/components/client/news/NewsArticleCard.vue";
import NewsSidebar from "@/components/client/news/NewsSidebar.vue";
import NewsPreviewModal from "@/components/client/news/NewsPreviewModal.vue";

import ClientNewsService from "@/services/client/clientNews.service";

const router = useRouter();

const pageSize = 6;

const search = ref("");
const activeTag = ref("all");
const sortBy = ref("latest");
const currentPage = ref(1);

const selectedArticle = ref(null);
const showPreview = ref(false);

const toast = ref("");
const loading = ref(false);
const errorMessage = ref("");

let toastTimer = null;

const articles = ref([]);

const fallbackImage =
    "https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=900&q=80";

const featuredArticles = computed(() => {
    return [...articles.value]
        .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
        .slice(0, 3);
});

const tags = computed(() => {
    const tagMap = new Map();

    articles.value.forEach((article) => {
        (article.tags || []).forEach((tag) => {
            const tagId = tag.id || tag.tag_id || tag.name || tag.tag_name;

            if (!tagId) {
                return;
            }

            const current = tagMap.get(tagId);

            tagMap.set(tagId, {
                id: tagId,
                tag_name: tag.tag_name || tag.name || "Chủ đề",
                count: Number(current?.count || 0) + 1,
            });
        });
    });

    return [...tagMap.values()].sort((a, b) => b.count - a.count);
});

const filteredArticles = computed(() => {
    const keyword = search.value.trim().toLocaleLowerCase("vi");

    const result = articles.value.filter((article) => {
        const title = article.title || "";
        const subtitle = article.subtitle || "";
        const excerpt = article.excerpt || "";

        const matchesSearch =
            !keyword ||
            title.toLocaleLowerCase("vi").includes(keyword) ||
            subtitle.toLocaleLowerCase("vi").includes(keyword) ||
            excerpt.toLocaleLowerCase("vi").includes(keyword);

        const matchesTag =
            activeTag.value === "all" ||
            article.tags?.some((tag) => {
                const tagId = tag.id || tag.tag_id || tag.name || tag.tag_name;

                return String(tagId) === String(activeTag.value);
            });

        return matchesSearch && matchesTag;
    });

    if (sortBy.value === "popular") {
        return [...result].sort((a, b) => {
            return Number(b.views || 0) - Number(a.views || 0);
        });
    }

    if (sortBy.value === "comments") {
        return [...result].sort((a, b) => {
            return Number(b.comments_count || 0) - Number(a.comments_count || 0);
        });
    }

    return [...result].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0);
        const dateB = new Date(b.published_at || b.created_at || 0);

        return dateB - dateA;
    });
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredArticles.value.length / pageSize));
});

const paginatedArticles = computed(() => {
    const start = (currentPage.value - 1) * pageSize;

    return filteredArticles.value.slice(start, start + pageSize);
});

const popularArticles = computed(() => {
    return [...articles.value]
        .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
        .slice(0, 4);
});

watch([search, activeTag, sortBy], () => {
    currentPage.value = 1;
});

function normalizeArticle(article) {
    const author =
        article.author ||
        article.user ||
        article.created_by ||
        {
            id: null,
            name: "NFarmHouse",
        };

    return {
        id: article.id,
        title: article.title || "Bài viết",
        subtitle: article.subtitle || article.excerpt || "",
        content: article.content || "",
        excerpt: article.excerpt || "",
        slug: article.slug,

        title_image_url:
            article.title_image_url ||
            article.image_url ||
            article.image ||
            fallbackImage,

        views: Number(article.views || 0),
        comments_count: Number(article.comments_count || 0),

        user: author,
        author,

        tags: Array.isArray(article.tags) ? article.tags : [],

        published_at:
            article.published_at ||
            article.published_date ||
            article.created_at,

        published_date:
            article.published_date ||
            (article.published_at
                ? new Date(article.published_at).toLocaleDateString("vi-VN")
                : ""),

        created_at: article.created_at,
        raw: article,
    };
}

async function fetchNews() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const response = await ClientNewsService.getNews({
            per_page: 100,
        });

        const data = response.data?.data || [];

        articles.value = data.map(normalizeArticle);
    } catch (error) {
        console.error("Lỗi tải tin tức:", error);

        errorMessage.value =
            error.response?.data?.message ||
            "Không tải được danh sách bài viết. Vui lòng thử lại sau.";

        articles.value = [];
    } finally {
        loading.value = false;
    }
}

async function openArticle(article) {
    selectedArticle.value = article;
    showPreview.value = true;

    if (!article?.slug) {
        return;
    }

    try {
        const response = await ClientNewsService.getNewsDetail(article.slug);
        const detail = response.data?.data || response.data;

        if (detail) {
            const normalizedDetail = normalizeArticle(detail);

            selectedArticle.value = normalizedDetail;

            const index = articles.value.findIndex((item) => {
                return Number(item.id) === Number(normalizedDetail.id);
            });

            if (index !== -1) {
                articles.value[index] = normalizedDetail;
            }
        }
    } catch (error) {
        console.error("Lỗi tải chi tiết bài viết:", error);
    }
}

function goToArticleDetail(article) {
    const slug = article?.slug || selectedArticle.value?.slug;

    if (!slug) {
        showToast("Bài viết này chưa có đường dẫn chi tiết.");
        return;
    }

    showPreview.value = false;

    router.push({
        name: "news-detail",
        params: {
            slug,
        },
    });
}

function selectTag(tagId) {
    activeTag.value = String(activeTag.value) === String(tagId) ? "all" : tagId;

    window.scrollTo({
        top: 420,
        behavior: "smooth",
    });
}

function changePage(page) {
    if (page < 1 || page > totalPages.value) {
        return;
    }

    currentPage.value = page;

    window.scrollTo({
        top: 620,
        behavior: "smooth",
    });
}

function showToast(message) {
    toast.value = message;

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = "";
    }, 2800);
}

function subscribe(email) {
    console.log("Newsletter email:", email);

    showToast("Đăng ký nhận bản tin thành công.");

    // Backend sau này:
    // POST /api/newsletter/subscriptions
}

onMounted(() => {
    fetchNews();
});

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
});
</script>

<template>
    <div class="min-h-[70vh] bg-[#f6f8f6] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-semibold text-[#174e31]">
                        Tin tức
                    </span>
                </nav>
            </div>
        </div>

        <main class="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            <div v-if="errorMessage"
                class="mb-5 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {{ errorMessage }}
            </div>

            <div v-if="loading"
                class="mb-5 rounded-3xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
                <Icon icon="mdi:loading" class="mx-auto mb-2 animate-spin text-3xl text-[#07532b]" />
                Đang tải bài viết...
            </div>

            <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2a900]">
                        Kiến thức nhà nông
                    </p>

                    <h1 class="mt-2 text-2xl font-bold text-[#123d27] sm:text-3xl">
                        Tin tức & kinh nghiệm nông nghiệp
                    </h1>

                    <p class="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                        Cập nhật kỹ thuật canh tác, sâu bệnh, phân bón và những câu chuyện mới từ cộng đồng nông nghiệp.
                    </p>
                </div>

                <div class="flex items-center gap-2 text-[10px] text-slate-400">
                    <Icon icon="mdi:newspaper-variant-multiple-outline" class="text-xl text-[#07532b]" />
                    {{ articles.length }} bài viết đã xuất bản
                </div>
            </header>

            <section v-if="featuredArticles.length" class="grid gap-4 lg:grid-cols-[1.55fr_0.8fr]">
                <button type="button"
                    class="group relative min-h-[380px] overflow-hidden rounded-3xl text-left shadow-lg lg:min-h-[470px]"
                    @click="openArticle(featuredArticles[0])">
                    <img :src="featuredArticles[0].title_image_url" :alt="featuredArticles[0].title"
                        class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />

                    <span
                        class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/5"></span>

                    <div class="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-[#ffd326] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[#07532b]">
                            <Icon icon="mdi:star-four-points" />
                            Bài viết nổi bật
                        </span>

                        <h2 class="mt-4 max-w-3xl text-2xl font-bold leading-8 sm:text-4xl sm:leading-[1.2]">
                            {{ featuredArticles[0].title }}
                        </h2>

                        <p class="mt-3 line-clamp-2 max-w-2xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">
                            {{ featuredArticles[0].subtitle }}
                        </p>

                        <div class="mt-5 flex flex-wrap items-center gap-4 text-[10px] text-white/60">
                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:account-edit-outline" />
                                {{ featuredArticles[0].user?.name || "NFarmHouse" }}
                            </span>

                            <span class="flex items-center gap-1.5">
                                <Icon icon="mdi:eye-outline" />
                                {{ featuredArticles[0].views }} lượt xem
                            </span>

                            <span class="flex items-center gap-1.5 font-bold text-[#ffd326]">
                                Xem nhanh
                                <Icon icon="mdi:arrow-right" />
                            </span>
                        </div>
                    </div>
                </button>

                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <button v-for="article in featuredArticles.slice(1)" :key="article.id" type="button"
                        class="group relative min-h-[225px] overflow-hidden rounded-3xl text-left shadow-md"
                        @click="openArticle(article)">
                        <img :src="article.title_image_url" :alt="article.title"
                            class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />

                        <span
                            class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent"></span>

                        <div class="absolute inset-x-0 bottom-0 p-5 text-white">
                            <span class="text-[9px] font-bold uppercase tracking-wide text-[#ffd326]">
                                {{ article.tags?.[0]?.tag_name || article.tags?.[0]?.name || "Bài viết" }}
                            </span>

                            <h3 class="mt-2 line-clamp-2 text-base font-bold leading-6 sm:text-lg">
                                {{ article.title }}
                            </h3>

                            <p class="mt-2 flex items-center gap-1.5 text-[9px] text-white/60">
                                <Icon icon="mdi:eye-outline" />
                                {{ article.views }} lượt xem
                            </p>
                        </div>
                    </button>
                </div>
            </section>

            <section class="mt-9 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div class="min-w-0">
                    <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                            <div class="relative">
                                <Icon icon="mdi:magnify"
                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

                                <input v-model.trim="search" type="search"
                                    class="h-11 w-full rounded-full border border-slate-200 bg-[#fafcfb] pl-11 pr-4 text-xs outline-none transition focus:border-[#0a7139] focus:bg-white focus:ring-4 focus:ring-[#0a7139]/10"
                                    placeholder="Tìm bài viết..." />
                            </div>

                            <select v-model="sortBy"
                                class="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-600 outline-none focus:border-[#0a7139]">
                                <option value="latest">
                                    Mới nhất
                                </option>

                                <option value="popular">
                                    Xem nhiều nhất
                                </option>

                                <option value="comments">
                                    Bình luận nhiều
                                </option>
                            </select>
                        </div>

                        <div class="mt-4 flex gap-2 overflow-x-auto border-t border-slate-100 pt-4">
                            <button type="button"
                                class="shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold transition" :class="activeTag === 'all'
                                    ? 'border-[#07532b] bg-[#07532b] text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-[#07532b] hover:text-[#07532b]'"
                                @click="activeTag = 'all'">
                                Tất cả
                            </button>

                            <button v-for="tag in tags.slice(0, 7)" :key="tag.id" type="button"
                                class="shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold transition" :class="String(activeTag) === String(tag.id)
                                    ? 'border-[#07532b] bg-[#07532b] text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-[#07532b] hover:text-[#07532b]'"
                                @click="selectTag(tag.id)">
                                {{ tag.tag_name }}
                            </button>
                        </div>
                    </div>

                    <div v-if="paginatedArticles.length" class="mt-5 grid gap-5 sm:grid-cols-2">
                        <NewsArticleCard v-for="article in paginatedArticles" :key="article.id" :article="article"
                            @open="openArticle" />
                    </div>

                    <div v-else-if="!loading"
                        class="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                        <span class="mx-auto grid size-20 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                            <Icon icon="mdi:text-search" class="text-4xl" />
                        </span>

                        <h2 class="mt-5 text-base font-bold text-[#123d27]">
                            Không tìm thấy bài viết
                        </h2>

                        <p class="mt-1 text-xs text-slate-400">
                            Thử thay đổi từ khóa hoặc chủ đề đang chọn.
                        </p>

                        <button type="button"
                            class="mt-5 rounded-full border border-[#07532b] px-5 py-2.5 text-xs font-bold text-[#07532b] hover:bg-[#edf5f0]"
                            @click="
                                search = '';
                            activeTag = 'all';
                            ">
                            Xóa bộ lọc
                        </button>
                    </div>

                    <nav v-if="totalPages > 1" class="mt-7 flex justify-center gap-2" aria-label="Phân trang tin tức">
                        <button type="button"
                            class="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
                            :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                            <Icon icon="mdi:chevron-left" />
                        </button>

                        <button v-for="page in totalPages" :key="page" type="button"
                            class="grid size-10 place-items-center rounded-full border text-xs font-bold transition"
                            :class="page === currentPage
                                ? 'border-[#07532b] bg-[#07532b] text-white'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-[#07532b] hover:text-[#07532b]'"
                            @click="changePage(page)">
                            {{ page }}
                        </button>

                        <button type="button"
                            class="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
                            :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                            <Icon icon="mdi:chevron-right" />
                        </button>
                    </nav>
                </div>

                <NewsSidebar :popular-articles="popularArticles" :tags="tags" :active-tag="activeTag"
                    @open="openArticle" @select-tag="selectTag" @subscribe="subscribe" />
            </section>
        </main>

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            leave-active-class="transition duration-150" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toast"
                class="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />
                {{ toast }}
            </div>
        </Transition>

        <NewsPreviewModal v-model="showPreview" :article="selectedArticle" @view-detail="goToArticleDetail" />
    </div>
</template>