<script setup>
import { ref, reactive, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FinancePagination from "@/components/admin/finance/FinancePagination.vue";
import InventoryReportDetail from "@/components/admin/inventory-report/InventoryReportDetail.vue";
import ReportExportActions from "@/components/admin/exports/ReportExportActions.vue";
import {
  useInventoryReport,
  todayVN,
  money,
  quantity,
  dateText,
  lotStatus,
} from "@/composables/useInventoryReport";
import "@/assets/finance.css";
const auth = useAuthStore();
const { canView, canExport, result, loading, error, load } =
  useInventoryReport();
const today = todayVN();
const filters = reactive({
  view: "ledger",
  search: "",
  package_id: null,
  date_from: today.slice(0, 8) + "01",
  date_to: today,
  condition: "all",
  days: 30,
});
const applied = ref(null),
  detail = ref(null),
  selectedSku = ref("");
const exportFilters = computed(() => {
  if (!applied.value) return {};
  const { view, condition, search, package_id, date_from, date_to, days } =
    applied.value;
  const result = { view, condition };
  if (search) result.search = search;
  if (package_id) result.package_id = package_id;
  if (view === "ledger") {
    result.date_from = date_from;
    result.date_to = date_to;
  } else if (view === "lots") {
    result.days = days;
  }
  return result;
});
const tabs = [
  { id: "ledger", label: "Nhập – xuất – tồn", icon: "mdi:swap-horizontal" },
  { id: "stock", label: "Giá trị tồn hiện tại", icon: "mdi:warehouse" },
  { id: "lots", label: "Lô & hạn dùng", icon: "mdi:calendar-clock-outline" },
];
const options = computed(
  () =>
    ({
      ledger: [
        ["all", "Tất cả SKU"],
        ["issues", "Cần đối chiếu"],
      ],
      stock: [
        ["all", "Tất cả SKU"],
        ["out", "Hết hàng có thể bán"],
        ["low", "Dưới ngưỡng bổ sung"],
        ["issues", "Cần đối chiếu"],
        ["unknown_cost", "Thiếu giá vốn"],
      ],
      lots: [
        ["all", "Tất cả lô còn tồn"],
        ["expiring", "Sắp hết hạn"],
        ["expired", "Đã hết hạn"],
        ["blocked", "Lô đã khóa"],
        ["quarantined", "Lô cách ly"],
        ["no_expiry", "Chưa có hạn dùng"],
        ["unknown_cost", "Thiếu giá vốn"],
      ],
    })[filters.view],
);
function params() {
  const p = {
    ...filters,
    search: filters.search.trim(),
    page: 1,
    per_page: 20,
  };
  if (!p.package_id) delete p.package_id;
  if (p.view !== "ledger") {
    delete p.date_from;
    delete p.date_to;
  }
  return p;
}
function apply() {
  applied.value = params();
  load(applied.value);
}
function page(n) {
  if (applied.value) {
    applied.value = { ...applied.value, page: n };
    load(applied.value);
  }
}
function tab(id) {
  filters.view = id;
  filters.condition = "all";
  detail.value = null;
  apply();
}
function lots(row) {
  filters.search = "";
  filters.package_id = row.package_id;
  selectedSku.value = row.sku;
  tab("lots");
}
function clearSku() {
  filters.package_id = null;
  selectedSku.value = "";
  apply();
}
function journal(row) {
  detail.value = {
    kind: "journal",
    id: row.package_id,
    sku: row.sku,
    period: {
      date_from: result.value?.period?.date_from || filters.date_from,
      date_to: result.value?.period?.date_to || filters.date_to,
    },
  };
}
function quick(previous = false) {
  const d = new Date(`${today}T12:00:00Z`);
  if (previous) {
    d.setUTCDate(0);
    filters.date_to = d.toISOString().slice(0, 10);
    filters.date_from = filters.date_to.slice(0, 8) + "01";
  } else {
    filters.date_to = today;
    filters.date_from = today.slice(0, 8) + "01";
  }
  apply();
}
watch(
  [() => auth.user?.id, () => canView.value],
  () => {
    detail.value = null;
    if (canView.value) apply();
  },
  { immediate: true },
);
</script>
<template>
  <div class="finance inventory-report min-w-0 product-admin">
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Báo cáo kho</h1>
        <p class="text-sm text-text-light">
          Đối chiếu số lượng, giá trị tồn và hạn dùng từ sổ kho theo lô.
        </p>
      </div>
      <button v-if="canView" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        :disabled="loading" @click="page(applied?.page || 1)">
        <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" /> Tải lại
      </button>
    </header>
    <div v-if="!canView" role="alert" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-6">
      Bạn cần quyền xem kho và xem báo cáo kho để sử dụng trang này.
    </div>
    <template v-else>
      <nav class="fin-tabs" aria-label="Loại báo cáo kho">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :class="{ active: filters.view === t.id }"
          :aria-pressed="filters.view === t.id"
          @click="tab(t.id)"
        >
          <Icon :icon="t.icon" class="text-lg" />{{ t.label }}
        </button>
      </nav>
      <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <form class="mb-5 flex flex-wrap items-end gap-3 product-filters" @submit.prevent="apply">
          <label class="grow form-group product-search-filter"
            >
<Icon icon="solar:magnifer-bold" class="pointer-events-none absolute bottom-3 left-3 text-text-light" aria-hidden="true" /><span class="form-label">Sản phẩm / SKU</span><input class="form-control"
              v-model="filters.search"
              maxlength="100"
              placeholder="Tên sản phẩm hoặc mã SKU"
          /></label>
          <template v-if="filters.view === 'ledger'"
            ><label class="form-group"
              ><span class="form-label">Từ ngày</span><input class="form-control"
                type="date"
                v-model="filters.date_from"
                :max="today"
                required /></label
            ><label class="form-group"
              ><span class="form-label">Đến ngày</span><input class="form-control"
                type="date"
                v-model="filters.date_to"
                :min="filters.date_from"
                :max="today"
                required /></label
          ></template>
          <label class="form-group"
            ><span class="form-label">Điều kiện</span><select class="filter-select cursor-pointer disabled:cursor-not-allowed" v-model="filters.condition">
              <option v-for="[key, label] in options" :key="key" :value="key">
                {{ label }}
              </option>
            </select></label
          >
          <label class="form-group"
            v-if="filters.view === 'lots' && filters.condition === 'expiring'"
            ><span class="form-label">Trong vòng</span><select class="filter-select cursor-pointer disabled:cursor-not-allowed" v-model.number="filters.days">
              <option :value="30">30 ngày</option>
              <option :value="60">60 ngày</option>
              <option :value="90">90 ngày</option>
            </select></label
          >
          <button class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="loading">
<Icon icon="solar:filter-bold" aria-hidden="true" />
            Áp dụng
          </button>
        </form>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="filters.view === 'ledger'"
            ><button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="quick()">Tháng này</button
            ><button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="quick(true)">
              Tháng trước
            </button></template
          ><button v-if="selectedSku" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="clearSku">
            {{ selectedSku }} · Bỏ chọn SKU ✕
          </button>
        </div>
      </section>
      <div v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</div>
      <p v-if="loading" role="status" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />
        Đang tổng hợp sổ kho…
      </p>
      <template v-else-if="result">
        
        
        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm mt-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs leading-5 text-text-light">
              Tổng hợp lúc {{ dateText(result.generated_at) }}
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <button
                class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                :disabled="loading"
                @click="load(applied)"
              >
<Icon icon="solar:refresh-bold" aria-hidden="true" />
                Tải lại
              </button>
              <ReportExportActions
                v-if="canExport"
                report-type="inventory_report"
                :filters="exportFilters"
                :disabled="loading || !applied"
                required-permission="report.inventory.export"
                button-label="Xuất Excel"
              />
            </div>
          </div>
          <p v-if="!result.data.length" class="py-10 text-center text-xs leading-5 text-text-light">
            Không có dữ liệu phù hợp bộ lọc.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm min-w-[1050px]">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">SKU / sản phẩm</th>
                  <template v-if="result.view === 'ledger'"
                    ><th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Tồn đầu</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Nhập NCC</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Xuất bán</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">ĐC tăng</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">ĐC giảm</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Mở sổ</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Tồn cuối</th></template
                  ><template v-else-if="result.view === 'stock'"
                    ><th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Vật lý / tổng lô</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Hợp lệ</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đang giữ</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Có thể bán</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Giá trị tồn</th></template
                  ><template v-else
                    ><th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Lô / nhà cung cấp</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Hạn dùng</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Còn tồn</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đang giữ</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Có thể bán</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Giá vốn / đơn vị</th>
                    <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Giá trị</th></template
                  >
                  <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đối chiếu / thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5"
                  v-for="row in result.data"
                  :key="row.lot_id || row.package_id"
                >
                  <td class="min-w-[190px] p-3 text-sm">
                    <strong>{{ row.sku }}</strong>
                    <p>{{ row.product_name }}</p>
                    <p class="text-xs leading-5 text-text-light">
                      {{ row.variant_name }} · {{ row.size }} {{ row.unit }}
                    </p>
                  </td>
                  <template v-if="result.view === 'ledger'"
                    ><td
                      v-for="key in [
                        'opening',
                        'receipts',
                        'sale_issues',
                        'adjustment_in',
                        'adjustment_out',
                        'opening_entries',
                        'closing',
                      ]"
                      :key="key"
                      class="whitespace-nowrap text-right font-mono p-3 text-sm"
                      :class="row[key] === null ? 'text-amber-700' : ''"
                    >
                      {{ quantity(row[key]) }}
                    </td></template
                  >
                  <template v-else-if="result.view === 'stock'"
                    ><td class="whitespace-nowrap text-right font-mono p-3 text-sm">
                      {{ quantity(row.physical) }} /
                      {{ quantity(row.lot_quantity) }}
                    </td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">{{ quantity(row.eligible) }}</td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">
                      {{ quantity(row.reserved) }}
                      <div v-if="row.legacy_unallocated_quantity > 0" class="text-xs text-text-light">
                        {{ quantity(row.legacy_unallocated_quantity) }} chưa chốt lô
                      </div>
                    </td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">
                      <strong>{{ quantity(row.available_to_sell) }}</strong>
                      <p class="text-xs leading-5 text-text-light">
                        Ngưỡng: {{ quantity(row.reorder_level) }}
                      </p>
                    </td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">
                      {{ money(row.value) }}
                      <p v-if="row.value === null" class="text-xs leading-5 text-text-light">
                        Đã biết: {{ money(row.known_value) }}
                      </p>
                    </td></template
                  >
                  <template v-else
                    ><td class="min-w-[150px] p-3 text-sm">
                      <strong>{{ row.lot_code }}</strong>
                      <p class="text-xs leading-5 text-text-light">
                        {{ row.supplier_name || "Chưa ghi NCC" }}
                      </p>
                      <span class="inline-block whitespace-nowrap rounded-lg bg-bg px-2 py-1 text-xs">{{
                        lotStatus[row.status] || row.status
                      }}</span>
                    </td>
                    <td class="whitespace-nowrap p-3 text-sm">
                      <span
                        :class="
                          row.expired
                            ? 'text-red-600'
                            : row.expiring
                              ? 'text-amber-700'
                              : ''
                        "
                        >{{ dateText(row.expires_on) }}</span
                      >
                      <p class="text-xs leading-5 text-text-light">
                        {{
                          row.expired
                            ? "Đã hết hạn"
                            : row.expiring
                              ? "Sắp hết hạn"
                              : !row.expires_on
                                ? "Chưa có hạn dùng"
                                : ""
                        }}
                      </p>
                    </td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">{{ quantity(row.quantity) }}</td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">{{ quantity(row.reserved_quantity) }}</td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">
                      {{ quantity(row.available_to_sell) }}
                      <div v-if="row.legacy_unallocated_quantity > 0" class="text-xs text-text-light">
                        SKU còn {{ quantity(row.legacy_unallocated_quantity) }} chưa chốt lô
                      </div>
                    </td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">{{ money(row.unit_cost, 4) }}</td>
                    <td class="whitespace-nowrap text-right font-mono p-3 text-sm">{{ money(row.value) }}</td></template
                  >
                  <td class="min-w-[190px] p-3 text-sm">
                    <details v-if="row.issues.length" class="mb-2">
                      <summary
                        class="cursor-pointer font-semibold text-amber-700"
                      >
                        {{ row.issues.length }} cảnh báo
                      </summary>
                      <ul class="mt-2 list-disc pl-4 text-xs leading-6">
                        <li v-for="issue in row.issues" :key="issue">
                          {{ issue }}
                        </li>
                      </ul>
                    </details>
                    <p v-if="row.coverage_start" class="text-xs leading-5 text-text-light">
                      Mở sổ: {{ dateText(row.coverage_start) }}
                    </p>
                    <div class="flex flex-col items-start gap-2">
                      <button
                        v-if="result.view === 'ledger'"
                        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                        @click="journal(row)"
                       type="button">
                        <Icon icon="solar:clipboard-list-bold-duotone" class="shrink-0" aria-hidden="true" />
                        Xem nhật ký</button
                      ><button
                        v-if="result.view === 'stock'"
                        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                        @click="lots(row)"
                       type="button">
                         <Icon icon="solar:box-bold-duotone" class="shrink-0" aria-hidden="true" />
                        Xem các lô</button
                      ><button
                        v-if="result.view === 'lots' && row.receipt_document_id"
                        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                        @click="
                          detail = {
                            kind: 'document',
                            id: row.receipt_document_id,
                          }
                        "
                       type="button">
                         <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                        Xem chứng từ nhận lô
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <FinancePagination :count="result.data.length"
            :meta="result.meta"
            :loading="loading"
            @page="page"
          />
        </section>
      </template>
      <InventoryReportDetail
        v-if="detail"
        :key="`${detail.kind}-${detail.id}`"
        :target="detail"
        @close="detail = null"
      />
    </template>
  </div>
</template>

<style scoped>
.inventory-report .fin-tabs {
  flex-wrap: wrap;
}
</style>