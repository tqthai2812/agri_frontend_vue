<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";
import SupplierProductLinks from "./SupplierProductLinks.vue";

const store = useSupplierStore();
defineProps({ modalTitle: String, canSave: Boolean, canManageProducts: Boolean, canViewProducts: Boolean });
const emit = defineEmits(["close", "save", "product-search", "load-products"]);
const dialog = ref(null);
const fields = [
    {
        key: "supplier_code",
        label: "Mã nhà cung cấp",
        required: true,
        maxlength: 50,
        type: "text",
    },
    {
        key: "name",
        label: "Tên nhà cung cấp",
        required: true,
        maxlength: 255,
        type: "text",
    },
    {
        key: "contact_name",
        label: "Người liên hệ",
        maxlength: 255,
        type: "text",
    },
    {
        key: "phone",
        label: "Số điện thoại",
        maxlength: 30,
        type: "tel",
    },
    {
        key: "email",
        label: "Email",
        maxlength: 255,
        type: "email",
    },
    {
        key: "tax_code",
        label: "Mã số thuế",
        maxlength: 50,
        type: "text",
    },
];


onMounted(() => dialog.value?.showModal());
onBeforeUnmount(() => dialog.value?.close());
</script>

<template>
<dialog ref="dialog" aria-labelledby="supplier-modal-title"
  class="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
  @cancel.prevent="emit('close')" @click.self="emit('close')">
  <header class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
    <div>
      <h2 id="supplier-modal-title" class="text-xl font-bold">{{ modalTitle }}</h2>
      <p class="mt-1 text-sm text-text-light">Thông tin liên hệ và sản phẩm nhà cung cấp có thể cung ứng.</p>
    </div>
    <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" aria-label="Đóng" :disabled="store.saving" @click="emit('close')">
      <Icon icon="solar:close-circle-bold" />
    </button>
  </header>
  <div class="space-y-6 p-5 sm:p-6">
    <div v-if="store.dialogError" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
      <p class="font-semibold">{{ store.dialogError }}</p>
      <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
        <li v-for="(error, key) in store.errors" :key="key">{{ error }}</li>
      </ul>
    </div>
    <div v-if="store.loadingDetail" class="py-10 text-center text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
      <p class="text-sm">Đang tải thông tin...</p>
    </div>
    <form v-else-if="store.detailReady" class="space-y-6" @submit.prevent="emit('save')">
      <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div class="mb-5">
          <h3 class="text-lg font-bold">Thông tin nhà cung cấp</h3>
          <p class="text-sm text-text-light">Thông tin doanh nghiệp, địa chỉ và người liên hệ.</p>
        </div>
        <fieldset :disabled="store.saving || store.readOnly" class="min-w-0 space-y-5">
                            <div class="grid gap-4 md:grid-cols-2">
                                <label v-for="field in fields" :key="field.key" class="form-group">
                                    <span class="form-label">
                                        {{ field.label }}
                                        <span v-if="field.required" class="text-primary">*</span>
                                    </span>

                                    <input v-model="store.form[field.key]" :type="field.type"
                                        :maxlength="field.maxlength" :required="field.required" class="form-control"
                                        :aria-invalid="Boolean(store.fieldError(field.key))" />

                                    <small v-if="store.fieldError(field.key)" class="text-danger">
                                        {{ store.fieldError(field.key) }}
                                    </small>
                                </label>
                            </div>

                            <label class="form-group">
                                <span class="form-label">Địa chỉ</span>
                                <textarea v-model="store.form.address" rows="2" maxlength="10000"
                                    class="form-control"></textarea>
                            </label>

                            <label class="form-group">
                                <span class="form-label">Ghi chú</span>
                                <textarea v-model="store.form.note" rows="3" maxlength="10000"
                                    class="form-control"></textarea>
                            </label>

                            <label class="flex cursor-pointer items-center gap-2 text-sm">
                                <input v-model="store.form.is_active" type="checkbox" class="size-4 accent-[#07532b]" />
                                Đang hoạt động
                            </label>

                            <p class="text-xs text-text-light">
                                Ngừng hoạt động để không chọn nhà cung cấp này cho lần nhập mới.
                                Lịch sử nhập hàng vẫn được giữ lại.
                            </p>
        </fieldset>
      </section>
      <SupplierProductLinks :can-manage-products="canManageProducts" :can-view-products="canViewProducts"
        @search="emit('product-search')" @load="emit('load-products', $event)" />
      <footer class="flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row">
        <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving" @click="emit('close')">
          {{ store.readOnly ? "Đóng" : "Hủy" }}
        </button>
        <button v-if="!store.readOnly && canSave" type="submit" class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" :disabled="!store.canSubmit">
          <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'" :class="{ 'animate-spin': store.saving }" />
          {{ store.saving ? "Đang lưu..." : "Lưu nhà cung cấp" }}
        </button>
      </footer>
    </form>
  </div>
</dialog>
</template>