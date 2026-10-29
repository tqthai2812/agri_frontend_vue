<script setup>
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
</script>
<template>
  <div class="nf-news admin stack">
    <div class="row between">
      <div>
        <h1>Quản lý bài viết</h1>
        <p class="muted">Biên tập, xuất bản và kết nối với độc giả.</p>
      </div>
      <div class="row">
        <RouterLink
          v-if="auth.hasPermission('article.update')"
          class="button"
          :to="{ name: 'admin-news-comments' }"
          >Duyệt bình luận</RouterLink
        ><RouterLink
          v-if="auth.hasPermission('article.create')"
          class="button primary"
          :to="{ name: 'admin-article-create' }"
          >+ Viết bài mới</RouterLink
        >
      </div>
    </div>
    <form class="row" @submit.prevent="load()">
      <input
        v-model="search"
        style="flex: 1; min-width: 200px"
        placeholder="Tìm theo tiêu đề…"
      /><select v-model="status" style="width: 180px" @change="load()">
        <option value="">Tất cả trạng thái</option>
        <option v-for="(label, key) in labels" :key="key" :value="key">
          {{ label }}
        </option></select
      ><button :disabled="busy">Tìm kiếm</button>
    </form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="panel" style="overflow-x: auto">
      <p v-if="busy">Đang tải…</p>
      <table v-else class="list">
        <thead>
          <tr>
            <th>Bài viết</th>
            <th>Tác giả</th>
            <th>Ngày xuất bản</th>
            <th>Lượt xem</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in rows" :key="n.id">
            <td>
              <strong>{{ n.title }}</strong>
              <div class="muted">{{ n.subtitle }}</div>
            </td>
            <td>{{ n.author }}</td>
            <td>{{ dateText(n.published_at) }}</td>
            <td>{{ n.views }}</td>
            <td>
              <span class="tag">{{ labels[n.status] }}</span>
            </td>
            <td>
              <div class="row">
                <RouterLink
                  v-if="auth.hasPermission('article.update')"
                  class="button"
                  :to="{ name: 'admin-article-edit', params: { id: n.id } }"
                  >Sửa</RouterLink
                ><RouterLink
                  v-if="n.status === 'published'"
                  class="button"
                  :to="{ name: 'news-detail', params: { slug: n.slug } }"
                  >Xem</RouterLink
                ><button
                  v-if="auth.hasPermission('article.delete')"
                  @click="remove(n)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="empty">Chưa có bài viết phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="row pager">
      <button
        :disabled="busy || meta.current_page <= 1"
        @click="load(meta.current_page - 1)"
      >
        Trước</button
      ><span
        >{{ meta.current_page || 1 }} / {{ meta.last_page || 1 }} ·
        {{ meta.total || 0 }} bài</span
      ><button
        :disabled="busy || meta.current_page >= meta.last_page"
        @click="load(meta.current_page + 1)"
      >
        Sau
      </button>
    </div>
  </div>
</template>