<script setup>
import { Icon } from "@iconify/vue";
import FarmEntityPicker from "@/components/shared/farm/FarmEntityPicker.vue";
import FarmService from "@/services/shared/farmUtility.service";
import FarmAliasesField from "./FarmAliasesField.vue";
defineProps({
  kind: { type: String, required: true },
  form: { type: Object, required: true },
  editing: { type: Object, default: null },
  busy: Boolean,
  errors: { type: Object, default: () => ({}) },
});
defineEmits(["submit", "cancel"]);
function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
</script>
<template>
  <form class="space-y-6" @submit.prevent="$emit('submit')">
    <fieldset
      :disabled="busy"
      class="min-w-0 space-y-4 rounded-2xl border border-border bg-surface p-5"
    >
      <div v-if="kind === 'stages'">
        <FarmEntityPicker
          v-model="form.crop_id"
          label="Cây trồng *"
          :selected-label="editing?.crop?.name || ''"
          :fetch-options="FarmService.cropOptions"
          :disabled="busy"
        /><small v-if="errors.crop_id" class="text-xs text-red-600">{{
          errors.crop_id[0]
        }}</small>
      </div>
      <label class="form-group"
        ><span class="form-label"
          >{{ kind === "stages" ? "Tên giai đoạn" : "Tên công dụng" }}
          <span class="text-red-600">*</span></span
        ><input
          v-model="form.name"
          required
          maxlength="255"
          class="form-control"
          @blur="!form.slug && (form.slug = slugify(form.name))"
        /><small v-if="errors.name" class="text-xs text-red-600">{{
          errors.name[0]
        }}</small></label
      >
      <label class="form-group"
        ><span class="form-label"
          >Đường dẫn <span class="text-red-600">*</span></span
        ><input
          v-model="form.slug"
          required
          maxlength="255"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          class="form-control"
        /><small v-if="errors.slug" class="text-xs text-red-600">{{
          errors.slug[0]
        }}</small></label
      >
      <FarmAliasesField v-model="form.aliases" :errors="errors" />
      <label class="form-group"
        ><span class="form-label">Mô tả</span
        ><textarea
          v-model="form.description"
          rows="4"
          maxlength="16000"
          class="form-control"
        ></textarea
        ><small v-if="errors.description" class="text-xs text-red-600">{{
          errors.description[0]
        }}</small></label
      >
      <label v-if="kind === 'stages'" class="form-group"
        ><span class="form-label">Thứ tự hiển thị</span
        ><input
          v-model="form.sort_order"
          type="number"
          min="0"
          max="65535"
          step="1"
          required
          class="form-control"
        /><small v-if="errors.sort_order" class="text-xs text-red-600">{{
          errors.sort_order[0]
        }}</small></label
      >
      <label class="flex cursor-pointer items-center gap-2 text-sm"
        ><input
          v-model="form.is_active"
          type="checkbox"
          class="size-4 cursor-pointer accent-primary"
        />
        Đang sử dụng</label
      >
    </fieldset>
    <div class="flex justify-end gap-3 border-t border-border pt-4">
      <button
        type="button"
        class="btn-outline cursor-pointer disabled:cursor-not-allowed"
        :disabled="busy"
        @click="$emit('cancel')"
      >
        Hủy</button
      ><button
        type="submit"
        class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="busy"
      >
        <Icon
          :icon="busy ? 'solar:refresh-bold' : 'solar:check-circle-bold'"
          :class="{ 'animate-spin': busy }"
        />{{ busy ? "Đang lưu..." : "Lưu thay đổi" }}
      </button>
    </div>
  </form>
</template>