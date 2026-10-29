<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import apiClient from "@/api/client";
const props = defineProps({ modelValue: [Number, String], selectedLot: Object, disabled: Boolean });
const emit = defineEmits(["update:modelValue", "select"]);
const days = ref(30), search = ref(""), rows = ref([]), page = ref(1), last = ref(1), loading = ref(false), error = ref("");
let version = 0, disposed = false;
async function load(next = 1) {
    const request = ++version; loading.value = true; error.value = ""; rows.value = [];
    try {
        const response = await apiClient.get("/api/v1/discount-lots", { params: { days: days.value, search: search.value, page: next, per_page: 8 } });
        if (disposed || version !== request) return;
        rows.value = response.data.data || []; page.value = response.data.current_page || 1; last.value = response.data.last_page || 1;
    } catch (e) { if (!disposed && version === request) error.value = e.response?.status === 403 ? "Cần quyền xem kho và tạo/sửa voucher để chọn lô." : e.response?.data?.message || "Không tải được lô."; }
    finally { if (!disposed && version === request) loading.value = false; }
}
function choose(lot) { if (props.disabled || !(Number(lot.available_to_sell) > 0)) return; emit("update:modelValue", lot.id); emit("select", lot); }
onMounted(() => load()); onBeforeUnmount(() => { disposed = true; version++; });
</script>
<template>
    <div class="space-y-3 rounded-xl border border-border p-4">
        <p class="text-sm font-semibold">Chọn lô sắp hết hạn</p>
        <p class="text-xs text-text-light">Không nhập số lượng. Hệ thống kiểm tra tồn lô trừ hàng đang giữ và tự ẩn
            voucher khi hết hàng có thể bán.</p>
        <p v-if="selectedLot" class="text-sm text-primary">Đang chọn: {{ selectedLot.lot_code }} · {{ selectedLot.sku }}
            · Hạn dùng {{ selectedLot.expires_on }}</p>
        <div v-if="!disabled" class="flex flex-wrap gap-2">
            <select v-model="days" aria-label="Hạn dùng trong" class="filter-select" @change="load()">
                <option :value="30">Trong 30 ngày</option>
                <option :value="60">Trong 60 ngày</option>
                <option :value="90">Trong 90 ngày</option>
            </select>
            <input v-model.trim="search" class="form-control min-w-0 flex-1" placeholder="Mã lô, SKU, tên sản phẩm"
                @keyup.enter.prevent="load()" />
            <button type="button" class="btn-outline-sm" :disabled="loading" @click="load()">Tìm lô</button>
        </div>
        <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }} <button type="button" class="underline"
                @click="load()">Thử lại</button></p>
        <p v-else-if="loading" class="text-sm text-text-light">Đang tải lô...</p>
        <template v-else-if="!disabled">
            <div v-if="!rows.length" class="text-sm text-text-light">Không có lô trong khoảng ngày đã chọn.</div>
            <label v-for="lot in rows" :key="lot.id" class="flex items-start gap-3 rounded-xl border p-3"
                :class="Number(modelValue) === lot.id ? 'border-primary bg-red-50' : 'border-border'">
                <input type="radio" name="voucher-lot" class="mt-1" :checked="Number(modelValue) === lot.id"
                    :disabled="!(Number(lot.available_to_sell) > 0)" @change="choose(lot)" />
                <span class="min-w-0 text-xs leading-5"><strong class="block">{{ lot.product_name }} · {{ lot.sku
                }}</strong>
                    Lô {{ lot.lot_code }} · Hạn dùng {{ lot.expires_on }}<br />
                    Tồn {{ lot.quantity_on_hand }} · Đang giữ {{ lot.reserved_quantity }} · Có thể bán {{
                        lot.available_to_sell ?? 'Chưa xác định' }}
                    <span v-if="lot.stock_note" class="block text-amber-700">{{ lot.stock_note }}</span>
                </span>
            </label>
            <div v-if="last > 1" class="flex items-center justify-between text-xs"><button type="button"
                    :disabled="page <= 1" class="btn-outline-sm" @click="load(page - 1)">Trước</button>{{ page }} / {{
                        last }}<button type="button" :disabled="page >= last" class="btn-outline-sm"
                    @click="load(page + 1)">Sau</button></div>
        </template>
    </div>
</template>