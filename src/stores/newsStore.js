import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import NewsService from "@/services/news.service";

export const useNewsStore = defineStore("news", () => {
  const news = ref([]);
  const selectedNews = ref(null);

  const loading = ref(false);
  const loadingDetail = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const showModal = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const statusCounts = reactive({
    all: 0,
    published: 0,
    draft: 0,
    hidden: 0,
  });

  const filters = reactive({
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    title: "",
    subtitle: "",
    content: "",
    slug: "",

    title_image: null,
    title_image_url: "",
    remove_title_image: false,

    images: [],
    existing_images: [],
    deleted_image_ids: [],

    status: "draft",
    published_at: "",

    meta_title: "",
    meta_description: "",

    tag_names_text: "",
  });

  const publishedNews = computed(() => {
    return news.value.filter((item) => item.status === "published");
  });

  const draftNews = computed(() => {
    return news.value.filter((item) => item.status === "draft");
  });

  function clearMessages() {
    message.value = "";
    errorMsg.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function setErrors(error) {
    clearMessages();

    const responseErrors = error.response?.data?.errors || {};

    Object.keys(responseErrors).forEach((key) => {
      errors[key] = responseErrors[key]?.[0] || "";
    });

    errorMsg.value =
      error.response?.data?.message ||
      Object.values(errors)[0] ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  function resetFilters() {
    filters.search = "";
    filters.status = "";
    filters.date_from = "";
    filters.date_to = "";
    filters.page = 1;
  }

  function resetForm() {
    form.title = "";
    form.subtitle = "";
    form.content = "";
    form.slug = "";

    form.title_image = null;
    form.title_image_url = "";
    form.remove_title_image = false;

    form.images = [];
    form.existing_images = [];
    form.deleted_image_ids = [];

    form.status = "draft";
    form.published_at = "";

    form.meta_title = "";
    form.meta_description = "";

    form.tag_names_text = "";

    selectedNews.value = null;

    clearMessages();
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function generateSlugFromTitle() {
    if (!form.slug && form.title) {
      form.slug = slugify(form.title);
    }
  }

  function tagNamesArray() {
    return String(form.tag_names_text || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function buildFormData() {
    const data = new FormData();

    data.append("title", form.title);
    data.append("subtitle", form.subtitle || "");
    data.append("content", form.content || "");
    data.append("slug", form.slug || "");

    data.append("meta_title", form.meta_title || "");
    data.append("meta_description", form.meta_description || "");

    data.append("is_draft", form.status === "draft" ? "1" : "0");
    data.append("is_published", form.status === "published" ? "1" : "0");

    if (form.published_at) {
      data.append("published_at", form.published_at);
    }

    if (form.title_image) {
      data.append("title_image", form.title_image);
    }

    if (form.remove_title_image) {
      data.append("remove_title_image", "1");
    }

    form.images.forEach((image) => {
      data.append("images[]", image);
    });

    form.deleted_image_ids.forEach((id) => {
      data.append("deleted_image_ids[]", id);
    });

    tagNamesArray().forEach((tag) => {
      data.append("tag_names[]", tag);
    });

    return data;
  }

  async function fetchNews() {
    loading.value = true;
    clearMessages();

    try {
      const response = await NewsService.getNews({
        search: filters.search || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      news.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || news.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatusCounts() {
    try {
      const response = await NewsService.getStatusCounts();
      const data = response.data?.data || {};

      statusCounts.all = data.all || 0;
      statusCounts.published = data.published || 0;
      statusCounts.draft = data.draft || 0;
      statusCounts.hidden = data.hidden || 0;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }

  async function loadData() {
    loading.value = true;
    clearMessages();

    try {
      await Promise.all([fetchNews(), fetchStatusCounts()]);
    } catch (error) {
      setErrors(error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchNewsDetail(id) {
    loadingDetail.value = true;
    clearMessages();

    try {
      const response = await NewsService.getNewsDetail(id);

      selectedNews.value = response.data?.data || null;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingDetail.value = false;
    }
  }

  function openCreateModal() {
    resetForm();
    showModal.value = true;
  }

  async function openEditModal(item) {
    resetForm();

    showModal.value = true;
    selectedNews.value = item;

    await fetchNewsDetail(item.id);

    const detail = selectedNews.value || item;

    form.title = detail.title || "";
    form.subtitle = detail.subtitle || "";
    form.content = detail.content || "";
    form.slug = detail.slug || "";

    form.title_image_url = detail.title_image_url || "";
    form.remove_title_image = false;

    form.existing_images = detail.images || [];
    form.deleted_image_ids = [];
    form.images = [];

    form.status = detail.status || "draft";

    form.published_at = detail.published_at
      ? String(detail.published_at).slice(0, 16).replace(" ", "T")
      : "";

    form.meta_title = detail.meta_title || "";
    form.meta_description = detail.meta_description || "";

    form.tag_names_text = Array.isArray(detail.tag_names)
      ? detail.tag_names.join(", ")
      : "";
  }

  function closeModal() {
    showModal.value = false;
    resetForm();
  }

  function markDeleteImage(imageId) {
    if (!form.deleted_image_ids.includes(imageId)) {
      form.deleted_image_ids.push(imageId);
    }

    form.existing_images = form.existing_images.filter(
      (image) => image.id !== imageId,
    );
  }

  function removeSelectedImage(index) {
    form.images.splice(index, 1);
  }

  async function saveNews() {
    saving.value = true;
    clearMessages();

    try {
      generateSlugFromTitle();

      const data = buildFormData();

      const response = selectedNews.value
        ? await NewsService.updateNews(selectedNews.value.id, data)
        : await NewsService.createNews(data);

      message.value =
        response.data?.message ||
        (selectedNews.value
          ? "Cập nhật bài viết thành công."
          : "Tạo bài viết thành công.");

      await Promise.all([fetchNews(), fetchStatusCounts()]);

      closeModal();

      message.value =
        response.data?.message ||
        (selectedNews.value
          ? "Cập nhật bài viết thành công."
          : "Tạo bài viết thành công.");

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteNews(item) {
    deleting.value = true;
    clearMessages();

    try {
      const response = await NewsService.deleteNews(item.id);

      message.value = response.data?.message || "Xóa bài viết thành công.";

      await Promise.all([fetchNews(), fetchStatusCounts()]);

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  async function publishNews(item) {
    resetForm();

    selectedNews.value = item;

    form.title = item.title || "";
    form.subtitle = item.subtitle || "";
    form.content = item.content || "";
    form.slug = item.slug || "";
    form.status = "published";
    form.published_at = item.published_at
      ? String(item.published_at).slice(0, 16).replace(" ", "T")
      : "";
    form.meta_title = item.meta_title || "";
    form.meta_description = item.meta_description || "";
    form.tag_names_text = Array.isArray(item.tag_names)
      ? item.tag_names.join(", ")
      : "";

    return saveNews();
  }

  function setPage(page) {
    filters.page = page;
    fetchNews();
  }

  return {
    news,
    selectedNews,

    loading,
    loadingDetail,
    saving,
    deleting,

    showModal,

    message,
    errorMsg,
    errors,

    meta,
    statusCounts,
    filters,
    form,

    publishedNews,
    draftNews,

    clearMessages,
    setErrors,
    fieldError,

    resetFilters,
    resetForm,

    slugify,
    generateSlugFromTitle,

    fetchNews,
    fetchStatusCounts,
    loadData,
    fetchNewsDetail,

    openCreateModal,
    openEditModal,
    closeModal,

    markDeleteImage,
    removeSelectedImage,

    saveNews,
    deleteNews,
    publishNews,

    setPage,
  };
});
