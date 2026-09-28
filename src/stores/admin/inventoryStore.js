import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import InventoryService from "@/services/admin/inventory.service";

const MAX_QUANTITY = 2147483647;

function makeMeta(perPage = 15) {
  return {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };
}

function applyMeta(target, response, count, perPage) {
  const source = response.data?.meta ?? {};

  Object.assign(target, {
    current_page: Number(source.current_page ?? 1),
    last_page: Math.max(1, Number(source.last_page ?? 1)),
    per_page: Number(source.per_page ?? perPage),
    total: Number(source.total ?? count),
  });
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizePackage(item) {
  return {
    ...item,
    quantity_available: nullableNumber(item.quantity_available),
    available_to_sell: nullableNumber(item.available_to_sell),
    reserved_quantity: nullableNumber(item.reserved_quantity),
    lot_quantity: nullableNumber(item.lot_quantity),
    lot_count: nullableNumber(item.lot_count),
    reorder_level: nullableNumber(item.reorder_level),
    stock_consistent:
      item.stock_consistent == null
        ? null
        : [true, 1, "1"].includes(item.stock_consistent),
  };
}

function localDateTime() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join("T");
}

function uuid() {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues !== "function") {
    throw new Error("Trình duyệt không hỗ trợ tạo mã giao dịch an toàn.");
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function dateOnly(value) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function optional(value) {
  return value === "" || value === undefined ? null : value;
}

function integer(value, label, { signed = false } = {}) {
  const text = String(value ?? "").trim();
  const pattern = signed ? /^-?\d+$/ : /^\d+$/;

  if (!pattern.test(text)) {
    throw new Error(`${label} phải là số nguyên.`);
  }

  const number = Number(text);

  if (
    !Number.isSafeInteger(number) ||
    number === 0 ||
    Math.abs(number) > MAX_QUANTITY ||
    (!signed && number < 1)
  ) {
    throw new Error(`${label} không hợp lệ.`);
  }

  return number;
}

function errorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
}

