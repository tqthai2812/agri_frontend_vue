<script setup>
import {
    ref,
    reactive,
    computed,
    onMounted,
    onBeforeUnmount,
    watch,
} from "vue";
import { useRouter } from "vue-router";
import api from "@/services/admin/finance.service";
import {
    useFinance,
    money,
    dateTime,
    monthStart,
    today,
    errorText,
    sourceLabel,
} from "@/composables/useFinance";
import Chart from "@/components/admin/finance/ProfitChart.vue";
import Pager from "@/components/admin/finance/FinancePagination.vue";
import Evidence from "@/components/admin/finance/FinanceEvidence.vue";
import "@/assets/finance.css";
const { auth, allowed, can, data, loading, error, load } =
    useFinance("report.profit.view");
const router = useRouter();
const dates = reactive({ date_from: monthStart(), date_to: today() }),
    tab = ref("summary"),
    exporting = ref(false),
    evidence = ref(null);
let exportController;
let applied = { ...dates },
    pages = { orders_page: 1, expenses_page: 1, issues_page: 1 };
const result = computed(() => data.value?.data),
    dirty = computed(
        () =>
            dates.date_from !== applied.date_from ||
            dates.date_to !== applied.date_to,
    );
const tabs = [
    ["summary", "Tổng quan"],
    ["orders", "Đơn hoàn thành"],
    ["expenses", "Khoản chi ghi sổ"],
    ["categories", "Theo danh mục"],
    ["issues", "Cần đối chiếu"],
];
const kpis = [
    ["net_sales", "Doanh thu hàng sau giảm"],
    ["shipping_charged", "Phí giao hàng thu khách"],
    ["cost_total", "Giá vốn hàng đã bán"],
    ["gross_profit", "Lãi gộp hàng hóa"],
    ["expenses", "Chi phí ghi sổ (ròng)"],
    ["pretax_profit", "Lợi nhuận trước thuế"],
];
async function fetchReport(apply = false) {
    if (apply) {
        applied = { ...dates };
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
async function exportCsv(set = tab.value) {
    if (exporting.value) return;
    exporting.value = true;
    error.value = "";
    exportController = new AbortController();
    const actor = auth.user?.id;
    try {
        const r = await api.export(
            { ...applied, dataset: set },
            exportController.signal,
        );
        if (
            !allowed.value ||
            actor !== auth.user?.id ||
            exportController.signal.aborted
        )
            return;
        const url = URL.createObjectURL(r.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `loi-nhuan-${set}-${applied.date_from}-${applied.date_to}.csv`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        if (e.code !== "ERR_CANCELED" && e.name !== "AbortError")
            error.value = await errorText(e);
    } finally {
        exporting.value = false;
    }
}
watch(
    () => [auth.user?.id, allowed.value],
    () => {
        evidence.value = null;
        exportController?.abort();
    },
);
onBeforeUnmount(() => exportController?.abort());
watch(allowed, (v) => {
    if (v) fetchReport();
});
onMounted(() => fetchReport());
</script>
<template>
    <section class="finance">
        <p v-if="!allowed" class="fin-error" role="alert">
            Bạn không có quyền xem báo cáo lợi nhuận.
        </p>
        <template v-else>
            <header class="mb-6">
                <h1>Báo cáo lợi nhuận</h1>
                <p class="fin-note">
                    Doanh thu và giá vốn theo ngày hoàn thành đơn · Chi phí theo ngày phát
                    sinh · Giờ Việt Nam
                </p>
            </header>
            <form class="fin-card fin-toolbar" @submit.prevent="fetchReport(true)">
                <label>Từ ngày<input v-model="dates.date_from" type="date" required /></label><label>Đến ngày<input
                        v-model="dates.date_to" type="date" required /></label><button class="fin-btn fin-primary"
                    :disabled="loading">Áp dụng</button><button type="button" class="fin-btn" :disabled="loading"
                    @click="quick('month')">
                    Tháng này</button><button type="button" class="fin-btn" :disabled="loading"
                    @click="quick('previous')">
                    Tháng trước</button><button type="button" class="fin-btn" :disabled="loading"
                    @click="quick('year')">
                    Năm nay</button><button type="button" class="fin-btn" :disabled="loading" @click="fetchReport()">
                    Tải lại
                </button>
            </form>
            <p v-if="dirty" class="fin-note mb-3">
                Bạn đã đổi ngày. Bấm Áp dụng để cập nhật báo cáo.
            </p>
            <p v-if="error" role="alert" class="fin-error">{{ error }}</p>
            <p v-if="loading" class="fin-card py-12 text-center">
                Đang tổng hợp số liệu...
            </p>
            <template v-else-if="result">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p class="fin-note">
                        Đang xem: {{ result.period.date_from }} →
                        {{ result.period.date_to }} · Lập lúc
                        {{ dateTime(result.generated_at) }}
                    </p>
                    <button v-if="can('report.profit.export')" class="fin-btn" :disabled="exporting"
                        @click="exportCsv()">
                        {{ exporting ? "Đang xuất..." : "Xuất tab này (CSV)" }}
                    </button>
                </div>
                <p v-if="
                    !result.quality.profit_complete ||
                    result.quality.undated_completed_all_time
                " class="fin-warning mb-4">
                    {{
                        result.summary.completed_orders - result.summary.profit_ready_orders
                    }}
                    đơn trong kỳ chưa đủ dữ liệu tính lợi nhuận.
                    {{ result.quality.undated_completed_all_time }} đơn hoàn thành trong
                    toàn hệ thống thiếu ngày hoàn thành.
                    <button class="fin-link" @click="tab = 'issues'">
                        Xem dữ liệu cần đối chiếu
                    </button>
                </p>
                <nav class="fin-tabs" aria-label="Các phần báo cáo">
                    <button v-for="[key, label] in tabs" :key="key" class="fin-btn" :class="{ active: tab === key }"
                        :aria-pressed="tab === key" @click="tab = key">
                        {{ label
                        }}<span v-if="key === 'issues'">({{ result.issues.meta.total }})</span>
                    </button>
                </nav>
                <template v-if="tab === 'summary'">
                    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <article v-for="[key, label] in kpis" :key="key" class="fin-card">
                            <p class="fin-note">{{ label }}</p>
                            <strong class="mt-2 block text-xl"
                                :class="key === 'pretax_profit' ? 'text-emerald-600' : ''">{{ money(result.summary[key])
                                }}</strong>
                        </article>
                    </div>
                    <p class="fin-note my-4">
                        {{ result.summary.completed_orders }} đơn hoàn thành ·
                        {{ result.summary.posted_entries }} dòng chi phí ghi sổ ·
                        {{ result.quality.payment_review_orders }} đơn cần đối chiếu thanh
                        toán.
                    </p>
                    <div class="fin-card">
                        <h2 class="mb-4">Diễn biến theo ngày</h2>
                        <Chart :rows="result.daily" />
                        <details class="mt-5">
                            <summary class="fin-link cursor-pointer">
                                Xem bảng số liệu theo ngày
                            </summary>
                            <button v-if="can('report.profit.export')" class="fin-btn my-3" :disabled="exporting"
                                @click="exportCsv('daily')">
                                Xuất bảng ngày
                            </button>
                            <div class="fin-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Ngày</th>
                                            <th>Doanh thu hàng</th>
                                            <th>Phí giao thu khách</th>
                                            <th>Giá vốn</th>
                                            <th>Chi phí</th>
                                            <th>Lợi nhuận</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="d in result.daily" :key="d.date">
                                            <td>{{ d.date }}</td>
                                            <td class="fin-money">{{ money(d.net_sales) }}</td>
                                            <td class="fin-money">{{ money(d.shipping_charged) }}</td>
                                            <td class="fin-money">{{ money(d.cost_total) }}</td>
                                            <td class="fin-money">{{ money(d.expenses) }}</td>
                                            <td class="fin-money">{{ money(d.pretax_profit) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </div>
                    <p class="fin-note mt-4">
                        Lợi nhuận trước thuế = doanh thu hàng sau giảm + phí giao hàng thu
                        khách − giá vốn − chi phí ghi sổ ròng. Đây là báo cáo quản trị theo
                        kỳ; không phải số tiền thực thu, thực chi hay báo cáo thuế. Chi phí
                        chung không tự phân bổ cho từng sản phẩm.
                    </p>
                </template>
                <div v-else-if="tab === 'orders'" class="fin-card">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Đơn hàng</th>
                                    <th>Hoàn thành</th>
                                    <th>Doanh thu hàng</th>
                                    <th>Giá vốn</th>
                                    <th>Lãi gộp hàng</th>
                                    <th>Thanh toán</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="o in result.orders.data" :key="o.id">
                                    <td>
                                        <button v-if="can('order.view')" class="fin-link"
                                            @click="evidence = { kind: 'orders', id: o.id }">
                                            {{ o.code }}</button><span v-else>{{ o.code }}</span>
                                    </td>
                                    <td class="whitespace-nowrap">
                                        {{ dateTime(o.completed_at) }}
                                    </td>
                                    <td class="fin-money">{{ money(o.net_sales) }}</td>
                                    <td class="fin-money">{{ money(o.cost_total) }}</td>
                                    <td class="fin-money">{{ money(o.gross_profit) }}</td>
                                    <td>
                                        {{
                                            {
                                                paid: "Đã thu hợp lệ",
                                                cod_uncollected: "COD chưa thu",
                                                review: "Cần đối chiếu",
                                            }[o.payment_state]
                                        }}
                                    </td>
                                </tr>
                                <tr v-if="!result.orders.data.length">
                                    <td colspan="6">Không có đơn hoàn thành trong kỳ.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Pager :meta="result.orders.meta" @page="page('orders', $event)" />
                </div>
                <div v-else-if="tab === 'expenses'" class="fin-card">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Khoản chi</th>
                                    <th>Ngày phát sinh</th>
                                    <th>Danh mục / Nguồn</th>
                                    <th>Nội dung</th>
                                    <th class="fin-money">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="e in result.expenses.data" :key="e.id">
                                    <td>
                                        <button v-if="can('expense.view')" class="fin-link" @click="expense(e.id)">
                                            {{ e.code }}</button><span v-else>{{ e.code }}</span>
                                    </td>
                                    <td class="whitespace-nowrap">
                                        {{ dateTime(e.incurred_at) }}
                                    </td>
                                    <td>
                                        {{ e.category_name }}<br />{{ sourceLabel(e.source) }}
                                    </td>
                                    <td class="min-w-48 max-w-96">{{ e.description }}</td>
                                    <td class="fin-money">{{ money(e.amount) }}</td>
                                </tr>
                                <tr v-if="!result.expenses.data.length">
                                    <td colspan="5">Không có khoản chi đã ghi sổ trong kỳ.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Pager :meta="result.expenses.meta" @page="page('expenses', $event)" />
                </div>
                <div v-else-if="tab === 'categories'" class="fin-card">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Danh mục</th>
                                    <th>Số dòng</th>
                                    <th>Chi phí dương</th>
                                    <th>Đảo giảm</th>
                                    <th>Chi phí ròng</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="c in result.categories" :key="c.id">
                                    <td>
                                        <button v-if="can('expense.view')" class="fin-link" @click="category(c.id)">
                                            {{ c.name }}</button><span v-else>{{ c.name }}</span>
                                    </td>
                                    <td>{{ c.count }}</td>
                                    <td class="fin-money">{{ money(c.positive) }}</td>
                                    <td class="fin-money">{{ money(c.reversals) }}</td>
                                    <td class="fin-money">{{ money(c.net) }}</td>
                                </tr>
                                <tr v-if="!result.categories.length">
                                    <td colspan="5">Chưa có chi phí ghi sổ trong kỳ.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-else class="fin-card">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Chứng từ</th>
                                    <th>Cần kiểm tra</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i in result.issues.data" :key="i.kind + ':' + i.id">
                                    <td>
                                        <button v-if="i.kind === 'order' && can('order.view')" class="fin-link"
                                            @click="evidence = { kind: 'orders', id: i.id }">
                                            {{ i.code }}</button><button
                                            v-else-if="i.kind === 'expense' && can('expense.view')" class="fin-link"
                                            @click="expense(i.id)">
                                            {{ i.code }}</button><span v-else>{{ i.code }}</span>
                                    </td>
                                    <td>{{ i.message }}</td>
                                </tr>
                                <tr v-if="!result.issues.data.length">
                                    <td colspan="2">
                                        Không phát hiện vấn đề trong các kiểm tra số liệu của báo
                                        cáo.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Pager :meta="result.issues.meta" @page="page('issues', $event)" />
                </div>
            </template>
            <Evidence v-if="evidence" v-bind="evidence" @close="evidence = null" />
        </template>
    </section>
</template>