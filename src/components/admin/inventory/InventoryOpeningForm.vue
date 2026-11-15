<script setup>
import "@/assets/finance.css";
import { useInventoryStore } from "@/stores/admin/inventoryStore";
const store = useInventoryStore();
import { lotStatuses, quantity } from "@/utils/inventoryDisplay";
</script>

<template>
    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 product-admin">
        Chỉ phân bổ tồn vật lý cũ vào các lô, không nhập thêm hàng. Tổng số lượng
        các lô phải đúng bằng tồn hiện tại. Backend sẽ từ chối nếu đã có lô hoặc còn
        nghiệp vụ cũ chưa được đối soát.
    </div>
    <label class="field form-group product-admin">
        <span class="form-label">Lý do / ghi chú chuyển đổi *</span>
        <textarea v-model.trim="store.initialization.note" class="form-control resize-y" rows="3" maxlength="1000"
            required></textarea>
    </label>
    <article v-for="(lot, index) in store.initialization.lots" :key="index"
        class="space-y-4 rounded-xl border border-border p-4 product-admin">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg font-bold">Lô {{ index + 1 }}</h3>
            <button type="button" class="btn-outline-sm text-danger cursor-pointer disabled:cursor-not-allowed" :disabled="store.initialization.lots.length <= 1"
                @click="store.removeInitializationLot(index)">
                Bỏ dòng
            </button>
        </div>

        <div class="field-grid">
            <label class="field form-group">
                <span class="form-label">Mã lô *</span>
                <input v-model.trim="lot.lot_code" class="form-control" maxlength="100" required />
            </label>

            <label class="field form-group">
                <span class="form-label">Số lượng *</span>
                <input v-model="lot.quantity_on_hand" type="number" min="1" max="2147483647" step="1"
                    class="form-control" required />
            </label>

            <label class="field form-group">
                <span class="form-label">Thời điểm nhập *</span>
                <input v-model="lot.received_at" type="datetime-local" step="1" class="form-control" required />
            </label>

            <label class="field form-group">
                <span class="form-label">Giá vốn / đơn vị SKU</span>
                <input v-model="lot.unit_cost" type="number" min="0" max="9999999999.99" step="0.01"
                    class="form-control" placeholder="Không biết thì để trống" />
                <small class="text-text-light">
                    Để trống là chưa rõ giá vốn, không phải 0 đồng.
                </small>
            </label>

            <label class="field form-group">
                <span class="form-label">Ngày sản xuất</span>
                <input v-model="lot.manufactured_on" type="date" class="form-control" />
            </label>

            <label class="field form-group">
                <span class="form-label">Hạn sử dụng</span>
                <input v-model="lot.expires_on" type="date" :min="lot.manufactured_on || undefined"
                    class="form-control" />
            </label>

            <label class="field form-group">
                <span class="form-label">Trạng thái *</span>
                <select v-model="lot.status" class="form-control cursor-pointer disabled:cursor-not-allowed">
                    <option v-for="status in lotStatuses" :key="status.value" :value="status.value">
                        {{ status.label }}
                    </option>
                </select>
            </label>
        </div>
    </article>
    <div class="flex flex-wrap items-center justify-between gap-3 product-admin">
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.initialization.lots.length >= 100"
            @click="store.addInitializationLot">
            Thêm lô
        </button>

        <strong :class="store.initializedQuantity === store.selectedPackage?.quantity_available
            ? 'text-success'
            : 'text-danger'
            ">
            Đã phân bổ {{ store.initializedQuantity }} /
            {{ quantity(store.selectedPackage?.quantity_available) }}
        </strong>
    </div>
</template>