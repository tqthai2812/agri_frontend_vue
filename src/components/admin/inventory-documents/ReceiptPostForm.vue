<script setup>
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
    <div class="doc-stack">
        <div class="doc-notice">
            Mỗi dòng hàng tạo một lô. Ghi sổ sẽ tăng tồn kho và khóa sửa phiếu.
        </div>
        <fieldset :disabled="locked" class="doc-stack">
            <article v-for="(item, index) in document.items" :key="item.id" class="doc-line">
                <header>
                    <div>
                        <strong>{{ index + 1 }}. {{ item.product_name }}</strong><small>{{ item.sku }} · {{
                            item.quantity_change }} quy cách ×
                            {{ money(item.unit_cost) }}</small>
                    </div>
                </header>
                <div class="doc-grid">
                    <label :for="`receipt-lot-${index}`">Mã lô *<input :id="`receipt-lot-${index}`"
                            v-model="lots[index].lot_code" maxlength="100" required /></label>
                    <label :for="`receipt-status-${index}`">Trạng thái lô<select :id="`receipt-status-${index}`"
                            v-model="lots[index].status">
                            <option v-for="(label, value) in lotStatuses" :key="value" :value="value">
                                {{ label }}
                            </option>
                        </select></label>
                    <label :for="`receipt-manufactured-${index}`">Ngày sản xuất<input
                            :id="`receipt-manufactured-${index}`" v-model="lots[index].manufactured_on" type="date"
                            :max="today()" /></label>
                    <label :for="`receipt-expiry-${index}`">Hạn sử dụng<input :id="`receipt-expiry-${index}`"
                            v-model="lots[index].expires_on" type="date"
                            :min="lots[index].manufactured_on || undefined" /></label>
                </div>
                <p v-if="lots[index].expires_on && lots[index].expires_on < today()" class="doc-warning">
                    Lô đã hết hạn: vẫn ghi nhận tồn vật lý, không tính vào lượng có thể
                    bán.
                </p>
                <label :for="`receipt-lot-note-${index}`">Ghi chú lô<input :id="`receipt-lot-note-${index}`"
                        v-model="lots[index].note" maxlength="10000" /></label>
            </article>
        </fieldset>
        <div class="doc-total">
            <span>Tổng giá trị nhập</span><strong>{{ money(totalValue(document.items)) }}</strong>
        </div>
    </div>
</template>