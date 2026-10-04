import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import OrderService from "@/services/admin/order.service";
export const useOrderStore = defineStore("order", () => {
  const orders = ref([]);
  const selectedOrder = ref(null);
  const loading = ref(false);
  const loadingCounts = ref(false);
  const loadingDetail = ref(false);
  const detailReady = ref(false);
  const savingStatus = ref(false);
  const confirmingPayment = ref(false);
  const busy = computed(() => savingStatus.value || confirmingPayment.value);
  const showDetailModal = ref(false);
  const showStatusModal = ref(false);
  const showCodModal = ref(false);
  const message = ref("");
  const warningMsg = ref("");
  const errorMsg = ref("");
  const detailError = ref("");
  const errors = reactive({});
  const meta = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const statusCounts = reactive({
    all: 0,
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
  });
  const filters = reactive({
    search: "",
    order_status: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 15,
  });
  const statusForm = reactive({
    order_status: "",
    note: "",
  });
  const codForm = reactive({
    received_payment: false,
  });
  let listVersion = 0;
  let countsVersion = 0;
  let detailVersion = 0;
  // Giữ tương thích với code cũ.
  // Đây chỉ là tổng tiền đơn hoàn thành trên trang hiện tại,
  // không phải doanh thu hoặc tổng tiền đã thu toàn hệ thống.
  const totalRevenue = computed(() =>
    orders.value
      .filter((order) => order.order_status === "completed")
      .reduce((sum, order) => sum + Number(order.total_payment || 0), 0),
  );
  const pendingOrders = computed(() =>
    orders.value.filter((order) => order.order_status === "pending"),
  );
  const shippingOrders = computed(() =>
    orders.value.filter((order) => order.order_status === "shipping"),
  );
  function clearMessages() {
    message.value = "";
    warningMsg.value = "";
    errorMsg.value = "";
    Object.keys(errors).forEach((key) => delete errors[key]);
  }
  function errorText(error) {
    const first = Object.values(error?.response?.data?.errors || {})[0];
    return (
      (Array.isArray(first) ? first[0] : first) ||
      error?.response?.data?.message ||
      "Có lỗi xảy ra. Vui lòng thử lại."
    );
  }
  function setErrors(error) {
    Object.keys(errors).forEach((key) => delete errors[key]);
    Object.entries(error?.response?.data?.errors || {}).forEach(
      ([key, value]) => {
        errors[key] = Array.isArray(value) ? value[0] : value;
      },
    );
    errorMsg.value = errorText(error);
  }
  function fieldError(key) {
    return errors[key] || "";
  }
  function resetFilters() {
    Object.assign(filters, {
      search: "",
      order_status: "",
      payment_method: "",
      date_from: "",
      date_to: "",
      page: 1,
    });
  }
  function paymentKnown(order) {
    return (
      typeof order?.is_paid === "boolean" || Array.isArray(order?.payments)
    );
  }
  function isPaid(order) {
    return (
      order?.is_paid === true ||
      order?.payments?.some((payment) => payment.status === "paid") === true
    );
  }
  function getNextStatuses(orderOrStatus) {
    const order = typeof orderOrStatus === "object" ? orderOrStatus : null;
    const status = order ? order.order_status : orderOrStatus;
    const map = {
      pending: [
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "cancelled", label: "Đã hủy" },
      ],
      confirmed: [
        { value: "shipping", label: "Đang giao" },
        { value: "cancelled", label: "Đã hủy" },
      ],
      shipping: [{ value: "completed", label: "Hoàn thành" }],
      completed: [],
      cancelled: [],
    };
    if (order && Array.isArray(order.allowed_next_statuses)) {
      return (map[status] || []).filter((item) =>
        order.allowed_next_statuses.includes(item.value),
      );
    }
    return (map[status] || []).filter(
      (item) =>
        item.value !== "cancelled" ||
        !order ||
        (paymentKnown(order) && !isPaid(order)),
    );
  }
  function canUpdateStatus(order) {
    return getNextStatuses(order).length > 0;
  }
  function canConfirmCodPayment(order) {
    return (
      order?.payment_method === "COD" &&
      ["shipping", "completed"].includes(order.order_status) &&
      paymentKnown(order) &&
      !isPaid(order)
    );
  }
  async function fetchOrders({ silent = false } = {}) {
    const version = ++listVersion;
    loading.value = true;
    try {
      const response = await OrderService.getOrders({
        search: filters.search || undefined,
        order_status: filters.order_status || undefined,
        payment_method: filters.payment_method || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });
      if (version === listVersion) {
        orders.value = response.data?.data || [];
        const data = response.data?.meta || {};
        Object.assign(meta, {
          current_page: Number(data.current_page ?? 1),
          last_page: Number(data.last_page ?? 1),
          per_page: Number(data.per_page ?? filters.per_page),
          total: Number(data.total ?? orders.value.length),
        });
      }
      return response;
    } catch (error) {
      if (version === listVersion && !silent) {
        setErrors(error);
      }
      throw error;
    } finally {
      if (version === listVersion) {
        loading.value = false;
      }
    }
  }
  async function fetchStatusCounts({ silent = false } = {}) {
    const version = ++countsVersion;
    loadingCounts.value = true;
    try {
      const response = await OrderService.getStatusCounts();
      if (version === countsVersion) {
        const data = response.data?.data || {};
        Object.keys(statusCounts).forEach((key) => {
          statusCounts[key] = Number(data[key] ?? 0);
        });
      }
      return response;
    } catch (error) {
      if (version === countsVersion && !silent) {
        setErrors(error);
      }
      throw error;
    } finally {
      if (version === countsVersion) {
        loadingCounts.value = false;
      }
    }
  }
  async function loadData() {
    clearMessages();
    await Promise.allSettled([fetchOrders(), fetchStatusCounts()]);
  }
  async function fetchOrderDetail(id) {
    const version = ++detailVersion;
    loadingDetail.value = true;
    detailReady.value = false;
    detailError.value = "";
    try {
      const response = await OrderService.getOrder(id);
      if (version !== detailVersion || !showDetailModal.value) {
        return null;
      }
      const order = response.data?.data;
      if (!order?.id || Number(order.id) !== Number(id)) {
        throw new Error("Dữ liệu chi tiết đơn hàng không hợp lệ.");
      }
      selectedOrder.value = order;
      detailReady.value = true;
      return response;
    } catch (error) {
      if (version === detailVersion) {
        detailError.value = error.response
          ? errorText(error)
          : error.message || "Không tải được chi tiết đơn hàng.";
      }
      throw error;
    } finally {
      if (version === detailVersion) {
        loadingDetail.value = false;
      }
    }
  }
  async function openDetailModal(order) {
    if (busy.value || showStatusModal.value || showCodModal.value) {
      return;
    }
    clearMessages();
    selectedOrder.value = order;
    showDetailModal.value = true;
    return fetchOrderDetail(order.id);
  }
  function closeDetailModal() {
    if (busy.value || showStatusModal.value || showCodModal.value) {
      return;
    }
    detailVersion++;
    showDetailModal.value = false;
    selectedOrder.value = null;
    detailReady.value = false;
    loadingDetail.value = false;
    detailError.value = "";
  }
  function resetStatusForm() {
    statusForm.order_status = "";
    statusForm.note = "";
  }
  function openStatusModal() {
    if (busy.value || !detailReady.value || showCodModal.value) {
      return;
    }
    const next = getNextStatuses(selectedOrder.value);
    if (!next.length) return;
    clearMessages();
    resetStatusForm();
    statusForm.order_status = next[0].value;
    showStatusModal.value = true;
  }
  function closeStatusModal() {
    if (busy.value) return;
    showStatusModal.value = false;
    resetStatusForm();
  }
  function openCodModal() {
    if (
      busy.value ||
      !detailReady.value ||
      showStatusModal.value ||
      !canConfirmCodPayment(selectedOrder.value)
    ) {
      return;
    }
    clearMessages();
    codForm.received_payment = false;
    showCodModal.value = true;
  }
  function closeCodModal() {
    if (busy.value) return;
    showCodModal.value = false;
    codForm.received_payment = false;
  }
  async function mutateOrder(kind, payload) {
    if (busy.value || !detailReady.value || !selectedOrder.value) {
      return null;
    }
    const id = selectedOrder.value.id;
    const flag = kind === "status" ? savingStatus : confirmingPayment;
    flag.value = true;
    clearMessages();
    // Bỏ qua các lượt đọc bắt đầu trước thao tác ghi này.
    listVersion++;
    countsVersion++;
    detailVersion++;
    loading.value = false;
    loadingCounts.value = false;
    try {
      let response;
      try {
        response =
          kind === "status"
            ? await OrderService.updateStatus(id, payload)
            : await OrderService.confirmCodPayment(id, payload);
      } catch (error) {
        setErrors(error);
        const status = error.response?.status;
        if (!status || status >= 500 || status === 408) {
          detailReady.value = false;
          detailError.value =
            "Chưa xác định được kết quả. " +
            "Hãy tải lại chi tiết đơn trước khi thao tác tiếp.";
          showStatusModal.value = false;
          showCodModal.value = false;
        }
        return null;
      }
      // API đã xác nhận ghi thành công.
      // Lỗi tải lại phía dưới không được báo thành lỗi ghi.
      const updated = response.data?.data;
      if (updated?.id && Number(updated.id) === Number(id)) {
        selectedOrder.value = updated;
        orders.value = orders.value.map((order) =>
          Number(order.id) === Number(id) ? updated : order,
        );
      } else {
        detailReady.value = false;
        detailError.value =
          "Đã cập nhật. Hãy tải lại chi tiết để xem dữ liệu mới.";
      }
      showStatusModal.value = false;
      showCodModal.value = false;
      resetStatusForm();
      codForm.received_payment = false;
      message.value =
        response.data?.message ||
        (kind === "status"
          ? "Cập nhật trạng thái thành công."
          : "Đã xác nhận thu tiền COD.");
      const results = await Promise.allSettled([
        fetchOrders({ silent: true }),
        fetchStatusCounts({ silent: true }),
      ]);
      if (results.some((result) => result.status === "rejected")) {
        warningMsg.value =
          "Đã lưu thành công nhưng chưa tải lại đầy đủ " +
          "danh sách/thống kê. Bấm Tải lại để cập nhật.";
      }
      return response;
    } finally {
      flag.value = false;
    }
  }
  function updateOrderStatus() {
    if (
      !showStatusModal.value ||
      !getNextStatuses(selectedOrder.value).some(
        (item) => item.value === statusForm.order_status,
      )
    ) {
      return null;
    }
    return mutateOrder("status", {
      order_status: statusForm.order_status,
      note: statusForm.note.trim() || null,
    });
  }
  function confirmCodPayment() {
    if (
      !showCodModal.value ||
      !codForm.received_payment ||
      !canConfirmCodPayment(selectedOrder.value)
    ) {
      return null;
    }
    return mutateOrder("cod", {
      received_payment: true,
    });
  }
  function setPage(page) {
    if (busy.value || page < 1 || page > meta.last_page) {
      return;
    }
    filters.page = page;
    return fetchOrders();
  }
  return {
    orders,
    selectedOrder,
    loading,
    loadingCounts,
    loadingDetail,
    detailReady,
    savingStatus,
    confirmingPayment,
    busy,
    showDetailModal,
    showStatusModal,
    showCodModal,
    message,
    warningMsg,
    errorMsg,
    detailError,
    errors,
    meta,
    statusCounts,
    filters,
    statusForm,
    codForm,
    totalRevenue,
    pendingOrders,
    shippingOrders,
    clearMessages,
    setErrors,
    fieldError,
    resetFilters,
    resetStatusForm,
    isPaid,
    paymentKnown,
    getNextStatuses,
    canUpdateStatus,
    canConfirmCodPayment,
    fetchOrders,
    fetchStatusCounts,
    loadData,
    fetchOrderDetail,
    openDetailModal,
    closeDetailModal,
    openStatusModal,
    closeStatusModal,
    openCodModal,
    closeCodModal,
    updateOrderStatus,
    confirmCodPayment,
    setPage,
  };
});
