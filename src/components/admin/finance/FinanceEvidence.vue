<script setup>
import "@/assets/finance.css";
import { ref, onMounted, onBeforeUnmount } from "vue";
import api from "@/services/admin/finance.service";
import { money, dateTime, errorText } from "@/composables/useFinance";
import FinanceDialog from "./FinanceDialog.vue";
const props = defineProps({ kind: String, id: Number });
defineEmits(["close"]);
const data = ref(null),
  error = ref("");
const abort = new AbortController();
onMounted(async () => {
  try {
    const r = await api.get(
      `/finance/evidence/${props.kind}/${props.id}`,
      {},
      abort.signal,
    );
    data.value = r.data.data;
  } catch (e) {
    if (e.name !== "AbortError" && e.code !== "ERR_CANCELED")
      error.value = await errorText(e);
  }
});
onBeforeUnmount(() => abort.abort());
</script>
<template>
  <FinanceDialog title="Chứng từ đối chiếu" @close="$emit('close')"
    ><p v-if="error" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{{ error }}</p>
    <p v-else-if="!data">Đang tải chứng từ...</p>
    <template v-else
      ><h2 class="text-lg font-bold">{{ data.code || data.document_number }}</h2>
      <p class="text-xs leading-5 text-text-light">
        {{ data.order_status || data.status }} ·
        {{
          kind === "orders" ? dateTime(data.completed_at) : data.document_date
        }}
      </p>
      <p v-if="data.measure?.issues?.length" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-3">
        {{ data.measure.issues.join("; ") }}
      </p>
      <div class="overflow-x-auto mt-4">
        <table class="w-full text-sm min-w-[700px] table-auto">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">SKU / Sản phẩm</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số lượng</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">
                {{ kind === "orders" ? "Đơn giá bán" : "Giá nhập dòng phiếu" }}
              </th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">
                {{ kind === "orders" ? "Doanh thu sau giảm" : "Ghi chú" }}
              </th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap" v-if="kind === 'orders'">Giá vốn</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-primary/5" v-for="i in data.items" :key="i.id">
              <td class="p-3 text-sm text-left">{{ i.sku }}<br />{{ i.product_name }}</td>
              <td class="p-3 text-sm text-left">{{ i.quantity ?? i.quantity_change }}</td>
              <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(i.price ?? i.unit_cost) }}</td>
              <td class="p-3 text-sm text-left">
                {{ kind === "orders" ? money(i.net_sales_amount) : i.note }}
              </td>
              <td v-if="kind === 'orders'" class="whitespace-nowrap font-mono p-3 text-sm text-left">
                {{ money(i.cost_total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-if="data.payments"
        ><h2 class="mt-6 text-lg font-bold">Các lần thanh toán</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[700px] table-auto">
            <thead class="bg-bg">
              <tr>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Mã giao dịch</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Phương thức</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số tiền</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Ngày thu</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-primary/5" v-for="p in data.payments" :key="p.id">
                <td class="p-3 text-sm text-left">{{ p.transaction_id || "—" }}</td>
                <td class="p-3 text-sm text-left">{{ p.payment_method }}</td>
                <td class="p-3 text-sm text-left">{{ p.status }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(p.amount) }}</td>
                <td class="p-3 text-sm text-left">{{ dateTime(p.paid_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div></template
      >
      <p v-if="data.note" class="mt-4 whitespace-pre-wrap text-sm">
        {{ data.note }}
      </p></template
    ></FinanceDialog
  >
</template>