<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import InventoryService from "@/services/admin/inventory.service";
import { dateTime } from "@/utils/inventoryDisplay";

const props = defineProps({ packageId: { type: Number, required: true } });
const auth = useAuthStore();
const allowed = computed(() => auth.isAuthenticated && auth.hasPermission("inventory.view"));
const status = ref("active");
const rows = ref([]);
const loading = ref(false);
const error = ref("");
const meta = ref({ current_page: 1, last_page: 1, total: 0 });
let request = null;
let version = 0;
const labels = { active: "Đang giữ", consumed: "Đã xuất", released: "Đã giải phóng" };

async function load(page = 1) {
    request?.abort();
    const token = ++version;
    rows.value = [];
    error.value = "";
    meta.value = { current_page: 1, last_page: 1, total: 0 };
    if (!allowed.value) { loading.value = false; return; }
    request = new AbortController();
    loading.value = true;
    try {
        const response = await InventoryService.getReservations(props.packageId, { status: status.value, page, per_page: 20 }, request.signal);
        if (token !== version || !allowed.value) return;
        rows.value = response.data?.data ?? [];
        meta.value = response.data?.meta ?? meta.value;
    } catch (e) {
        if (token !== version || e.code === "ERR_CANCELED" || e.name === "AbortError") return;
        error.value = e.response?.data?.message || "Không tải được hàng đang giữ. Hãy thử lại.";
    } finally {
        if (token === version) loading.value = false;
    }
}
watch(() => [props.packageId, status.value, allowed.value, auth.user?.id], () => load(1), { immediate: true });
onBeforeUnmount(() => { ++version; request?.abort(); });
</script>

<template>
    <section v-if="allowed" class="space-y-3 border-t border-border pt-5"
        aria-labelledby="inventory-reservations-title">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h3 id="inventory-reservations-title" class="font-bold">Hàng giữ theo đơn</h3>
                <p class="text-xs text-text-light">Xem lô và số lượng đã giữ. Hủy hoặc giải phóng hàng được xử lý từ đơn
                    hàng.</p>
            </div>
            <div class="flex items-center gap-2">
                <label class="sr-only" for="inventory-reservation-status">Trạng thái giữ hàng</label>
                <select id="inventory-reservation-status" v-model="status" class="form-control">
                    <option value="active">Đang giữ</option>
                    <option value="consumed">Đã xuất</option>
                    <option value="released">Đã giải phóng</option>
                    <option value="all">Tất cả</option>
                </select>
                <button type="button" class="btn-outline-sm" :disabled="loading" @click="load(meta.current_page)">Tải
                    lại</button>
            </div>
        </div>
        <p v-if="error" role="alert" class="notice-error">{{ error }}</p>
        <p v-else-if="loading" class="empty-cell">Đang tải hàng giữ...</p>
        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[700px]">
                <thead class="bg-bg">
                    <tr>
                        <th class="table-th">Đơn hàng</th>
                        <th class="table-th">Số lượng</th>
                        <th class="table-th">Lô</th>
                        <th class="table-th">Trạng thái</th>
                        <th class="table-th">Thời điểm</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows" :key="row.id" class="table-row">
                        <td class="table-td"><strong>{{ row.order_code }}</strong>
                            <div class="text-xs text-text-light">Dòng hàng #{{ row.order_item_id }}</div>
                        </td>
                        <td class="table-td">{{ row.quantity }}</td>
                        <td class="table-td">
                            <div v-for="part in row.lots" :key="part.lot_id" class="mb-1">
                                {{ part.lot_code || `Lô #${part.lot_id}` }}: <strong>{{ part.quantity }}</strong>
                                <span v-if="part.discounted_quantity > 0" class="text-xs text-text-light"> ({{
                                    part.discounted_quantity }} được giảm giá)</span>
                            </div>
                            <p v-if="row.unassigned_quantity > 0" class="text-xs text-amber-700">{{
                                row.unassigned_quantity }} chưa chốt lô</p>
                            <p v-if="row.source === 'document'" class="text-xs text-text-light">Theo phiếu soạn/xuất</p>
                        </td>
                        <td class="table-td">{{ labels[row.status] || row.status }}</td>
                        <td class="table-td text-xs">
                            <div>Tạo: {{ dateTime(row.created_at) }}</div>
                            <div v-if="row.expires_at">Hạn giữ: {{ dateTime(row.expires_at) }}</div>
                            <div v-if="row.consumed_at">Xuất: {{ dateTime(row.consumed_at) }}</div>
                            <div v-if="row.released_at">Giải phóng: {{ dateTime(row.released_at) }}</div>
                        </td>
                    </tr>
                    <tr v-if="!rows.length">
                        <td colspan="5" class="empty-cell">Không có hàng giữ phù hợp.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="!loading && !error && meta.total > 0" class="flex items-center justify-end gap-3">
            <span class="text-xs text-text-light">Trang {{ meta.current_page }} / {{ meta.last_page }}</span>
            <button type="button" class="page-btn" :disabled="meta.current_page <= 1"
                @click="load(meta.current_page - 1)">‹</button>
            <button type="button" class="page-btn" :disabled="meta.current_page >= meta.last_page"
                @click="load(meta.current_page + 1)">›</button>
        </div>
    </section>
</template>