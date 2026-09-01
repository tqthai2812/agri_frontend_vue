<template>
    <Teleport to="body">
        <Transition name="confirm-modal">
            <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
                role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
                <!-- Overlay -->
                <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]" aria-hidden="true"
                    @click="handleOverlayClick"></div>

                <!-- Modal -->
                <div
                    class="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_28px_80px_rgba(2,44,22,0.22)]">
                    <!-- Thanh màu phía trên -->
                    <div class="h-1 w-full" :class="accentBarClass"></div>

                    <!-- Nút đóng -->
                    <button type="button"
                        class="absolute right-4 top-5 grid size-9 place-items-center rounded-full text-text-light transition hover:bg-black/5 hover:text-text disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
                        aria-label="Đóng hộp thoại" :disabled="loading" @click="handleCancel">
                        <Icon icon="mdi:close" class="text-xl" />
                    </button>

                    <div class="px-5 pb-5 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
                        <div class="flex items-start gap-4 pr-8">
                            <!-- Icon -->
                            <div class="grid size-14 shrink-0 place-items-center rounded-2xl ring-1 ring-inset"
                                :class="iconWrapperClass">
                                <Icon :icon="icon" class="text-[28px]" :class="iconClass" />
                            </div>

                            <!-- Nội dung -->
                            <div class="min-w-0 flex-1 pt-0.5">
                                <h3 id="confirm-modal-title" class="text-lg font-bold leading-6 text-text">
                                    {{ title }}
                                </h3>

                                <p class="mt-2 text-sm leading-6 text-text-light">
                                    {{ message }}
                                </p>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button"
                                class="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-text-sec transition hover:border-[#9dbba8] hover:bg-[#f2f8f4] hover:text-[#07532b] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-text"
                                :disabled="loading" @click="handleCancel">
                                {{ cancelText }}
                            </button>

                            <button type="button"
                                class="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                :class="confirmButtonClass" :disabled="loading" @click="handleConfirm">
                                <Icon v-if="loading" icon="mdi:loading" class="animate-spin text-lg" />

                                <Icon v-else :icon="confirmIcon" class="text-lg" />

                                {{
                                    loading
                                        ? loadingText
                                        : confirmText
                                }}
                            </button>
                        </div>

                        <div class="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-text-light/80">
                            <Icon icon="mdi:shield-check-outline" class="text-sm" />

                            Thao tác được thực hiện an toàn
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import {
    computed,
    onBeforeUnmount,
    watch,
} from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },

    title: {
        type: String,
        default: 'Xác nhận thao tác',
    },

    message: {
        type: String,
        default:
            'Bạn có chắc chắn muốn thực hiện thao tác này không?',
    },

    confirmText: {
        type: String,
        default: 'Xác nhận',
    },

    cancelText: {
        type: String,
        default: 'Hủy',
    },

    loadingText: {
        type: String,
        default: 'Đang xử lý...',
    },

    loading: {
        type: Boolean,
        default: false,
    },

    type: {
        type: String,
        default: 'danger',

        validator: (value) =>
            [
                'danger',
                'warning',
                'success',
                'info',
            ].includes(value),
    },

    icon: {
        type: String,
        default:
            'solar:danger-triangle-bold-duotone',
    },

    closeOnOverlay: {
        type: Boolean,
        default: true,
    },
})

const emit = defineEmits([
    'update:modelValue',
    'confirm',
    'cancel',
])

let previousBodyOverflow = ''

const typeStyles = {
    danger: {
        wrapper:
            'bg-red-50 ring-red-100 dark:bg-red-500/10 dark:ring-red-500/20',

        icon:
            'text-red-500',

        button:
            'bg-red-500 hover:bg-red-600 shadow-red-500/25',

        accent:
            'bg-gradient-to-r from-red-400 via-red-500 to-rose-500',

        confirmIcon:
            'mdi:logout',
    },

    warning: {
        wrapper:
            'bg-amber-50 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20',

        icon:
            'text-amber-500',

        button:
            'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25',

        accent:
            'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',

        confirmIcon:
            'mdi:alert-outline',
    },

    success: {
        wrapper:
            'bg-emerald-50 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20',

        icon:
            'text-emerald-600',

        button:
            'bg-[#07532b] hover:bg-[#0a6837] shadow-emerald-700/25',

        accent:
            'bg-gradient-to-r from-[#07532b] via-[#0a7139] to-[#ffd326]',

        confirmIcon:
            'mdi:check',
    },

    info: {
        wrapper:
            'bg-[#edf5f0] ring-[#d4e7da] dark:bg-emerald-500/10 dark:ring-emerald-500/20',

        icon:
            'text-[#07532b]',

        button:
            'bg-[#07532b] hover:bg-[#0a6837] shadow-emerald-700/25',

        accent:
            'bg-gradient-to-r from-[#07532b] via-[#0a7139] to-[#ffd326]',

        confirmIcon:
            'mdi:check',
    },
}

const currentStyle = computed(() => {
    return (
        typeStyles[props.type] ||
        typeStyles.info
    )
})

const iconWrapperClass = computed(() => {
    return currentStyle.value.wrapper
})

const iconClass = computed(() => {
    return currentStyle.value.icon
})

const confirmButtonClass = computed(() => {
    return currentStyle.value.button
})

const accentBarClass = computed(() => {
    return currentStyle.value.accent
})

const confirmIcon = computed(() => {
    return currentStyle.value.confirmIcon
})

function closeModal(eventName) {
    if (props.loading) return

    emit('update:modelValue', false)
    emit(eventName)
}

function handleCancel() {
    closeModal('cancel')
}

function handleOverlayClick() {
    if (!props.closeOnOverlay) return

    handleCancel()
}

function handleConfirm() {
    if (props.loading) return

    emit('confirm')
}

function handleKeydown(event) {
    if (
        event.key === 'Escape' &&
        props.modelValue
    ) {
        handleCancel()
    }
}

watch(
    () => props.modelValue,

    (isOpen) => {
        if (isOpen) {
            previousBodyOverflow =
                document.body.style.overflow

            document.body.style.overflow =
                'hidden'

            window.addEventListener(
                'keydown',
                handleKeydown,
            )

            return
        }

        document.body.style.overflow =
            previousBodyOverflow

        window.removeEventListener(
            'keydown',
            handleKeydown,
        )
    },
)

onBeforeUnmount(() => {
    document.body.style.overflow =
        previousBodyOverflow

    window.removeEventListener(
        'keydown',
        handleKeydown,
    )
})
</script>

<style scoped>
.confirm-modal-enter-active,
.confirm-modal-leave-active {
    transition: opacity 0.2s ease;
}

.confirm-modal-enter-active>div:last-child,
.confirm-modal-leave-active>div:last-child {
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
    opacity: 0;
}

.confirm-modal-enter-from>div:last-child,
.confirm-modal-leave-to>div:last-child {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
}
</style>