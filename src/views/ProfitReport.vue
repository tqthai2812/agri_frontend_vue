<script setup>
import { Icon } from "@iconify/vue";
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  useFinance,
  money,
  dateTime,
  monthStart,
  today,
  sourceLabel,
} from "@/composables/useFinance";
import ReportExportActions from "@/components/admin/exports/ReportExportActions.vue";
import Chart from "@/components/admin/finance/ProfitChart.vue";
import Pager from "@/components/admin/finance/FinancePagination.vue";
import Evidence from "@/components/admin/finance/FinanceEvidence.vue";
import SkuProfitTable from "@/components/admin/finance/SkuProfitTable.vue";
import "@/assets/finance.css";
const { auth, allowed, can, data, loading, error, load } =
  useFinance("report.profit.view");
const router = useRouter();
const dates = reactive({ date_from: monthStart(), date_to: today() }),
  tab = ref("summary"),
  evidence = ref(null);
const applied = reactive({ ...dates });
const skuFilters = reactive({
  search: "",
  state: "all",
  sort: "net_sales_desc",
});
let pages = { orders_page: 1, expenses_page: 1, issues_page: 1 };
const result = computed(() => data.value?.data),
  dirty = computed(
    () =>
      dates.date_from !== applied.date_from ||
      dates.date_to !== applied.date_to,
  );
const tabs = [
  ["summary", "Tổng quan"],
  ["orders", "Đơn hoàn thành"],
  ["skus", "Theo SKU"],
  ["expenses", "Khoản chi ghi sổ"],
  ["categories", "Theo danh mục"],
  ["issues", "Cần đối chiếu"],
];
const kpis = [
  ["gross_sales", "Tiền hàng trước giảm"],
  ["discount", "Giảm giá đã chốt"],
  ["net_sales", "Doanh thu hàng sau giảm"],
  ["shipping_charged", "Phí giao hàng thu khách"],
  ["cost_total", "Giá vốn hàng đã bán"],
  ["gross_profit", "Lãi gộp hàng hóa"],
  ["expenses", "Chi phí ghi sổ (ròng)"],
  ["pretax_profit", "Lợi nhuận trước thuế"],
];
async function fetchReport(apply = false) {
  if (apply) {
    Object.assign(applied, dates);
    pages = { orders_page: 1, expenses_page: 1, issues_page: 1 };
  }
  await load("/reports/profit", { ...applied, ...pages });
}
function quick(kind) {
  const now = today();
  if (kind === "month") {
    dates.date_from = monthStart();
    dates.date_to = now;
  } else if (kind === "year") {
    dates.date_from = now.slice(0, 4) + "-01-01";
    dates.date_to = now;
  } else {
    const y = Number(now.slice(0, 4)),
      m = Number(now.slice(5, 7));
    const last = new Date(Date.UTC(y, m - 1, 0));
    dates.date_from = last.toISOString().slice(0, 8) + "01";
    dates.date_to = last.toISOString().slice(0, 10);
  }
  fetchReport(true);
}
function page(kind, n) {
  pages[kind + "_page"] = n;
  fetchReport();
}
function expense(id) {
  router.push({
    name: "admin-expenses",
    query: {
      expense: id,
      date_from: applied.date_from,
      date_to: applied.date_to,
    },
  });
}
function category(id) {
  router.push({
    name: "admin-expenses",
    query: {
      category_id: id,
      status: "posted",
      date_from: applied.date_from,
      date_to: applied.date_to,
    },
  });
}
watch(
  [() => auth.user?.id, () => allowed.value],
  () => {
    evidence.value = null;
    Object.assign(skuFilters, {
      search: "",
      state: "all",
      sort: "net_sales_desc",
    });
    if (allowed.value) fetchReport();
  },
);
const exportFilters = computed(() => ({
  date_from: result.value?.period.date_from,
  date_to: result.value?.period.date_to,
  dataset: tab.value,
}));
const dailyExportFilters = computed(() => ({
  ...exportFilters.value,
  dataset: "daily",
}));
onMounted(() => fetchReport());
</script>
<template>
  <section class="finance product-admin">
    <p v-if="!allowed" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
      Bạn không có quyền xem báo cáo lợi nhuận.
    </p>
    <template v-else
      ><header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
        <h1 class="text-2xl font-bold">Báo cáo lợi nhuận</h1>
        <p class="text-sm text-text-light">
          Doanh thu và giá vốn theo ngày hoàn thành đơn · Chi phí theo ngày phát
          sinh · Giờ Việt Nam
        </p>
      
        </div>
        <button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="fetchReport()"
        >
          <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" /> Tải lại
        </button>
      </header>
      <form class="rounded-2xl border border-border bg-surface p-5 shadow-sm mb-5 flex flex-wrap items-end gap-3 product-filters" @submit.prevent="fetchReport(true)">
        <label class="form-group"
          ><span class="form-label">Từ ngày</span><input class="form-control"
            v-model="dates.date_from"
            type="date"
            required /></label
        ><label class="form-group"
          ><span class="form-label">Đến ngày</span><input class="form-control" v-model="dates.date_to" type="date" required /></label
        ><button class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="loading">
