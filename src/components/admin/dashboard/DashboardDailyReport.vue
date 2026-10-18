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
    <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        aria-labelledby="daily-report-title">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
            <div>
                <h2 id="daily-report-title" class="font-bold text-text">
                    Hiệu suất hằng ngày
                </h2>
                <p class="mt-1 text-xs text-text-light">
                    {{ date(period.date_from) }} – {{ date(period.date_to) }}
                </p>
            </div>
            <ReportExportActions report-type="dashboard_daily" :filters="exportFilters"
                :disabled="disabled || unapplied" />
        </header>
        <p v-if="unapplied" class="border-b border-border px-5 py-3 text-xs text-amber-600">
            Áp dụng bộ lọc trước khi xuất.
        </p>
        <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
                <thead class="bg-bg text-text-sec">
                    <tr>
                        <th class="px-5 py-4 text-left font-semibold">Ngày</th>
                        <th class="px-5 py-4 text-right font-semibold">Đơn hoàn thành</th>
                        <th class="px-5 py-4 text-right font-semibold">
                            Doanh thu tiền hàng (VND)
                        </th>
                        <th class="px-5 py-4 text-right font-semibold">
                            Lợi nhuận gộp (VND)
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    <tr v-for="row in visible" :key="row.date" class="transition hover:bg-bg/60">
                        <td class="whitespace-nowrap px-5 py-4 font-medium">
                            {{ date(row.date) }}
                        </td>
                        <td class="px-5 py-4 text-right tabular-nums">
                            {{ number(row.completed_orders) }}
                        </td>
                        <td class="px-5 py-4 text-right tabular-nums">
                            {{ number(row.net_sales) }}
                        </td>
                        <td class="px-5 py-4 text-right tabular-nums" :class="String(row.gross_profit).startsWith('-') ? 'text-red-500' : ''
                            ">
                            {{ number(row.gross_profit) }}
                        </td>
                    </tr>
                    <tr v-if="!visible.length">
                        <td colspan="4" class="p-8 text-center text-text-light">
                            Chưa có dữ liệu.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <footer
            class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-text-light">
            <span>{{ sorted.length ? (page - 1) * perPage + 1 : 0 }}–{{
                Math.min(page * perPage, sorted.length)
                }}
                / {{ sorted.length }} dòng</span>
            <div class="flex items-center gap-3">
                <select v-model.number="perPage" aria-label="Số dòng mỗi trang"
                    class="rounded-lg border border-border bg-surface p-2 text-text">
                    <option :value="10">10 / trang</option>
                    <option :value="20">20 / trang</option>
                    <option :value="50">50 / trang</option>
                </select>
                <button type="button" aria-label="Trang trước" :disabled="page <= 1" @click="page--"
                    class="rounded-lg border border-border p-2 disabled:opacity-30">
                    <Icon icon="mdi:chevron-left" class="text-lg" />
                </button>
                <span class="text-text">{{ page }} / {{ lastPage }}</span>
                <button type="button" aria-label="Trang sau" :disabled="page >= lastPage" @click="page++"
                    class="rounded-lg border border-border p-2 disabled:opacity-30">
                    <Icon icon="mdi:chevron-right" class="text-lg" />
                </button>
            </div>
        </footer>
    </section>
</template>