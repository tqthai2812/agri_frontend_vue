<script setup>
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
import { computed } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import {
    dateOnly,
    dateTime,
    money,
    statusLabel,
} from "@/utils/inventoryDisplay";
const authStore = useAuthStore();
const canUpdate = computed(() => authStore.hasPermission("inventory.update"));
const emit = defineEmits(["adjust"]);
</script>

<template>
    <div>
        <p v-if="store.mode === 'adjustment'" class="mb-3 text-sm">
            Chọn đúng lô cần điều chỉnh. Có thể chuyển trang để tìm lô.
        </p>

        <div v-if="store.loadingLots" class="empty-cell">Đang tải lô...</div>

        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[800px]">
                <thead class="bg-bg">
                    <tr>
                        <th class="table-th">Lô</th>
                        <th class="table-th">Tồn lô</th>
                        <th class="table-th">Giá vốn</th>
                        <th class="table-th">Hạn dùng</th>
                        <th class="table-th">Trạng thái</th>
                        <th class="table-th">Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="lot in store.lots" :key="lot.id" class="table-row">
                        <td class="table-td">
                            <strong>{{ lot.lot_code }}</strong>
                            <div class="text-xs text-text-light">ID: {{ lot.id }}</div>
                            <div class="text-xs text-text-light">
                                Nhập: {{ dateTime(lot.received_at) }}
                            </div>
                        </td>
                        <td class="table-td">{{ lot.quantity_on_hand }}</td>
                        <td class="table-td">{{ money(lot.unit_cost) }}</td>
                        <td class="table-td">{{ dateOnly(lot.expires_on) }}</td>
                        <td class="table-td">{{ statusLabel(lot.status) }}</td>
                        <td class="table-td">
                            <button v-if="store.mode === 'adjustment'" type="button" class="btn-outline-sm"
                                :disabled="store.formLocked" @click="emit('adjust', lot)">
                                Điều chỉnh lô này
                            </button>

                            <button v-else-if="canUpdate" type="button" class="btn-outline-sm"
                                @click="store.editLot(lot)">
                                Sửa thông tin
                            </button>
                        </td>
                    </tr>

                    <tr v-if="!store.lots.length">
                        <td colspan="6" class="empty-cell">Chưa có lô hàng.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-3 flex items-center justify-end gap-3">
            <span class="text-xs text-text-light">
                Trang {{ store.lotMeta.current_page }} /
                {{ store.lotMeta.last_page }}
            </span>
            <button type="button" class="page-btn" :disabled="store.loadingLots ||
                store.formLocked ||
                store.lotMeta.current_page <= 1
                " @click="store.fetchLots(store.lotMeta.current_page - 1)">
                ‹
            </button>
            <button type="button" class="page-btn" :disabled="store.loadingLots ||
                store.formLocked ||
                store.lotMeta.current_page >= store.lotMeta.last_page
                " @click="store.fetchLots(store.lotMeta.current_page + 1)">
                ›
            </button>
        </div>

        <p class="mt-3 text-xs text-text-light">
            “Khả dụng” không đồng nghĩa còn bán được: lô hết hạn vẫn bị loại khỏi
            lượng có thể bán.
        </p>
    </div>
</template>