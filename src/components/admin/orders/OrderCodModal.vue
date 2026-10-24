<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useOrderStore } from "@/stores/admin/orderStore";
import { useAuthStore } from "@/stores/shared/authStore";
import { money, code } from "@/utils/orderPresentation";

const store = useOrderStore();
const authStore = useAuthStore();

const emit = defineEmits(["confirm"]);
const order = computed(() => store.selectedOrder);
const canEdit = computed(() => authStore.hasPermission("order.update"));
</script>

<template>
    <Teleport to="body">
        <div v-if="store.showCodModal" class="modal-backdrop z-[60]" @click.self="store.closeCodModal">
            <section role="dialog" aria-modal="true" aria-labelledby="order-cod-title" class="modal-panel max-w-lg">
                <header class="modal-header">
                    <h2 id="order-cod-title" class="text-lg font-bold">
                        Xác nhận thu COD
                    </h2>
                    <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Đóng xác nhận COD" :disabled="store.busy" @click="store.closeCodModal">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </header>
                <form class="space-y-5 p-6" @submit.prevent="emit('confirm')">
                    <p v-if="store.errorMsg" role="alert" class="notice error">
                        {{ store.errorMsg }}
                    </p>
                    <div class="detail-card">
                        <p>Đơn <strong>{{ code(order) }}</strong></p>
                        <p class="mt-2 text-xl font-bold">
                            {{ money(order?.total_payment) }}
                        </p>
                    </div>
                    <p class="text-sm text-text-light">
                        Chỉ xác nhận khi đã nhận đủ tiền từ khách hàng hoặc
                        đơn vị vận chuyển. Thao tác này ghi nhận khoản đã thu,
                        không đổi trạng thái giao hàng.
                    </p>
                    <label class="flex items-start gap-3 text-sm">
                        <input v-model="store.codForm.received_payment" type="checkbox" class="mt-1"
                            :disabled="store.busy" required />
                        <span>
                            Tôi xác nhận đã thực thu đủ
                            {{ money(order?.total_payment) }} cho đơn này.
                        </span>
                    </label>
                    <div class="flex justify-end gap-3">
                        <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                            :disabled="store.busy" @click="store.closeCodModal">
                            Hủy
                        </button>
                        <button type="submit"
                            class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="!canEdit ||
                                store.busy ||
                                !store.detailReady ||
                                !store.codForm.received_payment ||
                                !store.canConfirmCodPayment(order)
                                ">
                            {{
                                store.confirmingPayment
                                    ? "Đang xác nhận..."
                                    : "Xác nhận đã thu"
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

.detail-card {
    @apply rounded-2xl border border-border p-4;
}

.detail-card h3 {
    @apply mb-3 text-sm font-bold text-text-light;
}

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