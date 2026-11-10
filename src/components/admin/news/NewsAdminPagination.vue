<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({ meta: { type: Object, required: true }, count: { type: Number, default: 0 }, label: { type: String, default: "mục" }, busy: Boolean });
const emit = defineEmits(["change"]);
const current = computed(() => Number(props.meta.current_page || 1));
const last = computed(() => Number(props.meta.last_page || 1));
const pages = computed(() => {
  const values = [];
  for (let p = Math.max(1, current.value - 2); p <= Math.min(last.value, current.value + 2); p++) values.push(p);
  return values;
});
</script>

<template>
<div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
  <span class="text-sm text-text-light">Hiển thị {{ count }} / {{ meta.total ?? count }} {{ label }}</span>
  <div class="flex flex-wrap justify-center gap-2">
    <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang trước" :disabled="busy || current <= 1" @click="emit('change', current - 1)"><Icon icon="solar:arrow-left-bold" /></button>
    <button v-for="p in pages" :key="p" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" :class="{ active: p === current }" :aria-current="p === current ? 'page' : undefined" :disabled="busy" @click="emit('change', p)">{{ p }}</button>
    <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sau" :disabled="busy || current >= last" @click="emit('change', current + 1)"><Icon icon="solar:arrow-right-bold" /></button>
  </div>
</div>
</template>