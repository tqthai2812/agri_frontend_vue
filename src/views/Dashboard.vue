<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useAppStore } from "@/stores/appStore";
import { useDashboardStore } from "@/stores/admin/dashboardStore";
import DashboardDailyReport from "@/components/admin/dashboard/DashboardDailyReport.vue";
import DashboardSalesChart from "@/components/admin/dashboard/DashboardSalesChart.vue";

const auth = useAuthStore();
const app = useAppStore();
const store = useDashboardStore();
const canView = computed(
  () => auth.isAuthenticated && auth.hasPermission("dashboard.view"),
);
const canViewOrders = computed(() => auth.hasPermission("order.view"));
const data = computed(() => store.overview);
const selectedMetric = ref("net_sales");
const statusNames = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};
const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipping: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};
const count = (value) => new Intl.NumberFormat("vi-VN").format(value ?? 0);
function money(value) {
  if (value === null || value === undefined) return "Chưa đủ dữ liệu";
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return "Chưa đủ dữ liệu";
  const fraction = (match[3] || "").padEnd(2, "0");
  // Format decimal strings without losing integer precision through Number().
  return `${match[1]}${BigInt(match[2]).toLocaleString("vi-VN")}${fraction === "00" ? "" : `,${fraction}`} ₫`;
}
function date(value) {
  return String(value || "")
    .split("-")
    .reverse()
    .join("/");
}
function time(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
}
const unapplied = computed(
  () =>
    data.value &&
    (store.filters.date_from !== data.value.period.date_from ||
      store.filters.date_to !== data.value.period.date_to),
);
// Tiền từ API là decimal string; tính % bằng BigInt để không mất chữ số.
function decimalUnits(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const units =
    BigInt(match[2]) * 100n + BigInt((match[3] || "").padEnd(2, "0"));
  return match[1] ? -units : units;
}
function metricValue(source, key) {
  return key === "created_orders"
    ? source?.order_counts?.all
    : source?.summary?.[key];
}
function metricChange(card) {
  if (store.comparisonLoading)
    return {
      text: "…",
      direction: "neutral",
      hint: "Đang tải số liệu kỳ trước.",
    };
  if (store.comparisonError || !store.previousOverview)
    return {
      text: "—",
      direction: "neutral",
      hint: store.comparisonError || "Chưa có số liệu kỳ trước.",
    };
  const currentRaw = metricValue(data.value, card.key);
  const previousRaw = metricValue(store.previousOverview, card.key);
  const current = decimalUnits(currentRaw),
    previous = decimalUnits(previousRaw);
  if (current === null || previous === null)
    return {
      text: "—",
      direction: "neutral",
      hint: "Một trong hai kỳ chưa đủ dữ liệu, chưa thể tính % thay đổi.",
    };
  const prefix = `Kỳ trước: ${card.money ? money(previousRaw) : count(previousRaw)}. `;
  const delta = current - previous;
  const direction = delta > 0n ? "up" : delta < 0n ? "down" : "neutral";
  if (delta === 0n)
    return { text: "0%", direction, hint: prefix + "Không thay đổi." };
  if (previous === 0n)
    return {
      text: "Từ 0",
      direction,
      hint: prefix + "Không tính % khi số kỳ trước bằng 0.",
    };
  // Với kỳ trước âm (ví dụ lỗ), mẫu số là trị tuyệt đối để hướng tăng/giảm không bị đảo.
  const base = previous < 0n ? -previous : previous;
  const absoluteDelta = delta < 0n ? -delta : delta;
  const hundredths = (absoluteDelta * 10000n + base / 2n) / base;
  const percent =
    hundredths === 0n
      ? "<0,01"
      : `${(hundredths / 100n).toLocaleString("vi-VN")},${String(hundredths % 100n).padStart(2, "0")}`;
  return {
    text: `${delta > 0n ? "+" : "−"}${percent}%`,
    direction,
    hint:
      prefix +
      (previous < 0n
        ? "% thay đổi tính trên trị tuyệt đối của số kỳ trước."
        : "So với kỳ liền trước cùng số ngày."),
  };
}
const cards = computed(() => {
  if (!data.value) return [];
  const s = data.value.summary;
  return [
    {
      key: "created_orders",
      label: "Đơn tạo trong kỳ",
      value: count(data.value.order_counts.all),
      icon: "solar:cart-large-2-bold-duotone",
      note: "Theo ngày đặt đơn",
      money: false,
    },
    {
      key: "completed_orders",
      label: "Đơn hoàn thành trong kỳ",
      value: count(s.completed_orders),
      icon: "solar:check-circle-bold-duotone",
      note: "Theo ngày hoàn thành",
      money: false,
    },
    {
      key: "net_sales",
      label: "Doanh thu tiền hàng",
      value: money(s.net_sales),
      icon: "solar:wallet-money-bold-duotone",
      note: "Đã trừ giảm giá, chưa gồm phí giao hàng",
      money: true,
    },
    {
      key: "shipping_charged",
      label: "Phí giao hàng trên đơn",
      value: money(s.shipping_charged),
      icon: "solar:delivery-bold-duotone",
      note: "Phí tính cho khách của đơn hoàn thành",
      money: true,
    },
    {
      key: "cost_total",
      label: "Giá vốn hàng đã bán",
      value: money(s.cost_total),
      icon: "solar:box-bold-duotone",
      note:
        s.cost_total === null
          ? `Đã xác định: ${money(s.known_cost)}`
          : "Giá vốn lưu theo lô khi xuất hàng",
      money: true,
    },
    {
      key: "gross_profit",
      label: "Lợi nhuận gộp tiền hàng",
      value: money(s.gross_profit),
      icon: "solar:chart-2-bold-duotone",
      note: "Tiền hàng sau giảm giá − giá vốn",
      money: true,
    },
  ].map((card) => ({ ...card, change: metricChange(card) }));
});
// Chọn chỉ số chỉ đổi dữ liệu đang hiển thị; không gọi lại API.
const activeCard = computed(
  () =>
    cards.value.find((card) => card.key === selectedMetric.value) ||
    cards.value[2],
);
const chartModel = computed(() => {
  const metric = activeCard.value;
  if (!data.value || !metric) return { rows: [], type: "line", mode: "daily" };
  const key = metric.key;
  if (key === "created_orders") {
    return {
      type: "bar",
      mode: "status",
      title: "Đơn tạo trong kỳ theo trạng thái",
      description:
        "Trạng thái hiện tại của các đơn được tạo trong kỳ đang xem.",
      badge: "Theo trạng thái",
      column: "Trạng thái",
      rows: Object.entries(statusNames).map(([status, label]) => ({
        key: status,
        label,
        fullLabel: label,
        value: data.value.order_counts[status] ?? null,
      })),
    };
  }
  const daily = data.value.daily || [];
  const optionalDailyMetric = ["shipping_charged", "cost_total"].includes(key);
  // Hai chỉ số này có tổng trong summary; chỉ vẽ theo ngày nếu API thực sự trả trường đó.
  const hasDailyField = daily.some((day) =>
    Object.prototype.hasOwnProperty.call(day, key),
  );
  if (optionalDailyMetric && !hasDailyField) {
    const period = `${date(data.value.period.date_from)} – ${date(data.value.period.date_to)}`;
    return {
      type: "bar",
      mode: "total",
      title: `${metric.label} trong kỳ`,
      description: "Hiện chỉ có tổng trong kỳ, chưa có số liệu theo từng ngày.",
      badge: "Tổng trong kỳ",
      column: "Khoảng thời gian",
      rows: [
        {
          key: "period",
          label: "Tổng trong kỳ",
          fullLabel: period,
          value: data.value.summary[key] ?? null,
        },
      ],
    };
  }
  const descriptions = {
    completed_orders:
      "Số đơn theo ngày hoàn thành, cùng khoảng ngày đang áp dụng.",
    net_sales:
      "Tiền hàng sau giảm giá của đơn hoàn thành; chưa gồm phí giao hàng.",
    shipping_charged: "Phí giao hàng tính cho khách, theo ngày hoàn thành đơn.",
    cost_total: "Giá vốn hàng đã bán, theo ngày hoàn thành đơn.",
    gross_profit:
      "Tiền hàng sau giảm giá trừ giá vốn; chưa trừ chi phí vận hành.",
  };
  return {
    type: "line",
    mode: "daily",
    title: `${metric.label} theo ngày`,
    description: descriptions[key],
    badge: "Theo ngày",
    column: "Ngày",
    rows: daily.map((day) => ({
      key: day.date,
      label: `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`,
      fullLabel: date(day.date),
      value: day[key] ?? null,
    })),
  };
});
function chartValue(value) {
  if (value === null || value === undefined || value === "")
    return "Chưa đủ dữ liệu";
  return activeCard.value?.money ? money(value) : count(value);
}
const warnings = computed(() => {
  if (!data.value) return [];
  const q = data.value.quality;
  return [
    q.undated_completed_all_time > 0 &&
    `${count(q.undated_completed_all_time)} đơn hoàn thành trong toàn hệ thống thiếu ngày hoàn thành, chưa được đưa vào thống kê theo kỳ.`,
    q.missing_cost_orders > 0 &&
    `${count(q.missing_cost_orders)} đơn trong kỳ chưa có đủ giá vốn. Chưa thể kết luận tổng lợi nhuận gộp.`,
    q.inconsistent_sales_orders > 0 &&
    `${count(q.inconsistent_sales_orders)} đơn trong kỳ thiếu hoặc lệch dữ liệu tiền hàng ở các dòng sản phẩm. Cần đối chiếu trước khi tính lãi.`,
    q.invalid_header_orders > 0 &&
    `${count(q.invalid_header_orders)} đơn có số tiền trên đơn không hợp lệ. Tổng tiền tương ứng được để trống.`,
    q.empty_orders > 0 &&
    `${count(q.empty_orders)} đơn hoàn thành không có dòng sản phẩm.`,
  ].filter(Boolean);
});
function refresh() {
  if (canView.value) return store.fetchOverview();
}
function preset(mode) {
  store.preset(mode);
  refresh();
}
watch(
  [canView, () => auth.user?.id],
  () => {
    store.dispose();
    selectedMetric.value = "net_sales";
    if (canView.value) refresh();
  },
  { immediate: true, flush: "sync" },
);
onBeforeUnmount(() => store.dispose());
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text">Tổng quan bán hàng</h1>
        <p class="mt-1 text-sm text-text-light">
          Theo dõi đơn hàng, doanh thu và lợi nhuận gộp của NFarmHouse.
        </p>
      </div>
      <button type="button" :disabled="store.loading || !canView" class="btn-outline-sm disabled:opacity-50"
        @click="refresh">
        <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />Tải lại
      </button>
    </header>
    <p v-if="!canView" role="alert" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      Bạn không có quyền xem Dashboard.
    </p>
    <template v-else>
      <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="refresh">
          <label class="min-w-40 flex-1 text-xs font-semibold text-text-light sm:flex-none">Từ ngày<input
              v-model="store.filters.date_from" type="date" required
              class="mt-2 block w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text" /></label>
          <label class="min-w-40 flex-1 text-xs font-semibold text-text-light sm:flex-none">Đến ngày<input
              v-model="store.filters.date_to" type="date" required :min="store.filters.date_from || undefined"
              class="mt-2 block w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text" /></label>
          <button type="submit" class="btn-primary disabled:opacity-50" :disabled="store.loading">
            Áp dụng
          </button>
          <div class="flex flex-wrap gap-2 sm:ml-auto">
            <button v-for="option in [
              { mode: 'today', label: 'Hôm nay' },
              { mode: 'month', label: 'Tháng này' },
              { mode: '30days', label: '30 ngày qua' },
            ]" :key="option.mode" type="button"
              class="rounded-full border border-border px-3 py-2 text-xs font-semibold text-text-sec hover:bg-primary/10 disabled:opacity-50"
              :disabled="store.loading" @click="preset(option.mode)">
              {{ option.label }}
            </button>
          </div>
        </form>
        <p class="mt-3 text-xs text-text-light">
          Ngày thống kê theo giờ Việt Nam · Mỗi lần xem tối đa 366 ngày.
        </p>
        <p v-if="unapplied" role="status" class="mt-2 text-xs text-amber-600">
          Bạn đã đổi khoảng ngày. Bấm Áp dụng để cập nhật số liệu.
        </p>
      </section>
      <div v-if="store.loading" role="status"
        class="rounded-2xl border border-border bg-surface px-5 py-16 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-3 animate-spin text-3xl text-primary" />
        <p>Đang tổng hợp số liệu...</p>
      </div>
      <div v-else-if="store.error" role="alert"
        class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>{{ store.error }}</p>
        <button type="button" class="mt-3 font-bold underline" @click="refresh">
          Thử lại
        </button>
      </div>
      <template v-else-if="data">
        <div class="flex flex-wrap justify-between gap-2 text-xs text-text-light">
          <span>Đang xem:
            <strong class="text-text">{{ date(data.period.date_from) }} –
              {{ date(data.period.date_to) }}</strong></span><span>Cập nhật: {{ time(data.generated_at) }}</span>
        </div>
        <section v-if="warnings.length" role="status"
          class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 class="flex items-center gap-2 text-sm font-bold">
            <Icon icon="solar:danger-triangle-bold" />Dữ liệu cần đối chiếu
          </h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
          </ul>
        </section>
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-text-light">
          <span>Chọn chỉ số để xem biểu đồ</span>
          <span v-if="store.comparisonPeriod" class="sm:text-right">
            So với {{ store.comparisonPeriod.days }} ngày liền trước:
            <strong class="font-semibold text-text-sec">{{ date(store.comparisonPeriod.date_from) }} –
              {{ date(store.comparisonPeriod.date_to) }}</strong>
          </span>
        </div>
        <p v-if="store.comparisonError" role="status"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {{ store.comparisonError }}
          <button type="button" class="ml-2 font-bold underline" @click="store.retryComparison()">
            Thử lại kỳ trước
          </button>
        </p>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Chọn chỉ số cho biểu đồ">
          <button v-for="card in cards" :key="card.key" type="button"
            class="dashboard-metric min-w-0 rounded-2xl border border-border bg-surface p-5 text-left shadow-sm"
            :class="{ 'is-active': selectedMetric === card.key }" :aria-pressed="selectedMetric === card.key"
            :aria-label="`Xem biểu đồ: ${card.label}`" :aria-describedby="`metric-change-${card.key}`"
            aria-controls="dashboard-metric-chart" @click="selectedMetric = card.key">
            <div class="flex items-start justify-between gap-3">
              <p class="dashboard-metric-label text-xs font-semibold text-text-light">
                {{ card.label }}
              </p>
              <Icon :icon="card.icon" class="shrink-0 text-2xl text-primary" />
            </div>
            <div class="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <strong class="min-w-0 break-words font-mono text-2xl font-bold text-text">{{ card.value }}</strong>
              <span :id="`metric-change-${card.key}`"
                class="dashboard-change ml-auto inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold tabular-nums"
                :class="`dashboard-change--${card.change.direction}`" :title="card.change.hint"
                :aria-label="`${card.change.text}. ${card.change.hint}`" :data-metric-change="card.key">
                <Icon v-if="card.change.direction !== 'neutral'" :icon="card.change.direction === 'up'
                    ? 'mdi:arrow-top-right'
                    : 'mdi:arrow-bottom-right'
                  " class="text-sm" aria-hidden="true" />
                {{ card.change.text }}
              </span>
            </div>
            <p class="mt-2 text-xs leading-5 text-text-light">
              {{ card.note }}
            </p>
          </button>
        </div>
        <p class="text-xs leading-5 text-text-light">
          <template v-if="store.comparisonLoading">Đang tải kỳ trước để so sánh...</template>
          <template v-else>“Từ 0”: kỳ trước bằng 0 nên không tính %. “—”: chưa đủ dữ liệu để
            so sánh. Nếu kỳ trước âm, tỷ lệ tính trên trị tuyệt đối.</template>
        </p>
        <p class="text-xs leading-6 text-text-light">
          Doanh thu và lợi nhuận tính theo
          <strong class="text-text">ngày hoàn thành</strong>, bao gồm đơn COD
          hoàn thành chưa thu tiền. Lợi nhuận gộp tiền hàng chưa tính phí giao
          hàng, phí thanh toán và chi phí vận hành.
        </p>
        <div v-if="data.summary.gross_profit === null"
          class="rounded-xl border border-border bg-surface p-4 text-sm text-text-sec">
          Lợi nhuận gộp trên
          <strong>{{ count(data.summary.profit_ready_orders) }}/{{
            count(data.summary.completed_orders)
          }}</strong>
          đơn đủ dữ liệu:
          <strong class="font-mono text-text">{{
            money(data.summary.known_gross_profit)
          }}</strong>. Đây là phần đã xác định trong kỳ.
        </div>

        <section id="dashboard-metric-chart" aria-labelledby="dashboard-chart-title"
          class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 id="dashboard-chart-title" class="font-bold text-text" aria-live="polite" aria-atomic="true">
                {{ chartModel.title }}
              </h2>
              <p class="mt-1 text-xs leading-5 text-text-light">
                {{ chartModel.description }}
              </p>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-500">
              <span class="size-1.5 rounded-full bg-red-500" aria-hidden="true"></span>{{ chartModel.badge }}
            </span>
          </div>
          <DashboardSalesChart :rows="chartModel.rows" :chart-type="chartModel.type" :label="activeCard.label"
            :is-money="activeCard.money" :dark="app.darkMode" :format-value="chartValue" />
          <p class="mt-3 text-xs leading-5 text-text-light">
            Nhấp vào ô thống kê phía trên để đổi chỉ số.
            <template v-if="chartModel.mode === 'daily'">Đường biểu đồ bị ngắt tại ngày chưa đủ dữ liệu.</template>
          </p>
          <details class="mt-4 border-t border-border pt-4">
            <summary class="cursor-pointer text-sm font-semibold text-primary">
              Xem bảng số liệu của chỉ số đang chọn
            </summary>
            <div class="mt-3 max-h-80 overflow-auto">
              <table class="w-full text-left text-xs">
                <thead class="sticky top-0 bg-bg text-text-light">
                  <tr>
                    <th class="p-3">{{ chartModel.column }}</th>
                    <th class="p-3 text-right">{{ activeCard.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in chartModel.rows" :key="row.key" class="border-b border-border">
                    <td class="whitespace-nowrap p-3">{{ row.fullLabel }}</td>
                    <td class="whitespace-nowrap p-3 text-right font-mono">
                      {{ chartValue(row.value) }}
                    </td>
                  </tr>
                  <tr v-if="!chartModel.rows.length">
                    <td colspan="2" class="p-5 text-center text-text-light">
                      Chưa có dữ liệu cho khoảng ngày này.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <DashboardDailyReport :rows="data.daily || []" :period="data.period" :disabled="store.loading"
          :unapplied="Boolean(unapplied)" />

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 class="font-bold">Giá trị đơn hoàn thành</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div v-for="row in [
                { label: 'Tiền hàng trước giảm giá', key: 'gross_sales' },
                { label: 'Giảm giá đã áp dụng', key: 'discount' },
                { label: 'Tiền hàng sau giảm giá', key: 'net_sales' },
                {
                  label: 'Phí giao hàng tính cho khách',
                  key: 'shipping_charged',
                },
              ]" :key="row.key" class="flex flex-wrap justify-between gap-2">
                <dt class="text-text-light">{{ row.label }}</dt>
                <dd class="font-mono font-semibold">
                  {{ money(data.summary[row.key]) }}
                </dd>
              </div>
              <div class="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                <dt class="font-bold">Tổng giá trị thanh toán</dt>
                <dd class="font-mono font-bold text-primary">
                  {{ money(data.summary.order_total) }}
                </dd>
              </div>
            </dl>
          </section>
          <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 class="font-bold">Thanh toán của nhóm đơn hoàn thành</h2>
            <p class="mt-1 text-xs leading-5 text-text-light">
              Tình trạng hiện tại của các đơn hoàn thành trong kỳ; không thống
              kê dòng tiền theo ngày thu.
            </p>
            <dl class="mt-4 space-y-4 text-sm">
              <div v-for="row in [
                {
                  key: 'paid',
                  label: 'Đã thu hợp lệ',
                  color: 'text-green-600',
                },
                {
                  key: 'cod_uncollected',
                  label: 'COD chưa xác nhận thu',
                  color: 'text-amber-600',
                },
                {
                  key: 'review',
                  label: 'Cần đối chiếu thanh toán',
                  color: 'text-red-600',
                },
              ]" :key="row.key" class="flex flex-wrap justify-between gap-2">
                <dt :class="row.color">
                  {{ row.label }}
                  <span class="text-xs">({{ count(data.settlement[row.key].count) }} đơn)</span>
                </dt>
                <dd class="font-mono font-semibold">
                  {{ money(data.settlement[row.key].amount) }}
                </dd>
              </div>
            </dl>
            <p v-if="data.settlement.review.count" class="mt-4 text-xs text-text-light">
              Số tiền cần đối chiếu là giá trị của các đơn liên quan, chưa kết
              luận là tiền đã thu.
            </p>
          </section>
        </div>

        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-bold">Trạng thái đơn tạo trong kỳ</h2>
              <p class="mt-1 text-xs text-text-light">
                Lọc theo ngày tạo đơn, hiển thị trạng thái hiện tại.
              </p>
            </div>
            <RouterLink v-if="canViewOrders" :to="{ name: 'admin-orders' }"
              class="text-sm font-semibold text-primary hover:underline">Quản lý đơn hàng</RouterLink>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <div v-for="(label, status) in statusNames" :key="status" class="rounded-xl border border-border p-4">
              <p class="text-xs text-text-light">{{ label }}</p>
              <strong class="mt-2 block text-2xl">{{
                count(data.order_counts[status])
              }}</strong>
            </div>
          </div>
        </section>

        <div class="grid gap-6 xl:grid-cols-2">
          <section class="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 class="font-bold">10 sản phẩm bán chạy</h2>
            <p class="mt-1 text-xs leading-5 text-text-light">
              Từ đơn hoàn thành trong kỳ. Số lượng cộng theo quy cách bán, không
              quy đổi kg/lít.
            </p>
            <p v-if="!data.top_products.length" class="py-12 text-center text-sm text-text-light">
              Chưa có sản phẩm bán trong kỳ.
            </p>
            <div v-else class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="text-xs text-text-light">
                  <tr>
                    <th class="py-3 pr-3">Sản phẩm</th>
                    <th class="p-3 text-right">SL</th>
                    <th class="p-3 text-right">Đơn</th>
                    <th class="py-3 pl-3 text-right">Tiền hàng sau giảm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in data.top_products" :key="product.key" class="border-t border-border">
                    <td class="min-w-36 py-4 pr-3">
                      <span class="mr-2 text-xs text-text-light">{{ index + 1 }}.</span>
                      <RouterLink v-if="product.product_id" :to="{
                        name: 'client-product-detail',
                        params: { id: product.product_id },
                      }" class="font-semibold hover:text-primary">{{ product.name }}</RouterLink><span v-else
                        class="font-semibold">{{
                          product.name
                        }}</span>
                    </td>
                    <td class="p-3 text-right">
                      {{ count(product.quantity) }}
                    </td>
                    <td class="p-3 text-right">
                      {{ count(product.order_count) }}
                    </td>
                    <td class="whitespace-nowrap py-3 pl-3 text-right font-mono text-xs">
                      {{ money(product.net_sales) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 class="font-bold">Đơn tạo gần nhất trong kỳ</h2>
            <p class="mt-1 text-xs text-text-light">
              Tối đa 8 đơn, bao gồm mọi trạng thái.
            </p>
            <p v-if="!data.recent_orders.length" class="py-12 text-center text-sm text-text-light">
              Chưa có đơn tạo trong kỳ.
            </p>
            <div v-else class="mt-4 overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="text-text-light">
                  <tr>
                    <th class="py-3 pr-3">Đơn hàng</th>
                    <th class="p-3">Trạng thái</th>
                    <th class="py-3 pl-3 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in data.recent_orders" :key="order.id" class="border-t border-border">
                    <td class="min-w-36 py-4 pr-3">
                      <strong class="text-primary">{{ order.code }}</strong>
                      <p class="mt-1 text-text-light">
                        {{ time(order.created_at) }}
                      </p>
                      <p class="mt-1 text-text-light">
                        {{ order.payment_method }}
                      </p>
                    </td>
                    <td class="p-3">
                      <span class="inline-block whitespace-nowrap rounded-full px-2 py-1 font-semibold"
                        :class="statusStyles[order.order_status]">{{
                          statusNames[order.order_status] || order.order_status
                        }}</span>
                    </td>
                    <td class="whitespace-nowrap py-3 pl-3 text-right font-mono font-semibold">
                      {{ money(order.total_payment) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dashboard-change--up {
  color: #16a34a;
}

.dashboard-change--down {
  color: #ef4444;
}

.dashboard-change--neutral {
  color: var(--color-text-light, #64748b);
}

.dashboard-metric {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.dashboard-metric::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #fc1919;
  opacity: 0;
  transition: opacity 160ms ease;
}

.dashboard-metric:hover {
  border-color: rgba(252, 25, 25, 0.35);
}

.dashboard-metric.is-active {
  border-color: rgba(252, 25, 25, 0.5);
  box-shadow: 0 5px 18px rgba(252, 25, 25, 0.08);
}

.dashboard-metric.is-active::before {
  opacity: 1;
}

.dashboard-metric.is-active .dashboard-metric-label {
  color: #fc1919;
}

.dashboard-metric:focus-visible {
  outline: 2px solid #fc1919;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {

  .dashboard-metric,
  .dashboard-metric::before {
    transition: none;
  }
}
</style>