<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
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
const visiblePages = computed(() => {
  const current = Number(store.lotMeta.current_page) || 1;
  const last = Math.max(1, Number(store.lotMeta.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) pages.push(page);
  return pages;
});
</script>

<template>
    <div class="product-admin">
        <p v-if="store.mode === 'adjustment'" class="mb-3 text-sm">
            Chọn đúng lô cần điều chỉnh. Có thể chuyển trang để tìm lô.
        </p>

        <div v-if="store.loadingLots" class="empty-cell"><Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" /><span>Đang tải lô...</span></div>

        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[1050px] text-sm table-auto">
                <thead class="bg-bg">
                    <tr>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tồn lô</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đang giữ</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Có thể bán</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Hạn dùng</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th>
                        <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap w-px product-table-actions">Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="lot in store.lots" :key="lot.id" class="border-b border-border hover:bg-primary/5">
                        <td class="table-td p-3 text-sm text-left">
                            <strong class="text-left">{{ lot.lot_code }}</strong>
                            <div class="text-xs text-text-light text-left">ID: {{ lot.id }}</div>
                            <div class="text-xs text-text-light text-left">
                                Nhập: {{ dateTime(lot.received_at) }}
                            </div>
                        </td>
                        <td class="table-td p-3 text-sm text-left">{{ lot.quantity_on_hand }}</td>
                        <td class="table-td p-3 text-sm text-left">
                            <strong class="text-left">{{ lot.reserved_quantity ?? "—" }}</strong>
                            <p v-if="lot.reservation_consistent === false" class="text-xs text-red-600 text-left">Cần đối chiếu</p>
                        </td>
                        <td class="table-td p-3 text-sm text-left">
                            <strong class="text-left">{{ lot.available_to_sell ?? "—" }}</strong>
                            <p v-if="lot.legacy_unallocated_quantity > 0" class="max-w-48 text-xs text-text-light text-left">
                                SKU còn {{ lot.legacy_unallocated_quantity }} chưa chốt lô
                            </p>
                        </td>
                        <td class="table-td p-3 text-sm text-left">{{ money(lot.unit_cost) }}</td>
                        <td class="table-td p-3 text-sm text-left">{{ dateOnly(lot.expires_on) }}</td>
                        <td class="table-td p-3 text-sm text-left">{{ statusLabel(lot.status) }}</td>
                        <td class="table-td p-3 text-sm text-left w-px whitespace-nowrap product-table-actions">
                            <button aria-label="Điều chỉnh lô này" title="Điều chỉnh lô này" v-if="store.mode === 'adjustment'" type="button" class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                :disabled="store.formLocked" @click="emit('adjust', lot)">
                      <Icon icon="solar:tuning-bold" aria-hidden="true" />
                    </button>

                            <button aria-label="Sửa thông tin" title="Sửa thông tin" v-else-if="canUpdate" type="button" class="cursor-pointer disabled:cursor-not-allowed text-left btn-outline-icon shrink-0"
                                @click="store.editLot(lot)">
                      <Icon icon="solar:pen-bold" aria-hidden="true" />
                    </button>
                        </td>
                    </tr>

                    <tr class="border-b border-border hover:bg-primary/5" v-if="!store.lots.length">
                        <td colspan="8" class="empty-cell text-sm p-8 text-text-light text-left">Chưa có lô hàng.</td>
                    </tr>
                </tbody>
            </table>
        </div>

<div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
<span class="text-sm text-text-light">Hiển thị {{ store.lots.length }} / {{ store.lotMeta.total }} dòng</span>
<nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang">
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loadingLots ||
                store.formLocked ||
                store.lotMeta.current_page <= 1
                " @click="store.fetchLots(store.lotMeta.current_page - 1)" aria-label="Trang trước">
        <Icon icon="solar:arrow-left-bold" />
      </button>
<button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
 :class="{ active: page === Number(store.lotMeta.current_page) }" :aria-current="page === Number(store.lotMeta.current_page) ? 'page' : undefined"
 :disabled="store.loadingLots || store.formLocked" @click="store.fetchLots(page)">{{ page }}</button>
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="store.loadingLots ||
                store.formLocked ||
                store.lotMeta.current_page >= store.lotMeta.last_page
                " @click="store.fetchLots(store.lotMeta.current_page + 1)" aria-label="Trang sau">
        <Icon icon="solar:arrow-right-bold" />
      </button>
</nav>
</div>

        <p class="mt-3 text-xs text-text-light">
            Lô hết hạn, khóa hoặc cách ly không được bán. Dấu “—” ở Có thể bán
            nghĩa là SKU còn hàng giữ chưa chốt lô hoặc dữ liệu cần đối chiếu;
            số có thể bán toàn SKU vẫn được kiểm tra riêng.
        </p>
    </div>
</template>