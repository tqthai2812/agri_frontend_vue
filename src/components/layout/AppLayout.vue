<template>
  <div :class="{ dark: store.darkMode }" class="min-h-screen bg-bg text-text font-['Plus_Jakarta_Sans']">
    <div v-if="store.mobileSidebarOpen" class="fixed inset-0 bg-black/50 z-20" @click="store.mobileSidebarOpen = false">
    </div>

    <Sidebar :collapsed="store.sidebarCollapsed" :mobile-open="store.mobileSidebarOpen" :is-mobile="store.isMobile" />

    <Header :title="pageTitle" :sidebar-collapsed="store.sidebarCollapsed" :is-mobile="store.isMobile"
      :dark-mode="store.darkMode" @toggle-sidebar="store.toggleSidebar" @toggle-dark="store.toggleDarkMode" />

    <main class="pt-[72px] transition-all duration-300" :class="[
      store.isMobile ? 'ml-0' : store.sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
    ]">
      <div class="p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const store = useAppStore()
const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title || "Dashboard";
});

onMounted(() => {
  store.init()
})
onUnmounted(() => {
  store.cleanup()
})
</script>