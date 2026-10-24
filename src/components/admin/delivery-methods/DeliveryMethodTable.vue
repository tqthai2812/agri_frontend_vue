<script setup>
import { Icon } from "@iconify/vue";
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";

const store = useDeliveryMethodStore();
import { useAuthStore } from "@/stores/shared/authStore";
const authStore = useAuthStore();

const emit = defineEmits(["set-default", "toggle-active", "delete"]);

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}
</script>

<template>
    <div v-if="store.loading" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
        <p class="text-sm">Đang tải phương thức giao hàng...</p>
    </div>

    <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1000px]">
            <thead class="bg-bg">
                <tr>
                    <th class="table-th">Phương thức</th>
                    <th class="table-th">Phí giao hàng</th>
                    <th class="table-th">Đơn tối thiểu</th>
                    <th class="table-th">Khu vực</th>
                    <th class="table-th">Đơn hàng</th>
                    <th class="table-th">Trạng thái</th>
                    <th class="table-th">Mặc định</th>
                    <th class="table-th">Thao tác</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="method in store.deliveryMethods" :key="method.id" class="table-row">
                    <td class="table-td">
                        <div class="text-sm font-semibold">{{ method.name }}</div>
                        <div class="max-w-[320px] text-xs text-text-light">
                            {{ method.description || "Không có mô tả" }}
                        </div>
                    </td>

                    <td class="table-td font-mono font-bold">
                        {{ formatVND(method.base_price) }}
                    </td>

                    <td class="table-td font-mono">
                        {{ formatVND(method.min_order_amount) }}
                    </td>

                    <td class="table-td">
                        <span class="badge-gray">
                            {{ store.regionLabel(method.region) }}
                        </span>
                    </td>

                    <td class="table-td font-mono">
                        {{ method.orders_count ?? 0 }}
                    </td>

                    <td class="table-td">
                        <span :class="store.isTrue(method.is_active)
                            ? 'badge-active'
                            : 'badge-inactive'
                            ">
                            {{ store.isTrue(method.is_active) ? "Đang bật" : "Đã tắt" }}
                        </span>
                    </td>

                    <td class="table-td">
                        <span v-if="store.isTrue(method.is_default)" class="badge-pending">
                            Mặc định
                        </span>

                        <button v-else-if="authStore.hasPermission('delivery-method.update')" type="button"
                            class="text-xs font-semibold text-primary hover:underline cursor-pointer disabled:cursor-not-allowed"
                            :disabled="store.busy" @click="emit('set-default', method)">
                            Đặt mặc định
                        </button>

                        <span v-else class="text-xs text-text-light">—</span>
                    </td>

                    <td class="table-td">
                        <div class="flex gap-2">
                            <button v-if="authStore.hasPermission('delivery-method.update')" type="button"
                                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" title="Sửa"
                                aria-label="Sửa phương thức" :disabled="store.busy"
                                @click="store.openEditModal(method)">
                                <Icon icon="solar:pen-bold" />
                            </button>

                            <button v-if="authStore.hasPermission('delivery-method.update')" type="button"
                                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" :class="store.isTrue(method.is_active)
                                    ? 'text-warning'
                                    : 'text-success'
                                    " title="Bật / tắt" aria-label="Bật hoặc tắt phương thức" :disabled="store.busy"
                                @click="emit('toggle-active', method)">
                                <Icon :icon="store.isTrue(method.is_active)
                                    ? 'solar:pause-circle-bold'
                                    : 'solar:play-circle-bold'
                                    " />
                            </button>

                            <button v-if="authStore.hasPermission('delivery-method.delete')" type="button"
                                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed" title="Xóa"
                                aria-label="Xóa phương thức" :disabled="store.busy || Number(method.orders_count || 0) > 0
                                    " @click="emit('delete', method)">
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                        </div>
                    </td>
                </tr>

                <tr v-if="!store.deliveryMethods.length">
                    <td colspan="8" class="empty-cell">
                        Không có phương thức giao hàng nào.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.table-th {
    @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
    @apply p-3 align-middle;
}

.table-row {
    @apply border-b border-border transition hover:bg-primary/5;
}

.empty-cell {
    @apply p-8 text-center text-text-light;
}
</style>