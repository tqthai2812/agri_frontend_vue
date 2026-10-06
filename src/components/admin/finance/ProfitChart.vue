<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";
import { useAppStore } from "@/stores/appStore";
import { money } from "@/composables/useFinance";
Chart.register(
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);
const props = defineProps({ rows: { type: Array, default: () => [] } });
const canvas = ref(null);
const app = useAppStore();
let chart;
function draw() {
    if (!canvas.value) return;
    chart?.destroy();
    const color = app.darkMode ? "#becbd9" : "#64748b";
    chart = new Chart(canvas.value, {
        type: "line",
        data: {
            labels: props.rows.map((r) => r.date),
            datasets: [
                ["net_sales", "Doanh thu hàng", "#3182ce"],
                ["expenses", "Chi phí", "#d69e2e"],
                ["pretax_profit", "Lợi nhuận trước thuế", "#0a9860"],
            ].map(([key, label, borderColor]) => ({
                label,
                borderColor,
                data: props.rows.map((r) => (r[key] === null ? null : Number(r[key]))),
                pointRadius: props.rows.length > 40 ? 0 : 2,
                borderWidth: 2,
                spanGaps: false,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { labels: { color } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const key = ["net_sales", "expenses", "pretax_profit"][
                                ctx.datasetIndex
                            ];
                            return (
                                ctx.dataset.label + ": " + money(props.rows[ctx.dataIndex][key])
                            );
                        },
                    },
                },
            },
            scales: {
                x: { ticks: { color, maxTicksLimit: 10 }, grid: { display: false } },
                y: {
                    ticks: {
                        color,
                        callback: (v) =>
                            new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v),
                    },
                    grid: { color: app.darkMode ? "#334155" : "#e9eef2" },
                },
            },
        },
    });
}
onMounted(draw);
watch(() => [props.rows, app.darkMode], draw);
onBeforeUnmount(() => chart?.destroy());
</script>
<template>
    <div class="relative h-72 min-w-0">
        <canvas ref="canvas" role="img"
            aria-label="Biểu đồ doanh thu, chi phí và lợi nhuận theo ngày. Bảng số liệu ở ngay bên dưới."></canvas>
    </div>
</template>