<Icon icon="solar:filter-bold" aria-hidden="true" />Áp dụng</button
        ><button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="quick('month')"
        >
          Tháng này</button
        ><button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="quick('previous')"
        >
          Tháng trước</button
        ><button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="quick('year')"
        >
          Năm nay</button
        >
      </form>
      <p v-if="dirty" class="text-xs leading-5 text-text-light mb-3">
        Bạn đã đổi ngày. Bấm Áp dụng để cập nhật báo cáo.
      </p>
      <p v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
      <p v-if="loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />
        Đang tổng hợp số liệu...
      </p>
      <template v-else-if="result"
        ><div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs leading-5 text-text-light">
            Đang xem: {{ result.period.date_from }} →
            {{ result.period.date_to }} · Lập lúc
            {{ dateTime(result.generated_at) }}
          </p>
          <ReportExportActions
            v-if="tab !== 'skus' && can('report.profit.export')"
            report-type="profit_report"
            required-permission="report.profit.export"
            :filters="exportFilters"
            :disabled="loading || dirty"
            button-label="Xuất tab này (Excel)"
          />
        </div>
        <p
          v-if="
            !result.quality.profit_complete ||
            result.quality.undated_completed_all_time
          "
          class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4"
        >
          {{
            result.summary.completed_orders - result.summary.profit_ready_orders
          }}
          đơn trong kỳ chưa đủ dữ liệu tính lợi nhuận.
          {{ result.quality.undated_completed_all_time }} đơn hoàn thành trong
          toàn hệ thống thiếu ngày hoàn thành.
          <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="tab = 'issues'" type="button">
            <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
            Xem dữ liệu cần đối chiếu
          </button>
        </p>
        <nav class="fin-tabs" aria-label="Các phần báo cáo">
          <button
            v-for="[key, label] in tabs"
            :key="key"
            class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :class="{ active: tab === key }"
            :aria-pressed="tab === key"
            @click="tab = key"
          >
            {{ label
            }}<span v-if="key === 'issues'"
              >({{ result.issues.meta.total }})</span
            >
          </button>
        </nav>
        <template v-if="tab === 'summary'"
          >
          <p class="text-xs leading-5 text-text-light my-4">
            {{ result.summary.completed_orders }} đơn hoàn thành ·
            {{ result.summary.posted_entries }} dòng chi phí ghi sổ ·
            {{ result.quality.payment_review_orders }} đơn cần đối chiếu thanh
            toán.
          </p>
          <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 class="mb-4 text-lg font-bold">Diễn biến theo ngày</h2>
            <Chart :rows="result.daily" />
            <details class="mt-5">
              <summary class="text-sm font-semibold text-primary underline underline-offset-4 cursor-pointer">
                Xem bảng số liệu theo ngày
              </summary>
              <ReportExportActions
                v-if="can('report.profit.export')"
                class="my-3"
                report-type="profit_report"
                required-permission="report.profit.export"
                :filters="dailyExportFilters"
                :disabled="loading || dirty"
                button-label="Xuất bảng ngày (Excel)"
              />
              <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[1050px] table-auto">
                  <thead class="bg-bg">
                    <tr>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Ngày</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tiền hàng trước giảm</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giảm giá</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Doanh thu hàng sau giảm</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Phí giao thu khách</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Chi phí</th>
                      <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lợi nhuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-border hover:bg-primary/5" v-for="d in result.daily" :key="d.date">
                      <td class="p-3 text-sm text-left">{{ d.date }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.gross_sales) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.discount) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.net_sales) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.shipping_charged) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.cost_total) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.expenses) }}</td>
                      <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(d.pretax_profit) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
          <p class="text-xs leading-5 text-text-light mt-4">
            Lợi nhuận trước thuế = doanh thu hàng sau giảm + phí giao hàng thu
            khách − giá vốn − chi phí ghi sổ ròng. Đây là báo cáo quản trị theo
            kỳ; không phải số tiền thực thu, thực chi hay báo cáo thuế. Chi phí
            chung không tự phân bổ cho từng sản phẩm. Tiền giảm giá đã nằm trong
            doanh thu sau giảm; không trừ thêm lần nữa khi tính lợi nhuận.
          </p></template
        >
        <SkuProfitTable
          v-else-if="tab === 'skus'"
          :period="result.period"
          :disabled="loading || dirty"
          :initial-filters="skuFilters"
          @filters="Object.assign(skuFilters, $event)"
        />
        <div v-else-if="tab === 'orders'" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[1050px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đơn hàng</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Hoàn thành</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tiền hàng trước giảm</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giảm giá</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Doanh thu hàng sau giảm</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Phí giao thu khách</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tổng tiền đơn</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lãi gộp hàng</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="o in result.orders.data" :key="o.id">
                  <td class="p-3 text-sm text-left">
                    <button
                      v-if="can('order.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="evidence = { kind: 'orders', id: o.id }"
                     type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ o.code }}</button
                    ><span class="text-left" v-else>{{ o.code }}</span>
                  </td>
                  <td class="whitespace-nowrap p-3 text-sm text-left">
                    {{ dateTime(o.completed_at) }}
                  </td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.gross_sales) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.discount) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.net_sales) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.shipping_charged) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.total_payment) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.cost_total) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(o.gross_profit) }}</td>
                  <td class="p-3 text-sm text-left">
                    {{
                      {
                        paid: "Đã thu hợp lệ",
                        cod_uncollected: "COD chưa thu",
                        review: "Cần đối chiếu",
                      }[o.payment_state]
                    }}
                  </td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!result.orders.data.length">
                  <td class="text-sm p-8 text-text-light text-left" colspan="10">Không có đơn hoàn thành trong kỳ.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pager :count="result.orders.data.length" :loading="loading" :meta="result.orders.meta" @page="page('orders', $event)" />
        </div>
        <div v-else-if="tab === 'expenses'" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[700px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Khoản chi</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Ngày phát sinh</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Danh mục / Nguồn</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Nội dung</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="e in result.expenses.data" :key="e.id">
                  <td class="p-3 text-sm text-left">
                    <button
                      v-if="can('expense.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="expense(e.id)"
                     type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ e.code }}</button
                    ><span class="text-left" v-else>{{ e.code }}</span>
                  </td>
                  <td class="whitespace-nowrap p-3 text-sm text-left">
                    {{ dateTime(e.incurred_at) }}
                  </td>
                  <td class="p-3 text-sm text-left">
                    {{ e.category_name }}<br />{{ sourceLabel(e.source) }}
                  </td>
                  <td class="min-w-48 p-3 text-sm text-left">{{ e.description }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(e.amount) }}</td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!result.expenses.data.length">
                  <td class="text-sm p-8 text-text-light text-left" colspan="5">Không có khoản chi đã ghi sổ trong kỳ.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pager :count="result.expenses.data.length" :loading="loading"
            :meta="result.expenses.meta"
            @page="page('expenses', $event)"
          />
        </div>
        <div v-else-if="tab === 'categories'" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[700px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Danh mục</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số dòng</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Chi phí dương</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đảo giảm</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Chi phí ròng</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="c in result.categories" :key="c.id">
                  <td class="p-3 text-sm text-left">
                    <button
                      v-if="can('expense.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="category(c.id)"
                     type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ c.name }}</button
                    ><span class="text-left" v-else>{{ c.name }}</span>
                  </td>
                  <td class="p-3 text-sm text-left">{{ c.count }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(c.positive) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(c.reversals) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(c.net) }}</td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!result.categories.length">
                  <td class="text-sm p-8 text-text-light text-left" colspan="5">Chưa có chi phí ghi sổ trong kỳ.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[480px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Chứng từ</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Cần kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="i in result.issues.data" :key="i.kind + ':' + i.id">
                  <td class="p-3 text-sm text-left">
                    <button
                      v-if="i.kind === 'order' && can('order.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="evidence = { kind: 'orders', id: i.id }"
                     type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ i.code }}</button
                    ><button
                      v-else-if="i.kind === 'expense' && can('expense.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="expense(i.id)"
                     type="button">
                       <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ i.code }}</button
                    ><span class="text-left" v-else>{{ i.code }}</span>
                  </td>
                  <td class="p-3 text-sm text-left">{{ i.message }}</td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!result.issues.data.length">
                  <td class="text-sm p-8 text-text-light text-left" colspan="2">
                    Không phát hiện vấn đề trong các kiểm tra số liệu của báo
                    cáo.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pager :count="result.issues.data.length" :loading="loading" :meta="result.issues.meta" @page="page('issues', $event)" />
        </div> </template
      ><Evidence v-if="evidence" v-bind="evidence" @close="evidence = null"
    /></template>
  </section>
</template>