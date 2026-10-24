<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { useAuthStore } from "@/stores/shared/authStore";
import { code, statusLabel } from "@/utils/orderPresentation";

const store = useOrderStore();
const authStore = useAuthStore();

const emit = defineEmits(["save"]);
const order = computed(() => store.selectedOrder);
const canEdit = computed(() => authStore.hasPermission("order.update"));
const nextStatuses = computed(() => store.getNextStatuses(order.value));
</script>

<template>
    <Teleport to="body">
        <div v-if="store.showStatusModal" class="modal-backdrop z-[60]" @click.self="store.closeStatusModal">
            <section role="dialog" aria-modal="true" aria-labelledby="order-status-title" class="modal-panel max-w-lg">
                <header class="modal-header">
                    <h2 id="order-status-title" class="text-lg font-bold">
                        Cập nhật {{ code(order) }}
                    </h2>
                    <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Đóng cập nhật" :disabled="store.busy" @click="store.closeStatusModal">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </header>
                <form class="space-y-4 p-6" @submit.prevent="emit('save')">
                    <p v-if="store.errorMsg" role="alert" class="notice error">
                        {{ store.errorMsg }}
                    </p>
                    <p class="text-sm">
                        Hiện tại:
                        <strong>{{ statusLabel(order?.order_status) }}</strong>
                    </p>
                    <label class="block">
                        <span class="form-label">Trạng thái mới</span>
                        <select v-model="store.statusForm.order_status" class="form-control w-full"
                            :disabled="store.busy" required>
                            <option v-for="status in nextStatuses" :key="status.value" :value="status.value">
                                {{ status.label }}
                            </option>
                        </select>
                    </label>
                    <p v-if="store.statusForm.order_status === 'shipping'" class="text-sm text-text-light">
                        Chuyển sang đang giao sẽ xuất kho.
                        Đơn đang giao không thể hủy bằng thao tác này.
                    </p>
                    <p v-if="store.statusForm.order_status === 'cancelled'" class="text-sm text-text-light">
                        Hủy đơn sẽ giải phóng hàng đang giữ.
                        Đơn đã hủy không thể mở lại.
                    </p>
                    <p v-if="
                        store.statusForm.order_status === 'completed' &&
                        order?.payment_method === 'COD' &&
                        !store.isPaid(order)
                    " class="text-sm text-text-light">
                        Hoàn thành ghi nhận đã giao hàng.
                        Tiền COD cần được xác nhận riêng khi đã thực thu.
                    </p>
                    <label class="block">
                        <span class="form-label">Ghi chú</span>
                        <textarea v-model="store.statusForm.note" rows="3" maxlength="1000" class="form-control w-full"
                            :disabled="store.busy"></textarea>
                    </label>
                    <div class="flex justify-end gap-3">
                        <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                            :disabled="store.busy" @click="store.closeStatusModal">
                            Hủy
                        </button>
                        <button type="submit"
                            class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canEdit ||
                                store.busy ||
                                !store.detailReady ||
                                !nextStatuses.some(
                                    (item) => item.value === store.statusForm.order_status
                                )
                                ">
                            {{
                                store.savingStatus
                                    ? "Đang lưu..."
                                    : "Lưu trạng thái"
                            }}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    </Teleport>
</template>

<style scoped>
@reference "../../../style.css";

.notice {
    @apply mb-5 rounded-2xl border px-4 py-3 text-sm;
}

.notice.success {
    @apply border-green-100 bg-green-50 text-green-700;
}

.notice.warning {
    @apply border-amber-200 bg-amber-50 text-amber-800;
}

.notice.error {
    @apply border-red-100 bg-red-50 text-red-600;
}

.modal-backdrop {
    @apply fixed inset-0 flex items-center justify-center bg-black/50 p-4;
}

.modal-panel {
    @apply max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-surface shadow-xl;
}

.modal-header {
    @apply sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface p-5;
}
</style>