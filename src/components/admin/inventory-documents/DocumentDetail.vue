<script setup>
import "@/assets/finance.css";
import {
  documentTypes,
  documentStatuses,
  lotStatuses,
  money,
  totalValue,
  lineValue,
} from "@/utils/inventoryDocument";
defineProps({ document: { type: Object, required: true } });
</script>
<template>
  <div class="doc-stack product-admin">
    <dl class="doc-detail-grid">
      <div>
        <dt>Loại phiếu</dt>
        <dd>
          {{ documentTypes[document.document_type] || document.document_type }}
        </dd>
      </div>
      <div>
        <dt>Trạng thái</dt>
        <dd>
          <span class="doc-badge" :class="document.status">{{
            documentStatuses[document.status] || document.status
          }}</span>
        </dd>
      </div>
      <div>
        <dt>Ngày chứng từ</dt>
        <dd>{{ document.document_date }}</dd>
      </div>
      <div>
        <dt>Nhà cung cấp</dt>
        <dd>{{ document.supplier_name || "—" }}</dd>
      </div>
      <div>
        <dt>Người lập</dt>
        <dd>{{ document.creator?.name || "—" }}</dd>
      </div>
      <div>
        <dt>Người ghi sổ</dt>
        <dd>{{ document.poster?.name || "—" }}</dd>
      </div>
      <div>
        <dt>Thời điểm ghi sổ</dt>
        <dd>{{ document.posted_at || "—" }}</dd>
      </div>
      <div v-if="document.order_id">
        <dt>Đơn hàng liên quan</dt>
        <dd>#{{ document.order_id }}</dd>
      </div>
    </dl>
    <p v-if="document.note" class="doc-note">{{ document.note }}</p>
    <div class="doc-scroll">
      <table class="w-full text-sm min-w-[1050px] table-auto">
        <thead class="bg-bg">
          <tr>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Dòng</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Sản phẩm / SKU</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Quy cách</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Biến động</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá vốn đơn vị</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Giá trị theo dòng</th>
            <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Lô nhập</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border hover:bg-primary/5" v-for="(item, index) in document.items" :key="item.id">
            <td class="p-3 text-sm text-left">{{ item.line_number || index + 1 }}</td>
            <td class="p-3 text-sm text-left">
              <strong class="text-left">{{ item.product_name || "—" }}</strong
              ><small class="text-left">{{ item.sku }} · {{ item.variant_name }}</small
              ><small v-if="item.note" class="doc-note text-left">{{ item.note }}</small>
            </td>
            <td class="p-3 text-sm text-left">{{ item.size }} {{ item.unit }}</td>
            <td class="doc-number p-3 text-sm text-left">
              {{ item.quantity_change > 0 ? "+" : ""
              }}{{ item.quantity_change }}
            </td>
            <td class="doc-number p-3 text-sm text-left">{{ money(item.unit_cost) }}</td>
            <td class="doc-number p-3 text-sm text-left">{{ money(lineValue(item)) }}</td>
            <td class="p-3 text-sm text-left" v-if="item.received_lot">
              <strong class="text-left">{{ item.received_lot.lot_code }}</strong
              ><small class="text-left">{{ lotStatuses[item.received_lot.status] }}</small
              ><small class="text-left">NSX: {{ item.received_lot.manufactured_on || "—" }}</small
              ><small class="text-left">HSD: {{ item.received_lot.expires_on || "—" }}</small>
            </td>
            <td class="p-3 text-sm text-left" v-else>—</td>
          </tr>
          <tr class="border-b border-border hover:bg-primary/5" v-if="!document.items?.length">
            <td colspan="7" class="doc-empty text-sm p-8 text-text-light text-left">Phiếu không có dòng hàng.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="document.document_type === 'supplier_receipt'" class="doc-total">
      <span>Tổng giá trị nhập</span
      ><strong>{{ money(totalValue(document.items)) }}</strong>
    </div>
    <p v-if="document.status === 'posted'" class="text-xs leading-5 text-text-light">
      Phiếu đã ghi sổ. Sai lệch tồn kho được xử lý bằng thao tác điều chỉnh có
      lý do.
    </p>
    <p v-else-if="document.status === 'draft'" class="text-xs leading-5 text-text-light">
      Phiếu nháp chưa làm thay đổi tồn kho.
    </p>
  </div>
</template>