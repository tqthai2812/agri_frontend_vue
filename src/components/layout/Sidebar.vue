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

        <template v-for="item in section.items" :key="item.name">
          <button v-if="item.action === 'logout'" type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-red-500 hover:bg-red-50 hover:text-red-600"
            @click="openLogoutModal">
            <Icon :icon="item.icon" class="text-xl shrink-0" />

            <span :class="collapsed && !isMobile ? 'hidden' : ''">
              {{ item.label }}
            </span>
          </button>

          <RouterLink v-else :to="{ name: item.name }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all" :class="[
              route.name === item.name
                ? 'bg-primary/10 text-primary font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1/2 before:bg-primary before:rounded-r'
                : 'text-text-sec hover:bg-primary/10 hover:text-primary'
            ]" @click="handleNavigate">
            <Icon :icon="item.icon" class="text-xl shrink-0" />

            <span :class="collapsed && !isMobile ? 'hidden' : ''">
              {{ item.label }}
            </span>
          </RouterLink>
        </template>
      </div>
    </nav>

    <!-- Profile -->
    <div class="p-4 border-t border-border flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
        EV
      </div>

      <div :class="collapsed && !isMobile ? 'hidden' : 'block'">
        <strong class="text-sm block text-text">Admin EVDesign</strong>
        <span class="text-xs text-text-light">Super Admin</span>
      </div>
    </div>
  </aside>

  <ConfirmModal v-model="showLogoutModal" title="Xác nhận đăng xuất"
    message="Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị EVDesign không?" confirm-text="Đăng xuất"
    cancel-text="Ở lại" loading-text="Đang đăng xuất..." type="danger" icon="solar:logout-2-bold-duotone"
    :loading="authStore.loading" @confirm="handleLogout" />
</template>

<script setup>
import { ref } from "vue";
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import ConfirmModal from "@/components/common/ConfirmModal.vue";

defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean,
  isMobile: Boolean
})

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()
const showLogoutModal = ref(false);


const handleNavigate = () => {
  if (store.isMobile) {
    store.mobileSidebarOpen = false;
  }
};

function openLogoutModal() {
  showLogoutModal.value = true;
}


async function handleLogout() {
  try {
    await authStore.logout();

    if (store.isMobile) {
      store.mobileSidebarOpen = false;
    }

    await router.push({ name: "login" });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
  } finally {
    showLogoutModal.value = false;
  }
}

const navSections = [
  {
    title: 'QUẢN LÝ',
    items: [
      { name: "admin-dashboard", label: "Bảng điều khiển", icon: "solar:home-2-bold-duotone" },
      { name: "admin-products", label: "Quản lý sản phẩm", icon: "solar:bag-bold-duotone" },
      { name: "admin-categories", label: "Quản lý danh mục", icon: "solar:sort-bold-duotone" },
      { name: "admin-artisans", label: "Quản lý người dùng", icon: "solar:users-group-rounded-bold-duotone" },
      { name: "admin-orders", label: "Quản lý đơn hàng", icon: "solar:cart-large-2-bold-duotone" },
      { name: "admin-roles", label: "Phân quyền", icon: "solar:shield-bold-duotone" },
      { name: "admin-delivery-methods", label: "Phương thức giao hàng", icon: "solar:delivery-bold-duotone" },
      { name: "admin-discounts", label: "Quản lý giảm giá", icon: "solar:tag-price-bold-duotone" },
    ]
  },
  {
    title: 'NỘi DUNG',
    items: [
      { name: "admin-inventory", label: "Hàng tồn kho", icon: "solar:box-bold-duotone" },
      { name: "admin-gallery", label: "Phần trưng bày", icon: "solar:gallery-bold-duotone" },
      { name: "admin-articles", label: "Bài viết", icon: "solar:notes-bold-duotone" }
    ]
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { name: "admin-settings", label: 'Cài đặt', icon: 'solar:settings-bold-duotone' },
      { name: "logout", label: 'Đăng xuất', icon: 'solar:logout-2-bold-duotone', action: 'logout' }
    ]
  }
]
</script>