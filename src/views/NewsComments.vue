<script setup>
import { Icon } from "@iconify/vue";
import NewsAdminPagination from "@/components/admin/news/NewsAdminPagination.vue";
import "@/assets/news-admin.css";
import { ref, onMounted } from "vue";
import { newsApi, errorText, dateText } from "@/services/newsStudio.service";
import "@/assets/news.css";
import NewsAvatar from "@/components/client/news/NewsAvatar.vue";
const rows = ref([]),
  meta = ref({}),
  status = ref("active"),
  error = ref(""),
  busy = ref(false),
  replyId = ref(null),
  replyText = ref("");
const base = "/api/v1/news-comment-moderation";
async function load(page = 1) {
  busy.value = true;
  error.value = "";
  try {
    const r = await newsApi.get(base, { status: status.value, page });
    rows.value = r.data;
    meta.value = r;
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
async function moderate(c, value) {
  busy.value = true;
  try {
    await newsApi.write("patch", `${base}/${c.id}`, { status: value });
    await load(meta.value.current_page);
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
async function reply() {
  busy.value = true;
  try {
    await newsApi.write("post", `${base}/${replyId.value}/reply`, {
      content: replyText.value,
    });
    replyId.value = null;
    replyText.value = "";
    await load();
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
onMounted(() => load());
</script>

<template>
<div class="news-studio-admin">
  <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div><h1 class="text-2xl font-bold">Bình luận bài viết</h1><p class="text-sm text-text-light">Quản lý hiển thị và trả lời bình luận của độc giả.</p></div>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="load(meta.current_page || 1)"><Icon icon="solar:refresh-bold" :class="busy ? 'animate-spin' : ''" />Tải lại</button>
      <RouterLink class="btn-outline-sm cursor-pointer" :to="{ name: 'admin-articles' }"><Icon icon="solar:arrow-left-bold" />Bài viết</RouterLink>
    </div>
  </div>
  <div v-if="error" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{{ error }}</div>
  <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <div class="mb-5 flex flex-wrap gap-3"><select v-model="status" class="filter-select" aria-label="Trạng thái bình luận" @change="load()">
      <option value="active">Đang hiển thị</option><option value="hidden">Đã ẩn</option><option value="pending">Chờ xử lý từ bản cũ</option><option value="">Tất cả</option>
    </select></div>
    <div v-if="busy" class="py-10 text-center text-text-light"><Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" /><p class="text-sm">Đang xử lý...</p></div>
    <div class="space-y-4">
      <article v-for="c in rows" :key="c.id" class="rounded-2xl border border-border bg-surface p-5">
        <div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><NewsAvatar :src="c.avatar_url" :name="c.author" /><strong class="text-sm">{{ c.author }}</strong></div><span class="text-xs text-text-light">{{ dateText(c.created_at) }} · {{ { active: 'Đang hiển thị', hidden: 'Đã ẩn', pending: 'Chờ xử lý từ bản cũ' }[c.status] || c.status }}</span></div>
        <p class="mt-3 text-xs text-text-light">{{ c.article_title }}<span v-if="c.parent_id"> · Trả lời #{{ c.parent_id }}</span></p>
        <p class="mt-3 whitespace-pre-wrap break-words text-sm">{{ c.content }}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button v-if="c.status !== 'active'" type="button" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="moderate(c, 'active')">Hiện lại</button>
          <button v-if="c.status !== 'hidden'" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="moderate(c, 'hidden')">Ẩn bình luận</button>
          <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy || c.status !== 'active'" @click="replyId = c.id; replyText = ''"><Icon icon="solar:reply-bold" />Trả lời</button>
        </div>
        <form v-if="replyId === c.id" class="mt-4 space-y-3" @submit.prevent="reply">
          <textarea v-model="replyText" maxlength="3000" required class="form-control w-full" rows="3" aria-label="Trả lời độc giả" placeholder="Trả lời độc giả…" />
          <div class="flex flex-wrap gap-3"><button type="submit" class="btn-primary disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed" :disabled="busy || !replyText.trim()">Gửi trả lời</button><button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed" @click="replyId = null">Hủy</button></div>
        </form>
      </article>
    </div>
    <p v-if="!busy && !rows.length" class="p-8 text-center text-sm text-text-light">Không có bình luận trong trạng thái này.</p>
    <NewsAdminPagination :meta="meta" :count="rows.length" label="bình luận" :busy="busy" @change="load" />
  </section>
</div>
</template>