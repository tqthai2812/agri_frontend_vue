<script setup>
import { computed, ref, watch } from "vue";
const props = defineProps({
  src: { type: String, default: null },
  name: { type: String, default: "Thành viên" },
});
const failed = ref(false);
const safeSrc = computed(() => {
  if (!props.src || !/^(https?:\/\/|\/(?!\/))/i.test(props.src)) return null;
  return props.src;
});
const initials = computed(
  () =>
    props.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toLocaleUpperCase("vi-VN") || "TV",
);
watch(
  () => props.src,
  () => (failed.value = false),
);
</script>
<template>
  <span class="news-avatar" :aria-label="name">
    <img
      v-if="safeSrc && !failed"
      :src="safeSrc"
      alt=""
      loading="lazy"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>