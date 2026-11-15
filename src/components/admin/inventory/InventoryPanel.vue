<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { quantity } from "@/utils/inventoryDisplay";
import InventoryLots from "./InventoryLots.vue";
import InventoryReservations from "./InventoryReservations.vue";
import InventoryHistory from "./InventoryHistory.vue";
import InventoryImportForm from "./InventoryImportForm.vue";
import InventoryOpeningForm from "./InventoryOpeningForm.vue";
import InventoryLotForm from "./InventoryLotForm.vue";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
const authStore = useAuthStore();
const canCreate = computed(() => authStore.hasPermission("inventory.create"));
const canUpdate = computed(() => authStore.hasPermission("inventory.update"));
const emit = defineEmits(["adjust"]);
const title = computed(() => {
    return (
        {
            import: "Nhập kho",
            adjustment: "Điều chỉnh tồn lô",
            initialize: "Khởi tạo lô từ tồn cũ",
            lots: "Danh sách lô",
            edit: "Sửa thông tin lô",
            history: "Lịch sử kho",
        }[store.mode] || ""
    );
});

const writable = computed(() =>
    ["import", "initialize", "edit"].includes(store.mode),
);

const allowedToSave = computed(() => {
    if (["import", "adjustment"].includes(store.mode)) {
        return canCreate.value;
    }

    return canUpdate.value;
});
function closePanel() {
    store.closePanel();
}
async function save() {
    if (!allowedToSave.value) {
        return;
    }

    await store.save();
}

async function finishReconciliation() {
    const confirmed = window.confirm(
        "Chỉ đóng sau khi bạn đã kiểm tra lịch sử kho hoặc danh sách lô " +
        "để biết yêu cầu trước đã được ghi nhận hay chưa. " +
        "Bạn xác nhận đã kiểm tra?",
    );

    if (!confirmed) {
        return;
    }

    store.dismissPendingWrite();
    await store.fetchInventory();
}
</script>

<template>
    <Teleport to="body">
        <div v-if="store.mode"
            class="inventory-panel fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 product-admin"
            @click.self="closePanel">
            <section role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title"
                class="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-surface text-text shadow-2xl" @keydown.esc="closePanel">
                <header
                    class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
                    <div>
                        <h2 id="inventory-dialog-title" class="text-xl font-bold">
                            {{ title }}
                        </h2>
                        <p class="text-sm text-text-light">
                            {{ store.selectedPackage?.product?.name }}
                            · {{ store.selectedPackage?.sku }}
                        </p>
                    </div>

                    <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" aria-label="Đóng" :disabled="store.formLocked"
                        @click="closePanel">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </header>

                <div class="space-y-6 p-5 sm:p-6">
                    <div v-if="store.dialogError" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                        {{ store.dialogError }}
                        <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
                            <li v-for="(error, field) in store.errors" :key="field">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="store.pendingWrite && !store.saving" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <p>
                            Yêu cầu trước chưa được xác nhận thành công. Nội dung đang được
                            giữ nguyên; thử lại sẽ dùng đúng payload và mã giao dịch cũ. Nếu
                            API báo đã tồn tại, hãy đối chiếu lịch sử/lô ở tab khác trước khi
                            đóng.
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="!allowedToSave" @click="save">
                                Thử lại yêu cầu cũ
                            </button>

                            <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="finishReconciliation">
                                Đã đối chiếu, đóng
                            </button>
                        </div>
                    </div>

                    <div v-if="store.loadingDetail" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />
                        Đang tải chi tiết...
                    </div>

                    <template v-else>
                        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div class="rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm">
                                <p class="text-xs font-medium text-text-light">Tồn vật lý</p>
                                <strong class="font-mono text-2xl font-bold">{{
                                    quantity(store.selectedPackage?.quantity_available)
                                }}</strong>
                            </div>
                            <div class="rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm">
                                <p class="text-xs font-medium text-text-light">Tổng tồn lô</p>
                                <strong class="font-mono text-2xl font-bold">{{
                                    quantity(store.selectedPackage?.lot_quantity)
                                }}</strong>
                            </div>
                            <div class="rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm">
                                <p class="text-xs font-medium text-text-light">Đang giữ</p>
                                <strong class="font-mono text-2xl font-bold">{{
                                    quantity(store.selectedPackage?.reserved_quantity)
                                }}</strong>
                            </div>
                            <div class="rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm">
                                <p class="text-xs font-medium text-text-light">Có thể bán</p>
                                <strong class="font-mono text-2xl font-bold">{{
                                    quantity(store.selectedPackage?.available_to_sell)
                                }}</strong>
                            </div>
                        </div>

                        <div v-if="store.selectedPackage?.reservation_consistent === false" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                            <strong>Dữ liệu giữ lô cần đối chiếu</strong>
                            <ul class="mt-2 list-disc pl-5">
                                <li v-for="item in store.selectedPackage.reservation_issues" :key="item">{{ item }}</li>
                            </ul>
                        </div>

                        <!-- Danh sách lô / chọn lô điều chỉnh -->
                        <InventoryLots v-if="['lots', 'adjustment'].includes(store.mode)"
                            @adjust="emit('adjust', $event)" />

                        <InventoryReservations v-if="store.mode === 'lots' && store.selectedPackage"
                            :package-id="store.selectedPackage.id" />

                        <!-- Form ghi dữ liệu -->
                        <form v-if="writable" @submit.prevent="save">
                            <fieldset :disabled="store.formLocked" class="space-y-5 min-w-0">
                                <InventoryImportForm v-if="store.mode === 'import'" />
                                <InventoryOpeningForm v-else-if="store.mode === 'initialize'" />
                                <InventoryLotForm v-else-if="store.mode === 'edit'" />
                            </fieldset>

                            <div class="mt-5 flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row product-form-actions sticky bottom-0 bg-surface">
                                <button v-if="store.mode === 'edit'" type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                                    :disabled="store.formLocked" @click="store.backToLots">
                                    Quay lại
                                </button>

                                <button v-else type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed" :disabled="store.formLocked"
                                    @click="closePanel">
                                    Hủy
                                </button>

                                <button type="submit" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="!allowedToSave || store.formLocked || store.loadingSuppliers
                                    ">
                                    {{ store.saving ? "Đang lưu..." : "Lưu" }}
                                </button>
                            </div>
                        </form>

                        <!-- Lịch sử chỉ đọc -->
                        <InventoryHistory v-if="store.mode === 'history'" />
                    </template>
                </div>
            </section>
        </div>
    </Teleport>
</template>