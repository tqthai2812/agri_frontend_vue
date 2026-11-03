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
  reacting: Boolean,
});
defineEmits(["reply", "edit", "remove", "hide", "react", "people"]);
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
        <span class="news-reaction-control">
          <button
            type="button"
            class="news-reaction-button"
            :class="{ 'is-liked': comment.my_reaction === 'like' }"
            :aria-pressed="comment.my_reaction === 'like'"
            :disabled="disabled || reacting || comment.status !== 'active'"
            :title="comment.my_reaction === 'like' ? 'Bỏ thích' : 'Thích'"
            @click="$emit('react', comment, 'like')"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M7 10v11H3V10h4Zm0 0 5-8c3 0 3 3 2 7h6c1 0 2 1 1.7 2.3l-1.6 8C20 20.3 19.2 21 18 21H7"
              />
            </svg>
            Thích
          </button>
          <button
            v-if="comment.like_count > 0"
            type="button"
            class="news-reaction-count"
            :disabled="comment.status !== 'active'"
            :aria-label="`Xem người đã thích (${comment.like_count})`"
            @click="$emit('people', comment, 'like')"
          >
            {{ comment.like_count }}
          </button>
          <span v-else class="news-reaction-zero">0</span>
        </span>
        <span class="news-reaction-control">
          <button
            type="button"
            class="news-reaction-button"
            :class="{ 'is-disliked': comment.my_reaction === 'dislike' }"
            :aria-pressed="comment.my_reaction === 'dislike'"
            :disabled="disabled || reacting || comment.status !== 'active'"
            :title="
              comment.my_reaction === 'dislike'
                ? 'Bỏ không thích'
                : 'Không thích'
            "
            @click="$emit('react', comment, 'dislike')"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M7 14V3H3v11h4Zm0 0 5 8c3 0 3-3 2-7h6c1 0 2-1 1.7-2.3l-1.6-8C20 3.7 19.2 3 18 3H7"
              />
            </svg>
            Không thích
          </button>
          <button
            v-if="comment.dislike_count > 0"
            type="button"
            class="news-reaction-count"
            :disabled="comment.status !== 'active'"
            :aria-label="`Xem người đã không thích (${comment.dislike_count})`"
            @click="$emit('people', comment, 'dislike')"
          >
            {{ comment.dislike_count }}
          </button>
          <span v-else class="news-reaction-zero">0</span>
        </span>
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