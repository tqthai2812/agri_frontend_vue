import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import SupplierService from "@/services/admin/supplier.service";

function emptyForm() {
  return {
    supplier_code: "",
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    tax_code: "",
    note: "",
    is_active: true,
  };
}

function emptyMeta(perPage = 15) {
  return {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };
}

function updateMeta(target, response, count, perPage) {
  const meta = response.data?.meta ?? {};

  Object.assign(target, {
    current_page: Number(meta.current_page ?? 1),
    last_page: Math.max(1, Number(meta.last_page ?? 1)),
    per_page: Number(meta.per_page ?? perPage),
    total: Number(meta.total ?? count),
  });
}

function normalizeSupplier(item) {
  return {
    ...item,
    is_active: [true, 1, "1"].includes(item.is_active),
  };
}

function getMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
}

function nullableText(value) {
  const text = String(value ?? "").trim();

  return text || null;
}

export const useSupplierStore = defineStore("admin-suppliers", () => {
  const suppliers = ref([]);
  const loading = ref(false);
  const loadingDetail = ref(false);
  const saving = ref(false);
  const deletingId = ref(null);

  const message = ref("");
  const errorMsg = ref("");
  const dialogError = ref("");
  const errors = reactive({});

  // "", "create", "edit", "view"
  const mode = ref("");
  const selectedId = ref(null);
  const detailReady = ref(false);
  const form = reactive(emptyForm());

  const selectedProducts = ref([]);
  const productsChanged = ref(false);
  const productsLoaded = ref(false);

  const productResults = ref([]);
  const productLoading = ref(false);
  const productError = ref("");
  const productSearch = ref("");

  const meta = reactive(emptyMeta());
  const productMeta = reactive(emptyMeta(10));

  const filters = reactive({
    search: "",
    is_active: "",
    page: 1,
    per_page: 15,
  });

  let listVersion = 0;
  let detailVersion = 0;
  let productVersion = 0;

  const busy = computed(() => saving.value || deletingId.value !== null);

  const dialogOpen = computed(() => mode.value !== "");
  const readOnly = computed(() => mode.value === "view");

  const canSubmit = computed(
    () =>
      detailReady.value &&
      !loadingDetail.value &&
      !saving.value &&
      ["create", "edit"].includes(mode.value),
  );

  function clearErrors() {
    dialogError.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function setFormErrors(error) {
    clearErrors();

    const fields = error.response?.data?.errors ?? {};

    Object.entries(fields).forEach(([key, value]) => {
      errors[key] = Array.isArray(value) ? value[0] : String(value);
    });

    dialogError.value = getMessage(error);

    if (!error.response || error.response.status >= 500) {
      dialogError.value +=
        " Chưa xác định được kết quả lưu. Hãy kiểm tra danh sách " +
        "trước khi gửi lại, đặc biệt khi đang tạo mới.";
    }
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  async function fetchSuppliers() {
    const version = ++listVersion;

    loading.value = true;
    errorMsg.value = "";

    try {
      const response = await SupplierService.getSuppliers({
        search: filters.search || undefined,

        // Giữ giá trị "0" để lọc nhà cung cấp ngừng hoạt động.
        is_active: filters.is_active === "" ? undefined : filters.is_active,

        page: filters.page,
        per_page: filters.per_page,
      });

      if (version !== listVersion) {
        return false;
      }

      const rows = response.data?.data;

      if (!Array.isArray(rows)) {
        throw new Error("Danh sách nhà cung cấp không hợp lệ.");
      }

      suppliers.value = rows.map(normalizeSupplier);

      updateMeta(meta, response, suppliers.value.length, filters.per_page);

      // Sau khi xóa hoặc đổi bộ lọc, trang cũ có thể không còn.
      if (filters.page > meta.last_page) {
        filters.page = meta.last_page;

        return await fetchSuppliers();
      }

      return true;
    } catch (error) {
      if (version === listVersion) {
        errorMsg.value = getMessage(error);
      }

      return false;
    } finally {
      if (version === listVersion) {
        loading.value = false;
      }
    }
  }

  function resetFilters() {
    Object.assign(filters, {
      search: "",
      is_active: "",
      page: 1,
      per_page: 15,
    });
  }

  async function setPage(page) {
    if (
      loading.value ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > meta.last_page ||
      page === meta.current_page
    ) {
      return;
    }

    filters.page = page;

    await fetchSuppliers();
  }

  function resetDialog() {
    clearErrors();
    Object.assign(form, emptyForm());

    selectedId.value = null;
    detailReady.value = false;
    selectedProducts.value = [];
    productsChanged.value = false;
    productsLoaded.value = false;

    productResults.value = [];
    productSearch.value = "";
    productError.value = "";
    productLoading.value = false;

    Object.assign(productMeta, emptyMeta(10));
  }

  function openCreate() {
    if (busy.value) {
      return;
    }

    ++detailVersion;
    ++productVersion;

    resetDialog();

    loadingDetail.value = false;
    mode.value = "create";
    productsLoaded.value = true;
    detailReady.value = true;
  }

  async function openDetail(supplier, nextMode = "view") {
    if (busy.value || !["view", "edit"].includes(nextMode)) {
      return;
    }

    const version = ++detailVersion;

    ++productVersion;
    resetDialog();

    selectedId.value = supplier.id;
    mode.value = nextMode;
    loadingDetail.value = true;

    try {
      const response = await SupplierService.getSupplier(supplier.id);

      if (version !== detailVersion) {
        return;
      }

      const data = response.data?.data;

      if (!data?.id) {
        throw new Error("Không tải được chi tiết nhà cung cấp.");
      }

      const normalized = normalizeSupplier(data);

      Object.keys(emptyForm()).forEach((key) => {
        form[key] =
          key === "is_active" ? normalized.is_active : (normalized[key] ?? "");
      });

      /*
       * Phải phân biệt products bị thiếu với products là [].
       * Thiếu quan hệ thì không cho thay danh sách liên kết.
       */
      productsLoaded.value = Array.isArray(data.products);

      selectedProducts.value = productsLoaded.value
        ? data.products.map((product) => ({
            id: product.id,
            product_name: product.product_name,
          }))
        : [];

      detailReady.value = true;
    } catch (error) {
      if (version === detailVersion) {
        setFormErrors(error);
      }
    } finally {
      if (version === detailVersion) {
        loadingDetail.value = false;
      }
    }
  }

  function closeDialog() {
    if (saving.value) {
      return;
    }

    ++detailVersion;
    ++productVersion;

    mode.value = "";
    loadingDetail.value = false;

    resetDialog();
  }

  function invalidateProductSearch() {
    ++productVersion;
    productLoading.value = false;
    productResults.value = [];
    productError.value = "";
  }

  async function searchProducts(page = 1) {
    if (
      !dialogOpen.value ||
      readOnly.value ||
      !detailReady.value ||
      !productsLoaded.value ||
      saving.value
    ) {
      return;
    }

    const version = ++productVersion;

    productLoading.value = true;
    productError.value = "";

    try {
      const response = await SupplierService.getProducts({
        search: productSearch.value.trim() || undefined,
        page,
        per_page: 10,
      });

      if (version !== productVersion) {
        return;
      }

      const rows = response.data?.data;

      if (!Array.isArray(rows)) {
        throw new Error("Danh sách sản phẩm không hợp lệ.");
      }

      productResults.value = rows;

      updateMeta(productMeta, response, rows.length, 10);
    } catch (error) {
      if (version === productVersion) {
        productResults.value = [];
        productError.value = getMessage(error);
      }
    } finally {
      if (version === productVersion) {
        productLoading.value = false;
      }
    }
  }

  function isProductSelected(id) {
    return selectedProducts.value.some(
      (product) => String(product.id) === String(id),
    );
  }

  function addProduct(product) {
    if (
      saving.value ||
      readOnly.value ||
      !productsLoaded.value ||
      isProductSelected(product.id)
    ) {
      return;
    }

    if (selectedProducts.value.length >= 500) {
      productError.value = "Chỉ được liên kết tối đa 500 sản phẩm.";

      return;
    }

    selectedProducts.value.push({
      id: product.id,
      product_name: product.product_name,
    });

    productsChanged.value = true;
    productError.value = "";
  }

  function removeProduct(id) {
    if (saving.value || readOnly.value || !productsLoaded.value) {
      return;
    }

    selectedProducts.value = selectedProducts.value.filter(
      (product) => String(product.id) !== String(id),
    );

    productsChanged.value = true;
  }

  function buildPayload() {
    const payload = {
      supplier_code: form.supplier_code.trim(),
      name: form.name.trim(),
      contact_name: nullableText(form.contact_name),
      phone: nullableText(form.phone),
      email: nullableText(form.email),
      address: nullableText(form.address),
      tax_code: nullableText(form.tax_code),
      note: nullableText(form.note),
      is_active: form.is_active,
    };

    if (
      productsLoaded.value &&
      (mode.value === "create" || productsChanged.value)
    ) {
      payload.product_ids = selectedProducts.value.map((product) => product.id);
    }

    return payload;
  }

  async function saveSupplier() {
    if (!canSubmit.value) {
      return false;
    }

    saving.value = true;
    clearErrors();

    let response;

    try {
      const payload = buildPayload();

      response =
        mode.value === "edit"
          ? await SupplierService.updateSupplier(selectedId.value, payload)
          : await SupplierService.createSupplier(payload);
    } catch (error) {
      setFormErrors(error);

      return false;
    } finally {
      saving.value = false;
    }

    /*
     * Lưu thành công và tải lại danh sách là hai bước riêng.
     * Tải danh sách lỗi không được báo thành lỗi lưu.
     */
    closeDialog();

    message.value = response.data?.message || "Lưu nhà cung cấp thành công.";

    const refreshed = await fetchSuppliers();

    if (!refreshed) {
      errorMsg.value =
        "Đã lưu nhà cung cấp nhưng chưa tải lại được danh sách. " +
        "Hãy bấm Tải lại.";
    }

    return true;
  }

  async function deleteSupplier(supplier) {
    if (busy.value || dialogOpen.value) {
      return false;
    }

    deletingId.value = supplier.id;
    message.value = "";
    errorMsg.value = "";

    let response;

    try {
      response = await SupplierService.deleteSupplier(supplier.id);
    } catch (error) {
      const validationErrors = error.response?.data?.errors ?? {};
      const supplierErrors = validationErrors.supplier;

      errorMsg.value = Array.isArray(supplierErrors)
        ? supplierErrors[0]
        : getMessage(error);

      if (!error.response || error.response.status >= 500) {
        errorMsg.value +=
          " Hãy tải lại danh sách để kiểm tra kết quả trước khi thử lại.";
      }

      return false;
    } finally {
      deletingId.value = null;
    }

    message.value = response.data?.message || "Xóa nhà cung cấp thành công.";

    const refreshed = await fetchSuppliers();

    if (!refreshed) {
      errorMsg.value =
        "Đã xóa nhà cung cấp nhưng chưa tải lại được danh sách. " +
        "Hãy bấm Tải lại.";
    }

    return true;
  }

  return {
    suppliers,
    loading,
    loadingDetail,
    saving,
    deletingId,
    busy,

    message,
    errorMsg,
    dialogError,
    errors,

    mode,
    selectedId,
    detailReady,
    dialogOpen,
    readOnly,
    canSubmit,
    form,

    selectedProducts,
    productsLoaded,
    productResults,
    productLoading,
    productError,
    productSearch,
    productMeta,

    meta,
    filters,

    fieldError,
    fetchSuppliers,
    resetFilters,
    setPage,

    openCreate,
    openDetail,
    closeDialog,
    saveSupplier,
    deleteSupplier,

    invalidateProductSearch,
    searchProducts,
    isProductSelected,
    addProduct,
    removeProduct,
  };
});
