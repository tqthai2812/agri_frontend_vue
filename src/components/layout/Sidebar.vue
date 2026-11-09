<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/shared/authStore";
import { accessLinks, allowedNavigation, canVisit } from "@/router/adminAccess";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
defineProps({ collapsed: Boolean, mobileOpen: Boolean, isMobile: Boolean });
const route = useRoute(),
  router = useRouter(),
  store = useAppStore(),
  auth = useAuthStore();
const showLogoutModal = ref(false),
  logoutError = ref(""),
  accessOpen = ref(true);
const sections = computed(() => allowedNavigation(router, auth));
const accessItems = computed(() =>
  accessLinks.filter(([name]) =>
    canVisit(
      auth,
      router.getRoutes().find((r) => r.name === name),
    ),
  ),
);
const accessActive = computed(() =>
  accessLinks.some(([name]) => route.name === name),
);
const initials = computed(() =>
  String(auth.user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase(),
);
watch(accessActive, (active) => {
  if (active) accessOpen.value = true;
});
function navigate() {
  if (store.isMobile) store.mobileSidebarOpen = false;
}
async function logout() {
  logoutError.value = "";
  try {
    await auth.logout();
    showLogoutModal.value = false;
    navigate();
    await router.push({ name: "login" });
  } catch {
    logoutError.value =
      "Chưa đăng xuất được. Vui lòng kiểm tra kết nối rồi thử lại.";
    showLogoutModal.value = false;
  }
}
</script>
<template>
  <aside
    class="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-border bg-surface transition-all duration-300"
    :class="[
      isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : '',
      !isMobile && collapsed ? 'w-[80px]' : 'w-[280px]',
    ]"
  >
    <RouterLink
      :to="{ name: 'home' }"
      class="flex min-h-[72px] items-center gap-3 border-b border-border px-5 py-4"
      @click="navigate"
    >
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
        ><Icon icon="solar:leaf-bold-duotone" class="text-2xl"
      /></span>
      <span v-if="!collapsed || isMobile"
        ><strong class="block text-base text-text">NFarmHouse</strong
        ><span class="text-xs text-text-light">Trang quản trị</span></span
      >
    </RouterLink>
    <nav
      class="flex-1 space-y-3 overflow-y-auto p-3"
      aria-label="Điều hướng quản trị"
    >
      <section v-for="section in sections" :key="section.title">
        <h2
          v-if="!collapsed || isMobile"
          class="px-3 py-2 text-[10px] font-semibold tracking-wide text-text-light"
        >
          {{ section.title }}
        </h2>
        <RouterLink
          v-for="[name, label, icon] in section.items"
          :key="name"
          :to="{ name }"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
          :class="
            route.name === name
              ? 'bg-primary/10 text-primary'
              : 'text-text-sec hover:bg-primary/5 hover:text-primary'
          "
          :title="label"
          :aria-label="label"
          @click="navigate"
        >
          <Icon :icon="icon" class="text-xl shrink-0" /><span
            v-if="!collapsed || isMobile"
            >{{ label }}</span
          >
        </RouterLink>
      </section>
      <section v-if="accessItems.length">
        <RouterLink
          v-if="collapsed && !isMobile"
          :to="{ name: accessItems[0][0] }"
          class="flex justify-center rounded-xl px-3 py-3 hover:bg-primary/5"
          :class="{ 'text-primary bg-primary/10': accessActive }"
          title="Phân quyền"
          aria-label="Phân quyền"
          ><Icon icon="solar:shield-bold-duotone" class="text-xl"
        /></RouterLink>
        <template v-else>
          <button
            type="button"
            class="flex items-center w-full gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer hover:bg-primary/5"
            :class="accessActive ? 'text-primary' : 'text-text-sec'"
            :aria-expanded="accessOpen"
            @click="accessOpen = !accessOpen"
          >
            <Icon icon="solar:shield-bold-duotone" class="text-xl" /><span
              class="grow text-left"
              >Phân quyền</span
            ><Icon
              :icon="
                accessOpen
                  ? 'solar:alt-arrow-up-linear'
                  : 'solar:alt-arrow-down-linear'
              "
            />
          </button>
          <div
            v-show="accessOpen"
            class="ml-5 border-l border-border pl-3 space-y-1 mt-1"
          >
            <RouterLink
              v-for="[name, label] in accessItems"
              :key="name"
              :to="{ name }"
              class="block rounded-lg px-3 py-2.5 text-sm"
              :class="
                route.name === name
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-text-light hover:text-primary hover:bg-primary/5'
              "
              @click="navigate"
              >{{ label }}</RouterLink
            >
          </div>
        </template>
      </section>
      <p v-if="logoutError" role="alert" class="px-3 text-xs text-red-600">
        {{ logoutError }}
      </p>
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
        aria-label="Đăng xuất"
        title="Đăng xuất"
        @click="showLogoutModal = true"
      >
        <Icon
          icon="solar:logout-2-bold-duotone"
          class="text-xl shrink-0"
        /><span v-if="!collapsed || isMobile">Đăng xuất</span>
      </button>
    </nav>
    <div class="flex items-center gap-3 border-t border-border p-4">
      <img
        v-if="auth.user?.avatar_url"
        :src="auth.user.avatar_url"
        :alt="auth.user.name"
        class="size-9 shrink-0 rounded-full object-cover"
      />
      <span
        v-else
        class="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white text-sm font-bold"
        >{{ initials }}</span
      >
      <div v-if="!collapsed || isMobile" class="min-w-0">
        <strong class="block truncate text-sm text-text">{{
          auth.user?.name
        }}</strong
        ><span class="block truncate text-xs text-text-light">{{
          auth.user?.roles?.join(", ") || "Chưa có vai trò"
        }}</span>
      </div>
    </div>
  </aside>
  <ConfirmModal
    v-model="showLogoutModal"
    title="Xác nhận đăng xuất"
    message="Bạn muốn đăng xuất khỏi trang quản trị?"
    confirm-text="Đăng xuất"
    cancel-text="Ở lại"
    loading-text="Đang đăng xuất…"
    type="danger"
    icon="solar:logout-2-bold-duotone"
    :loading="auth.loading"
    @confirm="logout"
  />
</template>