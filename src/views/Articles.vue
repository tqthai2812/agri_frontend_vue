<script setup>
import { Icon } from "@iconify/vue";
import ArticleFilters from "@/components/admin/news/ArticleFilters.vue";
import ArticleTable from "@/components/admin/news/ArticleTable.vue";
import NewsAdminPagination from "@/components/admin/news/NewsAdminPagination.vue";
import "@/assets/news-admin.css";
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import {
  newsApi,
  adminBase,
  errorText,
  dateText,
} from "@/services/newsStudio.service";
import "@/assets/news.css";
const auth = useAuthStore(),
  rows = ref([]),
  meta = ref({}),
  search = ref(""),
  status = ref(""),
  busy = ref(false),
  error = ref("");
let seq = 0;
const labels = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  scheduled: "Hẹn đăng",
  hidden: "Đã ẩn",
};
async function load(page = 1) {
  const token = ++seq;
  busy.value = true;
  error.value = "";
  try {
    const r = await newsApi.get(adminBase, {
      page,
      search: search.value,
      status: status.value,
    });
    if (token === seq) {
      rows.value = r.data;
      meta.value = r;
    }
  } catch (e) {
    if (token === seq) error.value = errorText(e);
  } finally {
    if (token === seq) busy.value = false;
  }
}
async function remove(n) {
  if (!confirm(`Xóa bài “${n.title}” cùng ảnh và bình luận?`)) return;
  try {
    await newsApi.write("delete", `${adminBase}/${n.id}`);
    await load();
  } catch (e) {
    error.value = errorText(e);
  }
}
onMounted(() => load());

function resetFilters() { search.value = ""; status.value = ""; return load(); }
</script>

<template>
<div class="news-studio-admin">
  <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div><h1 class="text-2xl font-bold">Quản lý bài viết</h1><p class="text-sm text-text-light">{{ meta.total || 0 }} bài viết phù hợp bộ lọc</p></div>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="load()"><Icon icon="solar:refresh-bold" :class="busy ? 'animate-spin' : ''" />Tải lại</button>
      <RouterLink v-if="auth.hasPermission('article.update')" class="btn-outline-sm cursor-pointer" :to="{ name: 'admin-news-comments' }"><Icon icon="solar:chat-round-dots-bold" />Duyệt bình luận</RouterLink>
      <RouterLink v-if="auth.hasPermission('article.create')" class="btn-primary cursor-pointer" :to="{ name: 'admin-article-create' }"><Icon icon="solar:add-circle-bold" />Viết bài mới</RouterLink>
    </div>
  </div>
  <div v-if="error" role="alert" class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"><Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" /><span>{{ error }}</span></div>
  <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <ArticleFilters v-model:search="search" v-model:status="status" :labels="labels" :busy="busy" @submit="load()" @reset="resetFilters" />
    <ArticleTable :rows="rows" :labels="labels" :busy="busy" @delete="remove" />
    <NewsAdminPagination :meta="meta" :count="rows.length" label="bài viết" :busy="busy" @change="load" />
  </section>
</div>
</template>