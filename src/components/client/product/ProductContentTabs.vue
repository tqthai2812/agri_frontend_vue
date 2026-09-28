<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },
    reviews: {
        type: Array,
        default: () => [],
    },
    reviewsLoaded: {
        type: Boolean,
        default: false,
    },
    reviewEnabled: {
        type: Boolean,
        default: false,
    },
    reviewOrderItemId: {
        type: [Number, String],
        default: null,
    },
    submittingReview: {
        type: Boolean,
        default: false,
    },
    reviewError: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["submit-review"]);

const activeTab = ref("details");
const reviewRating = ref(5);
const reviewContent = ref("");

function isVisible(review) {
    return (
        !review.deleted_at &&
        (review.status == null || review.status === "published")
    );
}

const rootReviews = computed(() =>
    props.reviews.filter(
        (review) => review.parent_id == null && isVisible(review),
    ),
);

const ratedReviews = computed(() =>
    rootReviews.value.filter((review) => {
        const rating = Number(review.rating);
        return Number.isInteger(rating) && rating >= 1 && rating <= 5;
    }),
);

const reviewCount = computed(() => {
    const count = Number(
        props.product.review_count ?? ratedReviews.value.length,
    );

    return Number.isFinite(count) ? Math.max(0, count) : 0;
});

const averageRating = computed(() => {
    const value = Number(props.product.average_rating ?? 0);
    return Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
});

const tabs = computed(() => [
    {
        id: "details",
        label: "Chi tiết sản phẩm",
        icon: "mdi:file-document-outline",
    },
    {
        id: "instructions",
        label: "Hướng dẫn & an toàn",
        icon: "mdi:book-open-page-variant-outline",
    },
    {
        id: "reviews",
        label: `Đánh giá (${reviewCount.value})`,
        icon: "mdi:comment-text-outline",
    },
]);

const specifications = computed(() => [
    {
        label: "Danh mục",
        value: props.product.category?.name || props.product.category?.category_name,
    },
    {
        label: "Danh mục con",
        value: props.product.subcategory?.name || props.product.subcategory?.subcategory_name,
    },
    {
        label: "Nguồn gốc",
        value: props.product.origin?.name || props.product.origin?.origin_name,
    },
    {
        label: "Thương hiệu",
        value: props.product.brand,
    },
]);

const ratingDistribution = computed(() =>
    [5, 4, 3, 2, 1].map((rating) => {
        const count = ratedReviews.value.filter(
            (review) => Number(review.rating) === rating,
        ).length;

        return {
            rating,
            count,
            percent: ratedReviews.value.length
                ? Math.round((count / ratedReviews.value.length) * 100)
                : 0,
        };
    }),
);

const canWriteReview = computed(
    () =>
        props.reviewEnabled &&
        Number.isSafeInteger(Number(props.reviewOrderItemId)) &&
        Number(props.reviewOrderItemId) > 0,
);

const canSubmit = computed(
    () =>
        canWriteReview.value &&
        !props.submittingReview &&
        reviewContent.value.trim().length > 0 &&
        reviewContent.value.trim().length <= 1000 &&
        Number.isInteger(reviewRating.value) &&
        reviewRating.value >= 1 &&
        reviewRating.value <= 5,
);

function resetReviewForm() {
    reviewContent.value = "";
    reviewRating.value = 5;
}

// Trang cha chỉ gọi sau khi API xác nhận gửi thành công.
defineExpose({ resetReviewForm });

function submitReview() {
    if (!canSubmit.value) return;

    emit("submit-review", {
        product_id: props.product.id,
        order_item_id: Number(props.reviewOrderItemId),
        rating: reviewRating.value,
        content: reviewContent.value.trim(),
        parent_id: null,
    });
}

function visibleReplies(review) {
    return (review.replies || []).filter(isVisible);
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
    }).format(date);
}

function avatarUrl(path) {
    if (!path) return "";

    const value = String(path);

    if (/^https?:\/\//i.test(value)) return value;

    // Không nối các scheme khác thành đường dẫn ảnh.
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
        return "";
    }

    const backend = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
        .replace(/\/api\/?$/, "")
        .replace(/\/$/, "");

    const relative = value.replace(/^\/+/, "");

    return `${backend}/${relative.startsWith("storage/") ? relative : `storage/${relative}`}`;
}

