<script setup>
import "@/assets/finance.css";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
import { lotStatuses } from "@/utils/inventoryDisplay";
</script>

<template>
    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 product-admin">
        Chỉ sửa thông tin lô. Không sửa trực tiếp số lượng, giá vốn, nhà cung cấp
        hoặc liên kết phiếu nhập. Khóa lô hoặc đổi hạn dùng có thể ảnh hưởng lượng
        có thể bán; backend kiểm tra hàng đang giữ trước khi chấp nhận.
    </div>
    <div class="field-grid product-admin">
        <label class="field form-group">
            <span class="form-label">Mã lô *</span>
            <input v-model.trim="store.lotForm.lot_code" maxlength="100" class="form-control" required />
        </label>

        <label class="field form-group">
            <span class="form-label">Trạng thái *</span>
            <select v-model="store.lotForm.status" class="form-control cursor-pointer disabled:cursor-not-allowed">
                <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                    {{ status.label }}
                </option>
            </select>
        </label>

        <label class="field form-group">
            <span class="form-label">Ngày sản xuất</span>
            <input v-model="store.lotForm.manufactured_on" type="date" class="form-control" />
        </label>

        <label class="field form-group">
            <span class="form-label">Hạn sử dụng</span>
            <input v-model="store.lotForm.expires_on" type="date" :min="store.lotForm.manufactured_on || undefined"
                class="form-control" />
        </label>
    </div>
    <label class="field form-group product-admin">
        <span class="form-label">Ghi chú</span>
        <textarea v-model.trim="store.lotForm.note" rows="3" maxlength="1000" class="form-control resize-y"></textarea>
    </label>
</template>