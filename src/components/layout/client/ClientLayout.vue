<script setup>
import ClientHeader from "./ClientHeader.vue";
import ClientFooter from "./ClientFooter.vue";
import AiChatWidget from "@/components/client/ai/AiChatWidget.vue";
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-slate-800">
    <ClientHeader />

    <main class="flex-1">
      <RouterView />
    </main>

    <ClientFooter />
    <AiChatWidget />
  </div>
</template>