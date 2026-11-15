<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { ref, computed, watch } from "vue";
import { useFinance, money, dateTime } from "@/composables/useFinance";
import Dialog from "./FinanceDialog.vue";
import Pager from "./FinancePagination.vue";
import Evidence from "./FinanceEvidence.vue";
const props = defineProps({
  entry: { type: Object, required: true },
  period: { type: Object, required: true },
});
defineEmits(["close"]);
const { auth, allowed, can, data, loading, error, load } =
  useFinance("report.profit.view");
const result = computed(() => data.value?.data);
const expanded = ref(null),
  evidence = ref(null);
function cost4(value) {
  if (value === null || value === undefined) return "Chưa đủ dữ liệu";
  const text = String(value);
  if (!/^\d+(\.\d{1,4})?$/.test(text)) return "Không hợp lệ";
  const [whole, fraction = ""] = text.split(".");
  return (
    BigInt(whole).toLocaleString("vi-VN") + "," + fraction.padEnd(4, "0") + " ₫"
  );
}
async function fetchRows(page = 1) {
  expanded.value = null;
  evidence.value = null;
  await load(`/reports/profit/skus/${props.entry.key}`, {
    date_from: props.period.date_from,
    date_to: props.period.date_to,
    page,
  });
}
watch(
  () => [
    props.entry.key,
    props.period.date_from,
    props.period.date_to,
    auth.user?.id,
    allowed.value,
    can("inventory.view"),
  ],
  () => {
    if (allowed.value) fetchRows();
    else {
      evidence.value = null;
      expanded.value = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Dialog
    :title="`Chi tiết SKU ${entry.sku || 'chưa xác định'}`"
    @close="$emit('close')"
  >
    <p v-if="!allowed" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
      Bạn không có quyền xem báo cáo.
    </p>
    <template v-else>
      <p class="text-xs leading-5 text-text-light">
        {{ entry.product_name || "Thiếu tên lưu lúc mua" }} ·
        {{ entry.variant_name || "—" }} · {{ entry.package_label }}
      </p>
      <p class="text-xs leading-5 text-text-light">{{ period.date_from }} → {{ period.date_to }}</p>
      <p v-if="error" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{{ error }}</p>
      <p v-if="loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />
        Đang tải các dòng bán hàng...
      </p>
      <template v-else-if="result">
        <div class="my-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span
            >Doanh thu:
            <strong>{{ money(result.summary.net_sales) }}</strong></span
          >
          <span
            >Giá vốn:
            <strong>{{ money(result.summary.cost_total) }}</strong></span
          >
          <span
            >Lãi gộp:
            <strong>{{ money(result.summary.gross_profit) }}</strong></span
          >
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1050px] table-auto">
            <thead class="bg-bg">
              <tr>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đơn hàng / Dòng</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Hoàn thành</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đơn giá lúc mua</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trước giảm</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giảm giá</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Doanh thu</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lãi gộp</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đối chiếu</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in result.data" :key="row.id">
                <tr class="border-b border-border hover:bg-primary/5">
                  <td class="p-3 text-sm text-left">
                    <button
                      v-if="can('order.view')"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left"
                      @click="evidence = { kind: 'orders', id: row.order_id }"
                     type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ row.code }}</button
                    ><span class="text-left" v-else>{{ row.code }}</span>
                    <p class="text-xs leading-5 text-text-light text-left">Dòng #{{ row.id }}</p>
                  </td>
                  <td class="whitespace-nowrap p-3 text-sm text-left">
                    {{ dateTime(row.completed_at) }}
                  </td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ row.quantity ?? "—" }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.price) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.gross_sales) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.discount) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.net_sales) }}</td>
                  <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(row.cost_total) }}</td>
                  <td
                    class="whitespace-nowrap font-mono p-3 text-sm text-left"
                    :class="
                      row.gross_profit?.startsWith('-') ? 'text-red-500' : ''
                    "
                  >
                    {{ money(row.gross_profit) }}
                  </td>
                  <td class="min-w-44 p-3 text-sm text-left">
                    <span class="inline-block whitespace-nowrap rounded-lg bg-bg px-2 py-1 text-xs text-left">{{ row.status_label }}</span>
                    <button
                      v-if="result.can_view_lots && can('inventory.view')"
                      type="button"
                      class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed mt-2 text-left"
                      :aria-expanded="expanded === row.id"
                      @click="expanded = expanded === row.id ? null : row.id"
                    >
                      <Icon icon="solar:box-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ expanded === row.id ? "Đóng lô xuất" : "Xem lô xuất" }}
                    </button>
                  </td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5"
                  v-if="
                    expanded === row.id &&
                    result.can_view_lots &&
                    can('inventory.view')
                  "
                >
                  <td class="p-3 text-sm text-left" colspan="10">
                    <p
                      class="mb-3 text-sm font-semibold text-left"
                      :class="
                        row.allocation_status === 'Khớp giá vốn đã chốt'
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      "
                    >
                      {{ row.allocation_status }}
                    </p>
                    <p class="text-xs leading-5 text-text-light mb-3 text-left">{{ row.reservation_check }}</p>
                    <p class="text-xs leading-5 text-text-light mb-3 text-left">
                      Số lượng hưởng giảm theo lô dùng cho voucher xả kho.
                      Tiền giảm thực tế của cả dòng được hiển thị ở bảng trên.
                      Dấu — là không có lịch sử giữ lô để đối chiếu.
                    </p>
                    <table class="w-full text-sm min-w-[1050px] table-auto text-left" v-if="row.allocations?.length">
                      <thead class="bg-bg text-left">
                        <tr class="border-b border-border hover:bg-primary/5 text-left">
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô xuất</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Phiếu xuất</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng xuất</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng đã giữ</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">SL hưởng giảm theo lô</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Đơn giá vốn lô</th>
                          <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thành tiền vốn</th>
                        </tr>
                      </thead>
                      <tbody class="text-left">
                        <tr class="border-b border-border hover:bg-primary/5 text-left" v-for="lot in row.allocations" :key="lot.id">
                          <td class="p-3 text-sm text-left">{{ lot.lot_code || "—" }}</td>
                          <td class="p-3 text-sm text-left">{{ lot.document_number || "—" }}</td>
                          <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ lot.quantity }}</td>
                          <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ lot.reserved_quantity ?? "—" }}</td>
                          <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ lot.discounted_quantity ?? "—" }}</td>
                          <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ cost4(lot.unit_cost) }}</td>
                          <td class="whitespace-nowrap font-mono p-3 text-sm text-left">
                            {{ money(lot.cost_amount) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </template>
              <tr class="border-b border-border hover:bg-primary/5" v-if="!result.data.length">
                <td class="text-sm p-8 text-text-light text-left" colspan="10">Không có dòng bán hàng ở trang này.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager :count="result.data.length"
          :meta="result.meta"
          :loading="loading"
          @page="fetchRows($event)"
        />
      </template>
      <Evidence
        v-if="evidence && can('order.view')"
        v-bind="evidence"
        @close="evidence = null"
      />
    </template>
  </Dialog>
</template>