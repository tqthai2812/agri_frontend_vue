<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import ProductReviewService from "@/services/client/productReview.service";

const props = defineProps({
    modelValue: Boolean,
    orderId: { type: [Number, String], default: null },
});
const emit = defineEmits(["update:modelValue", "updated", "saved"]);

const dialog = ref(null);
const order = ref(null);
const drafts = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const errors = ref({});
const scoreLabels = ["Chọn số sao", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];
let loadVersion = 0;
let disposed = false;
let previousFocus = null;
let previousOverflow = null;

const completedReviews = computed(() => (order.value?.items || []).filter((item) => item.review));
const unavailableItems = computed(() => (order.value?.items || []).filter((item) => !item.review && !item.can_review));
const orderCode = computed(() => order.value?.order_code || `DH${String(props.orderId || "").padStart(6, "0")}`);

function fieldError(index, field) {
    const value = errors.value[`reviews.${index}.${field}`];
    return Array.isArray(value) ? value[0] : value || "";
}

function productName(item) {
    return item.product_name || item.product?.product_name || item.product?.name || "Sản phẩm";
}

function imageOf(item) {
    return item.product?.primary_image || item.package?.variant?.product?.primary_image || "";
}

function packageLabel(item) {
    const units = { l: "lít", piece: "cái" };
    const unit = item.unit ?? item.package?.unit;
    return [item.variant_name || item.variant?.name, `${item.size ?? item.package?.size ?? ""} ${units[unit] || unit || ""}`.trim()]
        .filter(Boolean).join(" · ");
}

function close() {
    if (!saving.value) emit("update:modelValue", false);
}

function restoreFocus() {
    if (previousOverflow !== null) {
        document.body.style.overflow = previousOverflow;
        previousOverflow = null;
    }
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
}

function onKeydown(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        close();
    }
    if (event.key !== "Tab") return;

    const elements = [...(dialog.value?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    ) || [])].filter((element) => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements[elements.length - 1];

    if (!first) {
        event.preventDefault();
        dialog.value?.focus();
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.value)) {
        event.preventDefault();
        first.focus();
    }
}

async function loadOrder(preserveDrafts = false) {
    if (saving.value) return;
    const version = ++loadVersion;
    const id = props.orderId;
    const previous = new Map(preserveDrafts ? drafts.value.map((draft) => [Number(draft.order_item_id), draft]) : []);
    loading.value = true;
    error.value = "";
    errors.value = {};

    try {
        const response = await ProductReviewService.getOrderReviews(id);
        if (disposed || version !== loadVersion || !props.modelValue) return;
        const value = response.data?.data;
        if (!value || Number(value.id) !== Number(id)) throw new Error("Không tải được thông tin đánh giá của đơn.");

        order.value = value;
        drafts.value = (value.items || []).filter((item) => item.can_review).map((item) => ({
            item,
            order_item_id: item.id,
            rating: previous.get(Number(item.id))?.rating || 0,
            content: previous.get(Number(item.id))?.content || "",
        }));
        emit("updated", value);
    } catch (err) {
        if (disposed || version !== loadVersion) return;
        error.value = err.response?.data?.message || err.message || "Không tải được danh sách sản phẩm cần đánh giá.";
    } finally {
        if (!disposed && version === loadVersion) loading.value = false;
    }
}

async function submit() {
    if (saving.value || loading.value || !drafts.value.length || !order.value?.can_review) return;
    error.value = "";
    errors.value = {};

    drafts.value.forEach((draft, index) => {
        if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
            errors.value[`reviews.${index}.rating`] = "Vui lòng chọn số sao.";
        }
        if (!draft.content.trim() || draft.content.trim().length > 1000) {
            errors.value[`reviews.${index}.content`] = "Vui lòng viết nhận xét từ 1 đến 1000 ký tự.";
        }
    });
    if (Object.keys(errors.value).length) {
        await nextTick();
        dialog.value?.querySelector('[aria-invalid="true"]')?.focus();
        return;
    }

    const id = order.value.id;
    const version = loadVersion;
    saving.value = true;

    try {
        const response = await ProductReviewService.submitOrderReviews(id, drafts.value.map((draft) => ({
            order_item_id: draft.order_item_id,
            rating: draft.rating,
            content: draft.content.trim(),
        })));
        if (disposed || version !== loadVersion) return;
        const value = response.data?.data;
        if (!value || Number(value.id) !== Number(id)) throw new Error("Chưa nhận được thông tin xác nhận. Hãy tải lại đánh giá để kiểm tra.");

        emit("updated", value);
        emit("saved", response.data?.message || "Đã gửi đánh giá thành công.");
        emit("update:modelValue", false);
    } catch (err) {
        if (disposed || version !== loadVersion) return;
        errors.value = err.response?.data?.errors || {};
        const first = Object.values(errors.value)[0];
        error.value = (Array.isArray(first) ? first[0] : first)
            || err.response?.data?.message
            || "Chưa nhận được xác nhận lưu. Bạn có thể gửi lại cùng nội dung; hệ thống không tạo đánh giá trùng.";
    } finally {
        if (!disposed && version === loadVersion) saving.value = false;
    }
}

