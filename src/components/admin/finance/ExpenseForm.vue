<script setup>
import "@/assets/finance.css";
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
  <form class="product-admin" @submit.prevent="submit">
    <fieldset :disabled="busy" class="grid min-w-0 gap-4 sm:grid-cols-2">
      <Lookup
        kind="expense-categories"
        active-only
        label="Danh mục chi phí *"
        v-model="form.category_id"
        :selected-label="labels.category"
        @select="labels.category = $event?.label"
      />
      <label class="form-group"
        ><span class="form-label">Số tiền (đồng) *</span><input class="form-control"
          v-model="form.amount"
          type="text"
          inputmode="decimal"
          placeholder="Ví dụ: 25000 hoặc 25000.50"
          pattern="[0-9]+(\.[0-9]{1,2})?"
          required
        /><span class="text-xs leading-5 text-text-light"
          >Nhập số dương, dùng dấu chấm cho phần thập phân.</span
        ></label
      >
      <label class="form-group"
        ><span class="form-label">Ngày phát sinh (giờ Việt Nam) *</span><input class="form-control"
          v-model="form.incurred_at"
          type="datetime-local"
          :max="localInput()"
          required
      /></label>
      <label class="form-group"
        ><span class="form-label">Chứng từ liên quan</span><select class="form-control cursor-pointer disabled:cursor-not-allowed" v-model="source" @change="resetSource">
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
        </select></label
      >
      <Lookup
        v-if="['order', 'payment'].includes(source)"
        kind="orders"
        label="Tìm mã đơn hàng"
        v-model="form.order_id"
        :selected-label="labels.order"
        @select="
          labels.order = $event?.label;
          form.payment_id = null;
          labels.payment = '';
        "
      />
      <Lookup
        v-if="source === 'payment'"
        kind="payments"
        label="Khoản đã thu của đơn"
        v-model="form.payment_id"
        :order-id="form.order_id"
        :disabled="!form.order_id"
        :selected-label="labels.payment"
        @select="labels.payment = $event?.label"
      />
      <Lookup
        v-if="source === 'inventory'"
        kind="inventory-documents"
        label="Tìm mã phiếu đã ghi sổ"
        v-model="form.inventory_document_id"
        :selected-label="labels.inventory"
        @select="labels.inventory = $event?.label"
      />
      <p v-if="source === 'inventory'" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:col-span-2">
        Chỉ nhập phí phụ trợ chưa được tính vào giá vốn. Không nhập lại tiền mua
        hàng; chi phí điều chỉnh giảm tồn đã được kho ghi tự động.
      </p>
      <label class="sm:col-span-2 form-group"
        ><span class="form-label">Nội dung / chứng từ thanh toán *</span><textarea class="form-control resize-y"
          v-model="form.description"
          maxlength="2000"
          required
          placeholder="Ví dụ: Cước giao đơn DH000012, biên nhận ..."
        ></textarea>
      </label>
      <label class="!flex items-center gap-2 cursor-pointer text-sm"
        ><input class="size-4 cursor-pointer accent-[#07532b] disabled:cursor-not-allowed"
          v-model="paid"
          type="checkbox"
          :disabled="!auth.hasPermission('expense.pay')"
          @change="form.paid_at = paid ? localInput() : ''"
        />Đã trả tiền thực tế</label
      >
      <label class="form-group" v-if="paid"
        ><span class="form-label">Ngày trả tiền *</span><input class="form-control"
          v-model="form.paid_at"
          :disabled="!auth.hasPermission('expense.pay')"
          type="datetime-local"
          :max="localInput()"
          required
      /></label>
      <p class="text-xs leading-5 text-text-light sm:col-span-2">
        Lưu nháp chưa đưa khoản chi vào báo cáo. Sau khi kiểm tra, mở khoản chi
        và chọn “Ghi sổ”. Đánh dấu trả tiền chỉ ghi nhận việc đã chi, không thực
        hiện chuyển tiền.
      </p>
    </fieldset>
    <div class="mt-5 flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row product-form-actions sticky bottom-0 bg-surface">
      <button
        type="button"
        class="btn-outline cursor-pointer disabled:cursor-not-allowed"
        :disabled="busy"
        @click="$emit('cancel')"
      >
        Hủy</button
      ><button
        class="btn-primary cursor-pointer disabled:cursor-not-allowed"
        :disabled="
          busy ||
          !form.category_id ||
          (['order', 'payment'].includes(source) && !form.order_id) ||
          (source === 'payment' && !form.payment_id) ||
          (source === 'inventory' && !form.inventory_document_id)
        "
      >
        {{ busy ? "Đang lưu..." : "Lưu nháp" }}
      </button>
    </div>
  </form>
</template>