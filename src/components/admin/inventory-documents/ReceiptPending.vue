<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
defineProps({
  pending: Object,
  recovery: String,
  busy: Boolean,
  canRetry: Boolean,
  recovered: Boolean,
});
defineEmits(["recover", "retry", "accept"]);
</script>
<template>
  <section
    v-if="pending"
    class="doc-warning doc-stack product-admin"
    aria-label="Thao tác chưa xác định kết quả"
  >
    <strong>Có thao tác cần kiểm tra kết quả</strong>
    <p v-if="pending.id">Phiếu #{{ pending.id }}</p>
    <p v-else class="doc-code">Mã thao tác: {{ pending.payload.event_key }}</p>
    <div class="doc-actions">
      <button
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        type="button"
        :disabled="busy"
        @click="$emit('recover')"
      >
        <Icon v-if="busy" icon="solar:refresh-bold" class="animate-spin" aria-hidden="true" />
        {{ busy ? "Đang kiểm tra…" : "Kiểm tra kết quả" }}
      </button>
      <button
        v-if="recovery === 'retry' && canRetry"
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        type="button"
        :disabled="busy"
        @click="$emit('retry')"
      >
        <Icon icon="solar:refresh-bold" aria-hidden="true" />
        Gửi lại yêu cầu đã lưu
      </button>
      <button
        v-if="recovered"
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        type="button"
        :disabled="busy"
        @click="$emit('accept')"
      >
        <Icon icon="solar:eye-bold" aria-hidden="true" />
        Xem phiên bản hiện tại
      </button>
    </div>
  </section>
</template>