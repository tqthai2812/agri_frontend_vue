<script setup>
import { ref, reactive, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FinancePagination from "@/components/admin/finance/FinancePagination.vue";
import InventoryReportDetail from "@/components/admin/inventory-report/InventoryReportDetail.vue";
import InventoryAdjustmentDialog from "@/components/admin/inventory-report/InventoryAdjustmentDialog.vue";
import { getPendingAdjustment } from "@/composables/useInventoryAdjustment";
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
const canAdjust = computed(() => canView.value && !!auth.user?.id && auth.hasPermission("inventory.create"));
const adjustment = ref(null);
const pendingAdjustment = ref(null);
const savedAdjustment = ref(null);
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

function refreshPending() {
    pendingAdjustment.value = canAdjust.value ? getPendingAdjustment(auth.user?.id) : null;
}

function openAdjustment(row) {
    if (!canAdjust.value || loading.value) return;
    savedAdjustment.value = null;
    refreshPending();
    adjustment.value = pendingAdjustment.value
        ? { package_id: pendingAdjustment.value.payload.package_id, lot_id: pendingAdjustment.value.payload.lot_id }
        : { package_id: Number(row.package_id), lot_id: Number(row.lot_id) };
}

async function adjusted(record) {
    const actor = auth.user?.id;
    adjustment.value = null;
    refreshPending();
    savedAdjustment.value = record;
    if (!applied.value || !canView.value) return;
    await load({ ...applied.value });
    if (actor !== auth.user?.id || !canView.value || !result.value) return;
    if (Number(result.value.meta.current_page) > Number(result.value.meta.last_page)) {
        applied.value = { ...applied.value, page: Math.max(1, Number(result.value.meta.last_page)) };
        await load({ ...applied.value });
    }
}

watch(() => [auth.user?.id, canAdjust.value], () => {
    adjustment.value = null;
    savedAdjustment.value = null;
    refreshPending();
}, { immediate: true });
watch(
    () => [auth.user?.id, canView.value],
    () => {
        detail.value = null;
        if (canView.value) apply();
    },
    { immediate: true },
);
</script>
<template>
    <div class="finance inventory-report min-w-0">
        <div v-if="canView && savedAdjustment" role="status"
            class="fin-ok mb-4 flex flex-wrap items-center justify-between gap-3">
            <span>Đã ghi sổ điều chỉnh {{ Number(savedAdjustment.quantity_change) > 0 ? '+' : '' }}{{
                quantity(savedAdjustment.quantity_change) }} đơn vị quy cách.</span>
            <button v-if="savedAdjustment.document_id" type="button" class="fin-link"
                @click="detail = { kind: 'document', id: Number(savedAdjustment.document_id) }">Xem phiếu điều
                chỉnh</button>
        </div>
        <div v-if="canAdjust && pendingAdjustment"
            class="fin-warning mb-4 flex flex-wrap items-center justify-between gap-3">
            <span>Còn một thao tác điều chỉnh cần kiểm tra kết quả: {{ pendingAdjustment.sku }} · lô {{
                pendingAdjustment.lot_code }}.</span>
            <button type="button" class="fin-btn" :disabled="loading || !!adjustment"
                @click="openAdjustment(pendingAdjustment.payload)">Tiếp tục kiểm tra</button>
        </div>
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Vận hành cửa hàng
                </p>
                <h1>Báo cáo kho</h1>
                <p class="fin-note mt-2">
                    Đối chiếu số lượng, giá trị tồn và hạn dùng từ sổ kho theo lô.
                </p>
            </div>
            <span class="fin-badge">{{ canAdjust ? 'Điều chỉnh theo lô' : 'Chỉ xem dữ liệu' }}</span>
        </header>
        <div v-if="!canView" role="alert" class="fin-warning mt-6">
            Bạn cần quyền xem kho và xem báo cáo kho để sử dụng trang này.
        </div>
        <template v-else>
            <nav class="fin-tabs" aria-label="Loại báo cáo kho">
                <button v-for="t in tabs" :key="t.id" class="fin-btn" :class="{ active: filters.view === t.id }"
                    :aria-pressed="filters.view === t.id" @click="tab(t.id)">
                    <Icon :icon="t.icon" class="text-lg" />{{ t.label }}
                </button>
            </nav>
            <section class="fin-card">
                <form class="fin-toolbar" @submit.prevent="apply">
                    <label class="grow">Sản phẩm / SKU<input v-model="filters.search" maxlength="100"
                            placeholder="Tên sản phẩm hoặc mã SKU" /></label>
                    <template v-if="filters.view === 'ledger'"><label>Từ ngày<input type="date"
                                v-model="filters.date_from" :max="today" required /></label><label>Đến ngày<input
                                type="date" v-model="filters.date_to" :min="filters.date_from" :max="today"
                                required /></label></template>
                    <label>Điều kiện<select v-model="filters.condition">
                            <option v-for="[key, label] in options" :key="key" :value="key">
                                {{ label }}
                            </option>
                        </select></label>
                    <label v-if="filters.view === 'lots' && filters.condition === 'expiring'">Trong vòng<select
                            v-model.number="filters.days">
                            <option :value="30">30 ngày</option>
                            <option :value="60">60 ngày</option>
                            <option :value="90">90 ngày</option>
                        </select></label>
                    <button class="fin-btn fin-primary" :disabled="loading">
                        Áp dụng
                    </button>
                </form>
                <div class="flex flex-wrap items-center gap-2">
                    <template v-if="filters.view === 'ledger'"><button class="fin-btn" @click="quick()">Tháng
                            này</button><button class="fin-btn" @click="quick(true)">
                            Tháng trước
                        </button></template><button v-if="selectedSku" class="fin-btn" @click="clearSku">
                        {{ selectedSku }} · Bỏ chọn SKU ✕
                    </button>
                    <p class="fin-note">
                        {{
                            filters.view === "ledger"
                                ? "Kỳ tối đa 366 ngày, theo giờ Việt Nam."
                                : "Số liệu hiện tại; chỉ tính giá trị các lô còn tồn."
                        }}
                    </p>
                </div>
            </section>
            <div v-if="error" role="alert" class="fin-error">{{ error }}</div>
            <p v-if="loading" role="status" class="py-12 text-center fin-note">
                Đang tổng hợp sổ kho…
            </p>
            <template v-else-if="result">
                <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article class="fin-card">
                        <p class="fin-note">
                            {{ result.view === "lots" ? "Lô phù hợp" : "SKU phù hợp" }}
                        </p>
                        <p class="mt-2 text-2xl font-bold">
                            {{ quantity(result.summary.rows) }}
                        </p>
                        <p class="fin-note">Toàn bộ bộ lọc, không chỉ trang này</p>
                    </article>
                    <article class="fin-card">
                        <p class="fin-note">Cần đối chiếu</p>
                        <p class="mt-2 text-2xl font-bold" :class="result.summary.issue_rows ? 'text-amber-700' : ''">
                            {{ quantity(result.summary.issue_rows) }}
                        </p>
                        <p class="fin-note">Dòng có cảnh báo dữ liệu</p>
                    </article>
                    <template v-if="result.view !== 'ledger'">
                        <article class="fin-card">
                            <p class="fin-note">Giá trị tồn theo bộ lọc</p>
                            <p class="mt-2 text-xl font-bold">
                                {{ money(result.summary.total_value) }}
                            </p>
                            <p class="fin-note">
                                {{ quantity(result.summary.unknown_cost_lots) }} lô chưa xác
                                định giá trị
                            </p>
                        </article>
                        <article class="fin-card">
                            <p class="fin-note">Phần giá trị đã xác định</p>
                            <p class="mt-2 text-xl font-bold">
                                {{ money(result.summary.known_value) }}
                            </p>
                            <p class="fin-note">Tổng giá vốn × tồn từng lô, làm tròn 2 số</p>
                        </article>
                    </template>
                    <article v-else class="fin-card sm:col-span-2">
                        <p class="fin-note">Kỳ đang hiển thị</p>
                        <p class="mt-2 text-lg font-bold">
                            {{ dateText(result.period.date_from) }} –
                            {{ dateText(result.period.date_to) }}
                        </p>
                        <p class="fin-note">
                            Tồn cuối = tồn đầu + nhập − xuất + điều chỉnh tăng − điều chỉnh
                            giảm + mở sổ.
                        </p>
                    </article>
                </div>
                <p v-if="result.view === 'ledger'" class="fin-warning mt-5">
                    “Mở sổ” là tồn cũ được đưa vào sổ lô, không phải hàng mua thêm. Kỳ
                    trước mốc chuyển đổi hoặc có nhật ký lệch sẽ hiện “Chưa xác định”. Số
                    lượng tính theo từng quy cách; không cộng các SKU khác đơn vị.
                </p>
                <p v-else class="fin-note mt-4">
                    Ngày xét hạn theo hệ thống kho:
                    {{ dateText(result.eligibility_date) }}. Lô hết hạn/khóa/cách ly vẫn
                    nằm trong tồn vật lý và giá trị tồn cho đến khi có phiếu xử lý. Giữ
                    hàng được theo dõi theo SKU, chưa phân bổ cho từng lô.
                </p>
                <section class="fin-card mt-5">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p class="fin-note">
                            Tổng hợp lúc {{ dateText(result.generated_at) }}
                        </p>
                        <div class="flex flex-wrap items-center gap-3">
                            <button class="fin-btn" :disabled="loading" @click="load(applied)">
                                Tải lại
                            </button>
                            <ReportExportActions v-if="canExport" report-type="inventory_report"
                                :filters="exportFilters" :disabled="loading || !applied"
                                required-permission="report.inventory.export" button-label="Xuất Excel" />
                        </div>
                    </div>
                    <p v-if="!result.data.length" class="py-10 text-center fin-note">
                        Không có dữ liệu phù hợp bộ lọc.
                    </p>
                    <div v-else class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>SKU / sản phẩm</th>
                                    <template v-if="result.view === 'ledger'">
                                        <th class="fin-money">Tồn đầu</th>
                                        <th class="fin-money">Nhập NCC</th>
                                        <th class="fin-money">Xuất bán</th>
                                        <th class="fin-money">ĐC tăng</th>
                                        <th class="fin-money">ĐC giảm</th>
                                        <th class="fin-money">Mở sổ</th>
                                        <th class="fin-money">Tồn cuối</th>
                                    </template><template v-else-if="result.view === 'stock'">
                                        <th class="fin-money">Vật lý / tổng lô</th>
                                        <th class="fin-money">Hợp lệ</th>
                                        <th class="fin-money">Đang giữ</th>
                                        <th class="fin-money">Có thể bán</th>
                                        <th class="fin-money">Giá trị tồn</th>
                                    </template><template v-else>
                                        <th>Lô / nhà cung cấp</th>
                                        <th>Hạn dùng</th>
                                        <th class="fin-money">Còn tồn</th>
                                        <th class="fin-money">Giá vốn / đơn vị</th>
                                        <th class="fin-money">Giá trị</th>
                                    </template>
                                    <th>Đối chiếu / thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in result.data" :key="row.lot_id || row.package_id">
                                    <td class="min-w-[190px]">
                                        <strong>{{ row.sku }}</strong>
                                        <p>{{ row.product_name }}</p>
                                        <p class="fin-note">
                                            {{ row.variant_name }} · {{ row.size }} {{ row.unit }}
                                        </p>
                                    </td>
                                    <template v-if="result.view === 'ledger'">
                                        <td v-for="key in [
                                            'opening',
                                            'receipts',
                                            'sale_issues',
                                            'adjustment_in',
                                            'adjustment_out',
                                            'opening_entries',
                                            'closing',
                                        ]" :key="key" class="fin-money" :class="row[key] === null ? 'text-amber-700' : ''">
                                            {{ quantity(row[key]) }}
                                        </td>
                                    </template>
                                    <template v-else-if="result.view === 'stock'">
                                        <td class="fin-money">
                                            {{ quantity(row.physical) }} /
                                            {{ quantity(row.lot_quantity) }}
                                        </td>
                                        <td class="fin-money">{{ quantity(row.eligible) }}</td>
                                        <td class="fin-money">{{ quantity(row.reserved) }}</td>
                                        <td class="fin-money">
                                            <strong>{{ quantity(row.available_to_sell) }}</strong>
                                            <p class="fin-note">
                                                Ngưỡng: {{ quantity(row.reorder_level) }}
                                            </p>
                                        </td>
                                        <td class="fin-money">
                                            {{ money(row.value) }}
                                            <p v-if="row.value === null" class="fin-note">
                                                Đã biết: {{ money(row.known_value) }}
                                            </p>
                                        </td>
                                    </template>
                                    <template v-else>
                                        <td class="min-w-[150px]">
                                            <strong>{{ row.lot_code }}</strong>
                                            <p class="fin-note">
                                                {{ row.supplier_name || "Chưa ghi NCC" }}
                                            </p>
                                            <span class="fin-badge">{{
                                                lotStatus[row.status] || row.status
                                                }}</span>
                                        </td>
                                        <td class="whitespace-nowrap">
                                            <span :class="row.expired
                                                    ? 'text-red-600'
                                                    : row.expiring
                                                        ? 'text-amber-700'
                                                        : ''
                                                ">{{ dateText(row.expires_on) }}</span>
                                            <p class="fin-note">
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
                                        <td class="fin-money">{{ quantity(row.quantity) }}</td>
                                        <td class="fin-money">{{ money(row.unit_cost, 4) }}</td>
                                        <td class="fin-money">{{ money(row.value) }}</td>
                                    </template>
                                    <td class="min-w-[190px]">
                                        <details v-if="row.issues.length" class="mb-2">
                                            <summary class="cursor-pointer font-semibold text-amber-700">
                                                {{ row.issues.length }} cảnh báo
                                            </summary>
                                            <ul class="mt-2 list-disc pl-4 text-xs leading-6">
                                                <li v-for="issue in row.issues" :key="issue">
                                                    {{ issue }}
                                                </li>
                                            </ul>
                                        </details>
                                        <p v-if="row.coverage_start" class="fin-note">
                                            Mở sổ: {{ dateText(row.coverage_start) }}
                                        </p>
                                        <div class="flex flex-col items-start gap-2">
                                            <button v-if="result.view === 'lots' && canAdjust" type="button"
                                                class="fin-btn"
                                                :disabled="loading || !!adjustment || !!pendingAdjustment"
                                                @click="openAdjustment(row)">Điều chỉnh tồn</button>
                                            <button v-if="result.view === 'ledger'" class="fin-link"
                                                @click="journal(row)">
                                                Xem nhật ký</button><button v-if="result.view === 'stock'"
                                                class="fin-link" @click="lots(row)">
                                                Xem các lô</button><button
                                                v-if="result.view === 'lots' && row.receipt_document_id"
                                                class="fin-link" @click="
                                                    detail = {
                                                        kind: 'document',
                                                        id: row.receipt_document_id,
                                                    }
                                                    ">
                                                Chứng từ nhận lô
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <FinancePagination :meta="result.meta" :loading="loading" @page="page" />
                </section>
            </template>
            <InventoryReportDetail v-if="detail" :key="`${detail.kind}-${detail.id}`" :target="detail"
                @close="detail = null" />
            <InventoryAdjustmentDialog v-if="canAdjust && adjustment"
                :key="`${adjustment.package_id}-${adjustment.lot_id}`" :target="adjustment"
                @close="adjustment = null; refreshPending()" @saved="adjusted" @pending-change="refreshPending" />
        </template>
    </div>
</template>

<style scoped>
.inventory-report .fin-tabs {
    flex-wrap: wrap;
}
</style>