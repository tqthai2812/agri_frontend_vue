<script setup>
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
} from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
    rows: { type: Array, required: true },
    chartType: {
        type: String,
        default: "line",
        validator: (value) => ["line", "bar"].includes(value),
    },
    label: { type: String, required: true },
    isMoney: { type: Boolean, default: true },
    dark: { type: Boolean, default: false },
    formatValue: { type: Function, required: true },
});
const canvas = ref(null);
const wrapper = ref(null);
const tooltip = ref(null);
const tooltipId = useId();
const hoverIndex = ref(null);
const visible = ref(false);
const hoveredRow = computed(() => props.rows[hoverIndex.value] || null);
const tooltipValue = computed(() =>
    hoveredRow.value ? props.formatValue(hoveredRow.value.value) : "",
);
let chart = null;
let media = null;
let reducedMotion = false;
let frame = 0;
let lastFrame = 0;
let lastMove = 0;
let positioned = false;
let pointer = { x: 0, y: 0 };
let position = { x: 0, y: 0 };

function targetPosition() {
    const box = wrapper.value,
        tip = tooltip.value;
    if (!box || !tip) return position;
    const gap = 16,
        padding = 8;
    const width = tip.offsetWidth,
        height = tip.offsetHeight;
    let x = pointer.x + gap,
        y = pointer.y - height - gap;
    if (x + width > box.clientWidth - padding) x = pointer.x - width - gap;
    if (y < padding) y = pointer.y + gap;
    return {
        x: Math.max(padding, Math.min(x, box.clientWidth - width - padding)),
        y: Math.max(padding, Math.min(y, box.clientHeight - height - padding)),
    };
}
function placeTooltip() {
    if (tooltip.value)
        tooltip.value.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}
