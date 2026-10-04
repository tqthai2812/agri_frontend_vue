<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import ProductReviews from "@/components/client/product/ProductReviews.vue";

const props = defineProps({ product: { type: Object, required: true } });
defineEmits(["review-summary"]);
const activeTab = ref("details");
const tabs = computed(() => [
    { id: "details", label: "Chi tiết sản phẩm", icon: "mdi:file-document-outline" },
    { id: "instructions", label: "Hướng dẫn & an toàn", icon: "mdi:book-open-page-variant-outline" },
    { id: "reviews", label: `Đánh giá (${Number(props.product.review_count || 0)})`, icon: "mdi:comment-text-outline" },
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

watch(() => props.product.id, () => { activeTab.value = "details"; });
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

            <ProductReviews v-else :product-id="product.id" @summary="$emit('review-summary', $event)" />
        </div>
    </section>
</template>