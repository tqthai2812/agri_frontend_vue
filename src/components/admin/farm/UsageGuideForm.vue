<script setup>
import { Icon } from "@iconify/vue";
import { computed, watch } from "vue";
import FarmGrowthStagePicker from "./FarmGrowthStagePicker.vue";
import FarmEntityPicker from "@/components/shared/farm/FarmEntityPicker.vue";
import UsageDoseFields from "./UsageDoseFields.vue";
import FarmService from "@/services/shared/farmUtility.service";
const props = defineProps({
  form: { type: Object, required: true },
  editing: { type: Object, default: null },
  busy: Boolean,
  errors: { type: Object, default: () => ({}) },
});
defineEmits(["submit", "cancel"]);
const stageErrors = computed(() =>
  Object.entries(props.errors)
    .filter(
      ([key]) =>
        key === "growth_stage_ids" || key.startsWith("growth_stage_ids."),
    )
    .flatMap(([, value]) => value),
);
watch(
  () => props.form.crop_id,
  (value, old) => {
    if (String(value) !== String(old)) props.form.growth_stage_ids = [];
  },
  { flush: "sync" },
);
watch(
  () => props.form.growth_stage_scope,
  (value) => {
    if (value !== "specific") props.form.growth_stage_ids = [];
  },
  { flush: "sync" },
);
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
  <form class="space-y-6" @submit.prevent="$emit('submit')">
    <fieldset :disabled="busy" class="min-w-0 space-y-6">
      <section
        class="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <div class="mb-5">
          <h3 class="text-lg font-bold">Thông tin chung</h3>
          <p class="text-sm text-text-light">
            Chọn đúng biến thể, cây trồng và điều kiện sử dụng.
          </p>
        </div>
        <div class="space-y-4">
          <div class="grid min-w-0 gap-4 sm:grid-cols-2">
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
              <small
                v-if="errors.variant_id"
                class="text-xs font-normal text-red-600"
                >{{ errors.variant_id[0] }}</small
              >
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
              <small
                v-if="errors.crop_id"
                class="text-xs font-normal text-red-600"
                >{{ errors.crop_id[0] }}</small
              >
            </div>
          </div>
          <div>
            <FarmEntityPicker
              v-model="form.purpose_id"
              label="Công dụng *"
              :disabled="busy"
              :selected-label="editing?.purpose?.name || ''"
              :fetch-options="FarmService.purposeOptions"
              :format-label="cropLabel"
            />
            <small v-if="errors.purpose_id" class="text-xs text-red-600">{{
              errors.purpose_id[0]
            }}</small>
          </div>
          <div class="grid min-w-0 gap-4 sm:grid-cols-2">
            <label class="form-group"
              ><span class="form-label">Phạm vi giai đoạn</span
              ><select
                v-model="form.growth_stage_scope"
                class="form-control cursor-pointer"
              >
                <option value="unspecified">Chưa xác định</option>
                <option value="specific">Chọn giai đoạn cụ thể</option>
                <option value="all">Tất cả giai đoạn</option></select
              ><small
                v-if="errors.growth_stage_scope"
                class="text-xs text-red-600"
                >{{ errors.growth_stage_scope[0] }}</small
              ></label
            >
            <label class="form-group">
              <span class="form-label"
                >Cách sử dụng <span class="text-red-600">*</span></span
              >
              <input
                v-model="form.application_method"
                required
                maxlength="100"
                class="form-control"
              />
              <small
                v-if="errors.application_method"
                class="text-xs font-normal text-red-600"
                >{{ errors.application_method[0] }}</small
              >
            </label>
          </div>
          <FarmGrowthStagePicker
            v-if="form.growth_stage_scope === 'specific'"
            :key="String(form.crop_id)"
            v-model="form.growth_stage_ids"
            :crop-id="form.crop_id"
            :disabled="busy"
            :selected-stages="
              (editing?.growth_stages || []).filter(
                (stage) => String(stage.crop_id) === String(form.crop_id),
              )
            "
          />
          <p v-else class="text-xs text-text-light">
            {{
              form.growth_stage_scope === "all"
                ? "Chỉ chọn Tất cả khi tài liệu xác nhận áp dụng mọi giai đoạn."
                : "Chưa xác định không có nghĩa là áp dụng mọi giai đoạn."
            }}
          </p>
          <small
            v-for="(error, index) in stageErrors"
            :key="index"
            class="block text-xs text-red-600"
            >{{ error }}</small
          >
        </div>
      </section>
      <UsageDoseFields :form="form" :errors="errors" />
      <section
        class="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <div class="mb-5">
          <h3 class="text-lg font-bold">Nội dung hướng dẫn</h3>
          <p class="text-sm text-text-light">
            Nội dung sử dụng, lưu ý an toàn và tài liệu đối chiếu.
          </p>
        </div>
        <div class="space-y-4">
          <label class="form-group">
            <span class="form-label"
              >Hướng dẫn sử dụng <span class="text-red-600">*</span></span
            >
            <textarea
              v-model="form.instructions"
              required
              rows="6"
              maxlength="16000"
              class="form-control"
              placeholder="Ghi đầy đủ cách sử dụng, điều kiện áp dụng và tỷ lệ gốc trên nhãn..."
            ></textarea>
            <small
              v-if="errors.instructions"
              class="text-xs font-normal text-red-600"
              >{{ errors.instructions[0] }}</small
            >
          </label>
          <label class="form-group">
            <span class="form-label">Lưu ý an toàn</span>
            <textarea
              v-model="form.safety_warning"
              rows="3"
              maxlength="16000"
              class="form-control"
            ></textarea>
            <small
              v-if="errors.safety_warning"
              class="text-xs font-normal text-red-600"
              >{{ errors.safety_warning[0] }}</small
            >
          </label>
          <div class="grid min-w-0 gap-4 sm:grid-cols-[1fr_200px]">
            <label class="form-group">
              <span class="form-label">Nguồn nhãn / tài liệu</span>
              <input
                v-model="form.label_source"
                :required="form.is_active"
                maxlength="1024"
                class="form-control"
                placeholder="URL hoặc mô tả tài liệu đã đối chiếu"
              />
              <small
                v-if="errors.label_source"
                class="text-xs font-normal text-red-600"
                >{{ errors.label_source[0] }}</small
              >
            </label>
            <label class="form-group">
              <span class="form-label">Thời gian cách ly (ngày)</span>
              <input
                v-model="form.pre_harvest_days"
                type="number"
                min="0"
                max="65535"
                step="1"
                class="form-control"
                placeholder="Chưa rõ: để trống"
              />
              <small
                v-if="errors.pre_harvest_days"
                class="text-xs font-normal text-red-600"
                >{{ errors.pre_harvest_days[0] }}</small
              >
            </label>
          </div>
          <p class="text-xs leading-5 text-text-light">
            Chưa có nguồn tài liệu: lưu bản nháp. Có nguồn nhưng chưa có định
            mức: khách vẫn đọc được khi bật hướng dẫn. Ô trống lưu NULL, không
            tự điền 0.
          </p>
          <label class="flex cursor-pointer items-center gap-2 text-sm"
            ><input
              v-model="form.is_active"
              type="checkbox"
              class="size-4 cursor-pointer accent-[#07532b] disabled:cursor-not-allowed"
            />
            Hiển thị hướng dẫn cho khách hàng</label
          >
          <p class="text-xs leading-5 text-text-light">
            Hướng dẫn mới mặc định là bản nháp. Chỉ bật sau khi đối chiếu nội
            dung với nhãn. Cây trồng, công dụng và giai đoạn đã chọn cần đang
            bật; sản phẩm phải hiển thị để khách thấy hướng dẫn.
          </p>
        </div>
      </section>
    </fieldset>
    <div
      class="flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row"
    >
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
        class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon
          :icon="busy ? 'solar:refresh-bold' : 'solar:check-circle-bold'"
          :class="{ 'animate-spin': busy }"
        />{{ busy ? "Đang lưu..." : "Lưu hướng dẫn" }}
      </button>
    </div>
  </form>
</template>