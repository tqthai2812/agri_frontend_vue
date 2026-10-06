<template>
  <aside
    class="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-border bg-surface transition-all duration-300"
    :class="[
      isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : '',
      !isMobile && collapsed ? 'w-[80px]' : 'w-[280px]',
    ]">
    <div class="flex min-h-[72px] items-center gap-3 border-b border-border px-5 py-5">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
        <Icon icon="solar:t-shirt-bold" class="text-2xl text-white" />
      </div>
      <div :class="collapsed && !isMobile ? 'hidden' : 'block'">
        <h2 class="text-base font-bold text-text">EVDesign</h2>
        <span class="text-xs text-text-light">Admin Dashboard</span>
      </div>
    </div>
    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      <div v-for="section in navSections" :key="section.title">
        <div v-if="section.title"
          class="mt-2 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-text-light"
          :class="collapsed && !isMobile ? 'opacity-0' : ''">
          {{ section.title }}
        </div>
        <template v-for="item in section.items" :key="item.name">
          <button v-if="item.action === 'logout'" type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
            :title="collapsed && !isMobile ? item.label : undefined" :aria-label="item.label" @click="openLogoutModal">
            <Icon :icon="item.icon" class="shrink-0 text-xl" /><span :class="collapsed && !isMobile ? 'hidden' : ''">{{
              item.label }}</span>
          </button>
          <RouterLink v-else :to="{ name: item.name }"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all" :class="[
              route.name === item.name
                ? 'relative bg-primary/10 font-semibold text-primary before:absolute before:left-0 before:top-1/2 before:h-1/2 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-primary'
                : 'text-text-sec hover:bg-primary/10 hover:text-primary',
            ]" :title="collapsed && !isMobile ? item.label : undefined" :aria-label="item.label"
            @click="handleNavigate">
            <Icon :icon="item.icon" class="shrink-0 text-xl" /><span :class="collapsed && !isMobile ? 'hidden' : ''">{{
              item.label }}</span>
          </RouterLink>
        </template>
      </div>
    </nav>
    <div class="flex items-center gap-3 border-t border-border p-4">
      <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
        EV
      </div>
      <div :class="collapsed && !isMobile ? 'hidden' : 'block'">
        <strong class="block text-sm text-text">Admin EVDesign</strong><span class="text-xs text-text-light">Super
          Admin</span>
      </div>
    </div>
  </aside>
  <ConfirmModal v-model="showLogoutModal" title="Xác nhận đăng xuất"
    message="Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị EVDesign không?" confirm-text="Đăng xuất"
    cancel-text="Ở lại" loading-text="Đang đăng xuất..." type="danger" icon="solar:logout-2-bold-duotone"
    :loading="authStore.loading" @confirm="handleLogout" />
</template>

<script setup>
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/shared/authStore";
import ConfirmModal from "@/components/common/ConfirmModal.vue";

defineProps({ collapsed: Boolean, mobileOpen: Boolean, isMobile: Boolean });
const route = useRoute();
const router = useRouter();
const store = useAppStore();
const authStore = useAuthStore();
const showLogoutModal = ref(false);
function handleNavigate() {
  if (store.isMobile) store.mobileSidebarOpen = false;
}
function openLogoutModal() {
  showLogoutModal.value = true;
}
async function handleLogout() {
  try {
    await authStore.logout();
    if (store.isMobile) store.mobileSidebarOpen = false;
    await router.push({ name: "login" });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
  } finally {
    showLogoutModal.value = false;
  }
}

const sections = [
  {
    title: "CHI PHÍ VÀ BÁO CÁO",
    items: [
      {
        name: "admin-expenses",
        label: "Chi phí",
        icon: "solar:wallet-money-bold-duotone",
        permission: "expense.view",
      },
      {
        name: "admin-expense-categories",
        label: "Danh mục chi phí",
        icon: "solar:folder-bold-duotone",
        permission: "expense.view",
      },
      {
        name: "admin-profit-report",
        label: "Báo cáo lợi nhuận",
        icon: "solar:chart-2-bold-duotone",
        permission: "report.profit.view",
      },
    ],
  },
  {
    title: "HỖ TRỢ",
    items: [
      {
        name: "admin-contacts",
        label: "Quản lý liên hệ",
        icon: "solar:chat-round-line-bold-duotone",
        permission: "contact.view",
      },
    ],
  },
  {
    title: "QUẢN LÝ",
    items: [
      {
        name: "admin-dashboard",
        label: "Bảng điều khiển",
        icon: "solar:home-2-bold-duotone",
      },
      {
        name: "admin-products",
        label: "Quản lý sản phẩm",
        icon: "solar:bag-bold-duotone",
      },
      {
        name: "admin-categories",
        label: "Quản lý danh mục",
        icon: "solar:sort-bold-duotone",
      },
      {
        name: "admin-artisans",
        label: "Quản lý người dùng",
        icon: "solar:users-group-rounded-bold-duotone",
      },
      {
        name: "admin-orders",
        label: "Quản lý đơn hàng",
        icon: "solar:cart-large-2-bold-duotone",
      },
      {
        name: "admin-reviews",
        label: "Quản lý đánh giá",
        icon: "solar:star-bold-duotone",
        permission: "review.view",
      },
      {
        name: "admin-roles",
        label: "Phân quyền",
        icon: "solar:shield-bold-duotone",
      },
      {
        name: "admin-delivery-methods",
        label: "Phương thức giao hàng",
        icon: "solar:delivery-bold-duotone",
      },
      {
        name: "admin-discounts",
        label: "Quản lý giảm giá",
        icon: "solar:tag-price-bold-duotone",
      },
    ],
  },
  {
    title: "KHO HÀNG",
    items: [
      {
        name: "admin-inventory",
        label: "Hàng tồn kho",
        icon: "solar:box-bold-duotone",
        permission: "inventory.view",
      },
      {
        name: "admin-suppliers",
        label: "Nhà cung cấp",
        icon: "solar:delivery-bold-duotone",
        permission: "inventory.view",
      },
    ],
  },
  {
    title: "NỘI DUNG",
    items: [
      {
        name: "admin-gallery",
        label: "Phần trưng bày",
        icon: "solar:gallery-bold-duotone",
      },
      {
        name: "admin-articles",
        label: "Bài viết",
        icon: "solar:notes-bold-duotone",
      },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      {
        name: "admin-settings",
        label: "Cài đặt",
        icon: "solar:settings-bold-duotone",
      },
      {
        name: "logout",
        label: "Đăng xuất",
        icon: "solar:logout-2-bold-duotone",
        action: "logout",
      },
    ],
  },
];
const navSections = computed(() =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || authStore.hasPermission(item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0),
);
</script>