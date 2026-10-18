<script setup>
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
import { lotStatuses } from "@/utils/inventoryDisplay";
</script>

<template>
    <div class="notice-warning">
        Thao tác này ghi sổ nhập kho ngay, không lưu phiếu nháp. Mỗi lần nhập tạo
        một lô mới.
    </div>
    <div class="field-grid">
        <label class="field">
            <span>Nhà cung cấp *</span>
            <select v-model="store.form.supplier_id" class="form-control" required :disabled="store.loadingSuppliers">
                <option value="">
                    {{ store.loadingSuppliers ? "Đang tải..." : "Chọn nhà cung cấp" }}
                </option>
                <option v-for="supplier in store.suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.supplier_code }} · {{ supplier.name }}
                </option>
            </select>
        </label>

        <label class="field">
            <span>Mã lô *</span>
            <input v-model.trim="store.form.lot_code" class="form-control" maxlength="100" required />
        </label>

        <label class="field">
            <span>Số lượng nhập *</span>
            <input v-model="store.form.quantity_change" type="number" min="1" max="2147483647" step="1"
                class="form-control" required />
        </label>

        <label class="field">
            <span>Giá vốn / một đơn vị SKU *</span>
            <input v-model="store.form.unit_cost" type="number" min="0" max="9999999999.99" step="0.01"
                class="form-control" required />
        </label>

        <label class="field">
            <span>Ngày sản xuất</span>
            <input v-model="store.form.manufactured_on" type="date" class="form-control" />
        </label>

        <label class="field">
            <span>Hạn sử dụng</span>
            <input v-model="store.form.expires_on" type="date" :min="store.form.manufactured_on || undefined"
                class="form-control" />
        </label>

        <label class="field">
            <span>Trạng thái lô *</span>
            <select v-model="store.form.lot_status" class="form-control">
                <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                    {{ status.label }}
                </option>
            </select>
        </label>
    </div>
    <p v-if="!store.loadingSuppliers && !store.suppliers.length" class="text-sm text-warning">
        Chưa tải được nhà cung cấp đang hoạt động hoặc chưa có nhà cung cấp. Cần
        tạo/kích hoạt nhà cung cấp trước khi nhập.
    </p>
    <label class="field">
        <span>Ghi chú</span>
        <textarea v-model.trim="store.form.note" class="form-control" rows="3" maxlength="1000"
            placeholder="Ghi chú phiếu nhập..."></textarea>
    </label>
</template>