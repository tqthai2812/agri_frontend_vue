<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { computed, reactive, ref, watch } from "vue";
import { useFinance, money } from "@/composables/useFinance";
import Pager from "./FinancePagination.vue";
import SkuProfitDetail from "./SkuProfitDetail.vue";
import ReportExportActions from "@/components/admin/exports/ReportExportActions.vue";

const props = defineProps({
  period: { type: Object, required: true },
  disabled: Boolean,
  initialFilters: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["filters"]);
const { auth, allowed, can, data, loading, error, load } =
  useFinance("report.profit.view");
const draft = reactive({
  search: "",
  state: "all",
  sort: "net_sales_desc",
  ...props.initialFilters,
});
const applied = reactive({ ...draft });
const selected = ref(null);
const result = computed(() => data.value?.data);
const dirty = computed(
  () =>
    draft.search.trim() !== applied.search ||
    draft.state !== applied.state ||
    draft.sort !== applied.sort,
);
const exportFilters = computed(() => ({
  date_from: result.value?.period.date_from,
  date_to: result.value?.period.date_to,
  dataset: "skus",
  ...(result.value?.filters || applied),
}));
const summaryCards = [
  ["net_sales", "Doanh thu sau giảm"],
  ["cost_total", "Giá vốn hàng bán"],
  ["gross_profit", "Lãi gộp"],
];
function percent(value) {
  return value === null ? "—" : String(value).replace(".", ",") + "%";
}
async function fetchRows(page = 1) {
  selected.value = null;
  const response = await load("/reports/profit/skus", {
    date_from: props.period.date_from,
    date_to: props.period.date_to,
    ...applied,
    page,
  });
  if (response) {
    Object.assign(applied, response.data.filters);
    emit("filters", { ...applied });
  }
}
function apply() {
  if (loading.value || props.disabled) return;
  Object.assign(applied, { ...draft, search: draft.search.trim() });
  emit("filters", { ...applied });
  fetchRows();
}
watch(
  [
    () => props.period.date_from,
    () => props.period.date_to,
    () => auth.user?.id,
    () => allowed.value,
  ],
  () => {
    selected.value = null;
    if (allowed.value) fetchRows();
  },
  { immediate: true },
);
</script>

<template>
  <section class="min-w-0 product-admin" aria-label="Báo cáo theo SKU">
    <form class="rounded-2xl border border-border bg-surface p-5 shadow-sm mb-5 flex flex-wrap items-end gap-3 product-filters" @submit.prevent="apply">
      <label class="flex-1 form-group product-search-filter"
        >
<Icon icon="solar:magnifer-bold" class="pointer-events-none absolute bottom-3 left-3 text-text-light" aria-hidden="true" /><span class="form-label">Sản phẩm / SKU
        </span><input class="form-control"
          v-model="draft.search"
          type="search"
          maxlength="100"
          placeholder="Tên sản phẩm hoặc mã SKU"
        />
      </label>
      <label class="form-group"
        ><span class="form-label">Tình trạng
        </span><select class="filter-select cursor-pointer disabled:cursor-not-allowed" v-model="draft.state">
          <option value="all">Tất cả</option>
          <option value="profitable">Có lãi gộp</option>
          <option value="loss">Lỗ gộp</option>
          <option value="missing_cost">Thiếu giá vốn</option>
          <option value="needs_review">Cần đối chiếu</option>
        </select>
      </label>
      <label class="form-group"
        ><span class="form-label">Sắp xếp
        </span><select class="filter-select cursor-pointer disabled:cursor-not-allowed" v-model="draft.sort">
          <option value="net_sales_desc">Doanh thu cao nhất</option>
          <option value="gross_profit_desc">Lãi gộp cao nhất</option>
          <option value="quantity_desc">Bán nhiều nhất</option>
          <option value="margin_asc">Biên lãi thấp nhất</option>
        </select>
      </label>
      <button class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="loading || disabled">
        Lọc SKU
      </button>
    </form>
    <p v-if="dirty" class="text-xs leading-5 text-text-light mb-3">Bấm Lọc SKU để áp dụng thay đổi.</p>
    <p v-if="error" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />
      Đang tổng hợp SKU...
    </p>
    <template v-else-if="result">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs leading-5 text-text-light">
          {{ result.summary.sku_count }} SKU/quy cách · Tổng của toàn bộ kết quả
          đã lọc
        </p>
        <ReportExportActions
          v-if="can('report.profit.export')"
          report-type="profit_report"
          required-permission="report.profit.export"
          :filters="exportFilters"
          :disabled="disabled || dirty || loading"
          button-label="Xuất theo SKU (Excel)"
        />
      </div>
      
      <p v-if="result.quality.unassigned_orders" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
        {{ result.quality.unassigned_orders }} đơn trong kỳ không có dòng hàng
        để phân bổ theo SKU. Xem tab Cần đối chiếu trước khi xuất.
      </p>
      <p
        v-if="result.summary.missing_cost_skus || result.summary.review_skus"
        class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4"
      >
        {{ result.summary.missing_cost_skus }} SKU thiếu giá vốn ·
        {{ result.summary.review_skus }} SKU cần đối chiếu.
      </p>
      <div class="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1050px] table-auto">
            <thead class="bg-bg">
              <tr>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">SKU / Sản phẩm</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Biến thể</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Quy cách</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng bán</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số đơn</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trước giảm giá</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giảm giá</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Doanh thu sau giảm</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lãi gộp</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Biên lãi gộp</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tình trạng dữ liệu</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-primary/5" v-for="row in result.data" :key="row.key">
                <td class="min-w-52 p-3 text-sm text-left">
                  <button
                    type="button"
                    class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                    @click="selected = row"
                  >
                    <Icon icon="solar:eye-bold" class="shrink-0" aria-hidden="true" />
                    {{ row.sku || "Thiếu SKU lưu lúc mua" }}
                  </button>
                  <p class="mt-1 text-left">
                    {{ row.product_name || "Thiếu tên lưu lúc mua" }}
                  </p>
                </td>
                <td class="p-3 text-sm text-left">{{ row.variant_name || "—" }}</td>
                <td class="whitespace-nowrap p-3 text-sm text-left">{{ row.package_label }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">
                  {{ row.quantity?.toLocaleString("vi-VN") ?? "—" }}
                </td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ row.order_count }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.gross_sales) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.discount) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.net_sales) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.cost_total) }}</td>
                <td
                  class="whitespace-nowrap font-mono p-3 text-sm text-left"
                  :class="
                    row.gross_profit?.startsWith('-') ? 'text-red-500' : ''
                  "
                >
                  {{ money(row.gross_profit) }}
                </td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ percent(row.margin_percent) }}</td>
                <td class="min-w-36 p-3 text-sm text-left">
                  <span class="inline-block whitespace-nowrap rounded-lg bg-bg px-2 py-1 text-xs text-left">{{ row.status_label }}</span>
                  <p v-if="row.missing_cost_lines" class="text-xs leading-5 text-text-light text-left">
                    {{ row.missing_cost_lines }} dòng thiếu vốn
                  </p>
                  <p v-if="row.review_lines" class="text-xs leading-5 text-text-light text-left">
                    {{ row.review_lines }} dòng cần đối chiếu
                  </p>
                </td>
              </tr>
              <tr class="border-b border-border hover:bg-primary/5" v-if="!result.data.length">
                <td class="text-sm p-8 text-text-light text-left" colspan="12">Không có SKU phù hợp bộ lọc.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager :count="result.data.length"
          :meta="result.meta"
          :loading="loading"
          @page="fetchRows($event)"
        />
      </div>
      <p class="text-xs leading-5 text-text-light mt-3">
        Lãi gộp theo SKU = doanh thu sau giảm − giá vốn đã chốt. Số lượng là số
        gói/chai/túi; chi phí chung không phân bổ vào SKU.
      </p>
    </template>
    <SkuProfitDetail
      v-if="selected"
      :key="selected.key"
      :entry="selected"
      :period="period"
      @close="selected = null"
    />
  </section>
</template>