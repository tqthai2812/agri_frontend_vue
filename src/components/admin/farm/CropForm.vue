<script setup>
import { Icon } from "@iconify/vue";
defineProps({
  form: { type: Object, required: true },
  busy: Boolean,
  errors: { type: Object, default: () => ({}) },
});
defineEmits(["submit", "cancel"]);
function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
</script>
<template>
  <form class="space-y-4" @submit.prevent="$emit('submit')">
    <fieldset :disabled="busy" class="space-y-4">
      <label class="block text-sm font-semibold"
        >Tên cây trồng <span class="text-red-600">*</span>
        <input
          v-model="form.name"
          required
          maxlength="255"
          class="form-control mt-2"
          @blur="!form.slug && (form.slug = slugify(form.name))"
        />
        <small v-if="errors.name" class="text-red-600">{{
          errors.name[0]
        }}</small>
      </label>
      <label class="block text-sm font-semibold"
        >Đường dẫn <span class="text-red-600">*</span>
        <input
          v-model="form.slug"
          required
          maxlength="255"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          class="form-control mt-2"
          placeholder="ten-cay-trong"
        />
        <small v-if="errors.slug" class="text-red-600">{{
          errors.slug[0]
        }}</small>
      </label>
      <label class="flex cursor-pointer items-center gap-2 text-sm"
        ><input v-model="form.is_active" type="checkbox" /> Hiển thị cây
        trồng</label
      >
      <p class="rounded-xl bg-bg p-3 text-xs leading-5 text-text-light">
        Tắt hiển thị cây trồng sẽ ẩn các hướng dẫn liên quan khỏi tiện ích phía
        khách hàng. Các hướng dẫn vẫn được lưu.
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
        />{{ busy ? "Đang lưu..." : "Lưu cây trồng" }}
      </button>
    </div>
  </form>
</template>