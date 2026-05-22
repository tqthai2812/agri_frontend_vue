<template>
  <div :class="{ dark: store.darkMode }" class="min-h-screen bg-bg text-text font-['Plus_Jakarta_Sans']">
    <div v-if="store.mobileSidebarOpen" class="fixed inset-0 bg-black/50 z-20" @click="store.mobileSidebarOpen = false">
    </div>

    <Sidebar :current-page="store.currentPage" :collapsed="store.sidebarCollapsed"
      :mobile-open="store.mobileSidebarOpen" :is-mobile="store.isMobile" @navigate="store.setCurrentPage" />

    <Header :title="pageTitle" :sidebar-collapsed="store.sidebarCollapsed" :is-mobile="store.isMobile"
      :dark-mode="store.darkMode" @toggle-sidebar="store.toggleSidebar" @toggle-dark="store.toggleDarkMode" />

    <main class="pt-[72px] transition-all duration-300" :class="[
      store.isMobile ? 'ml-0' : store.sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
    ]">
      <div class="p-6">
        <component :is="currentComponent" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/appStore'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const store = useAppStore()

const pageTitle = computed(() => {
  const titles = {
    dashboard: 'Bảng điều khiển',
    products: 'Quản lý sản phẩm',
    categories: 'Quản lý danh mục',
    artisans: 'Quản lý người dùng',
    orders: 'Quản lý đơn hàng',
    inventory: 'Quản lý tồn kho',
    gallery: 'Thư viện hình ảnh',
    articles: 'Bài viết',
    settings: 'Cài đặt',
    login: 'Đăng nhập'
  }
  return titles[store.currentPage] || store.currentPage
})

const currentComponent = computed(() => {
  const map = {
    dashboard: defineAsyncComponent(() => import('@/views/Dashboard.vue')),
    products: defineAsyncComponent(() => import('@/views/Products.vue')),
    categories: defineAsyncComponent(() => import('@/views/Categories.vue')),
    artisans: defineAsyncComponent(() => import('@/views/Artisans.vue')),
    orders: defineAsyncComponent(() => import('@/views/Orders.vue')),
    inventory: defineAsyncComponent(() => import('@/views/Inventory.vue')),
    gallery: defineAsyncComponent(() => import('@/views/Gallery.vue')),
    articles: defineAsyncComponent(() => import('@/views/Articles.vue')),
    settings: defineAsyncComponent(() => import('@/views/Settings.vue')),
    login: defineAsyncComponent(() => import('@/views/Login.vue')),
  }
  return map[store.currentPage] || map.dashboard
})

onMounted(() => {
  store.init()
})
onUnmounted(() => {
  store.cleanup()
})
</script>