function animateTooltip(now) {
    frame = 0;
    if (!visible.value || !tooltip.value) return;
    const target = targetPosition();
    const moving = now - lastMove < 70;
    const dt = Math.min(50, Math.max(1, now - (lastFrame || now - 16)));
    lastFrame = now;
    // Đang rê: trễ nhẹ (tau 140ms). Dừng 70ms: bắt kịp nhanh (tau 36ms).
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-dt / (moving ? 140 : 36));
    position.x += (target.x - position.x) * alpha;
    position.y += (target.y - position.y) * alpha;
    const settled =
        Math.hypot(target.x - position.x, target.y - position.y) < 0.25;
    if (settled || reducedMotion) position = target;
    placeTooltip();
    if (!reducedMotion && (!settled || moving))
        frame = requestAnimationFrame(animateTooltip);
}
function moveTooltip() {
    if (!visible.value || !tooltip.value) return;
    if (!positioned || reducedMotion) {
        position = targetPosition();
        positioned = true;
        placeTooltip();
    }
    if (!frame && !reducedMotion) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(animateTooltip);
    }
}
function hideTooltip() {
    visible.value = false;
    hoverIndex.value = null;
    positioned = false;
    cancelAnimationFrame(frame);
    frame = 0;
    chart?.draw();
}
function showAt(index, x, y) {
    hoverIndex.value = index;
    pointer = { x, y };
    lastMove = performance.now();
    visible.value = true;
    chart?.draw();
    // Cùng một DOM tooltip: chỉ cập nhật nội dung, không ẩn/hiện giữa các điểm.
    nextTick(moveTooltip);
}
function pointerMove(event) {
    if (!chart || !canvas.value || !wrapper.value) return;
    const bounds = canvas.value.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((event.clientX - bounds.left) * chart.width) / bounds.width;
    const y = ((event.clientY - bounds.top) * chart.height) / bounds.height;
    const area = chart.chartArea;
    if (x < area.left || x > area.right || y < area.top || y > area.bottom) {
        hideTooltip();
        return;
    }
    // Theo trục X kể cả ở ngày null: giữ tooltip và ghi Chưa đủ dữ liệu.
    const index = Math.max(
        0,
        Math.min(
            props.rows.length - 1,
            Math.round(chart.scales.x.getValueForPixel(x)),
        ),
    );
    const box = wrapper.value.getBoundingClientRect();
    showAt(
        index,
        ((event.clientX - box.left) * wrapper.value.clientWidth) / box.width,
        ((event.clientY - box.top) * wrapper.value.clientHeight) / box.height,
    );
}
function pointerLeave(event) {
    if (event.pointerType !== "touch") hideTooltip();
}
function keyboard(event) {
    if (event.key === "Escape") {
        hideTooltip();
        return;
    }
    if (!chart || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
    event.preventDefault();
    let index =
        hoverIndex.value ?? (event.key === "ArrowLeft" ? props.rows.length : -1);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = props.rows.length - 1;
    else index += event.key === "ArrowRight" ? 1 : -1;
    index = Math.max(0, Math.min(props.rows.length - 1, index));
    const x = chart.scales.x.getPixelForValue(index);
    const y = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    showAt(index, x, y);
}
function outsidePointer(event) {
    if (!wrapper.value?.contains(event.target)) hideTooltip();
}
function motionPreference(event) {
    reducedMotion = event.matches;
    if (reducedMotion) {
        cancelAnimationFrame(frame);
        frame = 0;
        moveTooltip();
    }
}
const hoverGuide = {
    id: "dashboard-hover-guide",
    afterDatasetsDraw(instance) {
        if (!visible.value || hoverIndex.value === null) return;
        const index = hoverIndex.value;
        const { ctx, chartArea, scales } = instance;
        const x = scales.x.getPixelForValue(index);
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            chartArea.left - 6,
            chartArea.top - 6,
            chartArea.width + 12,
            chartArea.height + 12,
        );
        ctx.clip();
        ctx.strokeStyle = props.dark ? "#94a3b8" : "#b0b8c4";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        const value = numeric(props.rows[index]?.value);
        if (value !== null) {
            const y = scales.y.getPixelForValue(value);
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = props.dark ? "#1e293b" : "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#fc1919";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    },
};
// NULL, undefined và chuỗi rỗng là dữ liệu thiếu; không biến thành số 0.
function numeric(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" && typeof value !== "number") return null;
    if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value))
        return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
}
const values = computed(() => props.rows.map((row) => numeric(row.value)));
const hasData = computed(() => values.value.some((value) => value !== null));
const accessibleLabel = computed(
    () =>
        `Biểu đồ ${props.label}. Dùng phím trái/phải để xem từng điểm, Escape để đóng. Số liệu chi tiết ở bảng bên dưới.`,
);
function destroy() {
    hideTooltip();
    chart?.destroy();
    chart = null;
}
function draw() {
    destroy();
    if (!canvas.value || !hasData.value) return;
    const colors = props.dark
        ? { text: "#cbd5e1", grid: "#334155", point: "#1e293b" }
        : { text: "#64748b", grid: "#e2e8f0", point: "#ffffff" };
    const accent = "#fc1919";
    chart = new Chart(canvas.value, {
        type: props.chartType,
        plugins: [hoverGuide],
        data: {
            labels: props.rows.map((row) => row.label),
            datasets: [
                {
                    label: props.label,
                    // Number chỉ dùng để vẽ tọa độ; tooltip/bảng vẫn định dạng giá trị gốc từ API.
                    data: values.value,
                    borderColor: accent,
                    backgroundColor: (context) => {
                        if (props.chartType === "bar") return "rgba(252,25,25,0.7)";
                        const { ctx, chartArea } = context.chart;
                        if (!chartArea) return "rgba(252,25,25,0.12)";
                        const gradient = ctx.createLinearGradient(
                            0,
                            chartArea.top,
                            0,
                            chartArea.bottom,
                        );
                        gradient.addColorStop(
                            0,
                            props.dark ? "rgba(252,25,25,0.28)" : "rgba(252,25,25,0.18)",
                        );
                        gradient.addColorStop(1, "rgba(252,25,25,0.01)");
                        return gradient;
                    },
                    fill: props.chartType === "line",
                    borderWidth: 2,
                    borderRadius: props.chartType === "bar" ? 6 : 0,
                    maxBarThickness: 68,
                    pointBackgroundColor: colors.point,
                    pointBorderColor: accent,
                    pointHoverBackgroundColor: accent,
                    pointHoverBorderColor: colors.point,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            // Pointer Events của canvas điều khiển tooltip, không dùng tooltip mặc định.
            events: [],
            onResize: () => hideTooltip(),
            interaction: { mode: "index", intersect: false },
            elements: {
                line: { tension: 0, borderWidth: 2, spanGaps: false },
                point: {
                    radius: props.rows.length > 45 ? 0 : 3,
                    hoverRadius: 5,
                    hitRadius: 10,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text, maxTicksLimit: 10, maxRotation: 30 },
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: values.value.every(
                        (value) => value === null || value === 0,
                    )
                        ? 1
                        : undefined,
                    title: {
                        display: true,
                        text: props.isMoney ? "VND" : "Đơn",
                        color: colors.text,
                    },
                    border: { display: false, dash: [4, 4] },
                    grid: { color: colors.grid },
                    ticks: {
                        color: colors.text,
                        ...(props.isMoney ? {} : { precision: 0 }),
                        callback: (value) =>
                            new Intl.NumberFormat("vi-VN", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                            }).format(value),
                    },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
            },
        },
    });
}
onMounted(() => {
    media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = media.matches;
    media.addEventListener("change", motionPreference);
    window.addEventListener("blur", hideTooltip);
    document.addEventListener("pointerdown", outsidePointer);
    draw();
});
watch(
    [
        () => props.rows,
        () => props.chartType,
        () => props.label,
        () => props.isMoney,
        () => props.dark,
    ],
    draw,
    { flush: "post" },
);
onBeforeUnmount(() => {
    media?.removeEventListener("change", motionPreference);
    window.removeEventListener("blur", hideTooltip);
    document.removeEventListener("pointerdown", outsidePointer);
    destroy();
});
</script>

<template>
    <div ref="wrapper" class="dashboard-chart relative h-72 w-full min-w-0 sm:h-80" :class="{ 'is-dark': dark }">
        <canvas v-if="hasData" ref="canvas" role="img" :aria-label="accessibleLabel"
            :aria-describedby="visible ? tooltipId : undefined" tabindex="0"
            class="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
            @pointermove="pointerMove" @pointerdown="pointerMove" @pointerleave="pointerLeave"
            @pointercancel="hideTooltip" @blur="hideTooltip" @keydown="keyboard"></canvas>
        <div ref="tooltip" :id="tooltipId" role="tooltip" :aria-hidden="!visible" class="dashboard-tooltip"
            :class="{ 'is-visible': visible }">
            <div class="dashboard-tooltip-date">{{ hoveredRow?.fullLabel }}</div>
            <div class="dashboard-tooltip-row">
                <span class="dashboard-tooltip-dot" aria-hidden="true"></span>
                <span class="dashboard-tooltip-label">{{ label }}</span>
                <strong class="dashboard-tooltip-value">{{ tooltipValue }}</strong>
            </div>
        </div>
        <div v-if="!hasData" role="status"
            class="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg/40 px-5 text-center">
            <p class="text-sm font-semibold text-text">
                {{
                    rows.length
                        ? "Chưa đủ dữ liệu để vẽ biểu đồ này."
                        : "Chưa có dữ liệu cho khoảng ngày này."
                }}
            </p>
            <p class="mt-2 text-xs text-text-light">
                Xem bảng số liệu bên dưới hoặc chọn một chỉ số khác.
            </p>
        </div>
    </div>
</template>

<style scoped>
.dashboard-tooltip {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    width: min(350px, calc(100% - 16px));
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #1e293b;
    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.13);
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    will-change: transform;
    transition: opacity 90ms ease;
}

.dashboard-tooltip.is-visible {
    opacity: 1;
    visibility: visible;
}

.dashboard-tooltip-date {
    padding: 9px 13px;
    background: #f5f6f8;
    color: #64748b;
    font-size: 12px;
}

.dashboard-tooltip-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    padding: 13px;
    font-size: 13px;
    line-height: 1.5;
}

.dashboard-tooltip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fc1919;
    flex-shrink: 0;
    align-self: center;
}

.dashboard-tooltip-label {
    flex: 1;
    min-width: 100px;
}

.dashboard-tooltip-value {
    margin-left: auto;
    max-width: 100%;
    overflow-wrap: anywhere;
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.is-dark .dashboard-tooltip {
    background: #1e293b;
    color: #f1f5f9;
    border-color: #475569;
}

.is-dark .dashboard-tooltip-date {
    background: #263449;
    color: #cbd5e1;
}

@media (prefers-reduced-motion: reduce) {
    .dashboard-tooltip {
        transition: none;
    }
}
</style>