<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
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
const visiblePages = computed(() => {
  const current = Number(meta.value.current_page) || 1;
  const last = Math.max(1, Number(meta.value.last_page) || 1);
  const pages = [];
  for (let page = Math.max(1, current - 2); page <= Math.min(last, current + 2); page++) pages.push(page);
  return pages;
});
</script>

<template>
  <section v-if="allowed" class="space-y-3 border-t border-border pt-5 product-admin" aria-labelledby="inventory-reservations-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 id="inventory-reservations-title" class="font-bold text-lg">Hàng giữ theo đơn</h3>
        <p class="text-xs text-text-light">Xem lô và số lượng đã giữ. Hủy hoặc giải phóng hàng được xử lý từ đơn hàng.</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="sr-only form-group" for="inventory-reservation-status"><span class="form-label">Trạng thái giữ hàng</span></label>
        <select id="inventory-reservation-status" v-model="status" class="form-control cursor-pointer disabled:cursor-not-allowed">
          <option value="active">Đang giữ</option><option value="consumed">Đã xuất</option>
          <option value="released">Đã giải phóng</option><option value="all">Tất cả</option>
        </select>
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="loading" @click="load(meta.current_page)">
<Icon icon="solar:refresh-bold" aria-hidden="true" />Tải lại</button>
      </div>
    </div>
    <p v-if="error" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="loading" class="empty-cell"><Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" /><span>Đang tải hàng giữ...</span></p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[700px] text-sm table-auto">
        <thead class="bg-bg"><tr>
          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đơn hàng</th><th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng</th>
          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô</th><th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th><th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thời điểm</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-b border-border hover:bg-primary/5">
            <td class="table-td p-3 text-sm text-left"><strong class="text-left">{{ row.order_code }}</strong><div class="text-xs text-text-light text-left">Dòng hàng #{{ row.order_item_id }}</div></td>
            <td class="table-td p-3 text-sm text-left">{{ row.quantity }}</td>
            <td class="table-td p-3 text-sm text-left">
              <div v-for="part in row.lots" :key="part.lot_id" class="mb-1 text-left">
                {{ part.lot_code || `Lô #${part.lot_id}` }}: <strong class="text-left">{{ part.quantity }}</strong>
                <span v-if="part.discounted_quantity > 0" class="text-xs text-text-light text-left"> ({{ part.discounted_quantity }} được giảm giá)</span>
              </div>
              <p v-if="row.unassigned_quantity > 0" class="text-xs text-amber-700 text-left">{{ row.unassigned_quantity }} chưa chốt lô</p>
              <p v-if="row.source === 'document'" class="text-xs text-text-light text-left">Theo phiếu soạn/xuất</p>
            </td>
            <td class="table-td p-3 text-sm text-left">{{ labels[row.status] || row.status }}</td>
            <td class="table-td p-3 text-sm text-left">
              <div class="text-left">Tạo: {{ dateTime(row.created_at) }}</div>
              <div class="text-left" v-if="row.expires_at">Hạn giữ: {{ dateTime(row.expires_at) }}</div>
              <div class="text-left" v-if="row.consumed_at">Xuất: {{ dateTime(row.consumed_at) }}</div>
              <div class="text-left" v-if="row.released_at">Giải phóng: {{ dateTime(row.released_at) }}</div>
            </td>
          </tr>
          <tr class="border-b border-border hover:bg-primary/5" v-if="!rows.length"><td colspan="5" class="empty-cell text-sm p-8 text-text-light text-left">Không có hàng giữ phù hợp.</td></tr>
        </tbody>
      </table>
    </div>
<div v-if="!loading && !error && meta.total > 0" class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
<span class="text-sm text-text-light">Hiển thị {{ rows.length }} / {{ meta.total }} dòng</span>
<nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang">
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)" aria-label="Trang trước">
        <Icon icon="solar:arrow-left-bold" />
      </button>
<button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0"
 :class="{ active: page === Number(meta.current_page) }" :aria-current="page === Number(meta.current_page) ? 'page' : undefined"
 :disabled="loading" @click="load(page)">{{ page }}</button>
<button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed shrink-0" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)" aria-label="Trang sau">
        <Icon icon="solar:arrow-right-bold" />
      </button>
</nav>
</div>
  </section>
</template>