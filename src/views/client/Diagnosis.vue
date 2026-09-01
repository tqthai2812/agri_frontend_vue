<script setup>
import {
    onBeforeUnmount,
    ref,
} from 'vue'
import { Icon } from '@iconify/vue'
import DiagnosisUploader from '@/components/client/diagnosis/DiagnosisUploader.vue'
import DiagnosisResults from '@/components/client/diagnosis/DiagnosisResults.vue'
import DiseaseDetailModal from '@/components/client/diagnosis/DiseaseDetailModal.vue'
import { diagnoseRiceLeaf } from '@/api/diagnosisApi'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ACCEPTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
]

const selectedFile = ref(null)
const previewUrl = ref('')
const analyzing = ref(false)
const analysisStage = ref(0)
const result = ref(null)
const errorMessage = ref('')
const selectedDisease = ref(null)
const detailOpen = ref(false)

let runId = 0

const timers = new Set()

function wait(ms) {
    return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
            timers.delete(timer)
            resolve()
        }, ms)

        timers.add(timer)
    })
}

function showError(message) {
    errorMessage.value = message

    window.setTimeout(() => {
        if (errorMessage.value === message) {
            errorMessage.value = ''
        }
    }, 3500)
}

function revokePreview() {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }
}

function handleFileSelected(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        showError(
            'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.',
        )
        return
    }

    if (file.size > MAX_FILE_SIZE) {
        showError(
            'Ảnh vượt quá 5MB. Hãy chọn ảnh có dung lượng nhỏ hơn.',
        )
        return
    }

    runId += 1

    revokePreview()

    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    result.value = null
    analysisStage.value = 0
    errorMessage.value = ''
}

function resetDiagnosis() {
    runId += 1
    analyzing.value = false
    result.value = null
    selectedFile.value = null

    revokePreview()

    previewUrl.value = ''
    analysisStage.value = 0
}

async function analyzeImage() {
    if (
        !selectedFile.value ||
        analyzing.value
    ) {
        return
    }

    const currentRun = ++runId

    analyzing.value = true
    result.value = null
    analysisStage.value = 0

    try {
        await wait(650)

        if (currentRun !== runId) return

        analysisStage.value = 1

        await wait(750)

        if (currentRun !== runId) return

        analysisStage.value = 2

        await wait(800)

        if (currentRun !== runId) return

        result.value = await diagnoseRiceLeaf(
            selectedFile.value,
        )
    } catch (error) {
        console.error(
            'Lỗi chẩn đoán:',
            error,
        )

        showError(
            'Không thể phân tích ảnh lúc này. Vui lòng thử lại.',
        )
    } finally {
        if (currentRun === runId) {
            analyzing.value = false
        }
    }
}

function openDisease(disease) {
    selectedDisease.value = disease
    detailOpen.value = true
}

onBeforeUnmount(() => {
    runId += 1

    timers.forEach((timer) => {
        window.clearTimeout(timer)
    })

    timers.clear()
    revokePreview()
})
</script>

