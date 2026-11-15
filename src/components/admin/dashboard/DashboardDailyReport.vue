<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import ReportExportActions from "@/components/admin/exports/ReportExportActions.vue";
const props = defineProps({
  rows: { type: Array, default: () => [] },
  period: { type: Object, required: true },
  disabled: Boolean,
  unapplied: Boolean,
});
const page = ref(1),
  perPage = ref(10);
const sorted = computed(() =>
  [...props.rows].sort((a, b) => b.date.localeCompare(a.date)),
);
const lastPage = computed(() =>
  Math.max(1, Math.ceil(sorted.value.length / perPage.value)),
);
const visible = computed(() =>
  sorted.value.slice(
    (page.value - 1) * perPage.value,
    page.value * perPage.value,
  ),
);
const exportFilters = computed(() => ({
  date_from: props.period.date_from,
  date_to: props.period.date_to,
}));
watch(
  () => [
    props.period.date_from,
    props.period.date_to,
    props.rows,
    perPage.value,
  ],
  () => {
    page.value = 1;
  },
);
function date(value) {
  return String(value || "")
    .split("-")
    .reverse()
    .join("/");
}
function number(value) {
  if (value == null) return "—";
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return "—";
  const cents = (match[3] || "").padEnd(2, "0");
  return `${match[1]}${BigInt(match[2]).toLocaleString("vi-VN")}${cents === "00" ? "" : `,${cents}`}`;
}
</script>
<template>
  <section
    class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    aria-labelledby="daily-report-title"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5"
    >
      <div>
        <h2 id="daily-report-title" class="text-text text-lg font-bold">
          Hiệu suất hằng ngày
        </h2>
        <p class="mt-1 text-xs text-text-light">
          {{ date(period.date_from) }} – {{ date(period.date_to) }}
        </p>
      </div>
      <ReportExportActions
        report-type="dashboard_daily"
        :filters="exportFilters"
        :disabled="disabled || unapplied"
      />
    </header>
    <p
      v-if="unapplied"
      class="border-b border-border px-5 py-3 text-xs text-amber-600"
    >
      Áp dụng bộ lọc trước khi xuất.
    </p>
    <div class="overflow-x-auto">
      <table class="w-full min-w-[760px] text-sm">
        <thead class="bg-bg">
          <tr>
            <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Ngày</th>
            <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đơn hoàn thành</th>
            <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">
              Doanh thu tiền hàng (VND)
            </th>
            <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">
              Lợi nhuận gộp (VND)
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="row in visible"
            :key="row.date"
            class="transition border-b border-border hover:bg-primary/5"
          >
            <td class="whitespace-nowrap font-medium p-3 text-sm">
              {{ date(row.date) }}
            </td>
            <td class="text-right tabular-nums p-3 text-sm">
              {{ number(row.completed_orders) }}
            </td>
            <td class="text-right tabular-nums p-3 text-sm">
              {{ number(row.net_sales) }}
            </td>
            <td
              class="text-right tabular-nums p-3 text-sm"
              :class="
                String(row.gross_profit).startsWith('-') ? 'text-red-500' : ''
              "
            >
              {{ number(row.gross_profit) }}
            </td>
          </tr>
          <tr class="border-b border-border hover:bg-primary/5" v-if="!visible.length">
            <td colspan="4" class="text-center text-text-light p-3 text-sm">
              Chưa có dữ liệu.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <footer
      class="flex flex-col items-center justify-between gap-4 border-t border-border p-5 text-sm text-text-light sm:flex-row"
    >
      <span
        >{{ sorted.length ? (page - 1) * perPage + 1 : 0 }}–{{
          Math.min(page * perPage, sorted.length)
        }}
        / {{ sorted.length }} dòng</span
      >
      <div class="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
        <select
          v-model.number="perPage"
          aria-label="Số dòng mỗi trang"
          class="filter-select !w-auto min-w-[112px] shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <option :value="10">10 / trang</option>
          <option :value="20">20 / trang</option>
          <option :value="50">50 / trang</option>
        </select>
        <nav class="flex shrink-0 items-center gap-2" aria-label="Phân trang hiệu suất hằng ngày">
          <button
            type="button"
            aria-label="Trang trước"
            :disabled="page <= 1"
            @click="page--"
            class="page-btn shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Icon icon="solar:arrow-left-bold" class="text-lg" />
          </button>
          <span class="inline-flex min-w-[64px] shrink-0 items-center justify-center whitespace-nowrap font-mono text-sm text-text"
            aria-live="polite" aria-atomic="true">{{ page }} / {{ lastPage }}</span>
          <button
            type="button"
            aria-label="Trang sau"
            :disabled="page >= lastPage"
            @click="page++"
            class="page-btn shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Icon icon="solar:arrow-right-bold" class="text-lg" />
          </button>
        </nav>
      </div>
    </footer>
  </section>
</template>