<script setup>
import { computed, ref, watch } from "vue";
const props = defineProps({
  modelValue: { type: Array, default: null },
  errors: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update:modelValue"]);
const text = ref(props.modelValue?.join("\n") || "");
const parse = (value) =>
  value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
function update(value) {
  text.value = value;
  emit("update:modelValue", parse(value));
}
watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value || []) !== JSON.stringify(parse(text.value)))
      text.value = value?.join("\n") || "";
  },
);
const messages = computed(() =>
  Object.entries(props.errors)
    .filter(([key]) => key === "aliases" || key.startsWith("aliases."))
    .flatMap(([, value]) => value),
);
</script>
<template>
  <label class="form-group">
    <span class="form-label">Tên gọi khác</span>
    <textarea
      :value="text"
      rows="3"
      maxlength="25600"
      class="form-control"
      placeholder="Mỗi tên gọi một dòng"
      @input="update($event.target.value)"
    ></textarea>
    <small
      v-for="(message, index) in messages"
      :key="index"
      class="block text-xs text-red-600"
      >{{ message }}</small
    >
  </label>
</template>