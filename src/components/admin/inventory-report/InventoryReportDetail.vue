<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import FinanceDialog from "@/components/admin/finance/FinanceDialog.vue";
import FinancePagination from "@/components/admin/finance/FinancePagination.vue";
import service from "@/services/admin/inventory-report.service";
import {
  quantity,
  money,
  dateText,
  errorText,
  documentType,
} from "@/composables/useInventoryReport";
const props = defineProps({ target: { type: Object, required: true } });
defineEmits(["close"]);
const data = ref(null),
  busy = ref(false),
  error = ref(""),
  documentId = ref(null);
let controller,
  seq = 0;
async function load(page = 1) {
  const current = ++seq;
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  data.value = null;
  error.value = "";
  try {
    const response =
      props.target.kind === "document"
        ? await service.document(props.target.id, controller.signal)
        : await service.journal(
            props.target.id,
            { ...props.target.period, page },
            controller.signal,
          );
    if (current === seq)
      data.value =
        props.target.kind === "document" ? response.data.data : response.data;
  } catch (e) {
    const message = await errorText(e);
    if (current === seq && !controller.signal.aborted) error.value = message;
  } finally {
    if (current === seq) busy.value = false;
  }
}
onMounted(() => load());
onBeforeUnmount(() => {
  seq++;
  controller?.abort();
});
</script>
<template>
  <FinanceDialog
    :title="
      target.kind === 'document' ? 'Chứng từ kho gốc' : `Nhật ký ${target.sku}`
    "
    @close="$emit('close')"
  >
    <p v-if="target.kind === 'journal'" class="text-xs leading-5 text-text-light mb-4">
      {{ dateText(target.period.date_from) }} –
      {{ dateText(target.period.date_to) }} · Theo giờ Việt Nam. Lọc theo thời
      điểm biến động lô; mỗi giao dịch hiển thị đầy đủ các lô của nó. Nhật ký cũ
      chưa gắn lô dùng thời điểm giao dịch.
    </p>
    <div v-if="busy" role="status" class="py-10 text-center text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" />
      <p class="text-sm">Đang tải chứng từ…</p>
    </div>
    <div v-else-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }} <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="load()">Thử lại</button>
    </div>
    <template v-else-if="data && target.kind === 'document'">
      <dl class="grid min-w-0 gap-4 sm:grid-cols-2 mb-5">
        <div>
          <dt class="text-xs leading-5 text-text-light">Số phiếu</dt>
          <dd class="font-bold break-all">{{ data.document_number }}</dd>
        </div>
        <div>
          <dt class="text-xs leading-5 text-text-light">Loại / trạng thái</dt>
          <dd>
            {{ documentType[data.document_type] || data.document_type }} ·
            {{
              { posted: "Đã ghi sổ", draft: "Nháp", cancelled: "Đã hủy" }[
                data.status
              ] || data.status
            }}
          </dd>
        </div>
        <div>
          <dt class="text-xs leading-5 text-text-light">Ngày chứng từ</dt>
          <dd>{{ dateText(data.document_date) }}</dd>
        </div>
        <div>
          <dt class="text-xs leading-5 text-text-light">Nhà cung cấp / đơn hàng</dt>
          <dd>
            {{ data.supplier_name || "—" }}
            <span v-if="data.order_id"> · Đơn #{{ data.order_id }}</span>
          </dd>
        </div>
      </dl>
      <p v-if="data.note" class="mb-4 whitespace-pre-wrap">{{ data.note }}</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[700px] table-auto">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">SKU / sản phẩm</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thay đổi</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn dòng phiếu</th>
              <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô / phân bổ xuất</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-primary/5" v-for="item in data.items || []" :key="item.id">
              <td class="p-3 text-sm text-left">
                {{ item.sku }}
                <p class="text-xs leading-5 text-text-light text-left">
                  {{ item.product_name }} · {{ item.variant_name }}
                </p>
              </td>
              <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ quantity(item.quantity_change) }}</td>
              <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ money(item.unit_cost) }}</td>
              <td class="p-3 text-sm text-left">
                <span class="text-left" v-if="item.received_lot">{{
                  item.received_lot.lot_code
                }}</span>
                <p class="text-left"
                  v-for="allocation in item.issue_allocations || []"
                  :key="allocation.id"
                >
                  Lô #{{ allocation.lot_id }}:
                  {{ quantity(allocation.quantity) }} ·
                  {{ money(allocation.cost_amount) }}
                </p>
                <span class="text-left"
                  v-if="!item.received_lot && !item.issue_allocations?.length"
                  >—</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs leading-5 text-text-light mt-4">
        Giá vốn dòng phiếu có thể trống. Nhật ký theo lô và phân bổ xuất lưu giá
        trị chi tiết; trang này chỉ xem chứng từ.
      </p>
    </template>
    <template v-else-if="data">
      <p v-if="!data.data.length" class="text-xs leading-5 text-text-light py-8 text-center">
        Không có giao dịch trong khoảng ngày này.
      </p>
      <article
        v-for="entry in data.data"
        :key="entry.id"
        class="mb-4 rounded-xl border border-slate-200 p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <strong
              >{{ documentType[entry.document_type] || "Nhật ký cũ" }} · #{{
                entry.id
              }}</strong
            >
            <p class="text-xs leading-5 text-text-light">{{ dateText(entry.occurred_at) }}</p>
          </div>
          <strong>{{ quantity(entry.quantity_change) }} đơn vị quy cách</strong>
        </div>
        <p v-if="entry.legacy" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-3">
          Nhật ký cũ chưa gắn chứng từ/lô. Không cộng lại vào số dư đã chuyển
          sang lô.
        </p>
        <button
          v-if="entry.document_id"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed mt-2 break-all text-left"
          @click="documentId = entry.document_id"
         type="button">
          <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
          {{ entry.document_number || `Phiếu #${entry.document_id}` }}
        </button>
        <p v-if="entry.note" class="text-xs leading-5 text-text-light mt-2 whitespace-pre-wrap">
          {{ entry.note }}
        </p>
        <div v-if="entry.movements?.length" class="overflow-x-auto mt-3">
          <table class="w-full text-sm min-w-[700px] table-auto">
            <thead class="bg-bg">
              <tr>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trước</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Thay đổi</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Sau</th>
                <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Biến động giá trị</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-primary/5" v-for="m in entry.movements" :key="m.id">
                <td class="p-3 text-sm text-left">
                  {{ m.lot_code }}
                  <p class="text-xs leading-5 text-text-light text-left">{{ dateText(m.occurred_at) }}</p>
                </td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ quantity(m.quantity_before) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ quantity(m.quantity_change) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">{{ quantity(m.quantity_after) }}</td>
                <td class="whitespace-nowrap font-mono p-3 text-sm text-left">
                  {{ m.value_change?.toString().startsWith("-") ? "- " : ""
                  }}{{
                    money(
                      m.value_change === null
                        ? null
                        : String(m.value_change).replace(/^-/, ""),
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <FinancePagination :meta="data.meta" :loading="busy" @page="load" />
    </template>
  </FinanceDialog>
  <InventoryReportDetail
    v-if="documentId"
    :target="{ kind: 'document', id: documentId }"
    @close="documentId = null"
  />
</template>