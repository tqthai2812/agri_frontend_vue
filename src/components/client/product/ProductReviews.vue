<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { Icon } from "@iconify/vue";
import ProductReviewService from "@/services/client/productReview.service";
import { useAuthStore } from "@/stores/shared/authStore";
import ProductReviewModerationDialog from "@/components/client/product/ProductReviewModerationDialog.vue";

const props = defineProps({ productId: { type: [Number, String], required: true } });
const emit = defineEmits(["summary"]);
const authStore = useAuthStore();
const canManage = computed(() => authStore.isAuthenticated && authStore.hasPermission("review.view"));
const canReply = computed(() => canManage.value && authStore.hasPermission("review.reply"));
const managementOpen = ref(false);
const initialReviewId = ref(null);
const notice = ref("");
const summaryStale = ref(false);
const reviews = ref([]);
const loading = ref(false);
const error = ref("");
const ratingFilter = ref(0);
const requestedPage = ref(1);
const meta = ref({ current_page: 1, last_page: 1, total: 0 });
const summary = ref({ average_rating: 0, review_count: 0, distribution: [] });
let version = 0;
let disposed = false;

const distribution = computed(() => [5, 4, 3, 2, 1].map((rating) => {
    const count = Number(summary.value.distribution.find((row) => Number(row.rating) === rating)?.count || 0);
    return { rating, count, percent: summary.value.review_count ? (count / summary.value.review_count) * 100 : 0 };
}));

async function loadReviews(page = 1, correctPage = true) {
    const requestId = ++version;
    const productId = props.productId;
    requestedPage.value = page;
    loading.value = true;
    error.value = "";

    try {
        const response = await ProductReviewService.getProductReviews(productId, {
            page, per_page: 10, rating: ratingFilter.value || undefined,
        });
        if (disposed || requestId !== version) return;
        const lastPage = Math.max(1, Number(response.data?.meta?.last_page || 1));
        if (correctPage && page > lastPage) return await loadReviews(lastPage, false);
        reviews.value = Array.isArray(response.data?.data) ? response.data.data : [];
        meta.value = {
            current_page: Number(response.data?.meta?.current_page ?? 1),
            last_page: lastPage,
            total: Number(response.data?.meta?.total ?? 0),
        };
        const data = response.data?.summary || {};
        summary.value = {
            average_rating: Number(data.average_rating || 0),
            review_count: Number(data.review_count || 0),
            distribution: Array.isArray(data.distribution) ? data.distribution : [],
        };
        summaryStale.value = false;
        emit("summary", { product_id: productId, ...summary.value });
    } catch (err) {
        if (disposed || requestId !== version) return;
        reviews.value = [];
        error.value = summaryStale.value
            ? "Thay đổi đã được lưu nhưng chưa tải lại được đánh giá và điểm sao. Bấm Thử lại để cập nhật."
            : err.response?.data?.message || "Không tải được đánh giá. Vui lòng thử lại.";
    } finally {
        if (!disposed && requestId === version) loading.value = false;
    }
}

function openManagement(reviewId = null) {
    if (!canManage.value) return;
    initialReviewId.value = reviewId;
    managementOpen.value = true;
}

function onManaged(result) {
    if (disposed || String(result.product_id) !== String(props.productId)) return;
    notice.value = result.message || "Đã lưu thay đổi đánh giá.";
    summaryStale.value = true;
    reviews.value = [];
    loadReviews(meta.value.current_page);
}

watch([canManage, () => authStore.user?.id], () => {
    managementOpen.value = false;
    initialReviewId.value = null;
    notice.value = "";
}, { flush: "sync" });

function filterBy(rating) {
    if (loading.value || ratingFilter.value === rating) return;
    ratingFilter.value = rating;
    loadReviews(1);
}

