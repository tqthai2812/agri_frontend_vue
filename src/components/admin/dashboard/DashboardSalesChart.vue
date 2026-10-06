<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
    daily: { type: Array, required: true },
    dark: { type: Boolean, default: false },
    formatMoney: { type: Function, required: true },
});
const canvas = ref(null);
let chart;
function draw() {
    if (!canvas.value) return;
    chart?.destroy();
    const colors = props.dark
        ? { text: "#cbd5e1", grid: "#334155" }
        : { text: "#64748b", grid: "#e2e8f0" };
    chart = new Chart(canvas.value, {
        type: "line",
        data: {
            labels: props.daily.map(
                (day) => `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`,
            ),
            datasets: [
                {
                    label: "Doanh thu tiền hàng",
                    data: props.daily.map((day) =>
                        day.net_sales === null ? null : Number(day.net_sales),
                    ),
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22,163,74,0.08)",
                    fill: true,
                },
                {
                    label: "Lợi nhuận gộp",
                    data: props.daily.map((day) =>
                        day.gross_profit === null ? null : Number(day.gross_profit),
                    ),
                    borderColor: "#d97706",
                    backgroundColor: "rgba(217,119,6,0.08)",
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "index", intersect: false },
            elements: {
                line: { tension: 0, borderWidth: 2, spanGaps: false },
                point: { radius: props.daily.length > 45 ? 0 : 2, hitRadius: 8 },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text, maxTicksLimit: 12 },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: {
                        color: colors.text,
                        callback: (value) =>
                            new Intl.NumberFormat("vi-VN", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                            }).format(value),
                    },
                },
            },
            plugins: {
                legend: {
                    labels: { color: colors.text, usePointStyle: true, boxWidth: 8 },
                },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const day = props.daily[items[0]?.dataIndex];
                            return day ? day.date.split("-").reverse().join("/") : "";
                        },
                        label: (item) => {
                            const day = props.daily[item.dataIndex];
                            const key =
                                item.datasetIndex === 0 ? "net_sales" : "gross_profit";
                            return `${item.dataset.label}: ${props.formatMoney(day[key])}`;
                        },
                    },
                },
            },
        },
    });
}
onMounted(draw);
watch([() => props.daily, () => props.dark], draw);
onBeforeUnmount(() => {
    chart?.destroy();
    chart = null;
});
</script>

<template>
    <div class="h-72 w-full sm:h-80">
        <canvas ref="canvas" role="img"
            aria-label="Biểu đồ doanh thu tiền hàng và lợi nhuận gộp theo ngày. Số liệu chi tiết ở bảng bên dưới."></canvas>
    </div>
</template>