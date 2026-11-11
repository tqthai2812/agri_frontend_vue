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
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Quản lý đánh giá</h1>
        <p class="text-sm text-text-light">{{ store.meta.total }} đánh giá phù hợp bộ lọc</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="store.loading || store.saving" @click="reloadList">
          <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
          Tải lại
        </button>
      </div>
    </header>

    <div class="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <div v-for="card in [
        ['total', 'Tổng đánh giá'], ['published', 'Công khai'], ['hidden', 'Đã ẩn'],
        ['pending', 'Chờ duyệt'], ['unanswered', 'Chưa trả lời'],
      ]" :key="card[0]" class="rounded-2xl border-l-4 bg-surface p-4 shadow-sm"
        :class="{
          'border-l-info': card[0] === 'total',
          'border-l-success': card[0] === 'published',
          'border-l-danger': card[0] === 'hidden',
          'border-l-warning': card[0] === 'pending',
          'border-l-primary': card[0] === 'unanswered',
        }">
        <div class="text-xs font-medium text-text-light">{{ card[1] }}</div>
        <strong class="mt-1 block font-mono text-2xl font-bold"
          :class="{
            'text-info': card[0] === 'total',
            'text-success': card[0] === 'published',
            'text-danger': card[0] === 'hidden',
            'text-primary': card[0] === 'unanswered',
          }">{{ store.summary[card[0]] }}</strong>
      </div>
    </div>
    <p class="mb-6 text-xs leading-5 text-text-light">
      Thống kê theo bộ lọc hiện tại. Phản hồi đã ẩn vẫn được tính là đã trả lời.
    </p>

    <div v-if="store.message" role="status"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
      <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.message }}</span>
    </div>
    <div v-if="store.listError" role="alert"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ store.listError }}</span>
    </div>

    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap gap-3">
        <label class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span class="sr-only">Tìm đánh giá</span>
          <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" />
          <input v-model.trim="store.filters.search" type="search" maxlength="255"
            class="w-full bg-transparent text-sm outline-none" aria-label="Tìm đánh giá"
            placeholder="Nội dung, sản phẩm, tên hoặc email khách" :disabled="store.saving" @input="search" />
        </label>
        <label class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span class="sr-only">Tìm sản phẩm để lọc</span>
          <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" />
          <input v-model="productSearch" type="search" maxlength="255"
            class="w-full bg-transparent text-sm outline-none" aria-label="Tìm sản phẩm để lọc"
            placeholder="Nhập tên sản phẩm để lọc..." :disabled="store.saving" @input="searchProducts" />
        </label>
        <label class="contents">
          <span class="sr-only">Sản phẩm</span>
          <select v-model="store.filters.product_id"
            class="filter-select min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none sm:max-w-[260px]"
            aria-label="Sản phẩm" :disabled="store.saving || store.loadingProducts" @change="productChanged">
            <option value="">Tất cả sản phẩm</option>
            <option v-for="product in productOptions" :key="product.id" :value="product.id">
              {{ product.product_name }}
            </option>
          </select>
        </label>
        <label class="contents">
          <span class="sr-only">Số sao</span>
          <select v-model="store.filters.rating"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none"
            aria-label="Số sao" :disabled="store.saving" @change="filterChanged">
            <option value="">Tất cả số sao</option>
            <option v-for="star in 5" :key="star" :value="star">{{ star }} sao</option>
          </select>
        </label>
        <label class="contents">
          <span class="sr-only">Trạng thái</span>
          <select v-model="store.filters.status"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none"
            aria-label="Trạng thái" :disabled="store.saving" @change="filterChanged">
            <option value="">Tất cả trạng thái</option>
            <option value="published">Công khai</option>
            <option value="hidden">Đã ẩn</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </label>
        <label class="contents">
          <span class="sr-only">Phản hồi của cửa hàng</span>
          <select v-model="store.filters.reply_status"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none"
            aria-label="Phản hồi của cửa hàng" :disabled="store.saving" @change="filterChanged">
            <option value="">Tất cả phản hồi</option>
            <option value="unanswered">Chưa trả lời</option>
            <option value="answered">Đã trả lời</option>
          </select>
        </label>
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="store.saving" @click="resetFilters">
          <Icon icon="solar:restart-bold" />
          Xóa lọc
        </button>
      </div>
      <p v-if="store.productError" role="alert"
        class="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ store.productError }}
      </p>
      <p class="mb-5 text-xs text-text-light">Tối đa 20 kết quả gợi ý sản phẩm; nhập tên để tìm thêm.</p>

      <div v-if="store.loading" class="py-10 text-center text-text-light" role="status">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        <p class="text-sm">Đang tải đánh giá...</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Sản phẩm / Đơn mua</th>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Người đánh giá</th>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Nội dung</th>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Trạng thái</th>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Phản hồi</th>
              <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.reviews" :key="row.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3 text-sm">
                <div class="flex items-center gap-3">
                  <span class="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-bg">
                    <Icon icon="solar:chat-round-line-bold-duotone" class="text-2xl text-primary" />
                  </span>
                  <div class="min-w-0 max-w-[240px]">
                    <strong class="block text-sm font-semibold">{{ row.product?.name || 'Sản phẩm không còn tồn tại' }}</strong>
                    <p class="mt-1 text-xs text-text-light">{{ packageLabel(row.purchase) }}</p>
                    <p class="mt-2 font-mono text-xs">{{ row.order?.code || 'Đánh giá cũ chưa liên kết đơn' }}</p>
                  </div>
                </div>
              </td>
              <td class="p-3 text-sm">
                <p class="font-semibold">{{ row.author?.name || 'Tài khoản không còn tồn tại' }}</p>
                <p class="mt-1 text-xs text-text-light">{{ row.author?.email }}</p>
                <p class="mt-2 text-xs text-text-light">{{ date(row.created_at) }}</p>
              </td>
              <td class="max-w-xs p-3 text-sm">
                <p class="flex items-center gap-1 font-mono font-semibold text-amber-600">
                  {{ row.rating ?? '—' }} / 5 <Icon icon="solar:star-bold" aria-hidden="true" />
                </p>
                <p class="mt-2 line-clamp-3 whitespace-pre-line break-words">{{ row.content }}</p>
              </td>
              <td class="p-3 text-sm">
                <span class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(row.status)">
                  {{ statusLabel(row.status) }}
                </span>
              </td>
              <td class="p-3 text-sm">
                <span>{{ row.has_shop_reply ? 'Đã trả lời' : 'Chưa trả lời' }}</span>
                <p v-if="row.shop_reply" class="mt-2 text-xs text-text-light">{{ statusLabel(row.shop_reply.status) }}</p>
              </td>
              <td class="p-3">
                <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                  title="Xem chi tiết đánh giá" aria-label="Xem chi tiết đánh giá"
                  :disabled="store.saving" @click="store.openDetail(row)">
                  <Icon icon="solar:eye-bold" />
                </button>
              </td>
            </tr>
            <tr v-if="!store.reviews.length">
              <td colspan="6" class="p-8 text-center text-sm text-text-light">Không có đánh giá phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">
          Hiển thị {{ store.reviews.length }} / {{ store.meta.total }} đánh giá
        </span>
        <nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang đánh giá">
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang trước"
            :disabled="store.loading || store.saving || store.meta.current_page <= 1"
            @click="pageChanged(store.meta.current_page - 1)">
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button v-for="page in pages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed"
            :class="{ active: page === store.meta.current_page }" :aria-current="page === store.meta.current_page ? 'page' : undefined"
            :disabled="store.loading || store.saving" @click="pageChanged(page)">
            {{ page }}
          </button>
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sau"
            :disabled="store.loading || store.saving || store.meta.current_page >= store.meta.last_page"
            @click="pageChanged(store.meta.current_page + 1)">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </nav>
      </div>
    </section>

    <Teleport to="body">
      <dialog ref="dialog" aria-labelledby="review-title"
        class="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
        @cancel.prevent="closeDetail">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
          <div>
            <h2 id="review-title" class="text-xl font-bold">Chi tiết đánh giá #{{ store.detailId }}</h2>
            <p class="mt-1 text-sm text-text-light">Xem nhận xét, duyệt hiển thị và phản hồi khách hàng.</p>
          </div>
          <button type="button" aria-label="Đóng chi tiết" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
            :disabled="store.saving" @click="closeDetail">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </header>

        <div class="space-y-6 p-5 sm:p-6">
          <div v-if="store.loadingDetail" role="status" class="py-10 text-center text-text-light">
            <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
            <p class="text-sm">Đang tải chi tiết...</p>
          </div>
          <div v-else-if="store.detailError" role="alert"
            class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {{ store.detailError }}
            <button type="button" class="ml-3 cursor-pointer font-semibold underline disabled:cursor-not-allowed" @click="reloadDetail">
              Thử lại
            </button>
          </div>
          <template v-else-if="review">
            <div v-if="store.message" role="status"
              class="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
              <span>{{ store.message }}</span>
            </div>
            <div v-if="store.actionError" role="alert"
              class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ store.actionError }}
              <button type="button" class="ml-2 cursor-pointer font-semibold underline disabled:cursor-not-allowed"
                :disabled="store.saving" @click="reloadDetail">Tải lại chi tiết</button>
            </div>

            <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 class="mb-4 text-lg font-bold">Thông tin đánh giá</h3>
              <div class="flex items-start gap-3">
                <span class="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-bg">
                  <Icon icon="solar:chat-round-line-bold-duotone" class="text-2xl text-primary" />
                </span>
                <div class="min-w-0">
                  <RouterLink v-if="review.product" :to="{ name: 'client-product-detail', params: { id: review.product.id } }"
                    target="_blank" rel="noopener noreferrer" class="cursor-pointer text-sm font-semibold text-primary hover:underline">
                    {{ review.product.name }}
                  </RouterLink>
                  <strong v-else class="text-sm font-semibold">Sản phẩm không còn tồn tại</strong>
                  <p class="mt-1 text-xs text-text-light">{{ packageLabel(review.purchase) }}</p>
                  <p class="mt-2 text-sm">{{ review.author?.name || 'Tài khoản không còn tồn tại' }} · {{ review.author?.email }}</p>
                  <p class="mt-1 text-xs text-text-light">
                    {{ date(review.created_at) }} · {{ review.order?.code || 'Chưa liên kết đơn hàng' }}
                  </p>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <strong class="flex items-center gap-1 font-mono text-sm text-amber-600">
                  {{ review.rating ?? '—' }} / 5 <Icon icon="solar:star-bold" aria-hidden="true" />
                </strong>
                <span class="rounded-full px-3 py-1 text-xs font-medium" :class="statusClass(review.status)">
                  {{ statusLabel(review.status) }}
                </span>
              </div>
              <p class="mt-3 whitespace-pre-line break-words text-sm leading-6">{{ review.content }}</p>
              <div v-if="canModerate" class="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                <button v-if="review.status !== 'published'" type="button" class="btn-primary cursor-pointer disabled:cursor-not-allowed"
                  :disabled="locked" @click="changeStatus('published')">
                  <Icon icon="solar:check-circle-bold" /> Công khai đánh giá
                </button>
                <button v-if="review.status !== 'hidden'" type="button" class="btn-outline cursor-pointer text-danger disabled:cursor-not-allowed"
                  :disabled="locked" @click="changeStatus('hidden')">
                  <Icon icon="solar:eye-closed-bold" /> Ẩn đánh giá
                </button>
              </div>
            </section>

            <section class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 class="text-lg font-bold">Phản hồi của cửa hàng</h3>
              <p v-if="review.status !== 'published'"
                class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Đánh giá đang {{ statusLabel(review.status).toLowerCase() }}. Khách chưa xem được đánh giá và phản hồi này trên trang sản phẩm.
              </p>
              <div v-if="review.shop_reply" class="rounded-xl border border-border bg-bg p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <strong class="text-sm font-semibold">{{ review.shop_reply.author?.name || 'Cửa hàng' }}</strong>
                  <span class="rounded-full px-2 py-1 text-xs font-medium" :class="statusClass(review.shop_reply.status)">
                    {{ statusLabel(review.shop_reply.status) }}
                  </span>
                </div>
                <p class="mt-2 whitespace-pre-line break-words text-sm leading-6">{{ review.shop_reply.content }}</p>
                <p class="mt-2 text-xs text-text-light">
                  Tạo: {{ date(review.shop_reply.created_at) }} · Cập nhật: {{ date(review.shop_reply.updated_at) }}
                </p>
              </div>
              <p v-else-if="review.has_shop_reply" class="text-sm text-text-light">
                Phản hồi đã bị xóa mềm. Không tạo thêm phản hồi trùng.
              </p>
              <p v-else class="text-sm text-text-light">Cửa hàng chưa trả lời đánh giá này.</p>

              <form v-if="canEditReply" class="space-y-4" @submit.prevent="saveReply">
                <div class="form-group">
                  <label for="shop-reply-content" class="form-label">
                    {{ review.shop_reply ? 'Sửa nội dung phản hồi' : 'Nội dung phản hồi' }}
                  </label>
                  <textarea id="shop-reply-content" v-model="replyDraft" rows="5" maxlength="1000" required
                    class="form-control" :disabled="locked" placeholder="Nhập phản hồi của cửa hàng..."></textarea>
                </div>
                <div class="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                  <span class="text-xs text-text-light">{{ [...replyDraft].length }} / 1000 ký tự</span>
                  <button type="submit" class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="locked || !replyDraft.trim() || (!!review.shop_reply && !dirty)">
                    <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:check-circle-bold'"
                      :class="store.saving ? 'animate-spin' : ''" />
                    {{ store.saving ? 'Đang lưu...' : review.shop_reply ? 'Lưu nội dung' : 'Gửi phản hồi' }}
                  </button>
                </div>
                <p v-if="review.shop_reply?.status === 'hidden'" class="text-xs text-text-light">
                  Lưu nội dung vẫn giữ phản hồi ở trạng thái ẩn.
                </p>
              </form>
              <div v-if="canReply && review.shop_reply" class="flex flex-wrap gap-3">
                <button v-if="review.shop_reply.status !== 'hidden'" type="button"
                  class="btn-outline cursor-pointer text-danger disabled:cursor-not-allowed" :disabled="locked" @click="changeReplyStatus('hidden')">
                  <Icon icon="solar:eye-closed-bold" /> Ẩn phản hồi
                </button>
                <button v-if="review.shop_reply.status !== 'published'" type="button"
                  class="btn-outline cursor-pointer disabled:cursor-not-allowed" :disabled="locked" @click="changeReplyStatus('published')">
                  <Icon icon="solar:eye-bold" /> Hiện phản hồi
                </button>
              </div>
            </section>

            <section v-if="review.other_replies?.length" class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 class="text-lg font-bold">Phản hồi khác từ dữ liệu trước đây</h3>
              <div v-for="reply in review.other_replies" :key="reply.id" class="rounded-xl border border-border p-4 text-sm">
                <strong class="font-semibold">{{ reply.author?.name || 'Người dùng' }}</strong> · {{ statusLabel(reply.status) }}
                <p class="mt-2 whitespace-pre-line break-words">{{ reply.content }}</p>
              </div>
            </section>
          </template>
        </div>
        <footer class="flex flex-col justify-end gap-3 border-t border-border bg-surface p-5 sm:flex-row sm:p-6">
          <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
            :disabled="store.saving" @click="closeDetail">Đóng</button>
        </footer>
      </dialog>
    </Teleport>
  </div>
</template>