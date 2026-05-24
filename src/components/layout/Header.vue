<template>
  <header
    class="fixed top-0 right-0 h-[72px] bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 gap-3 sm:gap-4 z-20 transition-all duration-300"
    :class="[
      isMobile ? 'left-0' : sidebarCollapsed ? 'left-[80px]' : 'left-[280px]'
    ]">
    <button
      class="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary transition"
      @click="$emit('toggle-sidebar')">
      <Icon icon="solar:hamburger-menu-bold" class="text-xl" />
    </button>

    <div class="flex-1">
      <h1 class="text-lg font-bold text-text">{{ title }}</h1>
      <div class="text-xs text-text-light">EVDesign / <span class="text-primary">{{ title }}</span></div>
    </div>

    <div class="flex items-center gap-3">
      <div
        class="hidden md:flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2 w-64 focus-within:border-primary focus-within:shadow-primary/20">
        <Icon icon="solar:magnifer-bold" class="text-text-light" />
        <input type="text" placeholder="Cari..." class="bg-transparent outline-none text-sm w-full" />
      </div>

      <button class="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center relative">
        <Icon icon="solar:bell-bold-duotone" class="text-xl" />
        <span
          class="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">4</span>
      </button>

      <button @click="$emit('toggle-dark')"
        class="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center">
        <Icon :icon="darkMode ? 'solar:sun-bold' : 'solar:moon-bold'" class="text-xl" />
      </button>

      <div
        class="avatar w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer">
        EV</div>

      <div class="hidden md:block text-right">
        <div class="text-sm font-medium text-text">{{ currentDate }}</div>
        <div class="text-xs font-mono text-primary font-bold">{{ currentTime }}</div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  title: String,
  sidebarCollapsed: Boolean,
  isMobile: Boolean,
  darkMode: Boolean
})

defineEmits(['toggle-sidebar', 'toggle-dark'])

const currentDate = ref('')
const currentTime = ref('')
let interval

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(() => {
  updateDateTime()
  interval = setInterval(updateDateTime, 1000)
})
onUnmounted(() => clearInterval(interval))
</script>