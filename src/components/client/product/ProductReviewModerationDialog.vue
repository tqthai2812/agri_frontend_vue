<script setup>
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useProductReviewModeration } from "@/composables/useProductReviewModeration";

const props = defineProps({
    modelValue: Boolean,
    productId: { type: [Number, String], required: true },
    initialReviewId: { type: [Number, String], default: null },
});
const emit = defineEmits(["update:modelValue", "saved"]);
const authStore = useAuthStore();
const dialog = ref(null);
const canView = computed(() => authStore.isAuthenticated && authStore.hasPermission("review.view"));
const canReply = computed(() => canView.value && authStore.hasPermission("review.reply"));
const canModerate = computed(() => canView.value && authStore.hasPermission("review.moderate"));
const enabled = computed(() => props.modelValue && canView.value);
const scopeKey = computed(() => `${props.productId}:${authStore.user?.id || ""}`);
const {
    reviews, selected, selectedId, statusFilter, meta, loading, loadingDetail, saving,
    listError, detailError, actionError, message, denied, needsReload, draft, originalReply,
    dirty, locked, canSaveReply, fetchReviews, selectReview, setReviewStatus, setReplyStatus, saveReply,
} = useProductReviewModeration({
    productId: toRef(props, "productId"), enabled, scopeKey,
    initialReviewId: toRef(props, "initialReviewId"), canReply, canModerate,
    onSaved: (result) => emit("saved", result),
});

const statusLabel = (status) => ({ published: "Công khai", hidden: "Đã ẩn", pending: "Chờ duyệt" }[status] || status);
function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("vi-VN");
}
function allowDiscard() {
    return !dirty.value || window.confirm("Bạn có phản hồi chưa lưu. Bỏ phần đang soạn?");
}
function close() {
    if (!saving.value && allowDiscard()) emit("update:modelValue", false);
}
function chooseReview(id) {
    if (saving.value || (String(id) === String(selectedId.value) && selected.value)) return;
    if (allowDiscard()) selectReview(id);
}
function reloadDetail() {
    if (!saving.value && allowDiscard()) selectReview();
}
function moderate(status) {
    if (locked.value || !canModerate.value) return;
    if (status === "hidden" && !window.confirm("Ẩn đánh giá này và các phản hồi khỏi trang công khai?")) return;
    setReviewStatus(status);
}
function moderateReply(status) {
    if (locked.value || !canReply.value) return;
    if (status === "hidden" && !window.confirm("Ẩn phản hồi của cửa hàng khỏi trang công khai?")) return;
    setReplyStatus(status);
}
function pageTo(page) {
    if (!loading.value && !saving.value && page >= 1 && page <= meta.value.last_page) fetchReviews(page);
}
function backdrop(event) {
    if (event.target !== dialog.value) return;
    const rect = dialog.value.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
}
let dialogVersion = 0;
let disposed = false;
watch(enabled, async (open) => {
    const version = ++dialogVersion;
    await nextTick();
    if (disposed || version !== dialogVersion || !dialog.value) return;
    if (open && !dialog.value.open) dialog.value.showModal();
    else if (!open && dialog.value.open) dialog.value.close();
}, { immediate: true, flush: "post" });
onBeforeUnmount(() => { disposed = true; dialogVersion++; dialog.value?.close(); });
</script>

