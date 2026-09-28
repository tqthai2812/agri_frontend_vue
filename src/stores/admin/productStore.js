import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import ProductService from "@/services/admin/product.service";

function booleanValue(value) {
  return value === true || value === 1 || value === "1";
}

function newPackage() {
  return {
    sku: "",
    size: "",
    unit: "piece",
    price: "",
    quantity_available: 0,
    reorder_level: 5,
    barcode: "",
    box_barcode: "",
  };
}

function newVariant() {
  return {
    variant_name: "",
    packages: [newPackage()],
  };
}

function initialForm() {
  return {
    category_id: "",
    subcategory_id: "",
    origin_id: "",
    product_name: "",
    brand: "",
    description: "",
    usage_instructions: "",
    safety_warning: "",
    is_show: true,
    primary_image_index: 0,
    images: [],
    variants: [newVariant()],
  };
}

function formError(field, message) {
  const error = new Error(message);

  error.response = {
    data: {
      message,
      errors: {
        [field]: [message],
      },
    },
  };

  return error;
}

export const useProductStore = defineStore("product", () => {
  const products = ref([]);
  const categories = ref([]);
  const subcategories = ref([]);
  const filterSubcategories = ref([]);
  const origins = ref([]);
  const selectedProduct = ref(null);

  const loadingList = ref(false);
  const loadingDetail = ref(false);
  const loading = computed(() => loadingList.value || loadingDetail.value);

  const loadingOptions = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const showProductModal = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

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

  const form = reactive(initialForm());

  let listRequestId = 0;
  let detailRequestId = 0;
  const subcategoryRequestIds = {
    form: 0,
    filter: 0,
  };

  const totalProducts = computed(() => meta.total);

  const visibleProducts = computed(() =>
    products.value.filter((product) => booleanValue(product.is_show)),
  );

  const hiddenProducts = computed(() =>
    products.value.filter((product) => !booleanValue(product.is_show)),
  );

  function isLowStock(product) {
    const packages = (product.variants || []).flatMap(
      (variant) => variant.packages || [],
    );

    return packages.some(
      (pkg) =>
        Number(pkg.quantity_available ?? 0) < Number(pkg.reorder_level ?? 5),
    );
  }

  const lowStockProducts = computed(() => products.value.filter(isLowStock));

  function clearErrors() {
    errorMsg.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function clearMessages() {
    message.value = "";
    clearErrors();
  }

  function setErrors(error) {
    clearErrors();

    const responseErrors = error.response?.data?.errors || {};

    Object.entries(responseErrors).forEach(([key, value]) => {
      errors[key] = Array.isArray(value) ? value[0] || "" : String(value || "");
    });

    errorMsg.value =
      Object.values(errors)[0] ||
      error.response?.data?.message ||
      error.message ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  function resetForm() {
    detailRequestId++;
    loadingDetail.value = false;

    selectedProduct.value = null;
    Object.assign(form, initialForm());

    subcategoryRequestIds.form++;
    subcategories.value = [];

    clearMessages();
  }

  function openCreateModal() {
    if (saving.value) return;

    resetForm();
    showProductModal.value = true;
  }

  function closeModal() {
    if (saving.value) return;

    showProductModal.value = false;
    resetForm();
  }

  async function openEditModal(product) {
    if (saving.value) return;

    resetForm();

    const requestId = ++detailRequestId;
    loadingDetail.value = true;

    try {
      const response = await ProductService.getProduct(product.id);

      if (requestId !== detailRequestId) return;

      const data = response.data?.data;

      if (!data?.id || !Array.isArray(data.variants)) {
        throw new Error("API chưa trả đủ thông tin sản phẩm và biến thể.");
      }

      // Thiếu ID sẽ khiến backend hiểu dữ liệu cũ là dữ liệu tạo mới.
      for (const variant of data.variants) {
        if (!variant.id || !Array.isArray(variant.packages)) {
          throw new Error("API chưa trả đủ ID biến thể hoặc quy cách.");
        }

        if (variant.packages.some((pkg) => !pkg.id)) {
          throw new Error("API chưa trả ID quy cách sản phẩm.");
        }
      }

      selectedProduct.value = data;

      Object.assign(form, {
        category_id: data.category_id ?? "",
        subcategory_id: data.subcategory_id ?? "",
        origin_id: data.origin_id ?? "",
        product_name: data.product_name ?? data.name ?? "",
        brand: data.brand ?? "",
        description: data.description ?? "",
        usage_instructions: data.usage_instructions ?? "",
        safety_warning: data.safety_warning ?? "",
        is_show: booleanValue(data.is_show),
        primary_image_index: 0,
        images: [],
        variants: data.variants.length
          ? data.variants.map((variant) => ({
              id: variant.id,
              variant_name: variant.variant_name ?? variant.name ?? "",
              packages: variant.packages.length
                ? variant.packages.map((pkg) => ({
                    id: pkg.id,
                    sku: pkg.sku ?? "",
                    size: pkg.size ?? "",
                    unit: pkg.unit ?? "piece",
                    price: pkg.price ?? "",
                    quantity_available: pkg.quantity_available ?? 0,
                    reorder_level: pkg.reorder_level ?? 5,
                    barcode: pkg.barcode ?? "",
                    box_barcode: pkg.box_barcode ?? "",
                  }))
                : [newPackage()],
            }))
          : [newVariant()],
      });

      await fetchSubcategories(form.category_id);

      if (requestId === detailRequestId) {
        showProductModal.value = true;
      }
    } catch (error) {
      if (requestId === detailRequestId) {
        setErrors(error);
      }
    } finally {
      if (requestId === detailRequestId) {
        loadingDetail.value = false;
      }
    }
  }

  function addVariant() {
    if (!saving.value) {
      form.variants.push(newVariant());
    }
  }

  function removeVariant(index) {
    if (saving.value || form.variants.length <= 1) return;

    form.variants.splice(index, 1);
  }

  function addPackage(variantIndex) {
    if (saving.value) return;

    form.variants[variantIndex]?.packages.push(newPackage());
  }

  function removePackage(variantIndex, packageIndex) {
    const packages = form.variants[variantIndex]?.packages;

    if (saving.value || !packages || packages.length <= 1) return;

    packages.splice(packageIndex, 1);
  }

  function setImages(files) {
    if (saving.value) return;

    form.images = Array.from(files || []);
    form.primary_image_index = 0;
  }

  function serializeVariants() {
    const originalPackages = new Map(
      (selectedProduct.value?.variants || []).flatMap((variant) =>
        (variant.packages || []).map((pkg) => [String(pkg.id), pkg]),
      ),
    );

    return form.variants.map((variant, variantIndex) => {
      const result = {
        variant_name: variant.variant_name,
        packages: variant.packages.map((pkg, packageIndex) => {
          const original = pkg.id ? originalPackages.get(String(pkg.id)) : null;

          if (pkg.id && !original) {
            throw formError(
              `variants.${variantIndex}.packages.${packageIndex}.id`,
              "Quy cách không thuộc sản phẩm đang sửa. Hãy tải lại sản phẩm.",
            );
          }

          const originalQuantity = Number(original?.quantity_available ?? 0);

          // Không âm thầm bỏ qua việc người dùng sửa tồn kho
          // trong modal cũ.
          if (Number(pkg.quantity_available ?? 0) !== originalQuantity) {
            throw formError(
              `variants.${variantIndex}.packages.${packageIndex}.quantity_available`,
              "Tồn kho được cập nhật qua nhập/xuất kho. Không sửa trực tiếp tại sản phẩm.",
            );
          }

          const packageData = {
            sku: pkg.sku,
            size: pkg.size,
            unit: pkg.unit,
            price: pkg.price,
            reorder_level: pkg.reorder_level ?? 5,
            barcode: pkg.barcode || null,
            box_barcode: pkg.box_barcode || null,
          };

          if (pkg.id) {
            packageData.id = pkg.id;
          }

          // Không gửi quantity_available để tránh gửi tồn kho cũ
          // khi có đơn hàng hoặc phiếu kho phát sinh lúc đang mở form.
          return packageData;
        }),
      };

      if (variant.id) {
        result.id = variant.id;
      }

      return result;
    });
  }

  function buildFormData() {
    if (form.images.length > 8) {
      throw formError("images", "Chỉ được tải lên tối đa 8 ảnh.");
    }

    const formData = new FormData();

    [
      "category_id",
      "subcategory_id",
      "origin_id",
      "product_name",
      "brand",
      "description",
      "usage_instructions",
      "safety_warning",
    ].forEach((key) => {
      formData.append(key, String(form[key] ?? ""));
    });

    formData.append("is_show", form.is_show ? "1" : "0");

    // Không gửi primary_image_index khi không tải ảnh mới.
    if (form.images.length) {
      const primaryIndex = Number(form.primary_image_index);

      if (
        !Number.isInteger(primaryIndex) ||
        primaryIndex < 0 ||
        primaryIndex >= form.images.length
      ) {
        throw formError(
          "primary_image_index",
          "Vui lòng chọn ảnh đại diện trong danh sách ảnh mới.",
        );
      }

      formData.append("primary_image_index", String(primaryIndex));

      if (selectedProduct.value) {
        formData.append("replace_images", "1");
      }

      form.images.forEach((file) => {
        formData.append("images[]", file);
      });
    }

    formData.append("variants", JSON.stringify(serializeVariants()));

    return formData;
  }

  async function fetchProducts({ preserveMessages = false } = {}) {
    const requestId = ++listRequestId;
    loadingList.value = true;

    if (!preserveMessages) {
      clearMessages();
    }

    try {
      const response = await ProductService.getProducts({ ...filters });

      if (requestId !== listRequestId) return response;

      products.value = (response.data?.data || []).map((product) => ({
        ...product,
        is_show: booleanValue(product.is_show),
      }));

      const responseMeta = response.data?.meta || {};

      meta.current_page = Number(responseMeta.current_page ?? 1);
      meta.last_page = Number(responseMeta.last_page ?? 1);
      meta.per_page = Number(responseMeta.per_page ?? filters.per_page);
      meta.total = Number(responseMeta.total ?? products.value.length);

      return response;
    } catch (error) {
      if (requestId === listRequestId) {
        setErrors(error);
      }

      throw error;
    } finally {
      if (requestId === listRequestId) {
        loadingList.value = false;
      }
    }
  }

  // Đọc hết các trang lựa chọn khi API có phân trang.
  async function fetchAllOptions(fetcher, params = {}) {
    const items = [];
    let page = 1;
    let lastPage = 1;

    do {
      const response = await fetcher({
        ...params,
        per_page: 100,
        page,
      });

      const body = response.data;
      const rows = Array.isArray(body) ? body : body?.data;

      if (!Array.isArray(rows)) {
        throw new Error("Dữ liệu danh mục/xuất xứ trả về không hợp lệ.");
      }

      items.push(...rows);

      lastPage = Number(body?.meta?.last_page ?? body?.last_page ?? 1);
      page++;
    } while (page <= lastPage);

    return [...new Map(items.map((item) => [item.id, item])).values()];
  }

  async function fetchOptions() {
    loadingOptions.value = true;

    try {
      const [categoryRows, originRows] = await Promise.all([
        fetchAllOptions((params) => ProductService.getCategories(params)),
        fetchAllOptions((params) => ProductService.getOrigins(params)),
      ]);

      categories.value = categoryRows.map((item) => ({
        ...item,
        name: item.name ?? item.category_name ?? "",
      }));

      origins.value = originRows.map((item) => ({
        ...item,
        origin_name: item.origin_name ?? item.name ?? "",
      }));

      return {
        categories: categories.value,
        origins: origins.value,
      };
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingOptions.value = false;
    }
  }

  async function fetchSubcategories(categoryId = "", target = "form") {
    const scope = target === "filter" ? "filter" : "form";
    const destination =
      scope === "filter" ? filterSubcategories : subcategories;

    const requestId = ++subcategoryRequestIds[scope];
    destination.value = [];

    if (!categoryId) return;

    try {
      const rows = await fetchAllOptions(
        (params) => ProductService.getSubcategories(params),
        { category_id: categoryId },
      );

      if (requestId !== subcategoryRequestIds[scope]) return;

      destination.value = rows.map((item) => ({
        ...item,
        name: item.name ?? item.subcategory_name ?? "",
      }));

      return destination.value;
    } catch (error) {
      if (requestId === subcategoryRequestIds[scope]) {
        setErrors(error);
      }

      throw error;
    }
  }

  async function loadData() {
    clearMessages();

    // Đợi tất cả hoàn tất, kể cả khi một request lỗi.
    const results = await Promise.allSettled([
      fetchProducts({ preserveMessages: true }),
      fetchOptions(),
      fetchSubcategories(filters.category_id, "filter"),
    ]);

    const failed = results.find((result) => result.status === "rejected");

    if (failed) throw failed.reason;
  }

  async function saveProduct() {
    if (saving.value) return;

    saving.value = true;
    clearMessages();

    let response;

    try {
      const formData = buildFormData();

      response = selectedProduct.value
        ? await ProductService.updateProduct(selectedProduct.value.id, formData)
        : await ProductService.createProduct(formData);
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }

    // API lưu đã thành công: đóng form trước khi tải lại danh sách.
    // Nếu refresh lỗi, không để người dùng tưởng cần gửi tạo lại.
    closeModal();
    message.value = response.data?.message || "Lưu sản phẩm thành công.";

    try {
      await fetchProducts({ preserveMessages: true });
    } catch {
      errorMsg.value =
        "Đã lưu sản phẩm nhưng chưa tải lại được danh sách. Hãy bấm Tải lại.";
    }

    return response;
  }

  async function deleteProduct(product) {
    if (deleting.value) return;

    deleting.value = true;
    clearMessages();

    let response;

    try {
      response = await ProductService.deleteProduct(product.id);
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }

    message.value = response.data?.message || "Xóa sản phẩm thành công.";

    if (products.value.length === 1 && filters.page > 1) {
      filters.page--;
    }

    try {
      await fetchProducts({ preserveMessages: true });
    } catch {
      errorMsg.value =
        "Đã xóa sản phẩm nhưng chưa tải lại được danh sách. Hãy bấm Tải lại.";
    }

    return response;
  }

  function setPage(page) {
    filters.page = page;
    return fetchProducts();
  }

  function resetFilters() {
    Object.assign(filters, {
      search: "",
      category_id: "",
      subcategory_id: "",
      origin_id: "",
      is_show: "",
      page: 1,
    });

    subcategoryRequestIds.filter++;
    filterSubcategories.value = [];
  }

  return {
    products,
    categories,
    subcategories,
    filterSubcategories,
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
    isLowStock,

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
