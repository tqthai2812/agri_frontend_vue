<script setup>
import { Icon } from "@iconify/vue";
import "@/assets/news-admin.css";
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import NewsEditor from "@/components/admin/news/NewsEditor.vue";
import ArticleBody from "@/components/client/news/ArticleBody.vue";
import ArticlePreviewModal from "@/components/admin/news/ArticlePreviewModal.vue";
import { newsApi, adminBase, errorText } from "@/services/newsStudio.service";
import "@/assets/news.css";
const route = useRoute(),
  router = useRouter(),
  auth = useAuthStore();
const id = ref(route.params.id || null),
  busy = ref(false),
  loading = ref(true),
  error = ref(""),
  message = ref(""),
  preview = ref(false),
  editor = ref(),
  fileInput = ref(),
  coverFileInput = ref(),
  images = ref([]),
  saved = ref("");
const form = reactive({
  title: "",
  subtitle: "",
  content: "",
  slug: "",
  status: "draft",
  published_at: "",
  meta_title: "",
  meta_description: "",
  tagsText: "",
  cover_id: null,
});
const snapshot = () => JSON.stringify(form);
const coverImage = computed(() =>
  images.value.find((i) => i.id === form.cover_id),
);
function localDate(v) {
  if (!v) return "";
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function apply(n) {
  Object.assign(form, {
    title: n.title,
    subtitle: n.subtitle || "",
    content: n.content || "",
    slug: n.slug || "",
    status: n.status === "scheduled" ? "published" : n.status,
    published_at: localDate(n.published_at),
    meta_title: n.meta_title || "",
    meta_description: n.meta_description || "",
    tagsText: (n.tags || []).join(", "),
    cover_id: n.cover_id ?? null,
  });
  images.value = n.images || [];
  saved.value = snapshot();
}
onMounted(async () => {
  try {
    if (id.value) apply((await newsApi.get(`${adminBase}/${id.value}`)).data);
    else saved.value = snapshot();
  } catch (e) {
    error.value = errorText(e);
  } finally {
    loading.value = false;
  }
});
async function save(status = form.status) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    const { tagsText, ...data } = form;
    data.tags = tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    data.status = status;
    data.published_at = form.published_at
      ? new Date(form.published_at).toISOString()
      : null;
    const r = await newsApi.write(
      id.value ? "put" : "post",
      id.value ? `${adminBase}/${id.value}` : adminBase,
      data,
    );
    id.value = r.data.id;
    apply(r.data);
    message.value = r.message;
    await router.replace({
      name: "admin-article-edit",
      params: { id: id.value },
    });
    return true;
  } catch (e) {
    error.value = errorText(e);
    return false;
  } finally {
    busy.value = false;
  }
}
async function upload(e, target = "content") {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  if (busy.value) return;
  if (!auth.hasPermission("article.update")) {
    error.value = "Bạn cần quyền cập nhật bài viết để tải ảnh.";
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    error.value = "Chọn ảnh JPG, PNG hoặc WebP.";
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    error.value = "Ảnh vượt quá 4 MB. Hãy chọn ảnh nhỏ hơn.";
    return;
  }
  if (!id.value && !(await save("draft"))) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    const fd = new FormData();
    fd.append("image", file);
    const r = await newsApi.write(
      "post",
      `${adminBase}/${id.value}/images`,
      fd,
    );
    images.value.push(r.data);
    if (target === "cover") {
      form.cover_id = r.data.id;
      message.value = "Đã chọn ảnh bìa. Bấm Lưu bài để lưu thay đổi.";
    } else {
      const alt =
        window.prompt(
          "Mô tả ngắn cho ảnh:",
          file.name.replace(/\.[^.]+$/, ""),
        ) || "";
      editor.value.insertImage(r.data.image_url, alt);
      message.value =
        "Đã chèn ảnh. Bấm Lưu bài để lưu vị trí ảnh trong nội dung.";
    }
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
async function removeImage(image) {
  if (image.id === 0) {
    error.value = "Ảnh bìa cũ: chọn ảnh bìa mới hoặc bấm Bỏ ảnh bìa rồi lưu.";
    return;
  }
  if (
    !confirm(
      "Xóa ảnh khỏi thư viện? Ảnh đang dùng phải được bỏ khỏi bài và lưu trước.",
    )
  )
    return;
  try {
    await newsApi.write(
      "delete",
      `${adminBase}/${id.value}/images/${image.id}`,
    );
    images.value = images.value.filter((i) => i.id !== image.id);
  } catch (e) {
    error.value = errorText(e);
  }
}
function leave() {
  return (
    snapshot() === saved.value ||
    window.confirm("Bài có thay đổi chưa lưu. Rời trang?")
  );
}
onBeforeRouteLeave(leave);
function unload(e) {
  if (snapshot() !== saved.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
window.addEventListener("beforeunload", unload);
onBeforeUnmount(() => window.removeEventListener("beforeunload", unload));
</script>

<template>
<div class="news-studio-admin">
  <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div><h1 class="text-2xl font-bold">{{ id ? "Chỉnh sửa bài viết" : "Viết bài mới" }}</h1><p class="text-sm text-text-light">Chia sẻ kiến thức hữu ích cùng nhà nông.</p></div>
    <RouterLink class="btn-outline-sm cursor-pointer" :to="{ name: 'admin-articles' }"><Icon icon="solar:arrow-left-bold" />Danh sách bài viết</RouterLink>
  </div>
  <p v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
  <p v-if="message" role="status" class="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{{ message }}</p>
  <div v-if="loading" class="py-10 text-center text-text-light"><Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" /><p class="text-sm">Đang tải bài viết...</p></div>
  <form v-else class="news-admin-editor-grid" @submit.prevent="save()">
    <section class="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div class="mb-5"><h2 class="text-lg font-bold">Nội dung bài viết</h2><p class="text-sm text-text-light">Tiêu đề, mô tả và nội dung chính.</p></div>
      <div class="space-y-5">
        <label class="form-group" for="article-title"><span class="form-label">Tiêu đề <span class="text-primary">*</span></span><input id="article-title" v-model="form.title" maxlength="255" required class="form-control" placeholder="Ví dụ: Nhận biết và phòng bệnh trên cây lúa" /></label>
        <label class="form-group" for="article-subtitle"><span class="form-label">Mô tả ngắn</span><textarea id="article-subtitle" v-model="form.subtitle" maxlength="255" rows="2" class="form-control" /></label>
        <div><p class="form-label mb-2">Nội dung</p><NewsEditor ref="editor" v-model="form.content" :disabled="busy" @image="fileInput.click()" /><p class="mt-3 text-xs text-text-light">Chọn H2/H3 để chia mục. Bấm dấu × ở góc phải ảnh để gỡ ảnh khỏi nội dung; ảnh vẫn còn trong thư viện và có thể chèn lại.</p></div>
      </div>
    </section>
    <aside class="min-w-0 space-y-5">
      <section class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 class="text-lg font-bold">Xuất bản</h2>
        <label class="form-group"><span class="form-label">Trạng thái</span><select v-model="form.status" class="form-control"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="hidden">Ẩn bài</option></select></label>
        <label v-if="form.status === 'published'" class="form-group"><span class="form-label">Thời gian xuất bản</span><input v-model="form.published_at" type="datetime-local" class="form-control" /></label>
        <p v-if="form.status === 'published'" class="text-xs text-text-light">Để trống để đăng ngay; chọn thời gian tương lai để hẹn đăng.</p>
        <div class="flex flex-wrap gap-3"><button type="submit" class="btn-primary disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed" :disabled="busy"><Icon :icon="busy ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'" :class="busy ? 'animate-spin' : ''" />{{ busy ? "Đang xử lý…" : "Lưu bài" }}</button><button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="preview = true"><Icon icon="solar:eye-bold" />Xem trước</button></div>
        <button v-if="form.status === 'draft'" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="save('published')">Xuất bản ngay</button>
      </section>
      <section class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 class="text-lg font-bold">Ảnh bìa</h2>
        <input id="article-cover-image" ref="coverFileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="upload($event, 'cover')" />
        <img v-if="coverImage" :src="coverImage.image_url" :alt="form.title || 'Ảnh bìa bài viết'" class="w-full rounded-xl border border-border object-cover" style="max-height:190px" />
        <div class="flex flex-wrap gap-3"><button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy || !auth.hasPermission('article.update')" @click="coverFileInput.click()"><Icon icon="solar:gallery-add-bold" />{{ coverImage ? "Thay ảnh bìa" : "Thêm ảnh bìa" }}</button><button v-if="form.cover_id !== null" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy" @click="form.cover_id = null">Bỏ ảnh bìa</button></div>
        <p class="text-xs text-text-light">Chọn ảnh bìa riêng cho bài viết. JPG, PNG, WebP · tối đa 4 MB.</p>
      </section>
      <section class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 class="text-lg font-bold">Ảnh bài viết</h2>
        <input id="article-inline-image" ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="upload" />
        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="busy || !auth.hasPermission('article.update')" @click="fileInput.click()"><Icon icon="solar:cloud-upload-bold" />Tải ảnh &amp; chèn vào bài</button>
        <p class="text-xs text-text-light">JPG, PNG, WebP · tối đa 4 MB. Bài mới sẽ được lưu nháp trước khi tải ảnh.</p>
        <div class="space-y-3"><div v-for="image in images" :key="image.id" class="rounded-xl border border-border p-3">
          <img :src="image.image_url" alt="Ảnh trong thư viện" class="mb-3 h-28 w-full rounded-lg object-cover" />
          <div class="flex flex-wrap gap-2"><button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="form.cover_id = image.id">{{ form.cover_id === image.id ? "✓ Ảnh bìa" : "Đặt bìa" }}</button><button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="editor.insertImage(image.image_url, '')">Chèn</button><button type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed" aria-label="Xóa ảnh khỏi thư viện" title="Xóa ảnh" @click="removeImage(image)"><Icon icon="solar:trash-bin-trash-bold" /></button></div>
        </div></div>
      </section>
      <section class="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 class="text-lg font-bold">Chủ đề &amp; tìm kiếm</h2>
        <label class="form-group"><span class="form-label">Tag, cách nhau bằng dấu phẩy</span><input v-model="form.tagsText" class="form-control" placeholder="Lúa, Sâu bệnh, Kỹ thuật" /></label>
        <label class="form-group"><span class="form-label">Slug</span><input v-model="form.slug" maxlength="255" class="form-control" placeholder="Tự tạo khi lưu" /></label>
        <label class="form-group"><span class="form-label">Tiêu đề SEO</span><input v-model="form.meta_title" maxlength="255" class="form-control" /></label>
        <label class="form-group"><span class="form-label">Mô tả SEO</span><textarea v-model="form.meta_description" maxlength="500" rows="3" class="form-control" /></label>
      </section>
    </aside>
  </form>
  <ArticlePreviewModal v-model:open="preview"><article><h1 class="text-2xl font-bold">{{ form.title }}</h1><p class="my-4 text-sm text-text-light">{{ form.subtitle }}</p><ArticleBody :content="form.content" toc /></article></ArticlePreviewModal>
</div>
</template>