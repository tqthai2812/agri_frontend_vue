import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import DiscountService from "@/services/discount.service";

export const useDiscountStore = defineStore("discount", () => {
  const discounts = ref([]);
  let fetchVersion = 0;
  const selectedDiscount = ref(null);

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
    status: "",
    discount_scope: "",
    page: 1,
    per_page: 15,
  });

  const form = reactive({
    discount_scope: "order",
    lot_id: "",
    starts_at: "",
    show_in_wallet: true,
    user_id: "",
    discount_code: "",
    discount_description: "",
    discount_percent: 10,
    max_discount_amount: 0,
    min_order_value: 0,
    usage_limit: "",
    used_count: 0,
    expire_date: "",
    is_active: true,
  });

  const availableDiscounts = computed(() => {
    return discounts.value.filter((item) => item.status === "available");
  });

  const expiredDiscounts = computed(() => {
    return discounts.value.filter((item) => item.status === "expired");
  });

  const inactiveDiscounts = computed(() => {
    return discounts.value.filter((item) => item.status === "inactive");
  });

  const usedUpDiscounts = computed(() => {
    return discounts.value.filter((item) => item.status === "used_up");
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
    selectedDiscount.value = null;

    form.discount_scope = "order";
    form.lot_id = "";
    form.starts_at = "";
    form.show_in_wallet = true;
    form.user_id = "";
    form.discount_code = "";
    form.discount_description = "";
    form.discount_percent = 10;
    form.max_discount_amount = 0;
    form.min_order_value = 0;
    form.usage_limit = "";
    form.used_count = 0;
    form.expire_date = "";
    form.is_active = true;

    clearMessages();
  }

  function openCreateModal() {
    resetForm();
    showModal.value = true;
  }

  function openEditModal(discount) {
    clearMessages();

    selectedDiscount.value = discount;

    form.discount_scope = discount.discount_scope || "order";
    form.lot_id = discount.lot_id || "";
    form.starts_at = String(discount.starts_at || "")
      .replace(" ", "T")
      .slice(0, 16);
    form.show_in_wallet = Boolean(discount.show_in_wallet);
    form.user_id = discount.user_id || "";
    form.discount_code = discount.discount_code || "";
    form.discount_description = discount.discount_description || "";
    form.discount_percent = Number(discount.discount_percent || 0);
    form.max_discount_amount = Number(discount.max_discount_amount || 0);
    form.min_order_value = Number(discount.min_order_value || 0);
    form.usage_limit = discount.usage_limit ?? "";
    form.used_count = Number(discount.used_count || 0);
    form.expire_date = discount.expire_date || "";
    form.is_active = Boolean(discount.is_active);

    showModal.value = true;
  }

  function closeModal() {
    if (saving.value) return;
    showModal.value = false;
    resetForm();
  }

  function buildPayload() {
    return {
      discount_scope: form.discount_scope,
      lot_id:
        form.discount_scope === "lot" ? Number(form.lot_id) || null : null,
      starts_at: form.starts_at
        ? form.starts_at.replace("T", " ") + ":00"
        : null,
      show_in_wallet: Boolean(form.show_in_wallet),
      user_id: form.user_id || null,
      discount_code: String(form.discount_code || "")
        .trim()
        .toUpperCase(),
      discount_description: form.discount_description,
      discount_percent: Number(form.discount_percent || 0),
      max_discount_amount: Number(form.max_discount_amount || 0),
      min_order_value: Number(form.min_order_value || 0),
      usage_limit:
        form.discount_scope === "lot" || form.usage_limit === ""
          ? null
          : Number(form.usage_limit),
      expire_date: form.expire_date,
      is_active: Boolean(form.is_active),
    };
  }

  async function fetchDiscounts() {
    const version = ++fetchVersion;
    loading.value = true;
    clearMessages();

    try {
      const response = await DiscountService.getDiscounts({
        search: filters.search || undefined,
        is_active: filters.is_active !== "" ? filters.is_active : undefined,
        status: filters.status || undefined,
        discount_scope: filters.discount_scope || undefined,
        page: filters.page,
        per_page: filters.per_page,
      });

      if (version !== fetchVersion) return response;
      discounts.value = response.data?.data || [];

      const responseMeta = response.data?.meta || {};

      meta.current_page = responseMeta.current_page || 1;
      meta.last_page = responseMeta.last_page || 1;
      meta.per_page = responseMeta.per_page || filters.per_page;
      meta.total = responseMeta.total || discounts.value.length;

      return response;
    } catch (error) {
      if (version !== fetchVersion) return;
      discounts.value = [];
      setErrors(error);
      throw error;
    } finally {
      if (version === fetchVersion) loading.value = false;
    }
  }

  async function saveDiscount() {
    if (saving.value) return;
    saving.value = true;
    clearMessages();

    try {
      const payload = buildPayload();

      let response;

      if (selectedDiscount.value) {
        response = await DiscountService.updateDiscount(
          selectedDiscount.value.id,
          payload,
        );
        message.value =
          response.data?.message || "Cập nhật giảm giá thành công.";
      } else {
        response = await DiscountService.createDiscount(payload);
        message.value = response.data?.message || "Thêm giảm giá thành công.";
      }

      const successMessage = message.value;

      showModal.value = false;
      resetForm();
      try {
        await fetchDiscounts();
      } catch {
        /* Save succeeded; offer Reload without another POST. */
      }
      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function deleteDiscount(discount) {
    deleting.value = true;
    clearMessages();

    try {
      const response = await DiscountService.deleteDiscount(discount.id);

      const successMessage =
        response.data?.message || "Xóa giảm giá thành công.";

      await fetchDiscounts();

      message.value = successMessage;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      deleting.value = false;
    }
  }

  async function toggleActive(discount) {
    saving.value = true;
    clearMessages();

    try {
      const response = await DiscountService.updateDiscount(discount.id, {
        is_active: !discount.is_active,
      });

      const successMessage =
        response.data?.message || "Cập nhật trạng thái thành công.";

      await fetchDiscounts();

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
    filters.status = "";
    filters.discount_scope = "";
    filters.page = 1;
  }

  function setPage(page) {
    filters.page = page;
    fetchDiscounts().catch(() => {});
  }

  return {
    discounts,
    selectedDiscount,

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

    availableDiscounts,
    expiredDiscounts,
    inactiveDiscounts,
    usedUpDiscounts,

    clearMessages,
    setErrors,
    fieldError,

    resetForm,
    openCreateModal,
    openEditModal,
    closeModal,

    fetchDiscounts,
    saveDiscount,
    deleteDiscount,
    toggleActive,

    resetFilters,
    setPage,
  };
});
