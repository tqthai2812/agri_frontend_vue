<script setup>
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
  <div class="nf-news admin stack">
    <div class="row between">
      <div>
        <h1>{{ id ? "Chỉnh sửa bài viết" : "Viết bài mới" }}</h1>
        <p class="muted">Chia sẻ kiến thức hữu ích cùng nhà nông.</p>
      </div>
      <RouterLink class="button" :to="{ name: 'admin-articles' }"
        >← Danh sách bài viết</RouterLink
      >
    </div>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="message" role="status" class="notice">{{ message }}</p>
    <p v-if="loading">Đang tải bài viết…</p>
    <form v-else class="grid" @submit.prevent="save()">
      <section class="panel">
        <label for="article-title">Tiêu đề *</label
        ><input
          id="article-title"
          v-model="form.title"
          maxlength="255"
          required
          placeholder="Ví dụ: Nhận biết và phòng bệnh trên cây lúa"
        /><label for="article-subtitle">Mô tả ngắn</label
        ><textarea
          id="article-subtitle"
          v-model="form.subtitle"
          maxlength="255"
          rows="2"
        /><label>Nội dung</label
        ><NewsEditor
          ref="editor"
          v-model="form.content"
          :disabled="busy"
          @image="fileInput.click()"
        />
        <p class="muted">
          Chọn H2/H3 để chia mục. Bấm dấu × ở góc phải ảnh để gỡ ảnh khỏi nội
          dung; ảnh vẫn còn trong thư viện và có thể chèn lại.
        </p>
      </section>
      <aside class="stack">
        <section class="panel">
          <h2>Xuất bản</h2>
          <label>Trạng thái</label
          ><select v-model="form.status">
            <option value="draft">Bản nháp</option>
            <option value="published">Xuất bản</option>
            <option value="hidden">Ẩn bài</option></select
          ><label v-if="form.status === 'published'">Thời gian xuất bản</label
          ><input
            v-if="form.status === 'published'"
            v-model="form.published_at"
            type="datetime-local"
          />
          <p class="muted" v-if="form.status === 'published'">
            Để trống để đăng ngay; chọn thời gian tương lai để hẹn đăng.
          </p>
          <div class="row" style="margin-top: 18px">
            <button class="primary" :disabled="busy">
              {{ busy ? "Đang xử lý…" : "Lưu bài" }}</button
            ><button type="button" @click="preview = true">Xem trước</button>
          </div>
          <button
            v-if="form.status === 'draft'"
            type="button"
            style="margin-top: 10px"
            :disabled="busy"
            @click="save('published')"
          >
            Xuất bản ngay
          </button>
        </section>
        <section class="panel">
          <h2>Ảnh bìa</h2>
          <input
            id="article-cover-image"
            ref="coverFileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            @change="upload($event, 'cover')"
          />
          <img
            v-if="coverImage"
            :src="coverImage.image_url"
            :alt="form.title || 'Ảnh bìa bài viết'"
            class="news-cover-preview"
          />
          <div class="row">
            <button
              type="button"
              :disabled="busy || !auth.hasPermission('article.update')"
              @click="coverFileInput.click()"
            >
              {{ coverImage ? "Thay ảnh bìa" : "Thêm ảnh bìa" }}
            </button>
            <button
              v-if="form.cover_id !== null"
              type="button"
              :disabled="busy"
              @click="form.cover_id = null"
            >
              Bỏ ảnh bìa
            </button>
          </div>
          <p class="muted">
            Chọn ảnh bìa riêng cho bài viết. JPG, PNG, WebP · tối đa 4 MB.
          </p>
        </section>
        <section class="panel">
          <h2>Ảnh bài viết</h2>
          <input
            id="article-inline-image"
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            @change="upload"
          /><button
            type="button"
            :disabled="busy || !auth.hasPermission('article.update')"
            @click="fileInput.click()"
          >
            Tải ảnh & chèn vào bài
          </button>
          <p class="muted">
            JPG, PNG, WebP · tối đa 4 MB. Bài mới sẽ được lưu nháp trước khi tải
            ảnh.
          </p>
          <div class="thumbs">
            <div v-for="image in images" :key="image.id">
              <img :src="image.image_url" alt="Ảnh trong thư viện" />
              <div class="row">
                <button type="button" @click="form.cover_id = image.id">
                  {{
                    form.cover_id === image.id ? "✓ Ảnh bìa" : "Đặt bìa"
                  }}</button
                ><button
                  type="button"
                  @click="editor.insertImage(image.image_url, '')"
                >
                  Chèn</button
                ><button type="button" @click="removeImage(image)">Xóa</button>
              </div>
            </div>
          </div>
        </section>
        <section class="panel">
          <h2>Chủ đề & tìm kiếm</h2>
          <label>Tag, cách nhau bằng dấu phẩy</label
          ><input
            v-model="form.tagsText"
            placeholder="Lúa, Sâu bệnh, Kỹ thuật"
          /><label>Slug</label
          ><input
            v-model="form.slug"
            maxlength="255"
            placeholder="Tự tạo khi lưu"
          /><label>Tiêu đề SEO</label
          ><input v-model="form.meta_title" maxlength="255" /><label
            >Mô tả SEO</label
          ><textarea v-model="form.meta_description" maxlength="500" rows="3" />
        </section>
      </aside>
    </form>
    <ArticlePreviewModal v-model:open="preview">
      <article>
        <h1>{{ form.title }}</h1>
        <p>{{ form.subtitle }}</p>
        <ArticleBody :content="form.content" toc />
      </article>
    </ArticlePreviewModal>
  </div>
</template>