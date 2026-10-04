<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useAdminProductReviewStore } from "@/stores/admin/productReviewStore";

const store = useAdminProductReviewStore();
const auth = useAuthStore();
const dialog = ref(null);
const productSearch = ref("");
const chosenProduct = ref(null);
const replyDraft = ref("");
const originalReply = ref(null);
let searchTimer;
let productTimer;
let disposed = false;

const canModerate = computed(() => auth.hasPermission("review.moderate"));
const canReply = computed(() => auth.hasPermission("review.reply"));
const locked = computed(() => store.saving || store.loadingDetail || store.needsReload);
const review = computed(() => store.selectedReview);
const dirty = computed(() => replyDraft.value.trim() !== (originalReply.value?.content || ""));
const canEditReply = computed(() => canReply.value && review.value && (
    review.value.shop_reply || (!review.value.has_shop_reply && review.value.status === "published")
));
const productOptions = computed(() => {
    const options = [...store.products];
    if (chosenProduct.value && !options.some((p) => Number(p.id) === Number(chosenProduct.value.id))) {
        options.unshift(chosenProduct.value);
    }
    return options;
});
const pages = computed(() => {
    const start = Math.max(1, store.meta.current_page - 2);
    const end = Math.min(store.meta.last_page, store.meta.current_page + 2);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
});

function statusLabel(value) { return { published: "Công khai", hidden: "Đã ẩn", pending: "Chờ duyệt" }[value] || value; }
function statusClass(value) {
    return { published: "bg-green-50 text-green-700", hidden: "bg-red-50 text-red-600", pending: "bg-amber-50 text-amber-700" }[value] || "bg-slate-100 text-slate-600";
}
function date(value) {
    const parsed = new Date(value);
    return value && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString("vi-VN") : "—";
}
function packageLabel(purchase) {
    return purchase ? [purchase.variant_name, `${purchase.size ?? ""} ${purchase.unit || ""}`.trim()].filter(Boolean).join(" · ") : "";
}
function search() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(filterChanged, 350);
}
function searchProducts() {
    clearTimeout(productTimer);
    productTimer = setTimeout(() => store.fetchProducts(productSearch.value.trim()), 350);
}
function filterChanged() {
    clearTimeout(searchTimer);
    store.filters.page = 1;
    store.fetchReviews();
}
function productChanged() {
    chosenProduct.value = productOptions.value.find((p) => Number(p.id) === Number(store.filters.product_id)) || null;
    filterChanged();
}
function resetFilters() {
    clearTimeout(searchTimer); clearTimeout(productTimer);
    store.resetFilters(); productSearch.value = ""; chosenProduct.value = null;
    store.fetchReviews(); store.fetchProducts();
}
function reloadList() { clearTimeout(searchTimer); store.fetchReviews(); }
function pageChanged(page) {
    if (store.loading || store.saving || page < 1 || page > store.meta.last_page) return;
    clearTimeout(searchTimer); store.filters.page = page; store.fetchReviews();
}
function syncDraft() {
    originalReply.value = review.value?.shop_reply ? { ...review.value.shop_reply } : null;
    replyDraft.value = originalReply.value?.content || "";
}
function closeDetail() {
    if (store.saving) return;
    if (dirty.value && !window.confirm("Đóng chi tiết và bỏ nội dung phản hồi chưa lưu?")) return;
    store.closeDetail();
}
async function reloadDetail() {
    if (dirty.value && !window.confirm("Tải lại sẽ bỏ nội dung phản hồi chưa lưu. Tiếp tục?")) return;
    if (await store.fetchDetail()) syncDraft();
}
async function saveReply() {
    if (locked.value || !canEditReply.value) return;
    const ok = await store.saveReply(replyDraft.value, originalReply.value);
    if (ok && !disposed) syncDraft();
}
async function changeStatus(status) {
    if (locked.value || !canModerate.value) return;
    if (status === "hidden" && !window.confirm("Ẩn đánh giá này? Đánh giá và phản hồi sẽ không xuất hiện công khai.")) return;
    await store.setReviewStatus(status);
}
async function changeReplyStatus(status) {
    if (locked.value || !canReply.value) return;
    const hadDraft = dirty.value;
    const ok = await store.setReplyStatus(status);
    if (ok && !hadDraft && !disposed) syncDraft();
}

watch(() => store.selectedReview?.id, (id, oldId) => { if (id !== oldId) syncDraft(); });
watch(() => store.showDetail, async (open) => {
    await nextTick();
    if (disposed || !dialog.value) return;
    if (open && !dialog.value.open) dialog.value.showModal();
    if (!open && dialog.value.open) dialog.value.close();
});
onMounted(() => { store.fetchReviews(); store.fetchProducts(); });
onBeforeUnmount(() => {
    disposed = true; clearTimeout(searchTimer); clearTimeout(productTimer);
    dialog.value?.close(); store.disposeRequests();
});
</script>

