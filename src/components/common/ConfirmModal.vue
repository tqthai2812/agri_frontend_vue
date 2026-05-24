<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleCancel"></div>

                <!-- Modal -->
                <div
                    class="relative w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
                    <div class="p-6">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                :class="iconWrapperClass">
                                <Icon :icon="icon" class="text-2xl" :class="iconClass" />
                            </div>

                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-text">
                                    {{ title }}
                                </h3>

                                <p class="text-sm text-text-light mt-1 leading-relaxed">
                                    {{ message }}
                                </p>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 mt-7">
                            <button type="button"
                                class="px-4 py-2 rounded-xl text-sm font-medium border border-border text-text-sec hover:bg-gray-50 transition-all"
                                @click="handleCancel">
                                {{ cancelText }}
                            </button>

                            <button type="button"
                                class="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                                :class="confirmButtonClass" :disabled="loading" @click="handleConfirm">
                                {{ loading ? loadingText : confirmText }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: "Xác nhận thao tác",
    },
    message: {
        type: String,
        default: "Bạn có chắc chắn muốn thực hiện thao tác này không?",
    },
    confirmText: {
        type: String,
        default: "Xác nhận",
    },
    cancelText: {
        type: String,
        default: "Hủy",
    },
    loadingText: {
        type: String,
        default: "Đang xử lý...",
    },
    loading: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: "danger",
    },
    icon: {
        type: String,
        default: "solar:danger-triangle-bold-duotone",
    },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const iconWrapperClass = computed(() => {
    if (props.type === "danger") {
        return "bg-red-100";
    }

    if (props.type === "warning") {
        return "bg-orange-100";
    }

    return "bg-primary/10";
});

const iconClass = computed(() => {
    if (props.type === "danger") {
        return "text-red-500";
    }

    if (props.type === "warning") {
        return "text-orange-500";
    }

    return "text-primary";
});

const confirmButtonClass = computed(() => {
    if (props.type === "danger") {
        return "bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20";
    }

    if (props.type === "warning") {
        return "bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/20";
    }

    return "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20";
});

function handleCancel() {
    if (props.loading) return;

    emit("update:modelValue", false);
    emit("cancel");
}

function handleConfirm() {
    emit("confirm");
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>