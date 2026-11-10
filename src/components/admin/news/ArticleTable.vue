<script setup>
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { dateText } from "@/services/newsStudio.service";
const auth = useAuthStore();
defineProps({ rows: Array, labels: Object, busy: Boolean });
const emit = defineEmits(["delete"]);
function statusClass(value) {
  return { published: "badge-active", draft: "badge-gray", scheduled: "badge-pending", hidden: "badge-inactive" }[value] || "badge-gray";
}
</script>

<template>
<div v-if="busy" class="py-10 text-center text-text-light">
  <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" /><p class="text-sm">Đang tải bài viết...</p>
</div>
<div v-else class="overflow-x-auto">
  <table class="w-full min-w-[1050px]">
    <thead class="bg-bg"><tr><th v-for="title in ['Bài viết', 'Tác giả', 'Ngày xuất bản', 'Lượt xem', 'Trạng thái', 'Thao tác']" :key="title" class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">{{ title }}</th></tr></thead>
    <tbody>
      <tr v-for="n in rows" :key="n.id" class="border-b border-border transition hover:bg-primary/5">
        <td class="p-3"><div class="max-w-[340px] break-words text-sm font-semibold">{{ n.title }}</div><div class="mt-1 max-w-[340px] text-xs text-text-light">{{ n.subtitle }}</div></td>
        <td class="p-3 text-sm">{{ n.author }}</td><td class="p-3 text-sm text-text-light">{{ dateText(n.published_at) }}</td><td class="p-3 font-mono text-sm">{{ n.views }}</td>
        <td class="p-3"><span :class="statusClass(n.status)">{{ labels[n.status] }}</span></td>
        <td class="p-3"><div class="flex gap-2">
          <RouterLink v-if="auth.hasPermission('article.update')" class="btn-outline-icon cursor-pointer" title="Sửa bài viết" aria-label="Sửa bài viết" :to="{ name: 'admin-article-edit', params: { id: n.id } }"><Icon icon="solar:pen-bold" /></RouterLink>
          <RouterLink v-if="n.status === 'published'" class="btn-outline-icon cursor-pointer" title="Xem bài viết" aria-label="Xem bài viết" :to="{ name: 'news-detail', params: { slug: n.slug } }"><Icon icon="solar:eye-bold" /></RouterLink>
          <button v-if="auth.hasPermission('article.delete')" type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed" title="Xóa bài viết" aria-label="Xóa bài viết" @click="emit('delete', n)"><Icon icon="solar:trash-bin-trash-bold" /></button>
        </div></td>
      </tr>
      <tr v-if="!rows.length"><td colspan="6" class="p-8 text-center text-sm text-text-light">Chưa có bài viết phù hợp.</td></tr>
    </tbody>
  </table>
</div>
</template>