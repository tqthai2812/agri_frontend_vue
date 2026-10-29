<script setup>
import { computed } from "vue";
import DOMPurify from "dompurify";
import "@/assets/news.css";
const props = defineProps({
  content: { type: String, default: "" },
  toc: Boolean,
});
const prepared = computed(() => {
  const box = document.createElement("div");
  box.innerHTML = DOMPurify.sanitize(props.content, {
    FORBID_TAGS: ["style", "iframe", "form"],
    FORBID_ATTR: ["style"],
  });
  const headings = [];
  box.querySelectorAll("h2,h3").forEach((h, i) => {
    h.id = `article-section-${i + 1}`;
    headings.push({ id: h.id, text: h.textContent, level: h.tagName });
  });
  return { html: box.innerHTML, headings };
});
</script>
<template>
  <nav
    v-if="toc && prepared.headings.length > 1"
    class="panel toc"
    aria-label="Mục lục"
    style="margin-bottom: 28px"
  >
    <h2>Mục lục</h2>
    <a
      v-for="h in prepared.headings"
      :key="h.id"
      :href="`#${h.id}`"
      :style="{ paddingLeft: h.level === 'H3' ? '16px' : 0 }"
      >{{ h.text }}</a
    >
  </nav>
  <div class="nf-article" v-html="prepared.html"></div>
</template>