import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import CartService from "@/services/cart.service";
import CheckoutService from "@/services/checkout.service";

export const useCartStore = defineStore("cart", () => {
  const cart = ref(null);
  const checkoutOptions = ref({
    delivery_methods: [],
    payment_methods: [],
  });
  const checkoutPreview = ref(null);
  const createdOrder = ref(null);

  const loading = ref(false);
  const saving = ref(false);
  const checkingOut = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const checkoutForm = reactive({
    delivery_id: "",
    discount_code: "",
    payment_method: "COD",
    note: "",

    receiver_name: "",
    receiver_phone: "",
    province: "",
    district: "",
    ward: "",
    province_id: "",
    district_id: "",
    ward_id: "",
    address_detail: "",
  });

  const items = computed(() => cart.value?.items || []);
  const subtotal = computed(() => Number(cart.value?.subtotal || 0));
  const totalQuantity = computed(() => Number(cart.value?.total_quantity || 0));

  function clearMessages() {
    message.value = "";
    errorMsg.value = "";
    Object.keys(errors).forEach((key) => delete errors[key]);
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

  async function fetchCart() {
    loading.value = true;
    clearMessages();

    try {
      const response = await CartService.getCart();
      cart.value = response.data?.data || null;
      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(packageId, quantity = 1) {
    saving.value = true;
    clearMessages();

    try {
      const response = await CartService.addItem({
        package_id: packageId,
        quantity,
      });

      cart.value = response.data?.data || null;
      message.value = response.data?.message || "Thêm vào giỏ hàng thành công.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function updateItem(itemId, quantity) {
    saving.value = true;
    clearMessages();

    try {
      const response = await CartService.updateItem(itemId, {
        quantity,
      });

      cart.value = response.data?.data || null;
      message.value = response.data?.message || "Cập nhật giỏ hàng thành công.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function removeItem(itemId) {
    saving.value = true;
    clearMessages();

    try {
      const response = await CartService.removeItem(itemId);

      cart.value = response.data?.data || null;
      message.value = response.data?.message || "Xóa sản phẩm thành công.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function clearCart() {
    saving.value = true;
    clearMessages();

    try {
      const response = await CartService.clearCart();

      cart.value = response.data?.data || null;
      checkoutPreview.value = null;
      message.value = response.data?.message || "Đã xóa giỏ hàng.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function fetchCheckoutOptions() {
    try {
      const response = await CheckoutService.getOptions();

      checkoutOptions.value = response.data?.data || {
        delivery_methods: [],
        payment_methods: [],
      };

      if (!checkoutForm.delivery_id) {
        const defaultDelivery =
          checkoutOptions.value.delivery_methods.find(
            (item) => item.is_default,
          ) || checkoutOptions.value.delivery_methods[0];

        checkoutForm.delivery_id = defaultDelivery?.id || "";
      }

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }

  async function previewCheckout() {
    clearMessages();

    try {
      const response = await CheckoutService.preview({
        delivery_id: checkoutForm.delivery_id,
        discount_code: checkoutForm.discount_code || null,
      });

      checkoutPreview.value = response.data?.data || null;

      return response;
    } catch (error) {
      checkoutPreview.value = null;
      setErrors(error);
      throw error;
    }
  }

  async function checkout() {
    checkingOut.value = true;
    clearMessages();

    try {
      const payload = {
        delivery_id: checkoutForm.delivery_id,
        discount_code: checkoutForm.discount_code || null,
        payment_method: checkoutForm.payment_method,
        note: checkoutForm.note || null,

        receiver_name: checkoutForm.receiver_name,
        receiver_phone: checkoutForm.receiver_phone,
        province: checkoutForm.province,
        district: checkoutForm.district,
        ward: checkoutForm.ward,
        province_id: checkoutForm.province_id || null,
        district_id: checkoutForm.district_id || null,
        ward_id: checkoutForm.ward_id || null,
        address_detail: checkoutForm.address_detail,
      };

      const response = await CheckoutService.checkout(payload);

      createdOrder.value = response.data?.data?.order || null;
      message.value = response.data?.message || "Đặt hàng thành công.";

      await fetchCart();

      checkoutPreview.value = null;

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      checkingOut.value = false;
    }
  }

  async function loadCheckoutData() {
    loading.value = true;
    clearMessages();

    try {
      await Promise.all([fetchCart(), fetchCheckoutOptions()]);

      if (items.value.length > 0 && checkoutForm.delivery_id) {
        await previewCheckout();
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    cart,
    items,
    subtotal,
    totalQuantity,

    checkoutOptions,
    checkoutPreview,
    createdOrder,
    checkoutForm,

    loading,
    saving,
    checkingOut,

    message,
    errorMsg,
    errors,

    clearMessages,
    setErrors,
    fieldError,

    fetchCart,
    addToCart,
    updateItem,
    removeItem,
    clearCart,

    fetchCheckoutOptions,
    previewCheckout,
    checkout,
    loadCheckoutData,
  };
});
