import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import ProductService from "@/services/product.service";

export const useProductStore = defineStore("product", () => {
  const products = ref([]);
  const categories = ref([]);
  const subcategories = ref([]);
  const origins = ref([]);

  const selectedProduct = ref(null);

  const loading = ref(false);
  const loadingOptions = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const showProductModal = ref(false);

  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const filters = reactive({
    search: "",
    category_id: "",
    subcategory_id: "",
    origin_id: "",
    is_show: "",
    per_page: 15,
    page: 1,
  });

  const form = reactive({
    category_id: "",
    subcategory_id: "",
    origin_id: "",
    product_name: "",
    description: "",
    usage_instructions: "",
    safety_warning: "",
    is_show: true,
    primary_image_index: 0,
    images: [],
    variants: [
      {
        variant_name: "",
        packages: [
          {
            sku: "",
            size: "",
            unit: "piece",
            price: "",
            quantity_available: "",
            barcode: "",
            box_barcode: "",
          },
        ],
      },
    ],
  });

  const message = ref("");
  const errorMsg = ref("");

  const errors = reactive({});

  const totalProducts = computed(() => products.value.length);

  const visibleProducts = computed(() => {
    return products.value.filter((product) => product.is_show);
  });

  const hiddenProducts = computed(() => {
    return products.value.filter((product) => !product.is_show);
  });

  const lowStockProducts = computed(() => {
    return products.value.filter(
      (product) => Number(product.total_stock || 0) < 5,
    );
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

  function resetForm() {
    selectedProduct.value = null;

    form.category_id = "";
    form.subcategory_id = "";
    form.origin_id = "";
    form.product_name = "";
    form.description = "";
    form.usage_instructions = "";
    form.safety_warning = "";
    form.is_show = true;
    form.primary_image_index = 0;
    form.images = [];
    form.variants = [
      {
        variant_name: "",
        packages: [
          {
            sku: "",
            size: "",
            unit: "piece",
            price: "",
            quantity_available: "",
            barcode: "",
            box_barcode: "",
          },
        ],
      },
    ];

    clearMessages();
  }

  function openCreateModal() {
    resetForm();
    showProductModal.value = true;
  }

  function closeModal() {
    showProductModal.value = false;
    resetForm();
  }

  async function openEditModal(product) {
    loading.value = true;
    clearMessages();

    try {
      const response = await ProductService.getProduct(product.id);
      const data = response.data?.data || null;

      if (!data) {
        throw new Error("Không lấy được chi tiết sản phẩm.");
      }

      selectedProduct.value = data;

      form.category_id = data.category_id || "";
      form.subcategory_id = data.subcategory_id || "";
      form.origin_id = data.origin_id || "";
      form.product_name = data.product_name || "";
      form.description = data.description || "";
      form.usage_instructions = data.usage_instructions || "";
      form.safety_warning = data.safety_warning || "";
      form.is_show = !!data.is_show;
      form.primary_image_index = 0;
      form.images = [];

      form.variants = data.variants?.length
        ? data.variants.map((variant) => ({
            variant_name: variant.variant_name || "",
            packages: variant.packages?.length
              ? variant.packages.map((pkg) => ({
                  sku: pkg.sku || "",
                  size: pkg.size || "",
                  unit: pkg.unit || "piece",
                  price: pkg.price || "",
                  quantity_available: pkg.quantity_available || "",
                  barcode: pkg.barcode || "",
                  box_barcode: pkg.box_barcode || "",
                }))
              : [
                  {
                    sku: "",
                    size: "",
                    unit: "piece",
                    price: "",
                    quantity_available: "",
                    barcode: "",
                    box_barcode: "",
                  },
                ],
          }))
        : [
            {
              variant_name: "",
              packages: [
                {
                  sku: "",
                  size: "",
                  unit: "piece",
                  price: "",
                  quantity_available: "",
                  barcode: "",
                  box_barcode: "",
                },
              ],
            },
          ];

      await fetchSubcategories(form.category_id);

      showProductModal.value = true;
    } catch (error) {
      setErrors(error);
    } finally {
      loading.value = false;
    }
  }

  function addVariant() {
    form.variants.push({
      variant_name: "",
      packages: [
        {
          sku: "",
          size: "",
          unit: "piece",
          price: "",
          quantity_available: "",
          barcode: "",
          box_barcode: "",
        },
      ],
    });
  }

  function removeVariant(index) {
    if (form.variants.length <= 1) {
      return;
    }

    form.variants.splice(index, 1);
  }

  function addPackage(variantIndex) {
    form.variants[variantIndex].packages.push({
      sku: "",
      size: "",
      unit: "piece",
      price: "",
      quantity_available: "",
      barcode: "",
      box_barcode: "",
    });
  }

  function removePackage(variantIndex, packageIndex) {
    const packages = form.variants[variantIndex].packages;

    if (packages.length <= 1) {
      return;
    }

    packages.splice(packageIndex, 1);
  }

  function setImages(files) {
    form.images = Array.from(files || []);
  }

  function buildFormData() {
    const formData = new FormData();

    formData.append("category_id", form.category_id);
    formData.append("subcategory_id", form.subcategory_id);
    formData.append("origin_id", form.origin_id);
    formData.append("product_name", form.product_name);
    formData.append("description", form.description || "");
    formData.append("usage_instructions", form.usage_instructions || "");
    formData.append("safety_warning", form.safety_warning || "");
    formData.append("is_show", form.is_show ? "1" : "0");
    formData.append(
      "primary_image_index",
      String(form.primary_image_index || 0),
    );

    if (selectedProduct.value && form.images.length > 0) {
      formData.append("replace_images", "1");
    }

    form.images.forEach((file) => {
      formData.append("images[]", file);
    });

    formData.append("variants", JSON.stringify(form.variants));

    return formData;
  }

  async function fetchProducts() {
    loading.value = true;
    clearMessages();

    try {
      const response = await ProductService.getProducts(filters);

      products.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || products.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOptions() {
    loadingOptions.value = true;
    clearMessages();

    try {
      const [categoriesResponse, originsResponse] = await Promise.all([
        ProductService.getCategories(),
        ProductService.getOrigins({
          per_page: 100,
        }),
      ]);

      categories.value = categoriesResponse.data?.data || [];
      origins.value = originsResponse.data?.data || [];

      return {
        categories: categoriesResponse,
        origins: originsResponse,
      };
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingOptions.value = false;
    }
  }

  async function fetchSubcategories(categoryId = "") {
    if (!categoryId) {
      subcategories.value = [];
      return;
    }

    try {
      const response = await ProductService.getSubcategories({
        category_id: categoryId,
      });

      subcategories.value = response.data?.data || [];

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }

  async function loadData() {
    await Promise.all([fetchProducts(), fetchOptions()]);
  }

  async function saveProduct() {
    saving.value = true;
    clearMessages();

    try {
      const formData = buildFormData();

      let response;

      if (selectedProduct.value) {
        response = await ProductService.updateProduct(
          selectedProduct.value.id,
          formData,
        );
        message.value =
          response.data?.message || "Cập nhật sản phẩm thành công.";
      } else {
        response = await ProductService.createProduct(formData);
        message.value = response.data?.message || "Tạo sản phẩm thành công.";
      }

      await fetchProducts();
      closeModal();

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteProduct(product) {
    deleting.value = true;
    clearMessages();

    try {
      const response = await ProductService.deleteProduct(product.id);

      message.value = response.data?.message || "Xóa sản phẩm thành công.";

      await fetchProducts();

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  function setPage(page) {
    filters.page = page;
    fetchProducts();
  }

  function resetFilters() {
    filters.search = "";
    filters.category_id = "";
    filters.subcategory_id = "";
    filters.origin_id = "";
    filters.is_show = "";
    filters.page = 1;
  }

  return {
    products,
    categories,
    subcategories,
    origins,

    selectedProduct,

    loading,
    loadingOptions,
    saving,
    deleting,

    showProductModal,

    meta,
    filters,
    form,

    message,
    errorMsg,
    errors,

    totalProducts,
    visibleProducts,
    hiddenProducts,
    lowStockProducts,

    clearMessages,
    resetForm,
    openCreateModal,
    closeModal,
    openEditModal,

    addVariant,
    removeVariant,
    addPackage,
    removePackage,
    setImages,

    fetchProducts,
    fetchOptions,
    fetchSubcategories,
    loadData,
    saveProduct,
    deleteProduct,

    setPage,
    resetFilters,
  };
});
