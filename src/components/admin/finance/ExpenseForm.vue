<script setup>
import { reactive, ref } from "vue";
import { localInput } from "@/composables/useFinance";
import { useAuthStore } from "@/stores/shared/authStore";
import Lookup from "./FinanceLookup.vue";
const props = defineProps({ expense: Object, busy: Boolean });
const emit = defineEmits(["submit", "cancel"]);
const auth = useAuthStore();
const e = props.expense;
const form = reactive({
    category_id: e?.category_id ?? null,
    amount: e?.amount ?? "",
    description: e?.description ?? "",
    incurred_at: e ? localInput(e.incurred_at) : localInput(),
    paid_at: e?.paid_at ? localInput(e.paid_at) : "",
    order_id: e?.order_id ?? null,
    payment_id: e?.payment_id ?? null,
    inventory_document_id: e?.inventory_document_id ?? null,
});
const paid = ref(!!e?.paid_at),
    source = ref(
        e?.inventory_document_id
            ? "inventory"
            : e?.payment_id
                ? "payment"
                : e?.order_id
                    ? "order"
                    : "none",
    );
const labels = reactive({
    category: e?.category?.name,
    order: e?.order_code,
    payment: e?.payment_id ? "Thanh toán #" + e.payment_id : "",
    inventory: e?.inventory_document_number,
});
function resetSource() {
    form.order_id = null;
    form.payment_id = null;
    form.inventory_document_id = null;
    labels.order = labels.payment = labels.inventory = "";
}
function submit() {
    emit("submit", {
        ...form,
        amount: String(form.amount).trim(),
        paid_at: paid.value ? form.paid_at : null,
        ...(e ? { lock_version: e.lock_version } : {}),
    });
}
</script>
<template>
    <form @submit.prevent="submit">
        <fieldset :disabled="busy" class="fin-grid">
            <Lookup kind="expense-categories" active-only label="Danh mục chi phí *" v-model="form.category_id"
                :selected-label="labels.category" @select="labels.category = $event?.label" />
            <label>Số tiền (đồng) *<input v-model="form.amount" type="text" inputmode="decimal"
                    placeholder="Ví dụ: 25000 hoặc 25000.50" pattern="[0-9]+(\.[0-9]{1,2})?" required /><span
                    class="fin-note">Nhập số dương, dùng dấu chấm cho phần thập phân.</span></label>
            <label>Ngày phát sinh (giờ Việt Nam) *<input v-model="form.incurred_at" type="datetime-local"
                    :max="localInput()" required /></label>
            <label>Chứng từ liên quan<select v-model="source" @change="resetSource">
                    <option value="none">Chi phí chung, không liên kết</option>
                    <option v-if="auth.hasPermission('order.view')" value="order">
                        Đơn hàng
                    </option>
                    <option v-if="auth.hasPermission('order.view')" value="payment">
                        Khoản thanh toán đã thu
                    </option>
                    <option v-if="auth.hasPermission('inventory.view')" value="inventory">
                        Phiếu kho (chi phí phụ trợ)
                    </option>
                </select></label>
            <Lookup v-if="['order', 'payment'].includes(source)" kind="orders" label="Tìm mã đơn hàng"
                v-model="form.order_id" :selected-label="labels.order" @select="
                    labels.order = $event?.label;
                form.payment_id = null;
                labels.payment = '';
                " />
            <Lookup v-if="source === 'payment'" kind="payments" label="Khoản đã thu của đơn" v-model="form.payment_id"
                :order-id="form.order_id" :disabled="!form.order_id" :selected-label="labels.payment"
                @select="labels.payment = $event?.label" />
            <Lookup v-if="source === 'inventory'" kind="inventory-documents" label="Tìm mã phiếu đã ghi sổ"
                v-model="form.inventory_document_id" :selected-label="labels.inventory"
                @select="labels.inventory = $event?.label" />
            <p v-if="source === 'inventory'" class="fin-warning fin-span">
                Chỉ nhập phí phụ trợ chưa được tính vào giá vốn. Không nhập lại tiền mua
                hàng; chi phí điều chỉnh giảm tồn đã được kho ghi tự động.
            </p>
            <label class="fin-span">Nội dung / chứng từ thanh toán *<textarea v-model="form.description"
                    maxlength="2000" required placeholder="Ví dụ: Cước giao đơn DH000012, biên nhận ..."></textarea>
            </label>
            <label class="!flex items-center gap-2"><input v-model="paid" type="checkbox"
                    :disabled="!auth.hasPermission('expense.pay')"
                    @change="form.paid_at = paid ? localInput() : ''" />Đã trả tiền thực tế</label>
            <label v-if="paid">Ngày trả tiền *<input v-model="form.paid_at"
                    :disabled="!auth.hasPermission('expense.pay')" type="datetime-local" :max="localInput()"
                    required /></label>
            <p class="fin-note fin-span">
                Lưu nháp chưa đưa khoản chi vào báo cáo. Sau khi kiểm tra, mở khoản chi
                và chọn “Ghi sổ”. Đánh dấu trả tiền chỉ ghi nhận việc đã chi, không thực
                hiện chuyển tiền.
            </p>
        </fieldset>
        <div class="fin-actions">
            <button type="button" class="fin-btn" :disabled="busy" @click="$emit('cancel')">
                Hủy</button><button class="fin-btn fin-primary" :disabled="busy ||
                    !form.category_id ||
                    (['order', 'payment'].includes(source) && !form.order_id) ||
                    (source === 'payment' && !form.payment_id) ||
                    (source === 'inventory' && !form.inventory_document_id)
                    ">
                {{ busy ? "Đang lưu..." : "Lưu nháp" }}
            </button>
        </div>
    </form>
</template>