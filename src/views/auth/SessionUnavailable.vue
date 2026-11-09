<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
const auth = useAuthStore(),
  route = useRoute(),
  router = useRouter();
const busy = ref(false),
  error = ref("");
async function retry() {
  busy.value = true;
  error.value = "";
  try {
    await auth.fetchUser();
    const target = route.query.redirect;
    await router.replace(
      typeof target === "string" &&
        target.startsWith("/") &&
        !target.startsWith("//") &&
        !/[\\\r\n]/.test(target) &&
        !target.startsWith("/session-unavailable")
        ? target
        : "/",
    );
  } catch {
    error.value = "Chưa kết nối được server. Vui lòng thử lại sau.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main
    class="min-h-screen flex items-center justify-center bg-bg p-6 text-text"
  >
    <section
      class="max-w-md rounded-2xl border border-border bg-surface p-8 space-y-4"
    >
      <h1 class="text-xl font-bold">Chưa xác minh được phiên đăng nhập</h1>
      <p class="text-sm text-text-light">
        Kiểm tra kết nối và thử lại để tải quyền truy cập hiện tại.
      </p>
      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary" :disabled="busy" @click="retry">
        {{ busy ? "Đang kiểm tra…" : "Thử lại" }}
      </button>
      <RouterLink :to="{ name: 'home' }" class="ml-4 text-sm text-primary"
        >Về trang chủ</RouterLink
      >
    </section>
  </main>
</template>