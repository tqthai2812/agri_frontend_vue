import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import DeliveryMethodService from "@/services/deliveryMethod.service";

export const useDeliveryMethodStore = defineStore("deliveryMethod", () => {
  const deliveryMethods = ref([]);
  const selectedMethod = ref(null);

  const loading = ref(false);
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

  const filters = reactive({
    search: "",
    is_active: "",
    region: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    name: "",
    description: "",
    base_price: 0,
    min_order_amount: 0,
    region: "",
    is_active: true,
    is_default: false,
  });

  const activeMethods = computed(() => {
    return deliveryMethods.value.filter((item) => item.is_active);
  });

  const inactiveMethods = computed(() => {
    return deliveryMethods.value.filter((item) => !item.is_active);
  });

  const defaultMethod = computed(() => {
    return deliveryMethods.value.find((item) => item.is_default) || null;
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
    selectedMethod.value = null;

    form.name = "";
    form.description = "";
    form.base_price = 0;
    form.min_order_amount = 0;
    form.region = "";
    form.is_active = true;
    form.is_default = false;

    clearMessages();
  }

  function openCreateModal() {
    resetForm();
    showModal.value = true;
  }

  function openEditModal(method) {
    clearMessages();

    selectedMethod.value = method;

    form.name = method.name || "";
    form.description = method.description || "";
    form.base_price = Number(method.base_price || 0);
    form.min_order_amount = Number(method.min_order_amount || 0);
    form.region = method.region || "";
    form.is_active = Boolean(method.is_active);
    form.is_default = Boolean(method.is_default);

    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
    resetForm();
  }

  function buildPayload() {
    return {
      name: form.name,
      description: form.description,
      base_price: Number(form.base_price || 0),
      min_order_amount: Number(form.min_order_amount || 0),
      region: form.region,
      is_active: Boolean(form.is_active),
      is_default: Boolean(form.is_default),
    };
  }

  async function fetchDeliveryMethods() {
    loading.value = true;
    clearMessages();

    try {
      const response = await DeliveryMethodService.getDeliveryMethods({
        search: filters.search || undefined,
        is_active: filters.is_active !== "" ? filters.is_active : undefined,
        region: filters.region || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      deliveryMethods.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || deliveryMethods.value.length;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function saveDeliveryMethod() {
    saving.value = true;
    clearMessages();

    try {
      const payload = buildPayload();

      let response;

      if (selectedMethod.value) {
        response = await DeliveryMethodService.updateDeliveryMethod(
          selectedMethod.value.id,
          payload,
        );
        message.value =
          response.data?.message ||
          "Cập nhật phương thức giao hàng thành công.";
      } else {
        response = await DeliveryMethodService.createDeliveryMethod(payload);
        message.value =
          response.data?.message || "Thêm phương thức giao hàng thành công.";
      }

      const successMessage = message.value;

      await fetchDeliveryMethods();

      closeModal();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteDeliveryMethod(method) {
    deleting.value = true;
    clearMessages();

    try {
      const response = await DeliveryMethodService.deleteDeliveryMethod(
        method.id,
      );

      const successMessage =
        response.data?.message || "Xóa phương thức giao hàng thành công.";

      await fetchDeliveryMethods();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  async function toggleActive(method) {
    saving.value = true;
    clearMessages();

    try {
      const response = await DeliveryMethodService.updateDeliveryMethod(
        method.id,
        {
          name: method.name,
          description: method.description,
          base_price: method.base_price,
          min_order_amount: method.min_order_amount,
          region: method.region,
          is_active: !method.is_active,
          is_default: method.is_default,
        },
      );

      const successMessage =
        response.data?.message || "Cập nhật trạng thái thành công.";

      await fetchDeliveryMethods();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function setDefault(method) {
    saving.value = true;
    clearMessages();

    try {
      const response = await DeliveryMethodService.updateDeliveryMethod(
        method.id,
        {
          name: method.name,
          description: method.description,
          base_price: method.base_price,
          min_order_amount: method.min_order_amount,
          region: method.region,
          is_active: method.is_active,
          is_default: true,
        },
      );

      const successMessage =
        response.data?.message || "Đặt mặc định thành công.";

      await fetchDeliveryMethods();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  function resetFilters() {
    filters.search = "";
    filters.is_active = "";
    filters.region = "";
    filters.page = 1;
  }

  function setPage(page) {
    filters.page = page;
    fetchDeliveryMethods();
  }

  return {
    deliveryMethods,
    selectedMethod,

    loading,
    saving,
    deleting,

    showModal,

    message,
    errorMsg,
    errors,

    meta,
    filters,
    form,

    activeMethods,
    inactiveMethods,
    defaultMethod,

    clearMessages,
    setErrors,
    fieldError,

    resetForm,
    openCreateModal,
    openEditModal,
    closeModal,

    fetchDeliveryMethods,
    saveDeliveryMethod,
    deleteDeliveryMethod,
    toggleActive,
    setDefault,

    resetFilters,
    setPage,
  };
});
