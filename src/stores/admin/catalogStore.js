import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import CatalogService from "@/services/catalog.service";

export const useCatalogStore = defineStore("catalog", () => {
  const activeTab = ref("categories");

  const categories = ref([]);
  const subcategories = ref([]);
  const origins = ref([]);

  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const showModal = ref(false);
  const modalType = ref("category");
  const selectedItem = ref(null);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const filters = reactive({
    categorySearch: "",
    subcategorySearch: "",
    subcategoryCategoryId: "",
    originSearch: "",
  });

  const categoryForm = reactive({
    category_name: "",
    category_description: "",
  });

  const subcategoryForm = reactive({
    category_id: "",
    subcategory_name: "",
  });

  const originForm = reactive({
    origin_name: "",
    origin_image: null,
    preview: "",
  });

  const totalCategories = computed(() => categories.value.length);
  const totalSubcategories = computed(() => subcategories.value.length);
  const totalOrigins = computed(() => origins.value.length);

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

  function resetCategoryForm() {
    categoryForm.category_name = "";
    categoryForm.category_description = "";
  }

  function resetSubcategoryForm() {
    subcategoryForm.category_id = "";
    subcategoryForm.subcategory_name = "";
  }

  function resetOriginForm() {
    originForm.origin_name = "";
    originForm.origin_image = null;
    originForm.preview = "";
  }

  function resetForms() {
    resetCategoryForm();
    resetSubcategoryForm();
    resetOriginForm();
  }

  function openCreateModal(type) {
    clearMessages();
    resetForms();

    selectedItem.value = null;
    modalType.value = type;
    showModal.value = true;
  }

  function openEditModal(type, item) {
    clearMessages();
    resetForms();

    selectedItem.value = item;
    modalType.value = type;

    if (type === "category") {
      categoryForm.category_name = item.category_name || item.name || "";
      categoryForm.category_description =
        item.category_description || item.description || "";
    }

    if (type === "subcategory") {
      subcategoryForm.category_id = item.category_id || "";
      subcategoryForm.subcategory_name =
        item.subcategory_name || item.name || "";
    }

    if (type === "origin") {
      originForm.origin_name = item.origin_name || "";
      originForm.origin_image = null;
      originForm.preview = item.origin_image || "";
    }

    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
    selectedItem.value = null;
    resetForms();
    clearMessages();
  }

  function setOriginImage(file) {
    originForm.origin_image = file || null;

    if (originForm.preview && originForm.preview.startsWith("blob:")) {
      URL.revokeObjectURL(originForm.preview);
    }

    originForm.preview = file ? URL.createObjectURL(file) : "";
  }

  function buildOriginFormData() {
    const formData = new FormData();

    formData.append("origin_name", originForm.origin_name);

    if (originForm.origin_image) {
      formData.append("origin_image", originForm.origin_image);
    }

    return formData;
  }

  async function fetchCategories() {
    const response = await CatalogService.getCategories({
      search: filters.categorySearch || undefined,
    });

    categories.value = response.data?.data || [];

    return response;
  }

  async function fetchSubcategories() {
    const response = await CatalogService.getSubcategories({
      search: filters.subcategorySearch || undefined,
      category_id: filters.subcategoryCategoryId || undefined,
    });

    subcategories.value = response.data?.data || [];

    return response;
  }

  async function fetchOrigins() {
    const response = await CatalogService.getOrigins({
      search: filters.originSearch || undefined,
      per_page: 100,
    });

    origins.value = response.data?.data || [];

    return response;
  }

  async function loadData() {
    loading.value = true;
    clearMessages();

    try {
      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchOrigins(),
      ]);
    } catch (error) {
      setErrors(error);
    } finally {
      loading.value = false;
    }
  }

  async function saveCategory() {
    if (selectedItem.value) {
      const response = await CatalogService.updateCategory(
        selectedItem.value.id,
        {
          category_name: categoryForm.category_name,
          category_description: categoryForm.category_description,
        },
      );

      message.value = response.data?.message || "Cập nhật danh mục thành công.";
      return response;
    }

    const response = await CatalogService.createCategory({
      category_name: categoryForm.category_name,
      category_description: categoryForm.category_description,
    });

    message.value = response.data?.message || "Thêm danh mục thành công.";
    return response;
  }

  async function saveSubcategory() {
    const payload = {
      category_id: subcategoryForm.category_id,
      subcategory_name: subcategoryForm.subcategory_name,
    };

    if (selectedItem.value) {
      const response = await CatalogService.updateSubcategory(
        selectedItem.value.id,
        payload,
      );

      message.value =
        response.data?.message || "Cập nhật danh mục con thành công.";

      return response;
    }

    const response = await CatalogService.createSubcategory(payload);

    message.value = response.data?.message || "Thêm danh mục con thành công.";
    return response;
  }

  async function saveOrigin() {
    const formData = buildOriginFormData();

    if (selectedItem.value) {
      const response = await CatalogService.updateOrigin(
        selectedItem.value.id,
        formData,
      );

      message.value = response.data?.message || "Cập nhật xuất xứ thành công.";
      return response;
    }

    const response = await CatalogService.createOrigin(formData);

    message.value = response.data?.message || "Thêm xuất xứ thành công.";
    return response;
  }

  async function saveItem() {
    saving.value = true;
    clearMessages();

    try {
      let successMessage = "";

      if (modalType.value === "category") {
        await saveCategory();
        successMessage = message.value || "Lưu danh mục thành công.";
      }

      if (modalType.value === "subcategory") {
        await saveSubcategory();
        successMessage = message.value || "Lưu danh mục con thành công.";
      }

      if (modalType.value === "origin") {
        await saveOrigin();
        successMessage = message.value || "Lưu xuất xứ thành công.";
      }

      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchOrigins(),
      ]);

      showModal.value = false;
      selectedItem.value = null;
      resetForms();

      message.value = successMessage;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteItem(type, item) {
    deleting.value = true;
    clearMessages();

    try {
      let response;
      let successMessage = "";

      if (type === "category") {
        response = await CatalogService.deleteCategory(item.id);
        successMessage = response.data?.message || "Xóa danh mục thành công.";
      }

      if (type === "subcategory") {
        response = await CatalogService.deleteSubcategory(item.id);
        successMessage =
          response.data?.message || "Xóa danh mục con thành công.";
      }

      if (type === "origin") {
        response = await CatalogService.deleteOrigin(item.id);
        successMessage = response.data?.message || "Xóa xuất xứ thành công.";
      }

      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchOrigins(),
      ]);

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  return {
    activeTab,

    categories,
    subcategories,
    origins,

    loading,
    saving,
    deleting,

    showModal,
    modalType,
    selectedItem,

    message,
    errorMsg,
    errors,

    filters,

    categoryForm,
    subcategoryForm,
    originForm,

    totalCategories,
    totalSubcategories,
    totalOrigins,

    clearMessages,
    fieldError,

    openCreateModal,
    openEditModal,
    closeModal,

    setOriginImage,

    fetchCategories,
    fetchSubcategories,
    fetchOrigins,
    loadData,

    saveItem,
    deleteItem,
  };
});