<template>
    <div class="min-h-[70vh] bg-[#f6f8f6] font-sans text-slate-800">
        <!-- Hero -->
        <section
            class="relative overflow-hidden border-b border-[#dce9e0] bg-gradient-to-br from-[#edf7f0] via-white to-[#fff9dc]">
            <div class="absolute -right-24 -top-28 size-80 rounded-full bg-[#ffd326]/15"></div>

            <div class="absolute -bottom-32 left-[8%] size-72 rounded-full bg-[#0a7139]/5"></div>

            <Icon icon="mdi:leaf-circle-outline"
                class="absolute right-[8%] top-1/2 hidden -translate-y-1/2 text-[180px] text-[#07532b]/[0.04] lg:block" />

            <div class="relative mx-auto max-w-[1320px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <nav class="flex items-center gap-2 text-[10px] text-slate-400" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-semibold text-[#174e31]">
                        Chẩn đoán bệnh lúa
                    </span>
                </nav>

                <div class="mt-8 max-w-3xl">
                    <span
                        class="inline-flex items-center gap-2 rounded-full bg-[#07532b] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                        <Icon icon="mdi:creation-outline" class="text-sm text-[#ffd326]" />

                        Hỗ trợ nhận biết bằng AI
                    </span>

                    <h1 class="mt-5 text-3xl font-bold leading-tight text-[#123d27] sm:text-5xl">
                        Chẩn đoán bệnh
                        <br class="hidden sm:block" />

                        <span class="text-[#0a7139]">
                            dựa trên lá lúa
                        </span>
                    </h1>

                    <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                        Tải lên ảnh lá lúa, hệ thống sẽ phân tích dấu hiệu
                        bất thường và trả về bệnh có khả năng nhất cùng mức
                        độ tin cậy để bạn xử lý nhanh hơn.
                    </p>
                </div>
            </div>
        </section>

        <main class="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div
                class="mb-6 flex gap-3 rounded-2xl border border-[#efdc83] bg-[#fff8d5] px-4 py-3.5 text-[11px] leading-5 text-[#66540b]">
                <Icon icon="mdi:information-outline" class="mt-0.5 shrink-0 text-lg text-[#0a7139]" />

                <p>
                    <strong>Mẹo chụp ảnh:</strong>
                    dùng hình ảnh lá lúa rõ nét, đủ sáng, không rung mờ
                    và tập trung vào vùng có dấu hiệu bệnh để tăng độ
                    chính xác.
                </p>
            </div>

            <section class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
                <DiagnosisUploader :preview-url="previewUrl" :file-name="selectedFile?.name || ''"
                    :analyzing="analyzing" @file-selected="handleFileSelected" @remove="resetDiagnosis"
                    @analyze="analyzeImage" />

                <DiagnosisResults :result="result" :analyzing="analyzing" :stage="analysisStage"
                    :preview-url="previewUrl" @open-disease="openDisease" @reset="resetDiagnosis" />
            </section>

            <section class="mt-10">
                <div class="text-center">
                    <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                        Ảnh tốt cho kết quả tốt
                    </p>

                    <h2 class="mt-2 text-2xl font-bold text-[#123d27]">
                        Cách chụp ảnh dễ nhận diện
                    </h2>
                </div>

                <div class="mt-6 grid gap-4 md:grid-cols-3">
                    <article v-for="item in [
                        {
                            icon: 'mdi:white-balance-sunny',
                            title: 'Đủ ánh sáng',
                            text: 'Chụp dưới ánh sáng tự nhiên, tránh bóng đổ hoặc ảnh bị cháy sáng.',
                        },
                        {
                            icon: 'mdi:focus-field-horizontal',
                            title: 'Lấy nét đúng vùng bệnh',
                            text: 'Đưa camera gần lá và chạm lấy nét vào vùng đốm, cháy hoặc đổi màu.',
                        },
                        {
                            icon: 'mdi:leaf',
                            title: 'Một lá chính trong ảnh',
                            text: 'Hạn chế nền rối và không để quá nhiều lá chồng lên nhau trong khung hình.',
                        },
                    ]" :key="item.title" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <span class="grid size-11 place-items-center rounded-2xl bg-[#edf5f0] text-[#07532b]">
                            <Icon :icon="item.icon" class="text-xl" />
                        </span>

                        <h3 class="mt-4 text-sm font-bold text-[#123d27]">
                            {{ item.title }}
                        </h3>

                        <p class="mt-2 text-[11px] leading-5 text-slate-500">
                            {{ item.text }}
                        </p>
                    </article>
                </div>
            </section>

            <div
                class="mt-8 flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[10px] leading-5 text-slate-500 shadow-sm">
                <Icon icon="mdi:shield-alert-outline" class="mt-0.5 shrink-0 text-lg text-[#d2a900]" />

                <p>
                    Kết quả chẩn đoán từ hình ảnh không thay thế việc
                    thăm đồng hoặc ý kiến của chuyên gia. Không tự ý pha
                    và sử dụng thuốc chỉ dựa trên một ảnh dự đoán.
                </p>
            </div>
        </main>

        <DiseaseDetailModal v-model="detailOpen" :disease="selectedDisease" :preview-url="previewUrl" />

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            leave-active-class="transition duration-150" leave-to-class="translate-y-3 opacity-0">
            <div v-if="errorMessage"
                class="fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-red-600 px-4 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:alert-circle-outline" class="shrink-0 text-xl" />

                <span>{{ errorMessage }}</span>
            </div>
        </Transition>
    </div>
</template>