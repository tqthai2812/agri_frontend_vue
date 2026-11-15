<script setup>
import "@/assets/finance.css";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
import { lotStatuses } from "@/utils/inventoryDisplay";
</script>

<template>
    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 product-admin">
        Thao tác này ghi sổ nhập kho ngay, không lưu phiếu nháp. Mỗi lần nhập tạo
        một lô mới.
    </div>
    <div class="field-grid product-admin">
        <label class="field form-group">
            <span class="form-label">Nhà cung cấp *</span>
            <select v-model="store.form.supplier_id" class="form-control cursor-pointer disabled:cursor-not-allowed" required :disabled="store.loadingSuppliers">
                <option value="">
                    {{ store.loadingSuppliers ? "Đang tải..." : "Chọn nhà cung cấp" }}
                </option>
                <option v-for="supplier in store.suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.supplier_code }} · {{ supplier.name }}
                </option>
            </select>
        </label>

        <label class="field form-group">
            <span class="form-label">Mã lô *</span>
            <input v-model.trim="store.form.lot_code" class="form-control" maxlength="100" required />
        </label>

        <label class="field form-group">
            <span class="form-label">Số lượng nhập *</span>
            <input v-model="store.form.quantity_change" type="number" min="1" max="2147483647" step="1"
                class="form-control" required />
        </label>

        <label class="field form-group">
            <span class="form-label">Giá vốn / một đơn vị SKU *</span>
            <input v-model="store.form.unit_cost" type="number" min="0" max="9999999999.99" step="0.01"
                class="form-control" required />
        </label>

        <label class="field form-group">
            <span class="form-label">Ngày sản xuất</span>
            <input v-model="store.form.manufactured_on" type="date" class="form-control" />
        </label>

        <label class="field form-group">
            <span class="form-label">Hạn sử dụng</span>
            <input v-model="store.form.expires_on" type="date" :min="store.form.manufactured_on || undefined"
                class="form-control" />
        </label>

        <label class="field form-group">
            <span class="form-label">Trạng thái lô *</span>
            <select v-model="store.form.lot_status" class="form-control cursor-pointer disabled:cursor-not-allowed">
                <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                    {{ status.label }}
                </option>
            </select>
        </label>
    </div>
    <p v-if="!store.loadingSuppliers && !store.suppliers.length" class="text-sm text-warning product-admin">
        Chưa tải được nhà cung cấp đang hoạt động hoặc chưa có nhà cung cấp. Cần
        tạo/kích hoạt nhà cung cấp trước khi nhập.
    </p>
    <label class="field form-group product-admin">
        <span class="form-label">Ghi chú</span>
        <textarea v-model.trim="store.form.note" class="form-control resize-y" rows="3" maxlength="1000"
            placeholder="Ghi chú phiếu nhập..."></textarea>
    </label>
</template>