<template>
    <div>
        <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold">Quản lý đánh giá</h1>
                <p class="mt-1 text-sm text-text-light">Theo dõi nhận xét và phản hồi khách hàng.</p>
            </div>
            <button type="button" class="btn-outline-sm" :disabled="store.loading || store.saving" @click="reloadList">
                <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />Tải lại
            </button>
        </header>

        <div class="mb-2 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div v-for="card in [
                ['total', 'Tổng đánh giá'], ['published', 'Công khai'], ['hidden', 'Đã ẩn'],
                ['pending', 'Chờ duyệt'], ['unanswered', 'Chưa trả lời'],
            ]" :key="card[0]" class="rounded-2xl border border-border bg-surface p-4">
                <div class="text-xs text-text-light">{{ card[1] }}</div>
                <strong class="mt-1 block text-2xl">{{ store.summary[card[0]] }}</strong>
            </div>
        </div>
        <p class="mb-5 text-xs text-text-light">Thống kê theo bộ lọc hiện tại. Phản hồi đã ẩn vẫn được tính là đã trả
            lời.</p>

        <p v-if="store.message" role="status" class="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{{
            store.message }}</p>
        <p v-if="store.listError" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{{
            store.listError }}</p>

        <section class="rounded-2xl border border-border bg-surface p-5">
            <div class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label class="block text-xs font-semibold">Tìm đánh giá
                    <input v-model.trim="store.filters.search" maxlength="255" class="form-control mt-1 w-full"
                        placeholder="Nội dung, sản phẩm, tên hoặc email khách" :disabled="store.saving"
                        @input="search" />
                </label>
                <label class="block text-xs font-semibold">Tìm sản phẩm để lọc
                    <input v-model="productSearch" maxlength="255" class="form-control mt-1 w-full"
                        placeholder="Nhập tên sản phẩm..." :disabled="store.saving" @input="searchProducts" />
                </label>
                <label class="block text-xs font-semibold">Sản phẩm
                    <select v-model="store.filters.product_id" class="form-control mt-1 w-full"
                        :disabled="store.saving || store.loadingProducts" @change="productChanged">
                        <option value="">Tất cả sản phẩm</option>
                        <option v-for="product in productOptions" :key="product.id" :value="product.id">{{
                            product.product_name }}</option>
                    </select>
                </label>
                <label class="block text-xs font-semibold">Số sao
                    <select v-model="store.filters.rating" class="form-control mt-1 w-full" :disabled="store.saving"
                        @change="filterChanged">
                        <option value="">Tất cả số sao</option>
                        <option v-for="star in 5" :key="star" :value="star">{{ star }} sao</option>
                    </select>
                </label>
                <label class="block text-xs font-semibold">Trạng thái
                    <select v-model="store.filters.status" class="form-control mt-1 w-full" :disabled="store.saving"
                        @change="filterChanged">
                        <option value="">Tất cả trạng thái</option>
                        <option value="published">Công khai</option>
                        <option value="hidden">Đã ẩn</option>
                        <option value="pending">Chờ duyệt</option>
                    </select>
                </label>
                <label class="block text-xs font-semibold">Phản hồi của cửa hàng
                    <select v-model="store.filters.reply_status" class="form-control mt-1 w-full"
                        :disabled="store.saving" @change="filterChanged">
                        <option value="">Tất cả</option>
                        <option value="unanswered">Chưa trả lời</option>
                        <option value="answered">Đã trả lời</option>
                    </select>
                </label>
            </div>
            <p v-if="store.productError" role="alert" class="mb-3 text-sm text-red-600">{{ store.productError }}</p>
            <div class="mb-4 flex items-center justify-between gap-3">
                <p class="text-xs text-text-light">Tối đa 20 kết quả gợi ý sản phẩm; nhập tên để tìm thêm.</p>
                <button type="button" class="btn-outline-sm" :disabled="store.saving" @click="resetFilters">Xóa
                    lọc</button>
            </div>
            <div v-if="store.loading" class="py-12 text-center text-text-light" role="status">
                <Icon icon="solar:refresh-bold" class="mx-auto mb-3 animate-spin text-3xl" />Đang tải đánh giá...
            </div>
            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[960px] text-sm">
                    <thead>
                        <tr class="border-b border-border text-left text-xs text-text-light">
                            <th class="p-3">Sản phẩm / Đơn mua</th>
                            <th class="p-3">Người đánh giá</th>
                            <th class="p-3">Nội dung</th>
                            <th class="p-3">Trạng thái</th>
                            <th class="p-3">Phản hồi</th>
                            <th class="p-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in store.reviews" :key="row.id" class="border-b border-border align-top">
                            <td class="p-3"><strong>{{ row.product?.name || 'Sản phẩm không còn tồn tại' }}</strong>
                                <p class="mt-1 text-xs text-text-light">{{ packageLabel(row.purchase) }}</p>
                                <p class="mt-2 text-xs">{{ row.order?.code || 'Đánh giá cũ chưa liên kết đơn' }}</p>
                            </td>
                            <td class="p-3">
                                <p>{{ row.author?.name || 'Tài khoản không còn tồn tại' }}</p>
                                <p class="mt-1 text-xs text-text-light">{{ row.author?.email }}</p>
                                <p class="mt-2 text-xs text-text-light">{{ date(row.created_at) }}</p>
                            </td>
                            <td class="max-w-xs p-3">
                                <p class="font-semibold text-amber-600">{{ row.rating ?? '—' }} / 5 ★</p>
                                <p class="mt-2 line-clamp-3 whitespace-pre-line break-words">{{ row.content }}</p>
                            </td>
                            <td class="p-3"><span class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs"
                                    :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                            <td class="p-3 text-xs"><span>{{ row.has_shop_reply ? 'Đã trả lời' : 'Chưa trả lời'
                            }}</span>
                                <p v-if="row.shop_reply" class="mt-2 text-text-light">{{
                                    statusLabel(row.shop_reply.status) }}</p>
                            </td>
                            <td class="p-3"><button type="button"
                                    class="font-semibold text-primary hover:underline disabled:opacity-50"
                                    :disabled="store.saving" @click="store.openDetail(row)">Xem chi tiết</button></td>
                        </tr>
                        <tr v-if="!store.reviews.length">
                            <td colspan="6" class="p-10 text-center text-text-light">Không có đánh giá phù hợp.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span class="text-xs text-text-light">{{ store.meta.total }} đánh giá · Trang {{ store.meta.current_page
                }} / {{ store.meta.last_page }}</span>
                <nav class="flex gap-2" aria-label="Phân trang đánh giá">
                    <button class="page-btn" :disabled="store.loading || store.saving || store.meta.current_page <= 1"
                        @click="pageChanged(store.meta.current_page - 1)">‹</button>
                    <button v-for="page in pages" :key="page" class="page-btn"
                        :class="{ active: page === store.meta.current_page }" :disabled="store.loading || store.saving"
                        @click="pageChanged(page)">{{ page }}</button>
                    <button class="page-btn"
                        :disabled="store.loading || store.saving || store.meta.current_page >= store.meta.last_page"
                        @click="pageChanged(store.meta.current_page + 1)">›</button>
                </nav>
            </div>
        </section>

        <dialog ref="dialog" aria-labelledby="review-title"
            class="m-auto max-h-[90vh] w-[min(760px,94vw)] overflow-y-auto rounded-2xl bg-surface p-0 text-text shadow-xl backdrop:bg-black/50"
            @cancel.prevent="closeDetail">
            <header
                class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5">
                <h2 id="review-title" class="text-lg font-bold">Chi tiết đánh giá #{{ store.detailId }}</h2>
                <button type="button" aria-label="Đóng chi tiết" class="btn-outline-icon" :disabled="store.saving"
                    @click="closeDetail">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </header>
            <div class="space-y-5 p-5">
                <p v-if="store.loadingDetail" role="status" class="py-10 text-center">Đang tải chi tiết...</p>
                <div v-else-if="store.detailError" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                    {{ store.detailError }}<button type="button" class="ml-3 underline" @click="reloadDetail">Thử
                        lại</button>
                </div>
                <template v-else-if="review">
                    <p v-if="store.message" role="status" class="rounded-xl bg-green-50 p-3 text-sm text-green-700">{{
                        store.message }}</p>
                    <div v-if="store.actionError" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                        {{ store.actionError }}
                        <button type="button" class="ml-2 underline" :disabled="store.saving" @click="reloadDetail">Tải
                            lại chi tiết</button>
                    </div>
                    <div>
                        <RouterLink v-if="review.product"
                            :to="{ name: 'client-product-detail', params: { id: review.product.id } }" target="_blank"
                            class="font-bold text-primary">{{ review.product.name }}</RouterLink>
                        <strong v-else>Sản phẩm không còn tồn tại</strong>
                        <p class="mt-1 text-xs text-text-light">{{ packageLabel(review.purchase) }}</p>
                        <p class="mt-2 text-sm">{{ review.author?.name || 'Tài khoản không còn tồn tại' }} · {{
                            review.author?.email }}</p>
                        <p class="mt-1 text-xs text-text-light">{{ date(review.created_at) }} · {{ review.order?.code ||
                            'Chưa liên kết đơn hàng' }}</p>
                    </div>
                    <div class="rounded-xl border border-border p-4">
                        <div class="flex items-center justify-between gap-3">
                            <strong class="text-amber-600">{{ review.rating ?? '—' }} / 5 ★</strong>
                            <span class="rounded-full px-3 py-1 text-xs" :class="statusClass(review.status)">{{
                                statusLabel(review.status) }}</span>
                        </div>
                        <p class="mt-3 whitespace-pre-line break-words text-sm leading-6">{{ review.content }}</p>
                    </div>
                    <div v-if="canModerate" class="flex flex-wrap gap-3">
                        <button v-if="review.status !== 'published'" type="button" class="btn-primary"
                            :disabled="locked" @click="changeStatus('published')">Công khai đánh giá</button>
                        <button v-if="review.status !== 'hidden'" type="button" class="btn-outline text-red-600"
                            :disabled="locked" @click="changeStatus('hidden')">Ẩn đánh giá</button>
                    </div>

                    <section class="space-y-3 border-t border-border pt-5">
                        <h3 class="font-bold">Phản hồi của cửa hàng</h3>
                        <p v-if="review.status !== 'published'"
                            class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Đánh giá đang {{
                                statusLabel(review.status).toLowerCase() }}. Khách chưa xem được đánh giá và phản hồi này
                            trên trang sản phẩm.</p>
                        <div v-if="review.shop_reply" class="rounded-xl border border-border p-4">
                            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <strong>{{ review.shop_reply.author?.name || 'Cửa hàng' }}</strong>
                                <span class="rounded-full px-2 py-1" :class="statusClass(review.shop_reply.status)">{{
                                    statusLabel(review.shop_reply.status) }}</span>
                            </div>
                            <p class="mt-2 whitespace-pre-line break-words text-sm leading-6">{{
                                review.shop_reply.content }}</p>
                            <p class="mt-2 text-xs text-text-light">Tạo: {{ date(review.shop_reply.created_at) }} · Cập
                                nhật: {{ date(review.shop_reply.updated_at) }}</p>
                        </div>
                        <p v-else-if="review.has_shop_reply" class="text-sm text-text-light">Phản hồi đã bị xóa mềm.
                            Không tạo thêm phản hồi trùng.</p>
                        <p v-else class="text-sm text-text-light">Cửa hàng chưa trả lời đánh giá này.</p>

                        <form v-if="canEditReply" class="space-y-3" @submit.prevent="saveReply">
                            <label for="shop-reply-content" class="block text-sm font-semibold">{{ review.shop_reply ?
                                'Sửa nội dung phản hồi' : 'Nội dung phản hồi' }}</label>
                            <textarea id="shop-reply-content" v-model="replyDraft" rows="5" maxlength="1000" required
                                class="form-control w-full" :disabled="locked"
                                placeholder="Nhập phản hồi của cửa hàng..."></textarea>
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <span class="text-xs text-text-light">{{ [...replyDraft].length }} / 1000 ký tự</span>
                                <button type="submit" class="btn-primary disabled:opacity-50"
                                    :disabled="locked || !replyDraft.trim() || (!!review.shop_reply && !dirty)">
                                    {{ store.saving ? 'Đang lưu...' : review.shop_reply ?
                                        'Lưu nội dung' : 'Gửi phảnhồi' }}
                                </button>
                            </div>
                            <p v-if="review.shop_reply?.status === 'hidden'" class="text-xs text-text-light">Lưu nội
                                dung vẫn giữ phản hồi ở trạng thái ẩn.</p>
                        </form>
                        <div v-if="canReply && review.shop_reply" class="flex gap-3">
                            <button v-if="review.shop_reply.status !== 'hidden'" type="button"
                                class="btn-outline text-red-600" :disabled="locked"
                                @click="changeReplyStatus('hidden')">Ẩn phản hồi</button>
                            <button v-if="review.shop_reply.status !== 'published'" type="button" class="btn-outline"
                                :disabled="locked" @click="changeReplyStatus('published')">Hiện phản hồi</button>
                        </div>
                    </section>

                    <section v-if="review.other_replies?.length" class="space-y-3 border-t border-border pt-4">
                        <h3 class="text-sm font-semibold">Phản hồi khác từ dữ liệu trước đây</h3>
                        <div v-for="reply in review.other_replies" :key="reply.id"
                            class="rounded-lg border border-border p-3 text-sm">
                            <strong>{{ reply.author?.name || 'Người dùng' }}</strong> · {{ statusLabel(reply.status) }}
                            <p class="mt-2 whitespace-pre-line break-words">{{ reply.content }}</p>
                        </div>
                    </section>
                </template>
            </div>
            <footer class="flex justify-end border-t border-border p-5"><button type="button" class="btn-outline"
                    :disabled="store.saving" @click="closeDetail">Đóng</button></footer>
        </dialog>
    </div>
</template>