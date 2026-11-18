<script setup>
import { defineAsyncComponent, nextTick, ref } from "vue";
import { Icon } from "@iconify/vue";
import "@/assets/ai-chat.css";
const AiChatPanel = defineAsyncComponent(() => import("./AiChatPanel.vue"));
const open = ref(false),
  mounted = ref(false),
  unread = ref(false),
  launcher = ref(null);
function openChat() {
  mounted.value = true;
  open.value = true;
  unread.value = false;
}
function close() {
  open.value = false;
  nextTick(() => launcher.value?.focus({ preventScroll: true }));
}
</script>

<template>
  <div class="nf-ai">
    <AiChatPanel
      v-if="mounted"
      :open="open"
      @close="close"
      @reply="unread = !open"
    />
    <button
      v-show="!open"
      ref="launcher"
      type="button"
      class="ai-launcher"
      :aria-expanded="open"
      aria-controls="nfarmhouse-ai-panel"
      aria-label="Mở trợ lý AI NFarmHouse"
      title="Chat với trợ lý AI"
      @click="openChat"
    >
      <Icon icon="solar:chat-round-dots-bold-duotone" /><span
        class="ai-launcher-label"
        >AI</span
      ><span
        v-if="unread"
        class="ai-unread"
        aria-label="Có câu trả lời mới"
      ></span>
    </button>
  </div>
</template>