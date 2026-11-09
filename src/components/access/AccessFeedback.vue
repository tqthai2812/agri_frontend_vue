<script setup>
defineProps({ error: String, success: String });
defineEmits(["dismiss"]);
</script>
<template>
  <div
    v-if="error || success"
    :role="error ? 'alert' : 'status'"
    class="ac-feedback"
    :class="error ? 'ac-feedback-error' : 'ac-feedback-success'"
  >
    <span>{{ error || success }}</span
    ><button
      type="button"
      aria-label="Đóng thông báo"
      @click="$emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>