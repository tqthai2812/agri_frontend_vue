<script setup>
import {
    onBeforeUnmount,
    watch,
} from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    disease: {
        type: Object,
        default: null,
    },
    previewUrl: {
        type: String,
        default: '',
    },
})

const emit = defineEmits([
    'update:modelValue',
])

function close() {
    emit('update:modelValue', false)
}

function handleKeydown(event) {
    if (
        event.key === 'Escape' &&
        props.modelValue
    ) {
        close()
    }
}

watch(
    () => props.modelValue,
    (open) => {
        document.body.style.overflow = open
            ? 'hidden'
            : ''
    },
)

window.addEventListener(
    'keydown',
    handleKeydown,
)

onBeforeUnmount(() => {
    document.body.style.overflow = ''

    window.removeEventListener(
        'keydown',
        handleKeydown,
    )
})
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
            leave-active-class="transition duration-150" leave-to-class="opacity-0">
            <div v-if="modelValue && disease" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <button type="button" class="absolute inset-0 bg-[#021a0e]/65 backdrop-blur-sm"
                    aria-label="Đóng chi tiết bệnh" @click="close"></button>

                <article class="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                    <div
                        class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
                        <div>
                            <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                                Thông tin tham khảo
                            </p>

                            <h2 class="mt-1 text-lg font-bold text-[#123d27]">
                                Chi tiết bệnh lúa
                            </h2>
                        </div>

                        <button type="button"
                            class="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#07532b] hover:bg-[#edf5f0] hover:text-[#07532b]"
                            aria-label="Đóng" @click="close">
                            <Icon icon="mdi:close" class="text-xl" />
                        </button>
                    </div>

                    <div class="p-5 sm:p-7">
                        <div
                            class="grid gap-6 rounded-3xl bg-gradient-to-br from-[#edf7f0] to-[#fff9dc] p-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:p-6">
                            <img v-if="previewUrl" :src="previewUrl" :alt="disease.name"
                                class="aspect-square w-full rounded-2xl object-cover ring-4 ring-white" />

                            <div class="flex flex-col justify-center">
                                <span
                                    class="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-[#07532b] shadow-sm">
                                    <Icon icon="mdi:shield-search" class="text-sm" />

                                    {{ disease.severity }}
                                </span>

                                <h3 class="mt-4 text-3xl font-bold text-[#07532b]">
                                    {{ disease.name }}
                                </h3>

                                <p class="mt-1 text-xs font-semibold text-slate-500">
                                    {{ disease.englishName }}
                                </p>

                                <p v-if="disease.scientificName" class="mt-1 text-[10px] italic text-slate-400">
                                    {{ disease.scientificName }}
                                </p>

                                <p class="mt-4 text-xs leading-6 text-slate-600">
                                    {{ disease.shortDescription }}
                                </p>
                            </div>
                        </div>

                        <div class="mt-7 grid gap-5 md:grid-cols-2">
                            <section class="rounded-2xl border border-slate-200 p-5">
                                <h4 class="flex items-center gap-2 text-sm font-bold text-[#123d27]">
                                    <span class="grid size-9 place-items-center rounded-xl bg-red-50 text-red-500">
                                        <Icon icon="mdi:alert-decagram-outline" class="text-lg" />
                                    </span>

                                    Dấu hiệu nhận biết
                                </h4>

                                <ul class="mt-4 space-y-3">
                                    <li v-for="item in disease.symptoms" :key="item"
                                        class="flex gap-2.5 text-[11px] leading-5 text-slate-600">
                                        <Icon icon="mdi:circle-small" class="shrink-0 text-xl text-[#0b7a3e]" />

                                        <span>{{ item }}</span>
                                    </li>
                                </ul>
                            </section>

                            <section class="rounded-2xl border border-slate-200 p-5">
                                <h4 class="flex items-center gap-2 text-sm font-bold text-[#123d27]">
                                    <span class="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                                        <Icon icon="mdi:virus-outline" class="text-lg" />
                                    </span>

                                    Nguyên nhân và điều kiện phát sinh
                                </h4>

                                <ul v-if="disease.causes.length" class="mt-4 space-y-3">
                                    <li v-for="item in disease.causes" :key="item"
                                        class="flex gap-2.5 text-[11px] leading-5 text-slate-600">
                                        <Icon icon="mdi:circle-small" class="shrink-0 text-xl text-[#0b7a3e]" />

                                        <span>{{ item }}</span>
                                    </li>
                                </ul>

                                <p v-else class="mt-4 text-[11px] leading-5 text-slate-500">
                                    Không phát hiện nguyên nhân bệnh lý rõ
                                    ràng.
                                </p>
                            </section>

                            <section class="rounded-2xl border border-slate-200 p-5">
                                <h4 class="flex items-center gap-2 text-sm font-bold text-[#123d27]">
                                    <span class="grid size-9 place-items-center rounded-xl bg-[#edf5f0] text-[#07532b]">
                                        <Icon icon="mdi:sprayer" class="text-lg" />
                                    </span>

                                    Hướng xử lý đề xuất
                                </h4>

                                <ol class="mt-4 space-y-3">
                                    <li v-for="(item, index) in disease.treatment" :key="item"
                                        class="flex gap-3 text-[11px] leading-5 text-slate-600">
                                        <span
                                            class="grid size-5 shrink-0 place-items-center rounded-full bg-[#07532b] text-[9px] font-bold text-white">
                                            {{ index + 1 }}
                                        </span>

                                        <span>{{ item }}</span>
                                    </li>
                                </ol>
                            </section>

                            <section class="rounded-2xl border border-slate-200 p-5">
                                <h4 class="flex items-center gap-2 text-sm font-bold text-[#123d27]">
                                    <span class="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon icon="mdi:shield-leaf-outline" class="text-lg" />
                                    </span>

                                    Phòng ngừa
                                </h4>

                                <ol class="mt-4 space-y-3">
                                    <li v-for="(item, index) in disease.prevention" :key="item"
                                        class="flex gap-3 text-[11px] leading-5 text-slate-600">
                                        <span
                                            class="grid size-5 shrink-0 place-items-center rounded-full bg-[#ffd326] text-[9px] font-bold text-[#07532b]">
                                            {{ index + 1 }}
                                        </span>

                                        <span>{{ item }}</span>
                                    </li>
                                </ol>
                            </section>
                        </div>

                        <div
                            class="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-5 text-amber-800">
                            <Icon icon="mdi:information-outline" class="mt-0.5 shrink-0 text-lg" />

                            <p>
                                Kết quả AI chỉ mang tính hỗ trợ nhận biết ban
                                đầu. Trước khi dùng thuốc, hãy kiểm tra trực
                                tiếp trên ruộng và tham khảo cán bộ bảo vệ thực
                                vật.
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </Transition>
    </Teleport>
</template>