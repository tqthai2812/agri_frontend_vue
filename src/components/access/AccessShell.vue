<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { accessLinks, canVisit } from "@/router/adminAccess";
import "@/assets/access.css";
defineProps({ title: String, description: String });
const auth = useAuthStore(),
  router = useRouter();
const links = computed(() =>
  accessLinks.filter(([name]) =>
    canVisit(
      auth,
      router.getRoutes().find((r) => r.name === name),
    ),
  ),
);
</script>
<template>
  <section class="ac space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-wider text-primary mb-2"
        >
          Hệ thống / Phân quyền
        </p>
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p class="mt-2 text-sm text-text-light max-w-3xl">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <nav
      aria-label="Quản lý phân quyền"
      class="flex gap-1 overflow-x-auto border-b border-border pb-1"
    >
      <RouterLink
        v-for="[name, label, icon] in links"
        :key="name"
        :to="{ name }"
        class="ac-tab"
        active-class="ac-tab-active"
      >
        <Icon :icon="icon" class="text-lg shrink-0" />{{ label }}
      </RouterLink>
    </nav>
    <slot />
  </section>
</template>