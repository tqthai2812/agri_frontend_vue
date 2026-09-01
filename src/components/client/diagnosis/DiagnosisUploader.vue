<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps({
    previewUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    analyzing: { type: Boolean, default: false },
})

const emit = defineEmits([
    'file-selected',
    'remove',
    'analyze',
])

const fileInput = ref(null)
const dragActive = ref(false)

function openFilePicker() {
    if (!fileInput.value) return

    fileInput.value.value = ''
    fileInput.value.click()
}

function emitFirstFile(fileList) {
    const file = fileList?.[0]

    if (file) {
        emit('file-selected', file)
    }
}

function handleInput(event) {
    emitFirstFile(event.target.files)
}

function handleDrop(event) {
    dragActive.value = false
    emitFirstFile(event.dataTransfer.files)
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
            class="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
                <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                    Bước 1
                </p>

                <h2 class="mt-1 text-lg font-bold text-[#123d27]">
                    Tải ảnh lá lúa
                </h2>
            </div>

            <span
                class="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#edf5f0] px-3 py-1.5 text-[10px] font-semibold text-[#07532b]">
                <Icon icon="mdi:image-check-outline" class="text-sm" />

                JPG, PNG, WEBP · tối đa 5MB
            </span>
        </div>

        <div class="p-4 sm:p-6">
            <div class="group relative min-h-[390px] overflow-hidden rounded-2xl border-2 border-dashed transition sm:min-h-[460px]"
                :class="[
                    dragActive
                        ? 'border-[#e0b400] bg-[#fff9dc]'
                        : previewUrl
                            ? 'border-[#b9d7c4] bg-[#f2f8f4]'
                            : 'border-[#c8ddd0] bg-[#f7fbf8] hover:border-[#76a98a] hover:bg-[#f1f8f3]',
                ]" @dragenter.prevent="dragActive = true" @dragover.prevent="dragActive = true"
                @dragleave.prevent="dragActive = false" @drop.prevent="handleDrop">
                <template v-if="previewUrl">
                    <img :src="previewUrl" :alt="fileName || 'Ảnh lá lúa đã chọn'"
                        class="absolute inset-0 size-full object-contain p-3 sm:p-5" />

                    <div
                        class="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-[#042f1b]/90 via-[#042f1b]/60 to-transparent px-4 pb-4 pt-16 text-white sm:flex-row sm:items-end sm:justify-between sm:px-5 sm:pb-5">
                        <div class="min-w-0">
                            <span class="flex items-center gap-1.5 text-[10px] font-semibold text-white/65">
                                <Icon icon="mdi:check-circle" class="text-sm text-[#ffd326]" />

                                Ảnh đã sẵn sàng
                            </span>

                            <p class="mt-1 truncate text-xs font-bold">
                                {{ fileName }}
                            </p>
                        </div>

                        <div v-if="!analyzing" class="flex shrink-0 gap-2">
                            <button type="button"
                                class="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-4 text-[10px] font-bold backdrop-blur-sm transition hover:bg-white/25"
                                @click="openFilePicker">
                                <Icon icon="mdi:image-edit-outline" class="text-base" />

                                Đổi ảnh
                            </button>

                            <button type="button"
                                class="grid size-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-red-500"
                                aria-label="Xóa ảnh" @click="$emit('remove')">
                                <Icon icon="mdi:trash-can-outline" class="text-lg" />
                            </button>
                        </div>
                    </div>

                    <div v-if="analyzing" class="absolute inset-0 overflow-hidden bg-[#042f1b]/20 backdrop-blur-[1px]">
                        <div
                            class="scan-line absolute inset-x-5 h-0.5 bg-[#ffd326] shadow-[0_0_18px_4px_rgba(255,211,38,0.8)]">
                        </div>

                        <div
                            class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl bg-[#042f1b]/85 px-6 py-5 text-center text-white shadow-2xl backdrop-blur-sm">
                            <Icon icon="mdi:leaf-circle-outline" class="animate-pulse text-4xl text-[#ffd326]" />

                            <strong class="mt-2 text-sm">
                                Đang quét ảnh lá lúa
                            </strong>

                            <span class="mt-1 text-[10px] text-white/60">
                                Vui lòng không đóng trang
                            </span>
                        </div>
                    </div>
                </template>

                <button v-else type="button"
                    class="absolute inset-0 flex size-full flex-col items-center justify-center p-7 text-center"
                    @click="openFilePicker">
                    <span
                        class="grid size-20 place-items-center rounded-3xl bg-white text-[#07532b] shadow-sm ring-1 ring-[#dbe9df] transition group-hover:-translate-y-1 group-hover:shadow-md">
                        <Icon icon="mdi:cloud-upload-outline" class="text-4xl" />
                    </span>

                    <strong class="mt-6 text-base text-[#123d27]">
                        Kéo thả ảnh lá lúa vào đây
                    </strong>

                    <span class="mt-2 text-xs leading-6 text-slate-500">
                        hoặc bấm để chọn ảnh từ thiết bị
                    </span>

                    <span
                        class="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white shadow-sm transition group-hover:bg-[#064522]">
                        <Icon icon="mdi:image-plus-outline" class="text-lg" />

                        Chọn hình ảnh
                    </span>
                </button>
            </div>

            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
                @change="handleInput" />

            <button type="button"
                class="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffd326] px-6 text-sm font-bold text-[#064b26] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f6c900] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                :disabled="!previewUrl || analyzing" @click="$emit('analyze')">
                <Icon :icon="analyzing ? 'mdi:loading' : 'mdi:line-scan'" class="text-xl"
                    :class="analyzing ? 'animate-spin' : ''" />

                {{
                    analyzing
                        ? 'Hệ thống đang phân tích...'
                        : 'Kiểm tra bệnh trên lá lúa'
                }}
            </button>
        </div>
    </section>
</template>

<style scoped>
@keyframes scan-image {
    0% {
        top: 8%;
        opacity: 0;
    }

    12%,
    88% {
        opacity: 1;
    }

    100% {
        top: 90%;
        opacity: 0;
    }
}

.scan-line {
    animation: scan-image 1.6s ease-in-out infinite;
}
</style>