function goToPage(page) {
    if (!loading.value && page >= 1 && page <= meta.value.last_page) loadReviews(page);
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

function packageLabel(purchase) {
    if (!purchase) return "";
    const units = { l: "lít", piece: "cái" };
    return [purchase.variant_name, `${purchase.size ?? ""} ${units[purchase.unit] || purchase.unit || ""}`.trim()]
        .filter(Boolean).join(" · ");
}

watch(() => props.productId, () => {
    managementOpen.value = false;
    initialReviewId.value = null;
    notice.value = "";
    summaryStale.value = false;
    ratingFilter.value = 0;
    reviews.value = [];
    summary.value = { average_rating: 0, review_count: 0, distribution: [] };
    loadReviews(1);
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => { disposed = true; version++; });
</script>

<template>
    <div class="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside>
            <div class="rounded-2xl bg-[#fffaf0] p-6 text-center">
                <strong class="text-5xl text-[#153f29]">{{ summary.average_rating.toFixed(1) }}</strong>
                <span class="ml-1 text-sm text-slate-400">/ 5</span>
                <div class="mt-3 flex justify-center" :aria-label="`${summary.average_rating} trên 5 sao`">
                    <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-xl"
                        :class="star <= Math.round(summary.average_rating) ? 'text-[#ffc400]' : 'text-slate-200'" />
                </div>
                <p class="mt-2 text-xs text-slate-500">{{ summary.review_count }} lượt đánh giá</p>
                <p v-if="summaryStale" role="status" class="mt-2 text-xs text-amber-700">
                    {{ loading ? 'Đang cập nhật điểm sao...' : 'Điểm sao chưa được tải lại.' }}</p>
            </div>
            <div class="mt-5 space-y-3">
                <div v-for="row in distribution" :key="row.rating" class="flex items-center gap-2 text-xs">
                    <span class="w-7">{{ row.rating }}★</span>
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div class="h-full rounded-full bg-[#ffc400]" :style="{ width: `${row.percent}%` }"></div>
                    </div>
                    <span class="min-w-6 text-right text-slate-400">{{ row.count }}</span>
                </div>
            </div>
        </aside>

        <div class="min-w-0">
            <div v-if="canManage"
                class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#bdd5c5] bg-[#edf5f0] p-4">
                <div>
                    <p class="text-sm font-bold text-[#07532b]">Quản lý đánh giá ngay tại đây</p>
                    <p class="mt-1 text-xs text-slate-500">Xem cả đánh giá đã ẩn và chờ duyệt của sản phẩm này.</p>
                </div>
                <button type="button" @click="openManagement()"
                    class="inline-flex items-center gap-2 rounded-full bg-[#07532b] px-4 py-2 text-xs font-bold text-white">
                    <Icon icon="mdi:comment-edit-outline" class="text-lg" />Quản lý đánh giá
                </button>
            </div>
            <p v-if="notice && canManage" role="status"
                class="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{{ notice }}</p>
            <div class="rounded-2xl border border-[#dce8df] bg-[#f6faf7] p-4 text-sm leading-6 text-slate-600">
                Bạn đã mua sản phẩm? Vào
                <RouterLink :to="{ name: 'my-orders' }" class="font-bold text-[#07532b] underline">Đơn mua</RouterLink>
                và chọn đơn đã hoàn thành để đánh giá các sản phẩm cùng một lượt.
            </div>

            <div class="mt-5 flex flex-wrap gap-2" aria-label="Lọc đánh giá theo số sao">
                <button type="button" :disabled="loading" :aria-pressed="ratingFilter === 0"
                    class="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    :class="ratingFilter === 0 ? 'border-[#07532b] bg-[#07532b] text-white' : 'border-slate-200 text-slate-500'"
                    @click="filterBy(0)">Tất cả ({{ summary.review_count }})</button>
                <button v-for="row in distribution" :key="row.rating" type="button" :disabled="loading"
                    :aria-pressed="ratingFilter === row.rating"
                    class="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    :class="ratingFilter === row.rating ? 'border-[#07532b] bg-[#07532b] text-white' : 'border-slate-200 text-slate-500'"
                    @click="filterBy(row.rating)">{{ row.rating }}★ ({{ row.count }})</button>
            </div>

            <div v-if="loading" role="status" class="py-12 text-center text-sm text-slate-500">
                <Icon icon="mdi:loading" class="mx-auto mb-2 animate-spin text-3xl text-[#07532b]" />Đang tải đánh
                giá...
            </div>
            <div v-else-if="error" role="alert" class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                {{ error }} <button type="button" class="ml-2 font-bold underline"
                    @click="loadReviews(requestedPage)">Thử lại</button>
            </div>
            <div v-else-if="!reviews.length"
                class="mt-5 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                <Icon icon="mdi:comment-outline" class="mx-auto mb-3 text-4xl text-slate-300" />
                {{ ratingFilter ? `Chưa có đánh giá ${ratingFilter} sao.` : "Chưa có đánh giá cho sản phẩm này." }}
            </div>
            <div v-else class="mt-2 divide-y divide-slate-100">
                <article v-for="review in reviews" :key="review.id" class="py-6">
                    <div class="flex gap-3">
                        <span
                            class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-sm font-bold text-[#07532b]">{{
                                review.user?.name?.charAt(0)?.toUpperCase() || "K" }}</span>
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap justify-between gap-2">
                                <strong class="text-sm text-slate-800">{{ review.user?.name || "Khách hàng" }}</strong>
                                <span class="text-xs text-slate-400">{{ formatDate(review.created_at) }}</span>
                            </div>
                            <div class="mt-1 flex" :aria-label="`${review.rating} sao`">
                                <Icon v-for="star in 5" :key="star" icon="mdi:star"
                                    :class="star <= review.rating ? 'text-[#ffc400]' : 'text-slate-200'" />
                            </div>
                            <p v-if="review.is_verified_purchase"
                                class="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#0a7139]">
                                <Icon icon="mdi:check-decagram-outline" />Đã mua hàng
                            </p>
                            <p v-if="packageLabel(review.purchase)" class="mt-1 text-xs text-slate-400">{{
                                packageLabel(review.purchase) }}</p>
                            <p class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{{
                                review.content }}</p>
                            <div v-if="review.replies?.length" class="mt-4 space-y-3 border-l-2 border-[#dce8df] pl-4">
                                <div v-for="reply in review.replies" :key="reply.id"
                                    class="rounded-xl bg-[#f7faf8] p-4">
                                    <strong class="text-xs text-[#07532b]">
                                        {{ reply.is_shop_reply ? "Phản hồi từ cửa hàng" : reply.user?.name ||
                                            "Người dùng" }}</strong>
                                    <p class="mt-1 text-[11px] text-slate-400">{{ formatDate(reply.created_at) }}</p>
                                    <p class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{{
                                        reply.content }}</p>
                                </div>
                            </div>
                            <div v-if="canManage"
                                class="mt-4 flex flex-wrap gap-2 border-t border-dashed border-slate-200 pt-3">
                                <button type="button" @click="openManagement(review.id)"
                                    class="inline-flex items-center gap-1.5 rounded-full border border-[#9dbba8] px-4 py-2 text-xs font-semibold text-[#07532b] hover:bg-[#edf5f0]">
                                    <Icon icon="mdi:comment-edit-outline" class="text-lg" />
                                    {{ canReply ? 'Trả lời / Quản lý' : 'Quản lý đánh giá' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </div>

            <nav v-if="!error && meta.last_page > 1" class="mt-5 flex items-center justify-center gap-4"
                aria-label="Phân trang đánh giá">
                <button type="button" :disabled="loading || meta.current_page <= 1"
                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold disabled:opacity-40"
                    @click="goToPage(meta.current_page - 1)">Trước</button>
                <span class="text-xs text-slate-500">{{ meta.current_page }} / {{ meta.last_page }}</span>
                <button type="button" :disabled="loading || meta.current_page >= meta.last_page"
                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold disabled:opacity-40"
                    @click="goToPage(meta.current_page + 1)">Sau</button>
            </nav>
        </div>
    </div>
    <ProductReviewModerationDialog v-if="canManage && managementOpen" v-model="managementOpen" :product-id="productId"
        :initial-review-id="initialReviewId" @saved="onManaged" />
</template>