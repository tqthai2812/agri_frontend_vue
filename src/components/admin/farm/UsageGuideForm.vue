<script setup>
import { Icon } from "@iconify/vue";
import FarmEntityPicker from "@/components/shared/farm/FarmEntityPicker.vue";
import UsageDoseFields from "./UsageDoseFields.vue";
import FarmService from "@/services/shared/farmUtility.service";
defineProps({
  form: { type: Object, required: true },
  editing: { type: Object, default: null },
  busy: Boolean,
  errors: { type: Object, default: () => ({}) },
});
defineEmits(["submit", "cancel"]);
function variantLabel(item) {
  return (
    (item.product?.product_name || "Sản phẩm #" + item.product_id) +
    " / " +
    item.variant_name +
    (item.product?.is_show === false ? " (sản phẩm đang ẩn)" : "")
  );
}
function cropLabel(item) {
  return item.name + (item.is_active ? "" : " (đang ẩn)");
}
</script>
<template>
  <form class="space-y-5" @submit.prevent="$emit('submit')">
    <fieldset :disabled="busy" class="space-y-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <FarmEntityPicker
            v-model="form.variant_id"
            label="Biến thể sản phẩm *"
            :disabled="busy"
            :selected-label="
              editing?.variant ? variantLabel(editing.variant) : ''
            "
            :fetch-options="FarmService.variantOptions"
            :format-label="variantLabel"
          />
          <small v-if="errors.variant_id" class="text-red-600">{{
            errors.variant_id[0]
          }}</small>
        </div>
        <div>
          <FarmEntityPicker
            v-model="form.crop_id"
            label="Cây trồng *"
            :disabled="busy"
            :selected-label="editing?.crop?.name || ''"
            :fetch-options="FarmService.cropOptions"
            :format-label="cropLabel"
          />
          <small v-if="errors.crop_id" class="text-red-600">{{
            errors.crop_id[0]
          }}</small>
        </div>
      </div>
      <label class="block text-sm font-semibold"
        >Mục đích sử dụng <span class="text-red-600">*</span>
        <input
          v-model="form.purpose"
          required
          maxlength="255"
          class="form-control mt-2"
        />
        <small v-if="errors.purpose" class="text-red-600">{{
          errors.purpose[0]
        }}</small>
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-semibold"
          >Giai đoạn sinh trưởng
          <input
            v-model="form.growth_stage"
            maxlength="255"
            class="form-control mt-2"
            placeholder="Chưa xác định thì để trống"
          />
          <small v-if="errors.growth_stage" class="text-red-600">{{
            errors.growth_stage[0]
          }}</small>
        </label>
        <label class="block text-sm font-semibold"
          >Cách sử dụng <span class="text-red-600">*</span>
          <input
            v-model="form.application_method"
            required
            maxlength="100"
            class="form-control mt-2"
          />
          <small v-if="errors.application_method" class="text-red-600">{{
            errors.application_method[0]
          }}</small>
        </label>
      </div>
      <UsageDoseFields :form="form" :errors="errors" />
      <label class="block text-sm font-semibold"
        >Hướng dẫn sử dụng <span class="text-red-600">*</span>
        <textarea
          v-model="form.instructions"
          required
          rows="6"
          maxlength="16000"
          class="form-control mt-2"
          placeholder="Ghi đầy đủ cách sử dụng, điều kiện áp dụng và tỷ lệ gốc trên nhãn..."
        ></textarea>
        <small v-if="errors.instructions" class="text-red-600">{{
          errors.instructions[0]
        }}</small>
      </label>
      <label class="block text-sm font-semibold"
        >Lưu ý an toàn
        <textarea
          v-model="form.safety_warning"
          rows="3"
          maxlength="16000"
          class="form-control mt-2"
        ></textarea>
        <small v-if="errors.safety_warning" class="text-red-600">{{
          errors.safety_warning[0]
        }}</small>
      </label>
      <div class="grid gap-4 sm:grid-cols-[1fr_200px]">
        <label class="block text-sm font-semibold"
          >Nguồn nhãn / tài liệu
          <input
            v-model="form.label_source"
            maxlength="1024"
            class="form-control mt-2"
            placeholder="URL hoặc mô tả tài liệu đã đối chiếu"
          />
          <small v-if="errors.label_source" class="text-red-600">{{
            errors.label_source[0]
          }}</small>
        </label>
        <label class="block text-sm font-semibold"
          >Thời gian cách ly (ngày)
          <input
            v-model="form.pre_harvest_days"
            type="number"
            min="0"
            max="65535"
            step="1"
            class="form-control mt-2"
            placeholder="Chưa rõ: để trống"
          />
          <small v-if="errors.pre_harvest_days" class="text-red-600">{{
            errors.pre_harvest_days[0]
          }}</small>
        </label>
      </div>
      <p class="text-xs leading-5 text-text-light">
        Không có định mức hoặc chưa có nguồn tài liệu: khách chỉ đọc hướng dẫn,
        chức năng tính lượng sẽ chưa mở. Ô trống được lưu NULL, không tự điền 0.
      </p>
      <label
        class="flex cursor-pointer items-center gap-2 text-sm font-semibold"
        ><input v-model="form.is_active" type="checkbox" /> Hiển thị hướng dẫn
        cho khách hàng</label
      >
      <p class="text-xs leading-5 text-text-light">
        Hướng dẫn mới mặc định là bản nháp. Chỉ bật sau khi đối chiếu nội dung
        với nhãn. Cây trồng và sản phẩm cũng cần đang hiển thị.
      </p>
    </fieldset>
    <div class="flex justify-end gap-3 border-t border-border pt-4">
      <button
        type="button"
        :disabled="busy"
        class="btn-outline cursor-pointer disabled:cursor-not-allowed"
        @click="$emit('cancel')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="busy"
        class="btn-primary cursor-pointer disabled:cursor-not-allowed"
      >
        <Icon
          :icon="busy ? 'solar:refresh-bold' : 'solar:check-circle-bold'"
          :class="{ 'animate-spin': busy }"
        />{{ busy ? "Đang lưu..." : "Lưu hướng dẫn" }}
      </button>
    </div>
  </form>
</template>