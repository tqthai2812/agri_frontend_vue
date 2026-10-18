<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { quantity } from "@/utils/inventoryDisplay";
import InventoryLots from "./InventoryLots.vue";
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
            class="inventory-panel fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            @click.self="closePanel">
            <section role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title"
                class="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-surface" @keydown.esc="closePanel">
                <header
                    class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-surface p-5">
                    <div>
                        <h2 id="inventory-dialog-title" class="text-xl font-bold">
                            {{ title }}
                        </h2>
                        <p class="text-sm text-text-light">
                            {{ store.selectedPackage?.product?.name }}
                            · {{ store.selectedPackage?.sku }}
                        </p>
                    </div>

                    <button type="button" class="btn-outline-icon" aria-label="Đóng" :disabled="store.formLocked"
                        @click="closePanel">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </header>

                <div class="space-y-5 p-5">
                    <div v-if="store.dialogError" class="notice-error" role="alert">
                        {{ store.dialogError }}
                        <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
                            <li v-for="(error, field) in store.errors" :key="field">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="store.pendingWrite && !store.saving" class="notice-warning">
                        <p>
                            Yêu cầu trước chưa được xác nhận thành công. Nội dung đang được
                            giữ nguyên; thử lại sẽ dùng đúng payload và mã giao dịch cũ. Nếu
                            API báo đã tồn tại, hãy đối chiếu lịch sử/lô ở tab khác trước khi
                            đóng.
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            <button type="button" class="btn-outline-sm" :disabled="!allowedToSave" @click="save">
                                Thử lại yêu cầu cũ
                            </button>

                            <button type="button" class="btn-outline-sm" @click="finishReconciliation">
                                Đã đối chiếu, đóng
                            </button>
                        </div>
                    </div>

                    <div v-if="store.loadingDetail" class="empty-cell">
                        Đang tải chi tiết...
                    </div>

                    <template v-else>
                        <div class="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg p-4 sm:grid-cols-4">
                            <div>
                                <p class="text-xs text-text-light">Tồn vật lý</p>
                                <strong>{{
                                    quantity(store.selectedPackage?.quantity_available)
                                }}</strong>
                            </div>
                            <div>
                                <p class="text-xs text-text-light">Tổng tồn lô</p>
                                <strong>{{
                                    quantity(store.selectedPackage?.lot_quantity)
                                }}</strong>
                            </div>
                            <div>
                                <p class="text-xs text-text-light">Đang giữ</p>
                                <strong>{{
                                    quantity(store.selectedPackage?.reserved_quantity)
                                }}</strong>
                            </div>
                            <div>
                                <p class="text-xs text-text-light">Có thể bán</p>
                                <strong>{{
                                    quantity(store.selectedPackage?.available_to_sell)
                                }}</strong>
                            </div>
                        </div>

                        <!-- Danh sách lô / chọn lô điều chỉnh -->
                        <InventoryLots v-if="['lots', 'adjustment'].includes(store.mode)"
                            @adjust="emit('adjust', $event)" />

                        <!-- Form ghi dữ liệu -->
                        <form v-if="writable" @submit.prevent="save">
                            <fieldset :disabled="store.formLocked" class="space-y-5">
                                <InventoryImportForm v-if="store.mode === 'import'" />
                                <InventoryOpeningForm v-else-if="store.mode === 'initialize'" />
                                <InventoryLotForm v-else-if="store.mode === 'edit'" />
                            </fieldset>

                            <div class="mt-5 flex justify-end gap-3 border-t border-border pt-4">
                                <button v-if="store.mode === 'edit'" type="button" class="btn-outline"
                                    :disabled="store.formLocked" @click="store.backToLots">
                                    Quay lại
                                </button>

                                <button v-else type="button" class="btn-outline" :disabled="store.formLocked"
                                    @click="closePanel">
                                    Hủy
                                </button>

                                <button type="submit" class="btn-primary" :disabled="!allowedToSave || store.formLocked || store.loadingSuppliers
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