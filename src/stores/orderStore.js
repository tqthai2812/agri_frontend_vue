import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import OrderService from "@/services/order.service";

export const useOrderStore = defineStore("order", () => {
  const orders = ref([]);
  const selectedOrder = ref(null);

  const loading = ref(false);
  const loadingDetail = ref(false);
  const savingStatus = ref(false);

  const showDetailModal = ref(false);
  const showStatusModal = ref(false);

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

  const totalRevenue = computed(() => {
    return orders.value
      .filter((order) => order.order_status === "completed")
      .reduce((total, order) => total + Number(order.total_payment || 0), 0);
  });

  const pendingOrders = computed(() => {
    return orders.value.filter((order) => order.order_status === "pending");
  });

  const shippingOrders = computed(() => {
    return orders.value.filter((order) => order.order_status === "shipping");
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
    filters.order_status = "";
    filters.payment_method = "";
    filters.date_from = "";
    filters.date_to = "";
    filters.page = 1;
  }

  function resetStatusForm() {
    statusForm.order_status = "";
    statusForm.note = "";

    clearMessages();
  }

  function getNextStatuses(status) {
    const map = {
      pending: [
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "cancelled", label: "Đã hủy" },
      ],
      confirmed: [
        { value: "shipping", label: "Đang giao" },
        { value: "cancelled", label: "Đã hủy" },
      ],
      shipping: [
        { value: "completed", label: "Hoàn thành" },
        { value: "cancelled", label: "Đã hủy" },
      ],
      completed: [],
      cancelled: [],
    };

    return map[status] || [];
  }

  function canUpdateStatus(order) {
    return getNextStatuses(order?.order_status).length > 0;
  }

  function getDefaultNextStatus(status) {
    const nextStatuses = getNextStatuses(status);

    return nextStatuses[0]?.value || "";
  }

  async function fetchOrders() {
    loading.value = true;
    clearMessages();

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

      orders.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || orders.value.length;

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
      const response = await OrderService.getStatusCounts();

      const data = response.data?.data || {};

      statusCounts.all = data.all || 0;
      statusCounts.pending = data.pending || 0;
      statusCounts.confirmed = data.confirmed || 0;
      statusCounts.shipping = data.shipping || 0;
      statusCounts.completed = data.completed || 0;
      statusCounts.cancelled = data.cancelled || 0;

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
      await Promise.all([fetchOrders(), fetchStatusCounts()]);
    } catch (error) {
      setErrors(error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrderDetail(id) {
    loadingDetail.value = true;
    clearMessages();

    try {
      const response = await OrderService.getOrder(id);

      selectedOrder.value = response.data?.data || null;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loadingDetail.value = false;
    }
  }

  async function openDetailModal(order) {
    selectedOrder.value = order;
    showDetailModal.value = true;

    await fetchOrderDetail(order.id);
  }

  function closeDetailModal() {
    showDetailModal.value = false;
    selectedOrder.value = null;
    clearMessages();
  }

  function openStatusModal(order) {
    resetStatusForm();

    selectedOrder.value = order;
    statusForm.order_status = getDefaultNextStatus(order.order_status);
    statusForm.note = "";

    showStatusModal.value = true;
  }

  function closeStatusModal() {
    showStatusModal.value = false;
    resetStatusForm();
  }

  async function updateOrderStatus() {
    if (!selectedOrder.value) {
      return;
    }

    savingStatus.value = true;
    clearMessages();

    try {
      const response = await OrderService.updateStatus(selectedOrder.value.id, {
        order_status: statusForm.order_status,
        note: statusForm.note || null,
      });

      const successMessage =
        response.data?.message || "Cập nhật trạng thái đơn hàng thành công.";

      await Promise.all([fetchOrders(), fetchStatusCounts()]);

      if (showDetailModal.value) {
        await fetchOrderDetail(selectedOrder.value.id);
      }

      closeStatusModal();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      savingStatus.value = false;
    }
  }

  function setPage(page) {
    filters.page = page;
    fetchOrders();
  }

  return {
    orders,
    selectedOrder,

    loading,
    loadingDetail,
    savingStatus,

    showDetailModal,
    showStatusModal,

    message,
    errorMsg,
    errors,

    meta,
    statusCounts,
    filters,
    statusForm,

    totalRevenue,
    pendingOrders,
    shippingOrders,

    clearMessages,
    setErrors,
    fieldError,

    resetFilters,
    resetStatusForm,

    getNextStatuses,
    canUpdateStatus,

    fetchOrders,
    fetchStatusCounts,
    loadData,
    fetchOrderDetail,

    openDetailModal,
    closeDetailModal,

    openStatusModal,
    closeStatusModal,
    updateOrderStatus,

    setPage,
  };
});
