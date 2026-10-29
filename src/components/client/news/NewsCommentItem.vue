<script setup>
import NewsAvatar from "./NewsAvatar.vue";
import { dateText } from "@/services/newsStudio.service";
defineProps({
  comment: { type: Object, required: true },
  own: Boolean,
  canReply: Boolean,
  canHide: Boolean,
  showStatus: Boolean,
  disabled: Boolean,
});
defineEmits(["reply", "edit", "remove", "hide"]);
const labels = {
  active: "Đang hiển thị",
  hidden: "Đã ẩn",
  pending: "Chờ xử lý từ bản cũ",
};
</script>
<template>
  <div class="news-comment-row" :data-comment-id="comment.id">
    <NewsAvatar :src="comment.avatar_url" :name="comment.author" />
    <div class="news-comment-main">
      <div class="news-comment-bubble">
        <strong class="news-comment-author">{{ comment.author }}</strong>
        <p class="news-comment-text">{{ comment.content }}</p>
      </div>
      <div class="news-comment-actions">
        <time
          :datetime="comment.created_at"
          :title="dateText(comment.created_at)"
          >{{ dateText(comment.created_at) }}</time
        >
        <button
          v-if="canReply"
          type="button"
          :disabled="disabled"
          @click="$emit('reply', comment)"
        >
          Trả lời
        </button>
        <button
          v-if="own"
          type="button"
          :disabled="disabled"
          @click="$emit('edit', comment)"
        >
          Sửa
        </button>
        <button
          v-if="own"
          type="button"
          :disabled="disabled"
          @click="$emit('remove', comment)"
        >
          Xóa
        </button>
        <button
          v-if="canHide"
          type="button"
          :disabled="disabled"
          @click="$emit('hide', comment)"
        >
          Ẩn
        </button>
        <span
          v-if="showStatus && comment.status !== 'active'"
          class="news-comment-status"
          >{{ labels[comment.status] || comment.status }}</span
        >
      </div>
      <slot />
    </div>
  </div>
</template>