<template>
    <dialog ref="dialog" aria-label="Quản lý đánh giá của sản phẩm" @cancel.prevent="close" @click="backdrop"
        class="m-auto max-h-[92dvh] w-[92vw] max-w-5xl overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-black/50">
        <header
            class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div>
                <h2 class="text-lg font-bold text-[#123d27]">Quản lý đánh giá của sản phẩm</h2>
                <p class="mt-1 text-xs text-slate-500">Khu vực dành cho người có quyền quản lý. Điểm sao chỉ tính đánh
                    giá công khai.</p>
            </div>
            <button type="button" autofocus aria-label="Đóng quản lý đánh giá" :disabled="saving" @click="close"
                class="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40">
                <Icon icon="mdi:close" class="text-xl" />
            </button>
        </header>

        <div class="p-5 sm:p-6">
            <p v-if="message" role="status" class="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{{
                message }}</p>
            <p v-if="actionError" role="alert" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ actionError
            }}</p>
            <p v-if="saving" role="status" class="mb-4 flex items-center gap-2 text-xs text-[#07532b]">
                <Icon icon="mdi:loading" class="animate-spin" />Đang lưu thay đổi...
            </p>

            <div v-if="!denied" class="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                <aside class="min-w-0">
                    <label class="block text-xs font-semibold text-slate-600">
                        Trạng thái đánh giá
                        <select v-model="statusFilter" :disabled="saving" @change="fetchReviews(1)"
                            class="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:opacity-50">
                            <option value="">Tất cả trạng thái</option>
                            <option value="published">Công khai</option>
                            <option value="hidden">Đã ẩn</option>
                            <option value="pending">Chờ duyệt</option>
                        </select>
                    </label>
                    <p class="mt-3 text-xs text-slate-400">{{ meta.total }} đánh giá theo bộ lọc · chỉ sản phẩm này</p>
                    <p v-if="loading" role="status" class="py-6 text-center text-sm text-slate-500">Đang tải...</p>
                    <div v-else-if="listError" role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                        {{ listError }}
                        <button type="button" :disabled="saving" @click="fetchReviews(meta.current_page)"
                            class="mt-2 block font-bold underline disabled:opacity-50">Thử lại</button>
                    </div>
                    <p v-else-if="!reviews.length" class="py-6 text-sm text-slate-400">Không có đánh giá phù hợp.</p>
                    <div v-else class="mt-3 max-h-72 space-y-2 overflow-y-auto md:max-h-[50dvh]">
                        <button v-for="review in reviews" :key="review.id" type="button" :disabled="saving"
                            @click="chooseReview(review.id)" :aria-pressed="String(selectedId) === String(review.id)"
                            class="w-full rounded-xl border p-3 text-left disabled:opacity-50"
                            :class="String(selectedId) === String(review.id) ? 'border-[#07532b] bg-[#f0f7f2]' : 'border-slate-200 hover:bg-slate-50'">
                            <span class="block truncate text-xs font-bold">{{ review.author?.name || 'Khách hàng'
                            }}</span>
                            <span class="mt-1 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500"><span>{{
                                review.rating || '—' }}★</span><span>{{ statusLabel(review.status) }}</span></span>
                            <span class="mt-2 line-clamp-2 break-words text-xs leading-5 text-slate-600">{{
                                review.content }}</span>
                            <span class="mt-2 block text-[10px] text-[#07532b]">
                                {{ review.has_shop_reply ? 'Đã có phản hồi' : 'Chưa phản hồi' }}</span>
                        </button>
                    </div>
                    <nav v-if="!listError && meta.last_page > 1" aria-label="Phân trang quản lý đánh giá"
                        class="mt-4 flex items-center justify-between gap-2 text-xs">
                        <button type="button" :disabled="loading || saving || meta.current_page <= 1"
                            @click="pageTo(meta.current_page - 1)"
                            class="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button>
                        <span>{{ meta.current_page }} / {{ meta.last_page }}</span>
                        <button type="button" :disabled="loading || saving || meta.current_page >= meta.last_page"
                            @click="pageTo(meta.current_page + 1)"
                            class="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button>
                    </nav>
                </aside>

                <section class="min-w-0" aria-label="Chi tiết và phản hồi đánh giá">
                    <p v-if="loadingDetail" role="status" class="py-10 text-center text-sm text-slate-500">Đang tải chi
                        tiết...</p>
                    <div v-else-if="detailError" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {{ detailError }} <button type="button" @click="reloadDetail"
                            class="ml-2 font-bold underline">Thử lại</button>
                    </div>
                    <div v-else-if="selected" class="space-y-5">
                        <article class="rounded-2xl border border-slate-200 p-4">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <h3 class="text-sm font-bold">{{ selected.author?.name || 'Khách hàng' }}</h3>
                                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs">{{
                                    statusLabel(selected.status) }}</span>
                            </div>
                            <div class="mt-2 flex text-amber-400" :aria-label="`${selected.rating || 0} sao`">
                                <Icon v-for="star in 5" :key="star"
                                    :icon="star <= selected.rating ? 'mdi:star' : 'mdi:star-outline'" />
                            </div>
                            <p class="mt-2 text-xs text-slate-400">{{ formatDate(selected.created_at) }}<span
                                    v-if="selected.order"> · {{ selected.order.code }}</span></p>
                            <p class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{{
                                selected.content }}</p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <button v-if="canModerate && selected.status !== 'hidden'" type="button"
                                    :disabled="locked" @click="moderate('hidden')"
                                    class="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 disabled:opacity-40">Ẩn
                                    đánh giá</button>
                                <button v-if="canModerate && selected.status !== 'published'" type="button"
                                    :disabled="locked" @click="moderate('published')"
                                    class="rounded-full bg-[#07532b] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Công
                                    khai đánh giá</button>
                                <button type="button" :disabled="saving" @click="reloadDetail"
                                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 disabled:opacity-40">Tải
                                    lại chi tiết</button>
                            </div>
                            <p v-if="selected.status !== 'published'" class="mt-3 text-xs leading-5 text-amber-700">Đánh
                                giá này và các phản hồi bên dưới hiện không xuất hiện với khách hàng.</p>
                        </article>

                        <div v-if="needsReload" role="alert" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                            Dữ liệu đã thay đổi. Tải lại chi tiết trước khi tiếp tục; bản nháp đang được giữ để bạn có
                            thể sao chép.</div>

                        <section class="rounded-2xl bg-[#f6faf7] p-4" aria-label="Phản hồi của cửa hàng">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <h3 class="text-sm font-bold text-[#07532b]">Phản hồi của cửa hàng</h3>
                                <span v-if="selected.shop_reply" class="text-xs text-slate-500">{{
                                    statusLabel(selected.shop_reply.status) }}</span>
                            </div>
                            <p v-if="selected.shop_reply" class="mt-2 text-[11px] text-slate-400">{{
                                selected.shop_reply.author?.name || 'Cửa hàng' }} · {{
                                    formatDate(selected.shop_reply.updated_at) }}</p>
                            <form v-if="canReply && (originalReply || !selected.has_shop_reply || dirty)" class="mt-3"
                                @submit.prevent="saveReply">
                                <label class="block text-xs font-semibold text-slate-600">
                                    {{ originalReply ? 'Nội dung phản hồi' : 'Trả lời khách hàng' }}
                                    <textarea v-model="draft" rows="4" maxlength="1000"
                                        :disabled="saving || loadingDetail" required
                                        placeholder="Nhập phản hồi của cửa hàng..."
                                        class="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-[#07532b] disabled:opacity-50"></textarea>
                                </label>
                                <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <span class="text-[11px] text-slate-400">{{ Array.from(draft).length }} / 1000 ký
                                        tự<span v-if="dirty"> · Chưa lưu</span></span>
                                    <button type="submit" :disabled="!canSaveReply || !draft.trim()"
                                        class="rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">{{
                                            saving ? 'Đang lưu...' : originalReply ? 'Lưu phản hồi' : 'Gửi phản hồi'
                                        }}</button>
                                </div>
                                <p v-if="!originalReply && selected.status !== 'published'"
                                    class="mt-3 text-xs text-amber-700">Công khai đánh giá trước khi gửi phản hồi mới.
                                </p>
                            </form>
                            <p v-else-if="selected.shop_reply"
                                class="mt-3 whitespace-pre-line break-words text-sm leading-6">{{
                                    selected.shop_reply.content }}</p>
                            <p v-else class="mt-3 text-xs text-slate-500">
                                {{ selected.has_shop_reply ? 'Phản hồi cũ đã bị xóa.Không tạo thêm phản hồi trùng.' :
                                'Chưa có phản hồi của cửa hàng.' }}</p>
                            <div v-if="canReply && selected.shop_reply" class="mt-3 flex flex-wrap gap-2">
                                <button v-if="selected.shop_reply.status !== 'hidden'" type="button" :disabled="locked"
                                    @click="moderateReply('hidden')"
                                    class="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 disabled:opacity-40">Ẩn
                                    phản hồi</button>
                                <button v-if="selected.shop_reply.status !== 'published'" type="button"
                                    :disabled="locked" @click="moderateReply('published')"
                                    class="rounded-full border border-[#9dbba8] px-4 py-2 text-xs font-semibold text-[#07532b] disabled:opacity-40">Hiện
                                    phản hồi</button>
                            </div>
                        </section>

                        <div v-if="selected.other_replies?.length" class="space-y-3">
                            <h3 class="text-xs font-semibold text-slate-500">Phản hồi khác</h3>
                            <article v-for="reply in selected.other_replies" :key="reply.id"
                                class="rounded-xl border border-slate-200 p-3">
                                <p class="text-xs font-semibold">{{ reply.author?.name || 'Người dùng' }} · {{
                                    statusLabel(reply.status) }}</p>
                                <p class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{{
                                    reply.content }}</p>
                            </article>
                        </div>
                    </div>
                    <p v-else
                        class="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                        Chọn một đánh giá để xem và xử lý ngay tại đây.</p>
                </section>
            </div>
        </div>
    </dialog>
</template>