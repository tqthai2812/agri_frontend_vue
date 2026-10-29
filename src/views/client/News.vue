<script setup>
import { ref, onMounted } from "vue";
import { newsApi, errorText, dateText } from "@/services/newsStudio.service";
import "@/assets/news.css";
const rows = ref([]),
  topics = ref([]),
  meta = ref({}),
  search = ref(""),
  tag = ref(""),
  sort = ref("latest"),
  busy = ref(false),
  error = ref("");
let seq = 0;
async function load(page = 1) {
  const token = ++seq;
  busy.value = true;
  error.value = "";
  try {
    const r = await newsApi.get("/api/v1/public/news", {
      page,
      search: search.value,
      tag: tag.value,
      sort: sort.value,
      per_page: 9,
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
onMounted(async () => {
  load();
  try {
    topics.value = (await newsApi.get("/api/v1/news-topics")).data;
  } catch {
    topics.value = [];
  }
});
</script>
<template>
  <main
    class="nf-news stack"
    style="max-width: 1180px; margin: auto; padding: 48px 20px"
  >
    <header style="max-width: 700px; margin-bottom: 30px">
      <span class="tag">KIẾN THỨC NHÀ NÔNG</span>
      <h1 style="font-size: clamp(30px, 5vw, 48px); margin-top: 15px">
        Hiểu cây trồng.<br />Vững vàng mỗi mùa vụ.
      </h1>
      <p class="muted">
        Kinh nghiệm canh tác, chăm sóc và những câu chuyện từ đồng ruộng.
      </p>
    </header>
    <form class="row" @submit.prevent="load()">
      <input
        v-model="search"
        placeholder="Tìm kiến thức bạn quan tâm…"
        style="flex: 1; min-width: 200px"
      /><select v-model="tag" style="width: 190px" @change="load()">
        <option value="">Tất cả chủ đề</option>
        <option v-for="t in topics" :key="t.id" :value="t.tag_name">
          {{ t.tag_name }}
        </option></select
      ><select v-model="sort" style="width: 180px" @change="load()">
        <option value="latest">Mới nhất</option>
        <option value="popular">Đọc nhiều</option>
        <option value="comments">Nhiều bình luận</option></select
      ><button class="primary" :disabled="busy">Tìm kiếm</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="busy" class="empty">Đang tải bài viết…</p>
    <section v-else class="cards">
      <article
        v-for="n in rows"
        :key="n.id"
        class="panel"
        style="padding: 16px"
      >
        <RouterLink
          :to="{ name: 'news-detail', params: { slug: n.slug } }"
          style="text-decoration: none; color: inherit"
          ><img
            v-if="n.title_image_url"
            :src="n.title_image_url"
            :alt="n.title"
            class="cover"
            loading="lazy"
          />
          <div
            v-else
            class="cover"
            style="display: grid; place-items: center; color: #559169"
          >
            Kiến thức nhà nông
          </div>
          <p class="muted" style="margin: 15px 0 8px">
            {{ dateText(n.published_at) }} · {{ n.reading_minutes }} phút đọc
          </p>
          <h2>{{ n.title }}</h2>
          <p class="muted">{{ n.subtitle || n.excerpt }}</p>
          <div class="row between" style="margin-top: 20px">
            <span class="tag">{{ n.tags?.[0]?.tag_name || "Kiến thức" }}</span
            ><span class="muted"
              >{{ n.views }} lượt xem · {{ n.comments_count }} bình luận</span
            >
          </div></RouterLink
        >
      </article>
    </section>
    <p v-if="!busy && !rows.length" class="empty">
      Chưa tìm thấy bài viết phù hợp.
    </p>
    <nav class="row pager" aria-label="Phân trang tin tức">
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
    </nav>
  </main>
</template>