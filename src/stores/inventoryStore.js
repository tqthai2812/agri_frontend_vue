import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import InventoryService from "@/services/inventory.service";

export const useInventoryStore = defineStore("inventory", () => {
  const inventory = ref([]);
  const categories = ref([]);
  const transactions = ref([]);

  const selectedPackage = ref(null);

  const loading = ref(false);
  const loadingOptions = ref(false);
  const loadingTransactions = ref(false);
  const saving = ref(false);

  const showTransactionModal = ref(false);
  const showHistoryModal = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const transactionMeta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const filters = reactive({
    search: "",
    category_id: "",
    status: "",
    page: 1,
    per_page: 15,
  });

  const transactionFilters = reactive({
    package_id: "",
    transaction_type: "",
    search: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    package_id: "",
    transaction_type: "import",
    quantity_change: "",
    note: "",
  });

  const availableItems = computed(() => {
    return inventory.value.filter((item) => item.stock_status === "available");
  });

  const lowStockItems = computed(() => {
    return inventory.value.filter((item) => item.stock_status === "low");
  });

  const outStockItems = computed(() => {
    return inventory.value.filter((item) => item.stock_status === "out");
  });

  const totalStockQuantity = computed(() => {
    return inventory.value.reduce((total, item) => {
      return total + Number(item.quantity_available || 0);
    }, 0);
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

  function resetForm() {
    form.package_id = "";
    form.transaction_type = "import";
    form.quantity_change = "";
    form.note = "";
  }

  function openTransactionModal(item, type = "import") {
    clearMessages();
    resetForm();

    selectedPackage.value = item;

    form.package_id = item.id;
    form.transaction_type = type;
    form.quantity_change = "";
    form.note = getDefaultNote(type, item);

    showTransactionModal.value = true;
  }

  function closeTransactionModal() {
    showTransactionModal.value = false;
    selectedPackage.value = null;
    resetForm();
    clearMessages();
  }

  async function openHistoryModal(item) {
    clearMessages();

    selectedPackage.value = item;
    transactionFilters.package_id = item.id;
    transactionFilters.page = 1;

    showHistoryModal.value = true;

    await fetchTransactions();
  }

  function closeHistoryModal() {
    showHistoryModal.value = false;
    selectedPackage.value = null;
    transactions.value = [];
    transactionFilters.package_id = "";
    transactionFilters.transaction_type = "";
    transactionFilters.search = "";
    transactionFilters.page = 1;
  }

  function getDefaultNote(type, item) {
    const sku = item?.sku || "";

    if (type === "import") {
      return `Nhập kho SKU ${sku}`;
    }

    if (type === "export") {
      return `Xuất kho SKU ${sku}`;
    }

    return `Điều chỉnh tồn kho SKU ${sku}`;
  }

  async function fetchInventory() {
    loading.value = true;
    clearMessages();

    try {
      const response = await InventoryService.getInventory({
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        status: filters.status || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      inventory.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || inventory.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategories() {
    loadingOptions.value = true;

    try {
      const response = await InventoryService.getCategories();

      categories.value = response.data?.data || [];

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingOptions.value = false;
    }
  }

  async function fetchTransactions() {
    loadingTransactions.value = true;
    clearMessages();

    try {
      const response = await InventoryService.getTransactions({
        package_id: transactionFilters.package_id || undefined,
        transaction_type: transactionFilters.transaction_type || undefined,
        search: transactionFilters.search || undefined,
        page: transactionFilters.page,
        per_page: transactionFilters.per_page,
      });

      transactions.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      transactionMeta.current_page = responseMeta.current_page || 1;
      transactionMeta.last_page = responseMeta.last_page || 1;
      transactionMeta.per_page =
        responseMeta.per_page || transactionFilters.per_page;
      transactionMeta.total = responseMeta.total || transactions.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingTransactions.value = false;
    }
  }

  async function loadData() {
    await Promise.all([fetchInventory(), fetchCategories()]);
  }

  async function saveTransaction() {
    saving.value = true;
    clearMessages();

    try {
      const payload = {
        package_id: form.package_id,
        transaction_type: form.transaction_type,
        quantity_change: Number(form.quantity_change),
        note: form.note || "",
      };

      const response = await InventoryService.createTransaction(payload);

      const successMessage =
        response.data?.message || "Cập nhật tồn kho thành công.";

      await fetchInventory();

      if (showHistoryModal.value || selectedPackage.value) {
        transactionFilters.package_id =
          selectedPackage.value?.id || form.package_id;
      }

      closeTransactionModal();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  function setPage(page) {
    filters.page = page;
    fetchInventory();
  }

  function setTransactionPage(page) {
    transactionFilters.page = page;
    fetchTransactions();
  }

  function resetFilters() {
    filters.search = "";
    filters.category_id = "";
    filters.status = "";
    filters.page = 1;
  }

  return {
    inventory,
    categories,
    transactions,

    selectedPackage,

    loading,
    loadingOptions,
    loadingTransactions,
    saving,

    showTransactionModal,
    showHistoryModal,

    message,
    errorMsg,
    errors,

    meta,
    transactionMeta,

    filters,
    transactionFilters,
    form,

    availableItems,
    lowStockItems,
    outStockItems,
    totalStockQuantity,

    clearMessages,
    setErrors,
    fieldError,

    resetForm,

    openTransactionModal,
    closeTransactionModal,

    openHistoryModal,
    closeHistoryModal,

    fetchInventory,
    fetchCategories,
    fetchTransactions,
    loadData,

    saveTransaction,

    setPage,
    setTransactionPage,
    resetFilters,
  };
});