watch(
    () => props.product.id,
    () => {
        activeTab.value = "details";
        resetReviewForm();
    },
);
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <nav class="flex overflow-x-auto border-b border-slate-200 px-4 sm:justify-center"
            aria-label="Thông tin sản phẩm">
            <button v-for="tab in tabs" :key="tab.id" type="button" :aria-pressed="activeTab === tab.id"
                class="relative flex shrink-0 items-center gap-2 px-5 py-5 text-sm font-bold transition"
                :class="activeTab === tab.id ? 'text-[#07532b]' : 'text-slate-400 hover:text-slate-700'"
                @click="activeTab = tab.id">
                <Icon :icon="tab.icon" class="text-lg" />
                {{ tab.label }}

                <span v-if="activeTab === tab.id"
                    class="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#07532b]"></span>
            </button>
        </nav>

        <div class="p-6 sm:p-8">
            <div v-if="activeTab === 'details'" class="space-y-8">
                <div>
                    <h2 class="text-xl font-bold text-[#153f29]">Mô tả sản phẩm</h2>
                    <p class="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                        {{ product.description || "Thông tin sản phẩm đang được cập nhật." }}
                    </p>
                </div>

                <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div v-for="item in specifications" :key="item.label" class="rounded-2xl bg-[#f6f9f7] p-4">
                        <dt class="text-xs text-slate-400">{{ item.label }}</dt>
                        <dd class="mt-1 break-words text-sm font-bold text-slate-700">
                            {{ item.value || "Đang cập nhật" }}
                        </dd>
                    </div>
                </dl>

                <p class="text-sm text-slate-500">
                    Có {{ product.variants?.length ?? 0 }} biến thể sản phẩm.
                </p>
            </div>

            <div v-else-if="activeTab === 'instructions'" class="grid gap-6 lg:grid-cols-2">
                <article class="rounded-2xl border border-[#cfe0d5] bg-[#f3f8f5] p-6">
                    <div class="flex items-center gap-3">
                        <span class="grid size-11 shrink-0 place-items-center rounded-full bg-[#07532b] text-white">
                            <Icon icon="mdi:book-open-page-variant-outline" class="text-2xl" />
                        </span>
                        <h2 class="text-lg font-bold text-[#153f29]">Hướng dẫn sử dụng</h2>
                    </div>

                    <p class="mt-5 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                        {{ product.usage_instructions || "Hướng dẫn sử dụng đang được cập nhật." }}
                    </p>
                </article>

                <article class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <div class="flex items-center gap-3">
                        <span class="grid size-11 shrink-0 place-items-center rounded-full bg-amber-400 text-amber-950">
                            <Icon icon="mdi:alert-outline" class="text-2xl" />
                        </span>
                        <h2 class="text-lg font-bold text-amber-900">Cảnh báo an toàn</h2>
                    </div>

                    <p class="mt-5 whitespace-pre-line break-words text-sm leading-7 text-amber-900/70">
                        {{ product.safety_warning || "Thông tin cảnh báo an toàn đang được cập nhật." }}
                    </p>
                </article>
            </div>

            <div v-else class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside>
                    <div class="rounded-2xl bg-[#fffaf0] p-6 text-center">
                        <strong class="text-5xl text-[#153f29]">
                            {{ averageRating.toFixed(1) }}
                        </strong>

                        <div class="mt-3 flex justify-center">
                            <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-xl"
                                :class="star <= Math.round(averageRating) ? 'text-[#ffc400]' : 'text-slate-200'" />
                        </div>

                        <p class="mt-2 text-xs text-slate-400">
                            {{ reviewCount }} lượt đánh giá
                        </p>
                    </div>

                    <div v-if="ratedReviews.length" class="mt-5 space-y-2">
                        <p class="mb-3 text-xs text-slate-500">
                            Phân bố của {{ ratedReviews.length }} đánh giá đã tải
                        </p>

                        <div v-for="item in ratingDistribution" :key="item.rating"
                            class="flex items-center gap-2 text-xs">
                            <span class="w-7">{{ item.rating }}★</span>
                            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-[#ffc400]" :style="{ width: `${item.percent}%` }">
                                </div>
                            </div>
                            <span class="min-w-6 text-right text-slate-400">{{ item.count }}</span>
                        </div>
                    </div>
                </aside>

                <div>
                    <form v-if="canWriteReview" class="rounded-2xl border border-slate-200 p-5"
                        @submit.prevent="submitReview">
                        <fieldset :disabled="submittingReview">
                            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h2 class="font-bold text-slate-800">Viết đánh giá của bạn</h2>

                                <div class="flex items-center gap-1" aria-label="Chọn số sao">
                                    <button v-for="star in 5" :key="star" type="button" class="text-2xl"
                                        :aria-label="`${star} sao`" :aria-pressed="reviewRating === star"
                                        @click="reviewRating = star">
                                        <Icon icon="mdi:star"
                                            :class="star <= reviewRating ? 'text-[#ffc400]' : 'text-slate-200'" />
                                    </button>
                                </div>
                            </div>

                            <textarea v-model="reviewContent" rows="3" maxlength="1000" required
                                aria-label="Nội dung đánh giá" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                class="mt-4 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#07532b] focus:ring-4 focus:ring-[#07532b]/10"></textarea>

                            <p v-if="reviewError" role="alert" class="mt-2 text-sm text-red-600">
                                {{ reviewError }}
                            </p>

                            <div class="mt-3 flex items-center justify-between gap-3">
                                <span class="text-xs text-slate-400">{{ reviewContent.length }}/1000</span>
                                <button type="submit"
                                    class="rounded-full bg-[#07532b] px-6 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    :disabled="!canSubmit">
                                    {{ submittingReview ? "Đang gửi..." : "Gửi đánh giá" }}
                                </button>
                            </div>
                        </fieldset>
                    </form>

                    <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        {{
                            reviewEnabled
                                ? "Bạn cần có sản phẩm đã mua đủ điều kiện để viết đánh giá."
                                : "Chức năng gửi đánh giá hiện chưa khả dụng."
                        }}
                    </div>

                    <div v-if="rootReviews.length" class="mt-6 divide-y divide-slate-100">
                        <article v-for="review in rootReviews" :key="review.id" class="py-5">
                            <div class="flex gap-3">
                                <img v-if="avatarUrl(review.user?.avatar)" :src="avatarUrl(review.user.avatar)"
                                    :alt="review.user?.name || 'Người dùng'" loading="lazy"
                                    class="size-10 shrink-0 rounded-full object-cover" />

                                <span v-else
                                    class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] font-bold text-[#07532b]">
                                    {{ review.user?.name?.charAt(0)?.toUpperCase() || "U" }}
                                </span>

                                <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <strong class="text-sm text-slate-800">
                                            {{ review.user?.name || "Người dùng" }}
                                        </strong>
                                        <span class="text-[11px] text-slate-400">
                                            {{ formatDate(review.created_at) }}
                                        </span>
                                    </div>

                                    <div v-if="Number(review.rating) >= 1" class="mt-1 flex">
                                        <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-sm"
                                            :class="star <= Number(review.rating) ? 'text-[#ffc400]' : 'text-slate-200'" />
                                    </div>

                                    <p class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                                        {{ review.content }}
                                    </p>

                                    <div v-if="visibleReplies(review).length"
                                        class="mt-4 space-y-3 border-l-2 border-[#dce8df] pl-4">
                                        <div v-for="reply in visibleReplies(review)" :key="reply.id"
                                            class="rounded-xl bg-[#f7faf8] p-4">
                                            <strong class="text-xs text-[#07532b]">
                                                {{ reply.user?.name || "Người dùng" }}
                                            </strong>
                                            <p
                                                class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                                                {{ reply.content }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div v-else
                        class="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
                        <Icon icon="mdi:comment-outline" class="mx-auto mb-2 text-4xl text-slate-300" />
                        {{
                            reviewsLoaded
                                ? "Chưa có đánh giá để hiển thị."
                                : "Danh sách đánh giá chưa được tải."
                        }}
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>