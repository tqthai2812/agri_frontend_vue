<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useDiscountStore } from "@/stores/admin/discountStore";
import DiscountLotPicker from "./DiscountLotPicker.vue";

const store = useDiscountStore();
const emit = defineEmits(["save"]);
const dialog = ref(null);
// Component mount khi mở modal nên khởi tạo ngay lô của voucher đang sửa.
const selectedLot = ref(store.selectedDiscount?.lot || null);
const identityLocked = computed(() => Number(store.selectedDiscount?.orders_count || 0) > 0);

function selectLot(lot) {
  selectedLot.value = lot;
  if (!store.form.expire_date || store.form.expire_date > lot.expires_on) store.form.expire_date = lot.expires_on;
}
function changeScope() {
  store.form.lot_id = "";
  selectedLot.value = null;
  if (store.form.discount_scope === "lot") store.form.usage_limit = "";
}
function handleCodeInput() {
  store.form.discount_code = String(store.form.discount_code || "").toUpperCase().replace(/\s+/g, "");
}
function requestClose() {
  if (!store.saving) store.closeModal();
}
onMounted(() => dialog.value?.showModal());
onBeforeUnmount(() => dialog.value?.close());
</script>

<template>
<Teleport to="body">
  <dialog ref="dialog" aria-labelledby="voucher-modal-title"
    class="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
    @cancel.prevent="requestClose">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 id="voucher-modal-title" class="text-xl font-bold">{{ store.selectedDiscount ? "Cập nhật voucher" : "Thêm voucher mới" }}</h2>
        <p class="mt-1 text-sm text-text-light">Thông tin mã giảm giá, phạm vi áp dụng và thời gian hiệu lực.</p>
      </div>
      <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" aria-label="Đóng" :disabled="store.saving" @click="requestClose">
        <Icon icon="solar:close-circle-bold" />
      </button>
    </div>
    <form class="space-y-6 p-5 sm:p-6" @submit.prevent="emit('save')">
      <div v-if="store.errorMsg" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        <Icon icon="solar:danger-circle-bold-duotone" class="mr-2 inline-block text-xl align-middle" />{{ store.errorMsg }}
      </div>
      <fieldset :disabled="store.saving" class="min-w-0 space-y-6">
        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 class="text-lg font-bold">Thông tin chung</h3>
              <p class="text-sm text-text-light">Mã, mô tả và loại voucher.</p>
            </div>
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input v-model="store.form.is_active" type="checkbox" class="size-4 accent-[#07532b]" />
              Kích hoạt voucher
            </label>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-group">
              <span class="form-label">Loại voucher</span>
              <select id="voucher-scope" v-model="store.form.discount_scope" :disabled="identityLocked" class="form-control" @change="changeScope">
                <option value="order">Toàn sàn — giảm trên tổng tiền hàng</option>
                <option value="lot">Xả kho — chỉ giảm hàng thuộc lô đã chọn</option>
              </select>
              <span v-if="identityLocked" class="mt-1 block text-xs text-text-light">Voucher đã gắn đơn hàng nên không đổi loại hoặc lô.</span>
            </label>
            <label class="form-group">
              <span class="form-label">Mã giảm giá <span class="text-primary">*</span></span>
              <input v-model.trim="store.form.discount_code" class="form-control uppercase font-mono" placeholder="Ví dụ: SALE10, WELCOME15" @input="handleCodeInput" />
              <span class="mt-1 block text-xs text-text-light">Chỉ nên dùng chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.</span>
              <span v-if="store.fieldError('discount_code')" class="error-text">{{ store.fieldError('discount_code') }}</span>
            </label>
            <label class="form-group md:col-span-2">
              <span class="form-label">Mô tả giảm giá <span class="text-primary">*</span></span>
              <input v-model.trim="store.form.discount_description" class="form-control" placeholder="Ví dụ: Giảm 10% cho đơn từ 200.000đ" />
              <span v-if="store.fieldError('discount_description')" class="error-text">{{ store.fieldError('discount_description') }}</span>
            </label>
          </div>
        </section>
        <section v-if="store.form.discount_scope === 'lot'" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="mb-5">
            <h3 class="text-lg font-bold">Lô áp dụng</h3>
            <p class="text-sm text-text-light">Chọn lô hàng cho voucher xả kho.</p>
          </div>
          <DiscountLotPicker v-model="store.form.lot_id" :selected-lot="selectedLot" :disabled="identityLocked" @select="selectLot" />
          <p class="mt-3 text-xs text-text-light">Mỗi lô chỉ có một voucher xả kho được bật trong cùng khoảng thời gian hiệu lực.</p>
          <p v-if="store.fieldError('lot_id')" class="error-text">{{ store.fieldError('lot_id') }}</p>
        </section>
        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="mb-5">
            <h3 class="text-lg font-bold">Mức giảm và điều kiện</h3>
            <p class="text-sm text-text-light">Giá trị giảm và giới hạn sử dụng.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-group">
              <span class="form-label">Phần trăm giảm <span class="text-primary">*</span></span>
              <input v-model.number="store.form.discount_percent" type="number" min="1" max="100" class="form-control" placeholder="10" />
              <span v-if="store.fieldError('discount_percent')" class="error-text">{{ store.fieldError('discount_percent') }}</span>
            </label>
            <label class="form-group">
              <span class="form-label">Giảm tối đa <span class="text-primary">*</span></span>
              <input v-model.number="store.form.max_discount_amount" type="number" min="0" class="form-control" placeholder="50000" />
              <span v-if="store.fieldError('max_discount_amount')" class="error-text">{{ store.fieldError('max_discount_amount') }}</span>
            </label>
            <label class="form-group md:col-span-2">
              <span class="form-label">{{ store.form.discount_scope === 'lot' ? 'Tiền từ lô áp dụng tối thiểu' : 'Tổng tiền hàng tối thiểu' }} <span class="text-primary">*</span></span>
              <input v-model.number="store.form.min_order_value" type="number" min="0" class="form-control" placeholder="200000" />
              <span class="mt-1 block text-xs text-text-light">{{ store.form.discount_scope === 'lot' ? 'Chỉ cộng tiền của số lượng thực tế lấy từ lô đã chọn trước giảm giá, không cộng lô khác hoặc phí giao hàng.' : 'Cộng tiền hàng của toàn đơn trước giảm giá, không gồm phí giao hàng.' }}</span>
              <span v-if="store.fieldError('min_order_value')" class="error-text">{{ store.fieldError('min_order_value') }}</span>
            </label>
            <label v-if="store.form.discount_scope === 'order'" class="form-group">
              <span class="form-label">Giới hạn sử dụng</span>
              <input v-model="store.form.usage_limit" type="number" min="1" class="form-control" placeholder="Để trống nếu không giới hạn" />
              <span v-if="store.fieldError('usage_limit')" class="error-text">{{ store.fieldError('usage_limit') }}</span>
            </label>
            <label class="form-group">
              <span class="form-label">Số lượt đã dùng</span>
              <input v-model.number="store.form.used_count" type="number" readonly class="form-control bg-bg" placeholder="0" />
              <span v-if="store.fieldError('used_count')" class="error-text">{{ store.fieldError('used_count') }}</span>
            </label>
          </div>
        </section>
        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div class="mb-5">
            <h3 class="text-lg font-bold">Thời gian và hiển thị</h3>
            <p class="text-sm text-text-light">Thời hạn áp dụng và hiển thị trong kho voucher.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-group">
              <span class="form-label">Bắt đầu áp dụng</span>
              <input id="voucher-start" v-model="store.form.starts_at" type="datetime-local" class="form-control" />
              <span class="mt-1 block text-xs text-text-light">Để trống để dùng ngay.</span>
              <span v-if="store.fieldError('starts_at')" class="error-text">{{ store.fieldError('starts_at') }}</span>
            </label>
            <label class="form-group">
              <span class="form-label">Ngày hết hạn <span class="text-primary">*</span></span>
              <input v-model="store.form.expire_date" type="date" class="form-control" />
              <span v-if="store.fieldError('expire_date')" class="error-text">{{ store.fieldError('expire_date') }}</span>
            </label>
          </div>
          <label class="mt-5 flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="store.form.show_in_wallet" type="checkbox" class="size-4 accent-[#07532b]" :disabled="Boolean(store.form.user_id)" />
            Hiển thị trong kho voucher công khai
          </label>
          <p v-if="store.fieldError('show_in_wallet')" class="error-text">{{ store.fieldError('show_in_wallet') }}</p>
        </section>
      </fieldset>
      <div class="flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row">
        <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving" @click="requestClose">Hủy</button>
        <button type="submit" class="btn-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer" :disabled="store.saving">
          <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'" :class="store.saving ? 'animate-spin' : ''" />
          {{ store.saving ? "Đang lưu..." : "Lưu voucher" }}
        </button>
      </div>
    </form>
  </dialog>
</Teleport>
</template>

<style scoped>
@reference "../../../style.css";

.error-text {
    @apply block text-danger text-sm mt-1;
}
</style>