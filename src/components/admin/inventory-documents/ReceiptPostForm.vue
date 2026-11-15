<script setup>
import "@/assets/finance.css";
import {
  today,
  lotStatuses,
  money,
  totalValue,
} from "@/utils/inventoryDocument";
defineProps({
  document: { type: Object, required: true },
  lots: { type: Array, required: true },
  locked: Boolean,
});
</script>
<template>
  <div class="doc-stack product-admin">
    <div class="doc-notice">
      Mỗi dòng hàng tạo một lô. Ghi sổ sẽ tăng tồn kho và khóa sửa phiếu.
    </div>
    <fieldset :disabled="locked" class="doc-stack min-w-0">
      <article
        v-for="(item, index) in document.items"
        :key="item.id"
        class="doc-line"
      >
        <header>
          <div>
            <strong>{{ index + 1 }}. {{ item.product_name }}</strong
            ><small
              >{{ item.sku }} · {{ item.quantity_change }} quy cách ×
              {{ money(item.unit_cost) }}</small
            >
          </div>
        </header>
        <div class="doc-grid">
          <label class="form-group" :for="`receipt-lot-${index}`"
            ><span class="form-label">Mã lô *</span><input class="form-control"
              :id="`receipt-lot-${index}`"
              v-model="lots[index].lot_code"
              maxlength="100"
              required
          /></label>
          <label class="form-group" :for="`receipt-status-${index}`"
            ><span class="form-label">Trạng thái lô</span><select class="form-control cursor-pointer disabled:cursor-not-allowed"
              :id="`receipt-status-${index}`"
              v-model="lots[index].status"
            >
              <option
                v-for="(label, value) in lotStatuses"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select></label
          >
          <label class="form-group" :for="`receipt-manufactured-${index}`"
            ><span class="form-label">Ngày sản xuất</span><input class="form-control"
              :id="`receipt-manufactured-${index}`"
              v-model="lots[index].manufactured_on"
              type="date"
              :max="today()"
          /></label>
          <label class="form-group" :for="`receipt-expiry-${index}`"
            ><span class="form-label">Hạn sử dụng</span><input class="form-control"
              :id="`receipt-expiry-${index}`"
              v-model="lots[index].expires_on"
              type="date"
              :min="lots[index].manufactured_on || undefined"
          /></label>
        </div>
        <p
          v-if="lots[index].expires_on && lots[index].expires_on < today()"
          class="doc-warning"
        >
          Lô đã hết hạn: vẫn ghi nhận tồn vật lý, không tính vào lượng có thể
          bán.
        </p>
        <label class="form-group" :for="`receipt-lot-note-${index}`"
          ><span class="form-label">Ghi chú lô</span><input class="form-control"
            :id="`receipt-lot-note-${index}`"
            v-model="lots[index].note"
            maxlength="10000"
        /></label>
      </article>
    </fieldset>
    <div class="doc-total">
      <span>Tổng giá trị nhập</span
      ><strong>{{ money(totalValue(document.items)) }}</strong>
    </div>
  </div>
</template>