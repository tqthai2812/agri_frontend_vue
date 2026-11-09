<script setup>
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/stores/appStore";

const app = useAppStore();
</script>

<template>
  <section class="settings-card" aria-labelledby="settings-appearance-title">
    <div class="settings-card-heading">
      <span class="settings-section-icon"
        ><Icon icon="solar:settings-bold-duotone"
      /></span>
      <div>
        <h2 id="settings-appearance-title" class="text-lg font-bold">
          Giao diện
        </h2>
        <p class="mt-1 text-sm text-text-light">
          Tùy chọn áp dụng ngay trên giao diện quản trị.
        </p>
      </div>
    </div>
    <label class="flex justify-between items-center gap-4 py-3 cursor-pointer"
      ><span
        ><span class="block text-sm font-semibold">Chế độ tối</span
        ><span class="block mt-1 text-xs text-text-light"
          >Chuyển giao diện giữa sáng và tối.</span
        ></span
      ><span class="settings-switch"
        ><input
          type="checkbox"
          :checked="app.darkMode"
          @change="app.toggleDarkMode()"
          aria-label="Chế độ tối" /><span
          class="settings-switch-track"
        ></span></span
    ></label>
    <label
      class="flex justify-between items-center gap-4 pt-5 mt-2 border-t border-border"
      :class="app.isMobile ? 'cursor-not-allowed' : 'cursor-pointer'"
      ><span
        ><span class="block text-sm font-semibold">Thu gọn menu</span
        ><span class="block mt-1 text-xs text-text-light">{{
          app.isMobile
            ? "Tùy chọn này áp dụng trên màn hình máy tính."
            : "Thu nhỏ thanh điều hướng để có thêm không gian."
        }}</span></span
      ><span class="settings-switch"
        ><input
          v-model="app.sidebarCollapsed"
          type="checkbox"
          :disabled="app.isMobile"
          aria-label="Thu gọn menu" /><span
          class="settings-switch-track"
        ></span></span
    ></label>
  </section>
</template>