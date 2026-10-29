<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import ArticleBody from "@/components/client/news/ArticleBody.vue";
import NewsComments from "@/components/client/news/NewsComments.vue";
import { newsApi, errorText, dateText } from "@/services/newsStudio.service";
import "@/assets/news.css";
const route = useRoute(),
  article = ref(null),
  related = ref([]),
  error = ref(""),
  busy = ref(false);
let seq = 0;
const oldTitle = document.title;
let description = document.querySelector('meta[name="description"]'),
  oldDescription = description?.content,
  createdDescription = false;
watch(
  () => route.params.slug,
  async (slug) => {
    const token = ++seq;
    busy.value = true;
    error.value = "";
    article.value = null;
    try {
      const r = await newsApi.get(
        `/api/v1/public/news/${encodeURIComponent(slug)}`,
      );
      if (token !== seq) return;
      article.value = r.data;
      related.value = r.related || [];
      document.title = `${r.data.meta_title || r.data.title} | NFarmHouse`;
      if (!description) {
        description = document.createElement("meta");
        description.name = "description";
        document.head.append(description);
        createdDescription = true;
      }
      description.content =
        r.data.meta_description || r.data.subtitle || r.data.excerpt;
    } catch (e) {
      if (token === seq) error.value = errorText(e);
    } finally {
      if (token === seq) busy.value = false;
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  seq++;
  document.title = oldTitle;
  if (createdDescription) description?.remove();
  else if (description) description.content = oldDescription || "";
});
</script>
<template>
  <main
    class="nf-news stack"
    style="max-width: 1050px; margin: auto; padding: 32px 20px 64px"
  >
    <nav class="muted">
      <RouterLink to="/">Trang chủ</RouterLink> /
      <RouterLink :to="{ name: 'news' }">Kiến thức nhà nông</RouterLink>
    </nav>
    <p v-if="busy" class="empty">Đang mở bài viết…</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>
    <template v-else-if="article"
      ><article>
        <header style="max-width: 800px; margin: 28px auto">
          <div class="row">
            <span v-for="tag in article.tags" :key="tag.id" class="tag">{{
              tag.tag_name
            }}</span>
          </div>
          <h1 style="font-size: clamp(30px, 4vw, 45px); margin-top: 18px">
            {{ article.title }}
          </h1>
          <p style="font-size: 19px; color: #697b70; margin: 20px 0">
            {{ article.subtitle }}
          </p>
          <p class="muted">
            {{ article.author?.name || "NFarmHouse" }} ·
            {{ dateText(article.published_at) }} ·
            {{ article.reading_minutes }} phút đọc · {{ article.views }} lượt
            xem
          </p>
        </header>
        <div style="max-width: 760px; margin: auto">
          <ArticleBody :content="article.content" toc />
        </div>
      </article>
      <section v-if="related.length" style="margin-top: 45px">
        <h2>Đọc thêm cùng chủ đề</h2>
        <div class="cards">
          <RouterLink
            v-for="n in related"
            :key="n.id"
            :to="{ name: 'news-detail', params: { slug: n.slug } }"
            class="panel"
            style="text-decoration: none; color: inherit"
            ><img
              v-if="n.title_image_url"
              :src="n.title_image_url"
              :alt="n.title"
              class="cover"
              loading="lazy"
            />
            <h3 style="margin-top: 12px">{{ n.title }}</h3></RouterLink
          >
        </div>
      </section>
      <NewsComments
        :key="article.id"
        :slug="article.slug"
        style="margin-top: 45px"
    /></template>
  </main>
</template>