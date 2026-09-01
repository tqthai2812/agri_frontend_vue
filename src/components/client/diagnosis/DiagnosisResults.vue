<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    result: {
        type: Object,
        default: null,
    },
    analyzing: {
        type: Boolean,
        default: false,
    },
    stage: {
        type: Number,
        default: 0,
    },
    previewUrl: {
        type: String,
        default: '',
    },
})

defineEmits([
    'open-disease',
    'reset',
])

const stages = [
    {
        label: 'Kiểm tra chất lượng ảnh',
        icon: 'mdi:image-search-outline',
    },
    {
        label: 'Nhận diện vùng tổn thương',
        icon: 'mdi:vector-square-scan',
    },
    {
        label: 'Đối chiếu mô hình bệnh',
        icon: 'mdi:brain',
    },
]

const confidencePercent = computed(() =>
    Math.round(
        (props.result?.topPrediction?.confidence || 0) * 100,
    ),
)

function percent(value) {
    return `${Math.round(Number(value || 0) * 100)}%`
}

function severityClass(severity) {
    if (severity === 'Nguy cơ cao') {
        return 'bg-red-50 text-red-600 ring-red-100'
    }

    if (severity === 'Trung bình') {
        return 'bg-amber-50 text-amber-700 ring-amber-100'
    }

    return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
                <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                    Bước 2
                </p>

                <h2 class="mt-1 text-lg font-bold text-[#123d27]">
                    Kết quả chẩn đoán
                </h2>
            </div>

            <span class="grid size-10 place-items-center rounded-2xl bg-[#edf5f0] text-[#07532b]">
                <Icon icon="mdi:clipboard-pulse-outline" class="text-xl" />
            </span>
        </div>

        <div class="min-h-[520px] p-5 sm:p-6">
            <!-- Loading -->
            <div v-if="analyzing" class="flex min-h-[470px] flex-col justify-center">
                <div class="mx-auto grid size-24 place-items-center rounded-full bg-[#f1f8f3] ring-1 ring-[#d9e9de]">
                    <div class="relative grid size-16 place-items-center rounded-full bg-white shadow-sm">
                        <Icon icon="mdi:sprout" class="animate-pulse text-4xl text-[#0b7a3e]" />

                        <span class="absolute inset-0 animate-ping rounded-full border border-[#ffd326]/50"></span>
                    </div>
                </div>

                <h3 class="mt-6 text-center text-lg font-bold text-[#123d27]">
                    AI đang phân tích ảnh
                </h3>

                <p class="mx-auto mt-2 max-w-sm text-center text-xs leading-6 text-slate-500">
                    Hệ thống đang tìm vùng bất thường và so sánh với dữ
                    liệu bệnh lúa.
                </p>

                <div class="mx-auto mt-8 w-full max-w-sm space-y-3">
                    <div v-for="(item, index) in stages" :key="item.label"
                        class="flex items-center gap-3 rounded-2xl border px-4 py-3 transition" :class="index <= stage
                            ? 'border-[#cfe3d5] bg-[#f3f9f5]'
                            : 'border-slate-100 bg-slate-50 opacity-55'
                            ">
                        <span class="grid size-9 place-items-center rounded-xl" :class="index < stage
                            ? 'bg-[#07532b] text-white'
                            : index === stage
                                ? 'bg-[#ffd326] text-[#07532b]'
                                : 'bg-white text-slate-400'
                            ">
                            <Icon :icon="index < stage
                                ? 'mdi:check'
                                : item.icon
                                " class="text-lg" :class="index === stage ? 'animate-pulse' : ''" />
                        </span>

                        <span class="text-xs font-semibold" :class="index <= stage
                            ? 'text-[#174e31]'
                            : 'text-slate-400'
                            ">
                            {{ item.label }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Có kết quả -->
            <div v-else-if="result" class="space-y-5">
                <!-- Độ tin cậy cao -->
                <div v-if="result.isReliable"
                    class="rounded-3xl border border-[#cfe3d5] bg-gradient-to-br from-[#f5fbf7] to-white p-4 sm:p-5">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-[#07532b] px-3 py-1.5 text-[10px] font-bold text-white">
                            <Icon icon="mdi:check-decagram" class="text-sm text-[#ffd326]" />

                            Kết quả có độ tin cậy cao
                        </span>

                        <span class="rounded-full px-3 py-1.5 text-[9px] font-bold ring-1" :class="severityClass(
                            result.topPrediction.disease.severity,
                        )
                            ">
                            {{ result.topPrediction.disease.severity }}
                        </span>
                    </div>

                    <div class="mt-5 grid gap-5 sm:grid-cols-[108px_minmax(0,1fr)]">
                        <div class="overflow-hidden rounded-2xl border border-[#dbe9df] bg-white">
                            <img :src="previewUrl" :alt="result.topPrediction.disease.name"
                                class="aspect-square size-full object-cover" />
                        </div>

                        <div class="min-w-0">
                            <p class="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d2a900]">
                                Chẩn đoán nhiều khả năng nhất
                            </p>

                            <h3 class="mt-1 text-2xl font-bold text-[#0b542c]">
                                {{ result.topPrediction.disease.name }}
                            </h3>

                            <p class="mt-1 text-[11px] font-medium text-slate-500">
                                {{
                                    result.topPrediction.disease.englishName
                                }}
                            </p>

                            <p class="mt-3 text-xs leading-6 text-slate-600">
                                {{
                                    result.topPrediction.disease
                                        .shortDescription
                                }}
                            </p>
                        </div>
                    </div>

                    <div class="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                        <div class="flex items-center justify-between gap-3">
                            <span class="text-[11px] font-semibold text-slate-600">
                                Độ tin cậy của dự đoán
                            </span>

                            <strong class="text-xl text-[#0b7a3e]">
                                {{ confidencePercent }}%
                            </strong>
                        </div>

                        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full bg-gradient-to-r from-[#0a7139] to-[#ffd326] transition-all duration-700"
                                :style="{
                                    width: `${confidencePercent}%`,
                                }"></div>
                        </div>
                    </div>

                    <div class="mt-5">
                        <p class="text-[11px] font-bold text-[#123d27]">
                            Dấu hiệu thường gặp
                        </p>

                        <ul class="mt-3 space-y-2.5">
                            <li v-for="symptom in result.topPrediction.disease.symptoms.slice(
                                0,
                                3,
                            )" :key="symptom" class="flex gap-2.5 text-[11px] leading-5 text-slate-600">
                                <Icon icon="mdi:leaf-circle-outline" class="mt-0.5 shrink-0 text-base text-[#0b7a3e]" />

                                <span>{{ symptom }}</span>
                            </li>
                        </ul>
                    </div>

                    <button type="button"
                        class="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white transition hover:bg-[#064522]"
                        @click="
                            $emit(
                                'open-disease',
                                result.topPrediction.disease,
                            )
                            ">
                        Xem nguyên nhân và hướng xử lý

                        <Icon icon="mdi:arrow-right" class="text-lg" />
                    </button>
                </div>

                <!-- Độ tin cậy thấp -->
                <div v-else>
                    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                        <div class="flex gap-3">
                            <Icon icon="mdi:alert-circle-outline" class="mt-0.5 shrink-0 text-xl" />

                            <div>
                                <strong class="text-xs">
                                    Chưa đủ độ tin cậy để kết luận một bệnh
                                    duy nhất
                                </strong>

                                <p class="mt-1 text-[10px] leading-5 text-amber-700">
                                    Hãy đối chiếu các khả năng dưới đây hoặc
                                    tải ảnh rõ hơn, chụp gần vùng có triệu
                                    chứng.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h3 class="mt-6 text-base font-bold text-[#123d27]">
                        Các bệnh có khả năng nhất
                    </h3>

                    <p class="mt-1 text-[10px] text-slate-500">
                        Sắp xếp theo xác suất dự đoán của mô hình.
                    </p>

                    <div class="mt-4 space-y-3">
                        <article v-for="(prediction, index) in result.predictions" :key="prediction.disease.id"
                            class="rounded-2xl border border-slate-200 p-4 transition hover:border-[#a7c8b2] hover:shadow-sm">
                            <div class="flex items-start gap-3">
                                <span class="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black"
                                    :class="index === 0
                                        ? 'bg-[#ffd326] text-[#07532b]'
                                        : 'bg-[#edf5f0] text-[#07532b]'
                                        ">
                                    {{ index + 1 }}
                                </span>

                                <div class="min-w-0 flex-1">
                                    <div class="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 class="text-sm font-bold text-[#123d27]">
                                                {{ prediction.disease.name }}
                                            </h4>

                                            <p class="mt-0.5 text-[9px] text-slate-400">
                                                {{
                                                    prediction.disease.englishName
                                                }}
                                            </p>
                                        </div>

                                        <strong class="text-sm text-[#0b7a3e]">
                                            {{ percent(prediction.confidence) }}
                                        </strong>
                                    </div>

                                    <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div class="h-full rounded-full" :class="index === 0
                                            ? 'bg-[#0b7a3e]'
                                            : 'bg-[#9abaaa]'
                                            " :style="{
                                                width: percent(
                                                    prediction.confidence,
                                                ),
                                            }"></div>
                                    </div>

                                    <button type="button"
                                        class="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#07532b] hover:underline"
                                        @click="
                                            $emit(
                                                'open-disease',
                                                prediction.disease,
                                            )
                                            ">
                                        Xem dấu hiệu nhận biết

                                        <Icon icon="mdi:chevron-right" class="text-sm" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>

                <div
                    class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[9px] text-slate-400">
                    <span>
                        Model: {{ result.modelVersion }} ·
                        {{ result.processingTimeMs }}ms
                    </span>

                    <button type="button"
                        class="inline-flex items-center gap-1 font-bold text-[#07532b] hover:underline"
                        @click="$emit('reset')">
                        <Icon icon="mdi:refresh" class="text-sm" />

                        Kiểm tra ảnh khác
                    </button>
                </div>
            </div>

            <!-- Chưa có dữ liệu -->
            <div v-else class="flex min-h-[470px] flex-col items-center justify-center text-center">
                <div class="relative grid size-28 place-items-center rounded-full bg-[#f1f8f3]">
                    <Icon icon="mdi:leaf-search-outline" class="text-6xl text-[#0a7139]" />

                    <span
                        class="absolute right-1 top-2 grid size-8 place-items-center rounded-full bg-[#ffd326] text-[#07532b] shadow-sm">
                        <Icon icon="mdi:plus" class="text-lg" />
                    </span>
                </div>

                <h3 class="mt-6 text-lg font-bold text-[#123d27]">
                    Chưa có kết quả
                </h3>

                <p class="mt-2 max-w-xs text-xs leading-6 text-slate-500">
                    Tải ảnh lá lúa ở khung bên trái rồi bấm “Kiểm
                    tra” để bắt đầu phân tích.
                </p>

                <div class="mt-7 grid w-full max-w-sm grid-cols-3 gap-2">
                    <div v-for="item in [
                        'Tải ảnh',
                        'AI phân tích',
                        'Nhận kết quả',
                    ]" :key="item" class="rounded-xl bg-slate-50 px-2 py-3 text-[9px] font-semibold text-slate-500">
                        {{ item }}
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>