export const useInventoryStore = defineStore("inventory", () => {
  const inventory = ref([]);
  const categories = ref([]);
  const suppliers = ref([]);
  const transactions = ref([]);
  const lots = ref([]);

  const selectedPackage = ref(null);
  const selectedLot = ref(null);

  // "", "import", "adjustment", "initialize", "lots", "edit", "history"
  const mode = ref("");

  const loading = ref(false);
  const loadingOptions = ref(false);
  const loadingSuppliers = ref(false);
  const loadingDetail = ref(false);
  const loadingLots = ref(false);
  const loadingTransactions = ref(false);
  const saving = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const dialogError = ref("");
  const errors = reactive({});

  /*
   * Khi mất kết nối hoặc server lỗi, giữ nguyên payload để không
   * tạo một giao dịch khác chỉ vì người dùng bấm thử lại.
   */
  const pendingWrite = ref(null);

  const meta = reactive(makeMeta());
  const lotMeta = reactive(makeMeta(20));
  const transactionMeta = reactive(makeMeta());

  const filters = reactive({
    search: "",
    category_id: "",
    status: "",
    page: 1,
    per_page: 15,
  });

  const transactionFilters = reactive({
    transaction_type: "",
    search: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    quantity_change: "",
    note: "",
    supplier_id: "",
    lot_id: "",
    lot_code: "",
    manufactured_on: "",
    expires_on: "",
    unit_cost: "",
    lot_status: "available",
    expense_category_id: "",
  });

  const initialization = reactive({
    note: "",
    lots: [],
  });

  const lotForm = reactive({
    lot_code: "",
    manufactured_on: "",
    expires_on: "",
    status: "available",
    note: "",
  });

  let inventoryVersion = 0;
  let dialogVersion = 0;
  let lotsVersion = 0;
  let transactionsVersion = 0;

  const availableItems = computed(() =>
    inventory.value.filter((item) => item.stock_status === "available"),
  );

  const lowStockItems = computed(() =>
    inventory.value.filter((item) => item.stock_status === "low"),
  );

  const outStockItems = computed(() =>
    inventory.value.filter((item) => item.stock_status === "out"),
  );

  const initializedQuantity = computed(() =>
    initialization.lots.reduce((total, lot) => {
      const quantity = Number(lot.quantity_on_hand);

      return total + (Number.isSafeInteger(quantity) ? quantity : 0);
    }, 0),
  );

  const formLocked = computed(
    () => saving.value || pendingWrite.value !== null,
  );

  function clearDialogErrors() {
    dialogError.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function setDialogError(error) {
    clearDialogErrors();

    const validationErrors = error.response?.data?.errors ?? {};

    Object.entries(validationErrors).forEach(([key, value]) => {
      errors[key] = Array.isArray(value) ? value[0] : String(value);
    });

    dialogError.value = errorMessage(error);
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  function resetForm() {
    Object.assign(form, {
      quantity_change: "",
      note: "",
      supplier_id: "",
      lot_id: "",
      lot_code: "",
      manufactured_on: "",
      expires_on: "",
      unit_cost: "",
      lot_status: "available",
      expense_category_id: "",
    });
  }

  function addInitializationLot() {
    if (formLocked.value || initialization.lots.length >= 100) {
      return;
    }

    initialization.lots.push({
      lot_code: "",
      quantity_on_hand: "",
      received_at: localDateTime(),
      manufactured_on: "",
      expires_on: "",
      unit_cost: "",
      status: "available",
    });
  }

  function removeInitializationLot(index) {
    if (formLocked.value || initialization.lots.length <= 1) {
      return;
    }

    initialization.lots.splice(index, 1);
  }

  async function fetchInventory() {
    const version = ++inventoryVersion;

    loading.value = true;
    errorMsg.value = "";

    try {
      const response = await InventoryService.getInventory({
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        status: filters.status || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      if (version !== inventoryVersion) {
        return false;
      }

      inventory.value = (response.data?.data ?? []).map(normalizePackage);

      applyMeta(meta, response, inventory.value.length, filters.per_page);

      return true;
    } catch (error) {
      if (version === inventoryVersion) {
        errorMsg.value = errorMessage(error);
      }

      return false;
    } finally {
      if (version === inventoryVersion) {
        loading.value = false;
      }
    }
  }

  /*
   * Các API danh mục/NCC có phân trang.
   * Không chỉ lấy trang đầu rồi làm thiếu lựa chọn.
   */
  async function readOptions(fetchPage) {
    const result = [];
    let page = 1;

    while (true) {
      const response = await fetchPage({
        page,
        per_page: 50,
      });

      const rows = response.data?.data;

      if (!Array.isArray(rows)) {
        throw new Error("Dữ liệu danh sách lựa chọn không hợp lệ.");
      }

      result.push(...rows);

      const lastPage = Number(response.data?.meta?.last_page ?? 1);

      if (!Number.isSafeInteger(lastPage) || lastPage < 1) {
        throw new Error("Thông tin phân trang không hợp lệ.");
      }

      if (page >= lastPage) {
        break;
      }

      if (rows.length === 0) {
        throw new Error("Danh sách lựa chọn trả về thiếu dữ liệu.");
      }

      page += 1;
    }

    return [...new Map(result.map((item) => [item.id, item])).values()];
  }

  async function fetchCategories() {
    loadingOptions.value = true;

    try {
      categories.value = await readOptions((params) =>
        InventoryService.getCategories(params),
      );

      return true;
    } catch (error) {
      errorMsg.value = `Không tải được danh mục: ${errorMessage(error)}`;

      return false;
    } finally {
      loadingOptions.value = false;
    }
  }

  async function fetchSuppliers() {
    loadingSuppliers.value = true;

    try {
      const rows = await readOptions((params) =>
        InventoryService.getSuppliers(params),
      );

      suppliers.value = rows.filter((item) =>
        [true, 1, "1"].includes(item.is_active),
      );

      return true;
    } catch (error) {
      // Không cho dùng danh sách NCC cũ nếu lần tải mới bị lỗi.
      suppliers.value = [];
      setDialogError(error);

      return false;
    } finally {
      loadingSuppliers.value = false;
    }
  }

  async function loadData() {
    message.value = "";

    await Promise.all([fetchInventory(), fetchCategories()]);
  }

  async function fetchLots(page = 1) {
    if (!selectedPackage.value) {
      return false;
    }

    const version = ++lotsVersion;
    const packageId = selectedPackage.value.id;

    loadingLots.value = true;

    try {
      const response = await InventoryService.getLots(packageId, {
        page,
        per_page: lotMeta.per_page,
      });

      if (version !== lotsVersion || selectedPackage.value?.id !== packageId) {
        return false;
      }

      lots.value = response.data?.data ?? [];

      applyMeta(lotMeta, response, lots.value.length, lotMeta.per_page);

      return true;
    } catch (error) {
      if (version === lotsVersion) {
        lots.value = [];
        setDialogError(error);
      }

      return false;
    } finally {
      if (version === lotsVersion) {
        loadingLots.value = false;
      }
    }
  }

  async function fetchTransactions() {
    if (!selectedPackage.value) {
      return false;
    }

    const version = ++transactionsVersion;
    const packageId = selectedPackage.value.id;

    loadingTransactions.value = true;

    try {
      const response = await InventoryService.getTransactions({
        package_id: packageId,
        transaction_type: transactionFilters.transaction_type || undefined,
        search: transactionFilters.search || undefined,
        page: transactionFilters.page,
        per_page: transactionFilters.per_page,
      });

      if (
        version !== transactionsVersion ||
        selectedPackage.value?.id !== packageId
      ) {
        return false;
      }

      transactions.value = response.data?.data ?? [];

      applyMeta(
        transactionMeta,
        response,
        transactions.value.length,
        transactionFilters.per_page,
      );

      return true;
    } catch (error) {
      if (version === transactionsVersion) {
        transactions.value = [];
        setDialogError(error);
      }

      return false;
    } finally {
      if (version === transactionsVersion) {
        loadingTransactions.value = false;
      }
    }
  }

  async function openPanel(item, nextMode) {
    if (saving.value || pendingWrite.value) {
      return;
    }

    if (
      !["import", "adjustment", "initialize", "lots", "history"].includes(
        nextMode,
      )
    ) {
      return;
    }

    const version = ++dialogVersion;

    ++lotsVersion;
    ++transactionsVersion;

    clearDialogErrors();
    resetForm();

    selectedPackage.value = item;
    selectedLot.value = null;
    lots.value = [];
    transactions.value = [];

    Object.assign(lotMeta, makeMeta(20));
    Object.assign(transactionMeta, makeMeta());

    Object.assign(transactionFilters, {
      transaction_type: "",
      search: "",
      page: 1,
      per_page: 15,
    });

    initialization.note = "";
    initialization.lots = [];

    mode.value = nextMode;
    loadingDetail.value = true;

    try {
      const response = await InventoryService.getInventoryDetail(item.id);

      if (version !== dialogVersion) {
        return;
      }

      const detail = response.data?.data;

      if (!detail?.id) {
        throw new Error("Không tải được chi tiết quy cách sản phẩm.");
      }

      selectedPackage.value = normalizePackage(detail);

      if (nextMode === "initialize") {
        addInitializationLot();
      }
    } catch (error) {
      if (version === dialogVersion) {
        setDialogError(error);
      }

      return;
    } finally {
      if (version === dialogVersion) {
        loadingDetail.value = false;
      }
    }

    if (version !== dialogVersion) {
      return;
    }

    if (nextMode === "import") {
      await fetchSuppliers();
    } else if (nextMode === "lots" || nextMode === "adjustment") {
      await fetchLots(1);
    } else if (nextMode === "history") {
      await fetchTransactions();
    }
  }

  function closePanel(force = false) {
    if (!force && (saving.value || pendingWrite.value)) {
      return;
    }

    ++dialogVersion;
    ++lotsVersion;
    ++transactionsVersion;

    mode.value = "";
    selectedPackage.value = null;
    selectedLot.value = null;
    lots.value = [];
    transactions.value = [];

    loadingDetail.value = false;
    loadingLots.value = false;
    loadingTransactions.value = false;

    clearDialogErrors();
  }

  function editLot(lot) {
    if (formLocked.value) {
      return;
    }

    clearDialogErrors();
    selectedLot.value = lot;

    Object.assign(lotForm, {
      lot_code: lot.lot_code ?? "",
      manufactured_on: dateOnly(lot.manufactured_on),
      expires_on: dateOnly(lot.expires_on),
      status: lot.status ?? "available",
      note: lot.note ?? "",
    });

    mode.value = "edit";
  }

  function backToLots() {
    if (formLocked.value) {
      return;
    }

    selectedLot.value = null;
    clearDialogErrors();
    mode.value = "lots";
  }

  function selectAdjustmentLot(lot) {
    if (formLocked.value) {
      return;
    }

    selectedLot.value = lot;
    form.lot_id = lot.id;
  }

  function buildWrite() {
    const packageId = selectedPackage.value?.id;

    if (!packageId) {
      throw new Error("Chưa chọn quy cách sản phẩm.");
    }

    if (mode.value === "import") {
      return {
        type: "transaction",
        packageId,
        data: {
          event_key: uuid(),
          package_id: packageId,
          transaction_type: "import",
          quantity_change: integer(form.quantity_change, "Số lượng nhập"),
          supplier_id: integer(form.supplier_id, "Nhà cung cấp"),
          lot_code: form.lot_code.trim(),
          manufactured_on: optional(form.manufactured_on),
          expires_on: optional(form.expires_on),
          unit_cost: form.unit_cost,
          lot_status: form.lot_status,
          note: optional(form.note.trim()),
        },
      };
    }

    if (mode.value === "adjustment") {
      const quantity = integer(form.quantity_change, "Số lượng điều chỉnh", {
        signed: true,
      });

      const data = {
        event_key: uuid(),
        package_id: packageId,
        transaction_type: "adjustment",
        lot_id: integer(form.lot_id, "Lô hàng"),
        quantity_change: quantity,
        note: form.note.trim(),
      };

      if (quantity < 0) {
        data.expense_category_id = integer(
          form.expense_category_id,
          "Danh mục chi phí",
        );
      }

      return {
        type: "transaction",
        packageId,
        data,
      };
    }

    if (mode.value === "initialize") {
      if (!initialization.lots.length) {
        throw new Error("Vui lòng khai báo ít nhất một lô.");
      }

      const rows = initialization.lots.map((lot, index) => {
        let receivedAt = String(lot.received_at || "")
          .trim()
          .replace("T", " ");

        if (receivedAt.length === 16) {
          receivedAt += ":00";
        }

        if (!receivedAt) {
          throw new Error(`Vui lòng nhập thời điểm nhập của lô ${index + 1}.`);
        }

        return {
          lot_code: lot.lot_code.trim(),

          // API nhận quantity; form vẫn dùng quantity_on_hand.
          quantity: integer(lot.quantity_on_hand, `Số lượng lô ${index + 1}`),

          received_at: receivedAt,
          manufactured_on: optional(lot.manufactured_on),
          expires_on: optional(lot.expires_on),
          unit_cost: optional(lot.unit_cost),
          status: lot.status,
        };
      });

      const total = rows.reduce((sum, lot) => sum + lot.quantity, 0);

      if (total !== selectedPackage.value.quantity_available) {
        throw new Error("Tổng số lượng các lô phải bằng tồn vật lý hiện tại.");
      }

      return {
        type: "initialize",
        packageId,
        data: {
          note: initialization.note.trim(),
          lots: rows,
        },
      };
    }

    if (mode.value === "edit") {
      if (!selectedLot.value?.id) {
        throw new Error("Chưa chọn lô cần sửa.");
      }

      return {
        type: "edit",
        packageId,
        lotId: selectedLot.value.id,
        data: {
          lot_code: lotForm.lot_code.trim(),
          manufactured_on: optional(lotForm.manufactured_on),
          expires_on: optional(lotForm.expires_on),
          status: lotForm.status,
          note: optional(lotForm.note.trim()),
        },
      };
    }

    throw new Error("Thao tác không hợp lệ.");
  }

  async function save() {
    if (saving.value || loadingDetail.value) {
      return false;
    }

    clearDialogErrors();

    try {
      if (!pendingWrite.value) {
        pendingWrite.value = buildWrite();
      }
    } catch (error) {
      setDialogError(error);

      return false;
    }

    const write = pendingWrite.value;

    saving.value = true;

    try {
      let response;

      if (write.type === "transaction") {
        response = await InventoryService.createTransaction(write.data);
      } else if (write.type === "initialize") {
        response = await InventoryService.initializeLots(
          write.packageId,
          write.data,
        );
      } else {
        response = await InventoryService.updateLot(
          write.packageId,
          write.lotId,
          write.data,
        );
      }

      pendingWrite.value = null;

      const successMessage =
        response.data?.message || "Cập nhật kho thành công.";

      closePanel(true);
      message.value = successMessage;

      const refreshed = await fetchInventory();

      if (!refreshed) {
        errorMsg.value =
          "Thao tác đã thành công nhưng chưa tải lại được danh sách. " +
          "Hãy bấm Tải lại; không gửi lại giao dịch.";
      }

      return true;
    } catch (error) {
      const status = error.response?.status;

      /*
       * 422: backend từ chối dữ liệu, cho sửa.
       * Mất mạng/5xx/409: giữ payload để đối soát hoặc thử lại
       * cùng event_key; không tự tạo một giao dịch mới.
       */
      if ([400, 401, 403, 404, 419, 422, 429].includes(status)) {
        pendingWrite.value = null;
      }

      setDialogError(error);

      return false;
    } finally {
      saving.value = false;
    }
  }

  /*
   * Chỉ gọi sau khi người dùng xác nhận đã kiểm tra lịch sử/lô.
   * Không tự động bỏ payload chưa rõ kết quả.
   */
  function dismissPendingWrite() {
    if (saving.value) {
      return;
    }

    pendingWrite.value = null;
    closePanel(true);
  }

  async function setPage(page) {
    if (!Number.isInteger(page) || page < 1 || page > meta.last_page) {
      return;
    }

    filters.page = page;

    await fetchInventory();
  }

  async function setTransactionPage(page) {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > transactionMeta.last_page
    ) {
      return;
    }

    transactionFilters.page = page;

    await fetchTransactions();
  }

  function resetFilters() {
    Object.assign(filters, {
      search: "",
      category_id: "",
      status: "",
      page: 1,
      per_page: 15,
    });
  }

  return {
    inventory,
    categories,
    suppliers,
    transactions,
    lots,
    selectedPackage,
    selectedLot,
    mode,

    loading,
    loadingOptions,
    loadingSuppliers,
    loadingDetail,
    loadingLots,
    loadingTransactions,
    saving,

    message,
    errorMsg,
    dialogError,
    errors,
    pendingWrite,
    formLocked,

    meta,
    lotMeta,
    transactionMeta,
    filters,
    transactionFilters,
    form,
    initialization,
    lotForm,

    availableItems,
    lowStockItems,
    outStockItems,
    initializedQuantity,

    fieldError,
    loadData,
    fetchInventory,
    fetchCategories,
    fetchSuppliers,
    fetchLots,
    fetchTransactions,

    openPanel,
    closePanel,
    editLot,
    backToLots,
    selectAdjustmentLot,
    addInitializationLot,
    removeInitializationLot,
    save,
    dismissPendingWrite,

    setPage,
    setTransactionPage,
    resetFilters,
  };
});
