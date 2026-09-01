<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },

    reviews: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits([
    'submit-review',
])

const activeTab = ref('details')
const reviewRating = ref(5)
const reviewContent = ref('')

const tabs = computed(() => [
    {
        id: 'details',
        label: 'Chi tiết sản phẩm',
        icon: 'mdi:file-document-outline',
    },
    {
        id: 'instructions',
        label: 'Hướng dẫn & an toàn',
        icon: 'mdi:book-open-page-variant-outline',
    },
    {
        id: 'reviews',
        label: `Đánh giá (${props.product.review_count || 0})`,
        icon: 'mdi:comment-text-outline',
    },
])

const ratingDistribution = computed(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
        const count = props.reviews.filter(
            (review) =>
                Number(review.rating) === rating,
        ).length

        const percent = props.reviews.length
            ? Math.round(
                (count / props.reviews.length) * 100,
            )
            : 0

        return {
            rating,
            count,
            percent,
        }
    })
})

function submitReview() {
    const content =
        reviewContent.value.trim()

    if (!content) return

    emit('submit-review', {
        product_id: props.product.id,
        rating: reviewRating.value,
        content,
        parent_id: null,
    })

    reviewContent.value = ''
    reviewRating.value = 5
}

function formatDate(value) {
    if (!value) return ''

    return new Intl.DateTimeFormat(
        'vi-VN',
        {
            dateStyle: 'medium',
        },
    ).format(new Date(value))
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <!-- Tabs -->
        <div class="flex overflow-x-auto border-b border-slate-200 px-4 sm:justify-center">
            <button v-for="tab in tabs" :key="tab.id" type="button"
                class="relative flex shrink-0 items-center gap-2 px-5 py-5 text-sm font-bold transition" :class="activeTab === tab.id
                    ? 'text-[#07532b]'
                    : 'text-slate-400 hover:text-slate-700'
                    " @click="activeTab = tab.id">
                <Icon :icon="tab.icon" class="text-lg" />

                {{ tab.label }}

                <span v-if="activeTab === tab.id"
                    class="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#07532b]"></span>
            </button>
        </div>

        <div class="p-6 sm:p-8">
            <!-- Chi tiết -->
            <div v-if="activeTab === 'details'" class="space-y-8">
                <div>
                    <h2 class="text-xl font-bold text-[#153f29]">
                        Mô tả sản phẩm
                    </h2>

                    <p class="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {{
                            product.description ||
                            'Thông tin sản phẩm đang được cập nhật.'
                        }}
                    </p>
                </div>

                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-2xl bg-[#f6f9f7] p-4">
                        <span class="text-xs text-slate-400">
                            Danh mục
                        </span>

                        <strong class="mt-1 block text-sm text-slate-700">
                            {{
                                product.category?.name ||
                                product.category?.category_name ||
                                'Đang cập nhật'
                            }}
                        </strong>
                    </div>

                    <div class="rounded-2xl bg-[#f6f9f7] p-4">
                        <span class="text-xs text-slate-400">
                            Danh mục con
                        </span>

                        <strong class="mt-1 block text-sm text-slate-700">
                            {{
                                product.subcategory?.name ||
                                product.subcategory?.subcategory_name ||
                                'Đang cập nhật'
                            }}
                        </strong>
                    </div>

                    <div class="rounded-2xl bg-[#f6f9f7] p-4">
                        <span class="text-xs text-slate-400">
                            Nguồn gốc
                        </span>

                        <strong class="mt-1 block text-sm text-slate-700">
                            {{
                                product.origin?.name ||
                                product.origin?.origin_name ||
                                'Đang cập nhật'
                            }}
                        </strong>
                    </div>

                    <div class="rounded-2xl bg-[#f6f9f7] p-4">
                        <span class="text-xs text-slate-400">
                            Số biến thể
                        </span>

                        <strong class="mt-1 block text-sm text-slate-700">
                            {{ product.variants?.length || 0 }}
                            biến thể
                        </strong>
                    </div>
                </div>
            </div>

            <!-- Hướng dẫn -->
            <div v-else-if="activeTab === 'instructions'" class="grid gap-6 lg:grid-cols-2">
                <article class="rounded-2xl border border-[#cfe0d5] bg-[#f3f8f5] p-6">
                    <div class="flex items-center gap-3">
                        <span class="grid size-11 place-items-center rounded-full bg-[#07532b] text-white">
                            <Icon icon="mdi:book-open-page-variant-outline" class="text-2xl" />
                        </span>

                        <h2 class="text-lg font-bold text-[#153f29]">
                            Hướng dẫn sử dụng
                        </h2>
                    </div>

                    <p class="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {{
                            product.usage_instructions ||
                            'Hướng dẫn sử dụng đang được cập nhật.'
                        }}
                    </p>
                </article>

                <article class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <div class="flex items-center gap-3">
                        <span class="grid size-11 place-items-center rounded-full bg-amber-400 text-white">
                            <Icon icon="mdi:alert-outline" class="text-2xl" />
                        </span>

                        <h2 class="text-lg font-bold text-amber-900">
                            Cảnh báo an toàn
                        </h2>
                    </div>

                    <p class="mt-5 whitespace-pre-line text-sm leading-7 text-amber-900/70">
                        {{
                            product.safety_warning ||
                            'Chưa có cảnh báo an toàn riêng cho sản phẩm này.'
                        }}
                    </p>
                </article>
            </div>

            <!-- Đánh giá -->
            <div v-else class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside>
                    <div class="rounded-2xl bg-[#fffaf0] p-6 text-center">
                        <strong class="text-5xl text-[#153f29]">
                            {{
                                Number(
                                    product.average_rating || 0,
                                ).toFixed(1)
                            }}
                        </strong>

                        <div class="mt-3 flex justify-center">
                            <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-xl" :class="star <=
                                Math.round(
                                    product.average_rating || 0,
                                )
                                ? 'text-[#ffc400]'
                                : 'text-slate-200'
                                " />
                        </div>

                        <p class="mt-2 text-xs text-slate-400">
                            {{ product.review_count || 0 }}
                            lượt đánh giá
                        </p>
                    </div>

                    <div class="mt-5 space-y-2">
                        <div v-for="item in ratingDistribution" :key="item.rating"
                            class="flex items-center gap-2 text-xs">
                            <span class="w-7">
                                {{ item.rating }}★
                            </span>

                            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-[#ffc400]" :style="{
                                    width: `${item.percent}%`,
                                }"></div>
                            </div>

                            <span class="w-6 text-right text-slate-400">
                                {{ item.count }}
                            </span>
                        </div>
                    </div>
                </aside>

                <div>
                    <form class="rounded-2xl border border-slate-200 p-5" @submit.prevent="submitReview">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 class="font-bold text-slate-800">
                                Viết đánh giá của bạn
                            </h2>

                            <div class="flex items-center gap-1">
                                <button v-for="star in 5" :key="star" type="button" class="text-2xl"
                                    :aria-label="`${star} sao`" @click="reviewRating = star">
                                    <Icon icon="mdi:star" :class="star <= reviewRating
                                        ? 'text-[#ffc400]'
                                        : 'text-slate-200'
                                        " />
                                </button>
                            </div>
                        </div>

                        <textarea v-model="reviewContent" rows="3" maxlength="1000"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                            class="mt-4 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#07532b] focus:ring-4 focus:ring-[#07532b]/10"></textarea>

                        <div class="mt-3 flex justify-end">
                            <button type="submit"
                                class="rounded-full bg-[#07532b] px-6 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                :disabled="!reviewContent.trim()">
                                Gửi đánh giá
                            </button>
                        </div>
                    </form>

                    <!-- Danh sách đánh giá -->
                    <div v-if="reviews.length" class="mt-6 divide-y divide-slate-100">
                        <article v-for="review in reviews" :key="review.id" class="py-5">
                            <div class="flex gap-3">
                                <img v-if="review.user?.avatar" :src="review.user.avatar" :alt="review.user.name"
                                    class="size-10 rounded-full object-cover" />

                                <span v-else
                                    class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] font-bold text-[#07532b]">
                                    {{
                                        review.user?.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'U'
                                    }}
                                </span>

                                <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <strong class="text-sm text-slate-800">
                                            {{
                                                review.user?.name ||
                                                'Người dùng'
                                            }}
                                        </strong>

                                        <time class="text-[11px] text-slate-400">
                                            {{
                                                formatDate(
                                                    review.created_at,
                                                )
                                            }}
                                        </time>
                                    </div>

                                    <div class="mt-1 flex">
                                        <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-sm" :class="star <= review.rating
                                            ? 'text-[#ffc400]'
                                            : 'text-slate-200'
                                            " />
                                    </div>

                                    <p class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                        {{ review.content }}
                                    </p>

                                    <!-- Phản hồi -->
                                    <div v-if="review.replies?.length"
                                        class="mt-4 space-y-3 border-l-2 border-[#dce8df] pl-4">
                                        <div v-for="reply in review.replies" :key="reply.id"
                                            class="rounded-xl bg-[#f7faf8] p-4">
                                            <strong class="text-xs text-[#07532b]">
                                                {{
                                                    reply.user?.name ||
                                                    'NFarmHouse'
                                                }}
                                            </strong>

                                            <p class="mt-2 text-sm leading-6 text-slate-600">
                                                {{ reply.content }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div v-else
                        class="mt-6 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                        <Icon icon="mdi:comment-outline" class="mx-auto mb-2 text-4xl text-slate-300" />

                        Chưa có đánh giá nào. Hãy là người đầu
                        tiên đánh giá sản phẩm.
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>