watch(() => [props.modelValue, props.orderId], async ([open]) => {
    if (!open) {
        loadVersion++;
        restoreFocus();
        return;
    }
    order.value = null;
    drafts.value = [];
    saving.value = false;
    if (previousOverflow === null) {
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    await nextTick();
    if (disposed || !props.modelValue) return;
    dialog.value?.focus();
    await loadOrder();
}, { immediate: true });

onBeforeUnmount(() => {
    disposed = true;
    loadVersion++;
    restoreFocus();
});
</script>

<template>
    <Teleport to="body">
        <div v-if="modelValue" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
            @click.self="close">
            <section ref="dialog" role="dialog" aria-modal="true" aria-labelledby="order-review-title" tabindex="-1"
                class="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white text-slate-800 shadow-2xl outline-none"
                @keydown="onKeydown">
                <header class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div>
                        <h2 id="order-review-title" class="text-lg font-bold text-[#123d27]">Đánh giá sản phẩm</h2>
                        <p class="mt-1 text-xs text-slate-500">Đơn {{ orderCode }} · Chia sẻ trải nghiệm của bạn</p>
                    </div>
                    <button type="button" aria-label="Đóng" :disabled="saving"
                        class="rounded-full p-2 hover:bg-slate-100 disabled:opacity-40" @click="close">
                        <Icon icon="mdi:close" class="text-xl" />
                    </button>
                </header>

                <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
                    <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7" :aria-busy="loading || saving">
                        <div v-if="error" role="alert"
                            class="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                            {{ error }}
                            <button type="button" :disabled="loading || saving"
                                class="mt-2 block font-bold underline disabled:opacity-40" @click="loadOrder(true)">Tải
                                lại đánh giá</button>
                        </div>

                        <div v-if="loading" role="status" class="py-12 text-center text-sm text-slate-500">
                            <Icon icon="mdi:loading" class="mx-auto mb-3 animate-spin text-4xl text-[#07532b]" />
                            Đang tải sản phẩm...
                        </div>

                        <template v-else-if="order">
                            <p v-if="drafts.length" class="mb-5 text-sm leading-6 text-slate-500">
                                Chọn số sao và viết nhận xét cho từng sản phẩm bên dưới, sau đó gửi cùng một lượt.
                            </p>
                            <p v-else-if="order.order_status !== 'completed'"
                                class="mb-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                                Bạn có thể đánh giá sau khi đơn hàng hoàn thành.
                            </p>
                            <p v-else-if="completedReviews.length && !unavailableItems.length"
                                class="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                                Bạn đã đánh giá tất cả sản phẩm trong đơn này. Cảm ơn bạn!
                            </p>

                            <fieldset :disabled="saving" class="space-y-5">
                                <article v-for="(draft, index) in drafts" :key="draft.order_item_id"
                                    class="rounded-2xl border border-slate-200 p-4 sm:p-5">
                                    <div class="flex gap-3">
                                        <img v-if="imageOf(draft.item)" :src="imageOf(draft.item)"
                                            :alt="productName(draft.item)"
                                            class="size-16 rounded-xl bg-slate-50 object-contain" />
                                        <span v-else
                                            class="grid size-16 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-300">
                                            <Icon icon="mdi:image-off-outline" class="text-3xl" />
                                        </span>
                                        <div>
                                            <h3 class="text-sm font-bold text-[#123d27]">{{ productName(draft.item) }}
                                            </h3>
                                            <p class="mt-1 text-xs text-slate-400">{{ packageLabel(draft.item) }} · × {{
                                                draft.item.quantity }}</p>
                                        </div>
                                    </div>

                                    <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <span class="text-xs font-semibold text-slate-600">Chất lượng sản phẩm</span>
                                        <div class="flex gap-1" role="group"
                                            :aria-label="`Số sao cho ${productName(draft.item)}`">
                                            <button v-for="star in 5" :key="star" type="button"
                                                :aria-label="`${star} sao`" :aria-pressed="draft.rating === star"
                                                :aria-invalid="Boolean(fieldError(index, 'rating'))"
                                                class="rounded p-1 text-3xl focus-visible:outline-2 focus-visible:outline-[#07532b]"
                                                @click="draft.rating = star; delete errors[`reviews.${index}.rating`]">
                                                <Icon :icon="star <= draft.rating ? 'mdi:star' : 'mdi:star-outline'"
                                                    :class="star <= draft.rating ? 'text-[#efb51c]' : 'text-slate-300'" />
                                            </button>
                                        </div>
                                        <span class="text-xs text-[#a77d00]">{{ scoreLabels[draft.rating] }}</span>
                                    </div>
                                    <p v-if="fieldError(index, 'rating')" class="mt-1 text-xs text-red-600">{{
                                        fieldError(index, 'rating') }}</p>

                                    <label :for="`review-content-${draft.order_item_id}`"
                                        class="mt-4 block text-xs font-semibold text-slate-600">Nhận xét của bạn</label>
                                    <textarea :id="`review-content-${draft.order_item_id}`" v-model="draft.content"
                                        rows="3" maxlength="1000" :aria-invalid="Boolean(fieldError(index, 'content'))"
                                        :aria-describedby="`review-error-${draft.order_item_id}`"
                                        class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#07532b] focus:ring-2 focus:ring-[#07532b]/10"
                                        placeholder="Sản phẩm có phù hợp với nhu cầu của bạn không?"
                                        @input="delete errors[`reviews.${index}.content`]"></textarea>
                                    <div class="mt-1 flex justify-between gap-3 text-xs">
                                        <span :id="`review-error-${draft.order_item_id}`" class="text-red-600">{{
                                            fieldError(index, 'content') || fieldError(index, 'order_item_id') }}</span>
                                        <span class="shrink-0 text-slate-400">{{ draft.content.length }}/1000</span>
                                    </div>
                                </article>
                            </fieldset>

                            <div v-if="completedReviews.length" :class="drafts.length ? 'mt-7' : ''">
                                <h3 class="mb-3 text-sm font-bold text-[#123d27]">Đánh giá đã gửi</h3>
                                <article v-for="item in completedReviews" :key="item.id"
                                    class="mb-3 rounded-2xl border border-slate-100 bg-[#f7faf8] p-4">
                                    <div class="flex flex-wrap justify-between gap-2">
                                        <strong class="text-sm text-[#123d27]">{{ productName(item) }}</strong>
                                        <span class="text-xs text-slate-500">{{ item.review.status_label }}</span>
                                    </div>
                                    <p class="mt-1 text-xs text-slate-400">{{ packageLabel(item) }}</p>
                                    <div v-if="item.review.rating" class="mt-2 flex">
                                        <Icon v-for="star in 5" :key="star" icon="mdi:star"
                                            :class="star <= item.review.rating ? 'text-[#efb51c]' : 'text-slate-200'" />
                                    </div>
                                    <p v-if="item.review.content"
                                        class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{{
                                            item.review.content }}</p>
                                </article>
                            </div>

                            <div v-if="unavailableItems.length && order.order_status === 'completed'"
                                class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                                <p v-for="item in unavailableItems" :key="item.id">{{ productName(item) }}: hiện không
                                    đủ thông tin để đánh giá.</p>
                            </div>
                        </template>
                    </div>

                    <footer class="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-7">
                        <button type="button" :disabled="saving"
                            class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
                            @click="close">Đóng</button>
                        <button v-if="drafts.length" type="submit" :disabled="saving || loading"
                            class="inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                            <Icon :icon="saving ? 'mdi:loading' : 'mdi:send-outline'"
                                :class="saving ? 'animate-spin' : ''" />
                            {{ saving ? "Đang gửi..." : `Gửi ${drafts.length} đánh giá` }}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    </Teleport>
</template>