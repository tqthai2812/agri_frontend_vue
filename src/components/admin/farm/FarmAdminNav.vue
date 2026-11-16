<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
const auth = useAuthStore();
const router = useRouter();
const links = [
  ["admin-crops", "Cây trồng", "crop.view"],
  ["admin-product-purposes", "Công dụng", "product-purpose.view"],
  [
    "admin-crop-growth-stages",
    "Giai đoạn sinh trưởng",
    "crop-growth-stage.view",
  ],
  ["admin-usage-guides", "Hướng dẫn sử dụng", "usage-guide.view"],
];
</script>
<template>
  <nav class="mb-6 flex flex-wrap gap-2" aria-label="Quản lý tiện ích">
    <template v-for="[name, label, permission] in links" :key="name">
      <RouterLink
        v-if="router.hasRoute(name) && auth.hasPermission(permission)"
        :to="{ name }"
        class="btn-outline-sm cursor-pointer"
        :class="{
          '!border-primary !text-primary !bg-primary/5': $route.name === name,
        }"
        >{{ label }}</RouterLink
      >
    </template>
  </nav>
</template>