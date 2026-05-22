<template>
  <aside
    class="fixed left-0 top-0 h-screen bg-surface border-r border-border z-30 flex flex-col transition-all duration-300 overflow-hidden"
    :class="[
      isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : '',
      !isMobile && collapsed ? 'w-[80px]' : 'w-[280px]'
    ]">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 py-5 border-b border-border min-h-[72px]">
      <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
        <Icon icon="solar:t-shirt-bold" class="text-white text-2xl" />
      </div>
      <div :class="collapsed && !isMobile ? 'hidden' : 'block'">
        <h2 class="font-bold text-base text-text">EVDesign</h2>
        <span class="text-xs text-text-light">Admin Dashboard</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
      <div v-for="section in navSections" :key="section.title">
        <div v-if="section.title"
          class="text-[0.65rem] font-semibold uppercase tracking-wide text-text-light px-2 py-1 mt-2"
          :class="collapsed && !isMobile ? 'opacity-0' : ''">
          {{ section.title }}
        </div>
        <a v-for="item in section.items" :key="item.name" href="#" @click.prevent="$emit('navigate', item.name)"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all" :class="[
            currentPage === item.name
              ? 'bg-primary/10 text-primary font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1/2 before:bg-primary before:rounded-r'
              : 'text-text-sec hover:bg-primary/10 hover:text-primary'
          ]">
          <Icon :icon="item.icon" class="text-xl shrink-0" />
          <span :class="collapsed && !isMobile ? 'hidden' : ''">{{ item.label }}</span>
        </a>
      </div>
    </nav>

    <!-- Profile -->
    <div class="p-4 border-t border-border flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">EV
      </div>
      <div :class="collapsed && !isMobile ? 'hidden' : 'block'">
        <strong class="text-sm block text-text">Admin EVDesign</strong>
        <span class="text-xs text-text-light">Super Admin</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  currentPage: String,
  collapsed: Boolean,
  mobileOpen: Boolean,
  isMobile: Boolean
})

defineEmits(['navigate'])

const navSections = [
  {
    title: 'QUẢN LÝ',
    items: [
      { name: 'dashboard', label: 'Bảng điều khiển', icon: 'solar:home-2-bold-duotone' },
      { name: 'products', label: 'Quản lý sản phẩm', icon: 'solar:bag-bold-duotone' },
      { name: 'categories', label: 'Quản lý danh mục', icon: 'solar:sort-bold-duotone' },
      { name: 'artisans', label: 'Quản lý người dùng', icon: 'solar:users-group-rounded-bold-duotone' },
      { name: 'orders', label: 'Quản lý đơn hàng', icon: 'solar:cart-large-2-bold-duotone' }
    ]
  },
  {
    title: 'NỘi DUNG',
    items: [
      { name: 'inventory', label: 'Hàng tồn kho', icon: 'solar:box-bold-duotone' },
      { name: 'gallery', label: 'Phần trưng bày', icon: 'solar:gallery-bold-duotone' },
      { name: 'articles', label: 'Bài viết', icon: 'solar:notes-bold-duotone' }
    ]
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { name: 'settings', label: 'Cài đặt', icon: 'solar:settings-bold-duotone' },
      { name: 'login', label: 'Đăng xuất', icon: 'solar:logout-2-bold-duotone', danger: true }
    ]
  }
]
</script>