<script setup>
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
    () => [
        props.period.date_from,
        props.period.date_to,
        auth.user?.id,
        allowed.value,
    ],
    () => {
        selected.value = null;
        if (allowed.value) fetchRows();
    },
    { immediate: true },
);
</script>

<template>
    <section class="min-w-0" aria-label="Báo cáo theo SKU">
        <form class="fin-card fin-toolbar" @submit.prevent="apply">
            <label class="flex-1">Sản phẩm / SKU
                <input v-model="draft.search" type="search" maxlength="100" placeholder="Tên sản phẩm hoặc mã SKU" />
            </label>
            <label>Tình trạng
                <select v-model="draft.state">
                    <option value="all">Tất cả</option>
                    <option value="profitable">Có lãi gộp</option>
                    <option value="loss">Lỗ gộp</option>
                    <option value="missing_cost">Thiếu giá vốn</option>
                    <option value="needs_review">Cần đối chiếu</option>
                </select>
            </label>
            <label>Sắp xếp
                <select v-model="draft.sort">
                    <option value="net_sales_desc">Doanh thu cao nhất</option>
                    <option value="gross_profit_desc">Lãi gộp cao nhất</option>
                    <option value="quantity_desc">Bán nhiều nhất</option>
                    <option value="margin_asc">Biên lãi thấp nhất</option>
                </select>
            </label>
            <button class="fin-btn fin-primary" :disabled="loading || disabled">
                Lọc SKU
            </button>
        </form>
        <p v-if="dirty" class="fin-note mb-3">Bấm Lọc SKU để áp dụng thay đổi.</p>
        <p v-if="error" class="fin-error" role="alert">{{ error }}</p>
        <p v-if="loading" class="fin-card py-10 text-center">
            Đang tổng hợp SKU...
        </p>
        <template v-else-if="result">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p class="fin-note">
                    {{ result.summary.sku_count }} SKU/quy cách · Tổng của toàn bộ kết quả
                    đã lọc
                </p>
                <ReportExportActions v-if="can('report.profit.export')" report-type="profit_report"
                    required-permission="report.profit.export" :filters="exportFilters"
                    :disabled="disabled || dirty || loading" button-label="Xuất theo SKU (Excel)" />
            </div>
            <div class="mb-4 grid gap-3 sm:grid-cols-3">
                <article v-for="[key, label] in summaryCards" :key="key" class="fin-card min-w-0">
                    <p class="fin-note">{{ label }}</p>
                    <strong class="mt-2 block break-words text-lg" :class="key === 'gross_profit' && result.summary[key]?.startsWith('-')
                        ? 'text-red-500'
                        : ''
                        ">{{ money(result.summary[key]) }}</strong>
                </article>
            </div>
            <p v-if="result.quality.unassigned_orders" class="fin-warning mb-4">
                {{ result.quality.unassigned_orders }} đơn trong kỳ không có dòng hàng
                để phân bổ theo SKU. Xem tab Cần đối chiếu trước khi xuất.
            </p>
            <p v-if="result.summary.missing_cost_skus || result.summary.review_skus" class="fin-warning mb-4">
                {{ result.summary.missing_cost_skus }} SKU thiếu giá vốn ·
                {{ result.summary.review_skus }} SKU cần đối chiếu.
            </p>
            <div class="fin-card min-w-0">
                <div class="fin-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU / Sản phẩm</th>
                                <th>Biến thể</th>
                                <th>Quy cách</th>
                                <th class="fin-money">Số lượng bán</th>
                                <th class="fin-money">Số đơn</th>
                                <th class="fin-money">Trước giảm giá</th>
                                <th class="fin-money">Giảm giá</th>
                                <th class="fin-money">Doanh thu sau giảm</th>
                                <th class="fin-money">Giá vốn</th>
                                <th class="fin-money">Lãi gộp</th>
                                <th class="fin-money">Biên lãi gộp</th>
                                <th>Tình trạng dữ liệu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in result.data" :key="row.key">
                                <td class="min-w-52">
                                    <button type="button" class="fin-link text-left" @click="selected = row">
                                        {{ row.sku || "Thiếu SKU lưu lúc mua" }}
                                    </button>
                                    <p class="mt-1">
                                        {{ row.product_name || "Thiếu tên lưu lúc mua" }}
                                    </p>
                                </td>
                                <td>{{ row.variant_name || "—" }}</td>
                                <td class="whitespace-nowrap">{{ row.package_label }}</td>
                                <td class="fin-money">
                                    {{ row.quantity?.toLocaleString("vi-VN") ?? "—" }}
                                </td>
                                <td class="fin-money">{{ row.order_count }}</td>
                                <td class="fin-money">{{ money(row.gross_sales) }}</td>
                                <td class="fin-money">{{ money(row.discount) }}</td>
                                <td class="fin-money">{{ money(row.net_sales) }}</td>
                                <td class="fin-money">{{ money(row.cost_total) }}</td>
                                <td class="fin-money" :class="row.gross_profit?.startsWith('-') ? 'text-red-500' : ''
                                    ">
                                    {{ money(row.gross_profit) }}
                                </td>
                                <td class="fin-money">{{ percent(row.margin_percent) }}</td>
                                <td class="min-w-36">
                                    <span class="fin-badge">{{ row.status_label }}</span>
                                    <p v-if="row.missing_cost_lines" class="fin-note">
                                        {{ row.missing_cost_lines }} dòng thiếu vốn
                                    </p>
                                    <p v-if="row.review_lines" class="fin-note">
                                        {{ row.review_lines }} dòng cần đối chiếu
                                    </p>
                                </td>
                            </tr>
                            <tr v-if="!result.data.length">
                                <td colspan="12">Không có SKU phù hợp bộ lọc.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Pager :meta="result.meta" :loading="loading" @page="fetchRows($event)" />
            </div>
            <p class="fin-note mt-3">
                Lãi gộp theo SKU = doanh thu sau giảm − giá vốn đã chốt. Số lượng là số
                gói/chai/túi; chi phí chung không phân bổ vào SKU.
            </p>
        </template>
        <SkuProfitDetail v-if="selected" :key="selected.key" :entry="selected" :period="period"
            @close="selected = null" />
    </section>
</template>