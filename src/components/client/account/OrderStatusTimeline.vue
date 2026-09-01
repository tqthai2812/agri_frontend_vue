<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    status: {
        type: String,
        default: 'pending',
    },
})

const steps = [
    { key: 'pending', label: 'Chờ xác nhận', icon: 'mdi:clock-outline' },
    { key: 'confirmed', label: 'Đã xác nhận', icon: 'mdi:check-decagram-outline' },
    { key: 'shipping', label: 'Đang giao hàng', icon: 'mdi:truck-fast-outline' },
    {
        key: 'completed',
        label: 'Hoàn thành',
        icon: 'mdi:package-variant-closed-check',
    },
    {
        key: 'cancelled',
        label: 'Đã hủy',
        icon: 'mdi:close-circle-outline',
    },
]

const normalOrder = ['pending', 'confirmed', 'shipping', 'completed']

const currentIndex = computed(() => {
    return normalOrder.indexOf(props.status)
})

function stateOf(step, index) {
    if (props.status === 'cancelled') {
        if (step.key === 'pending') return 'done'
        if (step.key === 'cancelled') return 'cancelled'

        return 'idle'
    }

    if (step.key === 'cancelled') return 'idle'
    if (index < currentIndex.value) return 'done'
    if (index === currentIndex.value) return 'current'

    return 'idle'
}

function connectorClass(index) {
    if (index >= steps.length - 1) return ''

    if (props.status === 'cancelled') {
        return index === 3 ? 'border-red-200' : 'border-slate-200'
    }

    return index < currentIndex.value
        ? 'border-[#0a7139]'
        : 'border-slate-200'
}
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        <div class="overflow-x-auto pb-2">
            <div class="grid min-w-[700px] grid-cols-5">
                <div v-for="(step, index) in steps" :key="step.key"
                    class="relative flex flex-col items-center px-2 text-center">
                    <span v-if="index < steps.length - 1"
                        class="absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-[23px] border-t-2 transition-colors"
                        :class="connectorClass(index)"></span>

                    <span
                        class="relative z-10 grid size-12 place-items-center rounded-full border-2 bg-white transition-all"
                        :class="{
                            'border-[#0a7139] bg-[#0a7139] text-white shadow-[0_8px_20px_rgba(10,113,57,0.2)]':
                                ['done', 'current'].includes(stateOf(step, index)),
                            'border-slate-200 text-slate-300':
                                stateOf(step, index) === 'idle',
                            'border-red-500 bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.2)]':
                                stateOf(step, index) === 'cancelled',
                            'ring-4 ring-[#0a7139]/10':
                                stateOf(step, index) === 'current',
                        }">
                        <Icon :icon="stateOf(step, index) === 'done'
                            ? 'mdi:check'
                            : step.icon
                            " class="text-xl" />
                    </span>

                    <strong class="mt-3 text-[11px]" :class="{
                        'text-[#07532b]':
                            ['done', 'current'].includes(stateOf(step, index)),
                        'text-slate-400':
                            stateOf(step, index) === 'idle',
                        'text-red-500':
                            stateOf(step, index) === 'cancelled',
                    }">
                        {{ step.label }}
                    </strong>

                    <span v-if="stateOf(step, index) === 'current'"
                        class="mt-1 text-[9px] font-semibold uppercase tracking-wide text-[#0a7139]">
                        Hiện tại
                    </span>
                </div>
            </div>
        </div>
    </section>
</template>