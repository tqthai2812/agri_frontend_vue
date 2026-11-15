<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useInventoryDocuments } from "@/composables/useInventoryDocuments";
import { documentTypes, documentStatuses } from "@/utils/inventoryDocument";
import DocumentDialog from "@/components/admin/inventory-documents/DocumentDialog.vue";
import DocumentDetail from "@/components/admin/inventory-documents/DocumentDetail.vue";
import ReceiptEditor from "@/components/admin/inventory-documents/ReceiptEditor.vue";
import ReceiptPostForm from "@/components/admin/inventory-documents/ReceiptPostForm.vue";
import ReceiptPending from "@/components/admin/inventory-documents/ReceiptPending.vue";
import "@/components/admin/inventory-documents/documents.css";
const {
  canCreate,
  canUpdate,
  rows,
  meta,
  filters,
  loading,
  busy,
  locked,
  error,
  errors,
  message,
  mode,
  document,
  form,
  lots,
  pending,
  recovery,
  recoveredDocument,
  editable,
  load,
  create,
  open,
  close,
  save,
  post,
  cancel,
  recover,
  retry,
  acceptCurrent,
} = useInventoryDocuments();
const title = computed(() =>
  mode.value === "edit"
    ? document.value
      ? "Sửa phiếu nhập nháp"
      : "Lập phiếu nhập nhà cung cấp"
    : mode.value === "post"
      ? "Ghi sổ phiếu nhập"
      : document.value?.document_number || "Chi tiết phiếu",
);
const pendingProps = computed(() => ({
  pending: pending.value,
  recovery: recovery.value,
  busy: busy.value,
  canRetry:
    pending.value?.kind === "create" ? canCreate.value : canUpdate.value,
  recovered: !!recoveredDocument.value,
}));
const visiblePages = computed(() => {
  const current = Number(meta.value.current_page) || 1;
  const last = Math.max(1, Number(meta.value.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) {
    pages.push(page);
  }
  return pages;
});
const pageStats = computed(() => ({
  draft: rows.value.filter((row) => row.status === "draft").length,
  posted: rows.value.filter((row) => row.status === "posted").length,
  cancelled: rows.value.filter((row) => row.status === "cancelled").length,
}));
function resetFilters() {
  Object.keys(filters).forEach((key) => (filters[key] = ""));
  load(1);
}
</script>
<template>
  <div class="stock-docs text-text product-admin">
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Phiếu kho</h1>
        <p class="text-sm text-text-light">
          {{ meta.total }} phiếu phù hợp bộ lọc
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="load(meta.current_page)"
        >
          <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" />
          Tải lại
        </button>

        <button
          v-if="canCreate"
          type="button"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed"
          :disabled="locked"
          @click="create"
        >
          <Icon icon="solar:add-circle-bold" />
          Lập phiếu kho
        </button>
      </div>
    </header>
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Thống kê phiếu kho">
      <div class="rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Theo bộ lọc</div>
        <div class="font-mono text-2xl font-bold text-info">{{ loading ? "—" : meta.total }}</div>
      </div>
      <div class="rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Đã ghi sổ · trang này</div>
        <div class="font-mono text-2xl font-bold text-success">{{ loading ? "—" : pageStats.posted }}</div>
      </div>
      <div class="rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Nháp · trang này</div>
        <div class="font-mono text-2xl font-bold">{{ loading ? "—" : pageStats.draft }}</div>
      </div>
      <div class="rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm">
        <div class="text-xs font-medium text-text-light">Đã hủy · trang này</div>
        <div class="font-mono text-2xl font-bold text-danger">{{ loading ? "—" : pageStats.cancelled }}</div>
      </div>
    </div>
    <div v-if="message" class="doc-success" role="status">{{ message }}</div>
    <div v-if="error && !mode" class="doc-error" role="alert">
      {{ error }}
      <ul v-if="errors.length">
        <li v-for="item in errors" :key="item">{{ item }}</li>
      </ul>
    </div>
    <ReceiptPending
      v-if="!mode"
      v-bind="pendingProps"
      @recover="recover"
      @retry="retry"
      @accept="acceptCurrent"
    />
    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <form class="mb-5 flex flex-wrap gap-3" @submit.prevent="load(1)">
        <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" aria-hidden="true" />
          <input v-model="filters.search" type="search" maxlength="255" aria-label="Tìm phiếu"
            placeholder="Mã phiếu, nhà cung cấp, ghi chú" class="min-w-0 w-full bg-transparent text-sm outline-none" />
        </div>
        <select v-model="filters.document_type" class="filter-select flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed" aria-label="Loại phiếu">
          <option value="">Tất cả loại phiếu</option>
          <option v-for="(label, key) in documentTypes" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="filters.status" class="filter-select flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed" aria-label="Trạng thái">
          <option value="">Tất cả trạng thái</option>
          <option v-for="(label, key) in documentStatuses" :key="key" :value="key">{{ label }}</option>
        </select>
        <label class="flex w-[168px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 sm:flex-none">
          <span class="shrink-0 text-sm text-text-light">Từ</span>
          <input v-model="filters.date_from" type="date" aria-label="Từ ngày"
            class="min-w-0 w-full bg-transparent text-sm outline-none" />
        </label>
        <label class="flex w-[168px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 sm:flex-none">
          <span class="shrink-0 text-sm text-text-light">Đến</span>
          <input v-model="filters.date_to" type="date" aria-label="Đến ngày"
            class="min-w-0 w-full bg-transparent text-sm outline-none" />
        </label>
        <button type="submit" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="loading">
            <Icon icon="solar:filter-bold" aria-hidden="true" />
            Lọc phiếu
          </button>
          <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="loading" @click="resetFilters">
            <Icon icon="solar:restart-bold" aria-hidden="true" />
            Đặt lại
          </button>
      </form>
      <div class="doc-scroll" :aria-busy="loading">
        <table class="w-full min-w-[1050px] text-sm table-auto product-document-table">
          <colgroup>
            <col />
            <col class="product-compact-column" />
            <col />
            <col class="product-compact-column" />
            <col class="product-compact-column" />
            <col class="product-compact-column" />
            <col class="product-compact-column" />
          </colgroup>
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Mã phiếu / ngày</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Loại phiếu</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Nhà cung cấp</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số dòng</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Người lập</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap w-px product-table-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-primary/5" v-if="loading">
              <td colspan="7" class="p-0 text-sm p-3 text-left">
                <div role="status" class="py-10 text-text-light text-left">
                  <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" />
                  <p class="text-sm text-left">Đang tải phiếu kho…</p>
                </div>
              </td>
            </tr>
            <template v-else
              ><tr class="border-b border-border hover:bg-primary/5" v-for="row in rows" :key="row.id">
                <td class="p-3 text-sm text-left whitespace-nowrap">
                  <button
                    class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left whitespace-nowrap"
                    type="button"
                    :disabled="locked"
                    @click="open(row.id)"
                  >
                    <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                    {{ row.document_number }}</button
                  ><small class="text-left">{{ row.document_date }}</small>
                </td>
                <td class="p-3 text-sm text-left whitespace-nowrap">
                  {{ documentTypes[row.document_type] || row.document_type }}
                </td>
                <td class="p-3 text-sm text-left whitespace-nowrap">{{ row.supplier_name || "—" }}</td>
                <td class="p-3 text-sm text-left whitespace-nowrap">
                  <span class="doc-badge text-left" :class="row.status">{{
                    documentStatuses[row.status] || row.status
                  }}</span>
                </td>
                <td class="doc-number p-3 text-sm text-left whitespace-nowrap">{{ row.items_count ?? "—" }}</td>
                <td class="p-3 text-sm text-left whitespace-nowrap">{{ row.creator?.name || "—" }}</td>
                <td class="p-3 text-sm text-left whitespace-nowrap w-px product-table-actions">
                  <div class="doc-actions text-left flex-nowrap justify-start">
                    <button aria-label="Xem chi tiết" title="Xem chi tiết"
                      type="button"
                      class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                      :disabled="locked"
                      @click="open(row.id)"
                    >
                      <Icon icon="solar:eye-bold" aria-hidden="true" />
                    </button
                    ><button aria-label="Sửa nháp" title="Sửa nháp"
                      v-if="
                        canUpdate &&
                        row.document_type === 'supplier_receipt' &&
                        row.status === 'draft'
                      "
                      type="button"
                      class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                      :disabled="locked"
                      @click="open(row.id, 'edit')"
                    >
                      <Icon icon="solar:pen-bold" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr class="border-b border-border hover:bg-primary/5" v-if="!rows.length">
                <td colspan="7" class="text-text-light text-sm p-8 text-left">
                  Chưa có phiếu phù hợp với bộ lọc.
                </td>
              </tr></template
            >
          </tbody>
        </table>
      </div>
      <footer class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">Hiển thị {{ rows.length }} / {{ meta.total }} phiếu</span>
        <nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang phiếu kho">
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" aria-label="Trang trước"
            :disabled="loading || meta.current_page <= 1" @click="load(meta.current_page - 1)">
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
            :class="{ active: page === Number(meta.current_page) }"
            :aria-current="page === Number(meta.current_page) ? 'page' : undefined"
            :disabled="loading" @click="load(page)">
            {{ page }}
          </button>
          <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" aria-label="Trang sau"
            :disabled="loading || meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </nav>
      </footer>
    </section>
    <DocumentDialog v-if="mode" :title="title" :busy="busy" @close="close">
      <div v-if="document && mode !== 'detail'" class="doc-subtitle doc-code">
        {{ document.document_number }} · {{ document.supplier_name }}
      </div>
      <div v-if="error" class="doc-error" role="alert">
        {{ error }}
        <ul v-if="errors.length">
          <li v-for="item in errors" :key="item">{{ item }}</li>
        </ul>
      </div>
      <ReceiptPending
        v-bind="pendingProps"
        @recover="recover"
        @retry="retry"
        @accept="acceptCurrent"
      />
      <ReceiptEditor
        v-if="mode === 'edit'"
        :key="document?.id || 'new'"
        :form="form"
        :locked="locked"
        :supplier-name="document?.supplier_name"
      />
      <ReceiptPostForm
        v-else-if="mode === 'post'"
        :document="document"
        :lots="lots"
        :locked="locked"
      />
      <DocumentDetail v-else-if="document" :document="document" />
      <template #footer>
        <span role="status" class="inline-flex items-center gap-2 text-xs leading-5 text-text-light">
          <Icon v-if="busy" icon="solar:refresh-bold" class="animate-spin text-base" aria-hidden="true" />{{
          busy
            ? "Đang xử lý…"
            : document
              ? `Phiếu #${document.id}`
              : "Phiếu nhập mới"
        }}</span>
        <div class="doc-actions">
          <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="close">Đóng</button>
          <template v-if="mode === 'detail' && editable && canUpdate">
            <button
              class="btn-outline-sm text-danger hover:!border-danger cursor-pointer disabled:cursor-not-allowed"
              type="button"
              :disabled="locked"
              @click="cancel"
            >
              <Icon icon="solar:trash-bin-trash-bold" aria-hidden="true" />
            Hủy nháp
            </button>
            <button
              class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
              type="button"
              :disabled="locked"
              @click="open(document.id, 'edit')"
            >
              <Icon icon="solar:pen-bold" aria-hidden="true" />
            Sửa nháp
            </button>
            <button
              class="btn-primary cursor-pointer disabled:cursor-not-allowed"
              type="button"
              :disabled="locked"
              @click="open(document.id, 'post')"
            >
              <Icon icon="solar:check-circle-bold" aria-hidden="true" />
            Nhập lô & ghi sổ
            </button>
          </template>
          <button
            v-if="mode === 'edit'"
            class="btn-primary cursor-pointer disabled:cursor-not-allowed"
            type="button"
            :disabled="locked || (document ? !canUpdate : !canCreate)"
            @click="save"
          >
            <Icon icon="solar:diskette-bold-duotone" aria-hidden="true" />
            Lưu nháp
          </button>
          <button
            v-if="mode === 'post'"
            class="btn-primary cursor-pointer disabled:cursor-not-allowed"
            type="button"
            :disabled="locked || !canUpdate"
            @click="post"
          >
            <Icon icon="solar:check-circle-bold" aria-hidden="true" />
            Xác nhận ghi sổ
          </button>
        </div>
      </template>
    </DocumentDialog>
  </div>
</template>