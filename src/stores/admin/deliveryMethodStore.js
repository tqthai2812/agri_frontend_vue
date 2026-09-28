import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import DeliveryMethodService from "@/services/admin/deliveryMethod.service";
import LocationService from "@/services/client/location.service";

export const useDeliveryMethodStore = defineStore("deliveryMethod", () => {
  const deliveryMethods = ref([]);
  const selectedMethod = ref(null);

  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const showModal = ref(false);

  const shippingRegions = ref([]);
  const regionsLoading = ref(false);
  const regionsLoaded = ref(false);
  const regionsError = ref("");

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  let listVersion = 0;

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

  const emptyForm = () => ({
    name: "",
    description: "",
    base_price: 0,
    min_order_amount: 0,
    region: "",
    is_active: true,
    is_default: false,
  });

  const form = reactive(emptyForm());

  function isTrue(value) {
    return value === true || value === 1 || value === "1";
  }

  const activeMethods = computed(() =>
    deliveryMethods.value.filter((item) => isTrue(item.is_active)),
  );

  const inactiveMethods = computed(() =>
    deliveryMethods.value.filter((item) => !isTrue(item.is_active)),
  );

  const defaultMethod = computed(
    () => deliveryMethods.value.find((item) => isTrue(item.is_default)) || null,
  );

  const busy = computed(() => saving.value || deleting.value);

  const formRegionValid = computed(() => {
    if (!regionsLoaded.value) return false;

    const value = String(form.region ?? "").trim();

    return (
      value === "" ||
      shippingRegions.value.some((region) => region.value === value)
    );
  });

  function clearMessages() {
    message.value = "";
    errorMsg.value = "";

    Object.keys(errors).forEach((key) => {
      delete errors[key];
    });
  }

  function errorText(error, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
    const first = Object.values(error.response?.data?.errors || {})[0];

    return (
      (Array.isArray(first) ? first[0] : first) ||
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }

  function setErrors(error) {
    clearMessages();

    Object.entries(error.response?.data?.errors || {}).forEach(
      ([key, value]) => {
        errors[key] = Array.isArray(value)
          ? value[0] || ""
          : String(value || "");
      },
    );

    errorMsg.value = errorText(error);
  }

  function fieldError(key) {
    return errors[key] || "";
  }

  function regionLabel(value) {
    if (value === null) return "Toàn quốc";

    const code = String(value ?? "").trim();

    if (!code) return "Chưa chuẩn hóa khu vực";

    const region = shippingRegions.value.find((item) => item.value === code);

    if (region) return region.label;

    return regionsLoaded.value ? `Cần cập nhật: ${code}` : code;
  }

  async function fetchShippingRegions() {
    if (regionsLoading.value) return;

    regionsLoading.value = true;
    regionsError.value = "";

    try {
      const response = await LocationService.getShippingRegions();
      const data = response.data?.data;

      if (
        !Array.isArray(data) ||
        data.some(
          (item) =>
            !item ||
            typeof item.value !== "string" ||
            !item.value.trim() ||
            typeof item.label !== "string" ||
            !item.label.trim(),
        )
      ) {
        throw new Error("Danh sách vùng giao hàng không hợp lệ.");
      }

      shippingRegions.value = data.map((item) => ({
        ...item,
        value: item.value.trim(),
        label: item.label.trim(),
      }));

      regionsLoaded.value = true;

      return response;
    } catch (error) {
      regionsLoaded.value = false;
      regionsError.value = errorText(
        error,
        "Không tải được danh sách vùng giao hàng.",
      );

      throw error;
    } finally {
      regionsLoading.value = false;
    }
  }

  function resetForm() {
    selectedMethod.value = null;
    Object.assign(form, emptyForm());
    clearMessages();
  }

  function openCreateModal() {
    if (busy.value) return;

    resetForm();
    showModal.value = true;
  }

  function openEditModal(method) {
    if (busy.value) return;

    clearMessages();
    selectedMethod.value = method;

    Object.assign(form, {
      name: method.name || "",
      description: method.description || "",
      base_price: Number(method.base_price ?? 0),
      min_order_amount: Number(method.min_order_amount ?? 0),
      region: method.region ?? "",
      is_active: isTrue(method.is_active),
      is_default: isTrue(method.is_default),
    });

    showModal.value = true;
  }

  function closeModal() {
    if (busy.value) return;

    showModal.value = false;
    resetForm();
  }

  function buildPayload() {
    return {
      name: String(form.name || "").trim(),
      description: String(form.description || "").trim() || null,
      base_price: Number(form.base_price),
      min_order_amount: Number(form.min_order_amount),
      region: String(form.region || "").trim() || null,
      is_active: isTrue(form.is_active),
      is_default: isTrue(form.is_default),
    };
  }

  async function fetchDeliveryMethods({ preserveMessages = false } = {}) {
    const version = ++listVersion;
    loading.value = true;

    if (!preserveMessages) clearMessages();

    try {
      const response = await DeliveryMethodService.getDeliveryMethods({
        search: filters.search || undefined,
        is_active: filters.is_active !== "" ? filters.is_active : undefined,
        region: filters.region || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      if (version !== listVersion) return response;

      deliveryMethods.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = Number(responseMeta.current_page ?? 1);
      meta.last_page = Number(responseMeta.last_page ?? 1);
      meta.per_page = Number(responseMeta.per_page ?? filters.per_page);
      meta.total = Number(responseMeta.total ?? deliveryMethods.value.length);

      return response;
    } catch (error) {
      if (version === listVersion && !preserveMessages) {
        setErrors(error);
      }

      throw error;
    } finally {
      if (version === listVersion) {
        loading.value = false;
      }
    }
  }

  async function refreshAfterWrite(successMessage) {
    try {
      await fetchDeliveryMethods({ preserveMessages: true });
    } catch {
      errorMsg.value =
        "Thao tác đã thành công nhưng chưa tải lại được danh sách. Vui lòng bấm Tải lại.";
    }

    message.value = successMessage;
  }

  async function saveDeliveryMethod() {
    if (busy.value) return;

    clearMessages();

    if (!formRegionValid.value) {
      const error = new Error(
        regionsLoaded.value
          ? "Vui lòng chọn lại khu vực trong danh sách."
          : "Vui lòng tải danh sách vùng giao hàng trước khi lưu.",
      );

      errors.region = error.message;
      errorMsg.value = error.message;
      throw error;
    }

    saving.value = true;

    try {
      const payload = buildPayload();
      const editing = Boolean(selectedMethod.value);

      const response = editing
        ? await DeliveryMethodService.updateDeliveryMethod(
            selectedMethod.value.id,
            payload,
          )
        : await DeliveryMethodService.createDeliveryMethod(payload);

      const successMessage =
        response.data?.message ||
        (editing
          ? "Cập nhật phương thức giao hàng thành công."
          : "Thêm phương thức giao hàng thành công.");

      // API đã xác nhận lưu thành công.
      showModal.value = false;
      resetForm();

      await refreshAfterWrite(successMessage);

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteDeliveryMethod(method) {
    if (busy.value) return;

    deleting.value = true;
    clearMessages();

    try {
      const response = await DeliveryMethodService.deleteDeliveryMethod(
        method.id,
      );

      if (deliveryMethods.value.length === 1 && filters.page > 1) {
        filters.page--;
      }

      await refreshAfterWrite(
        response.data?.message || "Xóa phương thức giao hàng thành công.",
      );

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  async function updateFlags(method, flags, fallback) {
    if (busy.value) return;

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
          region: String(method.region || "").trim() || null,
          is_active: isTrue(method.is_active),
          is_default: isTrue(method.is_default),
          ...flags,
        },
      );

      await refreshAfterWrite(response.data?.message || fallback);

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  function toggleActive(method) {
    return updateFlags(
      method,
      { is_active: !isTrue(method.is_active) },
      "Cập nhật trạng thái thành công.",
    );
  }

  function setDefault(method) {
    return updateFlags(
      method,
      { is_default: true },
      "Đặt mặc định thành công.",
    );
  }

  function resetFilters() {
    filters.search = "";
    filters.is_active = "";
    filters.region = "";
    filters.page = 1;
  }

  function setPage(page) {
    filters.page = page;
    return fetchDeliveryMethods();
  }

  return {
    deliveryMethods,
    selectedMethod,

    loading,
    saving,
    deleting,
    busy,
    showModal,

    shippingRegions,
    regionsLoading,
    regionsLoaded,
    regionsError,
    formRegionValid,

    message,
    errorMsg,
    errors,

    meta,
    filters,
    form,

    activeMethods,
    inactiveMethods,
    defaultMethod,

    isTrue,
    regionLabel,
    clearMessages,
    setErrors,
    fieldError,

    resetForm,
    openCreateModal,
    openEditModal,
    closeModal,

    fetchShippingRegions,
    fetchDeliveryMethods,
    saveDeliveryMethod,
    deleteDeliveryMethod,
    toggleActive,
    setDefault,

    resetFilters,
    setPage,
  };
});
