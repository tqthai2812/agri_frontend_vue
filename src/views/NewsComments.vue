<script setup>
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
  <div class="nf-news admin stack">
    <div class="row between">
      <h1>Bình luận bài viết</h1>
      <RouterLink class="button" :to="{ name: 'admin-articles' }"
        >← Bài viết</RouterLink
      >
    </div>
    <select v-model="status" style="max-width: 230px" @change="load()">
      <option value="active">Đang hiển thị</option>
      <option value="hidden">Đã ẩn</option>
      <option value="pending">Chờ xử lý từ bản cũ</option>
      <option value="">Tất cả</option>
    </select>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="busy">Đang xử lý…</p>
    <div v-for="c in rows" :key="c.id" class="panel">
      <div class="row between">
        <div class="row">
          <NewsAvatar :src="c.avatar_url" :name="c.author" /><strong>{{
            c.author
          }}</strong>
        </div>
        <span class="muted"
          >{{ dateText(c.created_at) }} ·
          {{
            {
              active: "Đang hiển thị",
              hidden: "Đã ẩn",
              pending: "Chờ xử lý từ bản cũ",
            }[c.status] || c.status
          }}</span
        >
      </div>
      <p class="muted">
        {{ c.article_title }}
        <span v-if="c.parent_id">· Trả lời #{{ c.parent_id }}</span>
      </p>
      <p class="comment-text">{{ c.content }}</p>
      <div class="row" style="margin-top: 15px">
        <button
          v-if="c.status !== 'active'"
          class="primary"
          :disabled="busy"
          @click="moderate(c, 'active')"
        >
          Hiện lại
        </button>
        <button
          v-if="c.status !== 'hidden'"
          :disabled="busy"
          @click="moderate(c, 'hidden')"
        >
          Ẩn bình luận
        </button>
        <button
          :disabled="busy || c.status !== 'active'"
          @click="
            replyId = c.id;
            replyText = '';
          "
        >
          Trả lời
        </button>
      </div>
      <form
        v-if="replyId === c.id"
        @submit.prevent="reply"
        style="margin-top: 15px"
      >
        <textarea
          v-model="replyText"
          maxlength="3000"
          required
          placeholder="Trả lời độc giả…"
        />
        <div class="row">
          <button class="primary" :disabled="busy || !replyText.trim()">
            Gửi trả lời</button
          ><button type="button" @click="replyId = null">Hủy</button>
        </div>
      </form>
    </div>
    <p v-if="!busy && !rows.length" class="empty">
      Không có bình luận trong trạng thái này.
    </p>
    <div class="row pager">
      <button
        :disabled="busy || meta.current_page <= 1"
        @click="load(meta.current_page - 1)"
      >
        Trước</button
      ><span>{{ meta.current_page || 1 }} / {{ meta.last_page || 1 }}</span
      ><button
        :disabled="busy || meta.current_page >= meta.last_page"
        @click="load(meta.current_page + 1)"
      >
        Sau
      </button>
    </div>
  </div>
</template>