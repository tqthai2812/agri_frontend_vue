import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import CartService from "@/services/cart.service";
import CheckoutService from "@/services/checkout.service";
import ShippingAddressService from "@/services/shippingAddress.service";

export const useCartStore = defineStore("cart", () => {
  const cart = ref(null);

  const checkoutOptions = ref({
    addresses: [],
    delivery_methods: [],
    payment_methods: [],
  });

  const checkoutPreview = ref(null);
  const createdOrder = ref(null);

  const loading = ref(false);
  const saving = ref(false);
  const previewing = ref(false);
  const checkingOut = ref(false);

  const message = ref("");
  const errorMsg = ref("");
  const errors = reactive({});

  const checkoutForm = reactive({
    cart_item_ids: [],

    shipping_address_id: "",

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

  const items = computed(() => {
    return cart.value?.items || [];
  });

  const subtotal = computed(() => {
    return Number(cart.value?.subtotal || 0);
  });

  const totalQuantity = computed(() => {
    return Number(cart.value?.total_quantity || 0);
  });

  const addresses = computed(() => {
    return checkoutOptions.value.addresses || [];
  });

  const deliveryMethods = computed(() => {
    return checkoutOptions.value.delivery_methods || [];
  });

  const paymentMethods = computed(() => {
    return checkoutOptions.value.payment_methods || [];
  });

  const selectedCheckoutItems = computed(() => {
    const selectedIds = checkoutForm.cart_item_ids.map(Number);

    return items.value.filter((item) => {
      return selectedIds.includes(Number(item.id));
    });
  });

  const checkoutSubtotal = computed(() => {
    if (checkoutPreview.value) {
      return Number(checkoutPreview.value.subtotal || 0);
    }

    return selectedCheckoutItems.value.reduce((sum, item) => {
      return (
        sum + Number(item.package?.price || 0) * Number(item.quantity || 0)
      );
    }, 0);
  });

  const checkoutTotalQuantity = computed(() => {
    if (checkoutPreview.value) {
      return Number(checkoutPreview.value.total_quantity || 0);
    }

    return selectedCheckoutItems.value.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);
  });

  const checkoutDeliveryCost = computed(() => {
    return Number(checkoutPreview.value?.delivery_cost || 0);
  });

  const checkoutDiscountAmount = computed(() => {
    return Number(checkoutPreview.value?.discount_amount || 0);
  });

  const checkoutTotalPayment = computed(() => {
    if (checkoutPreview.value) {
      return Number(checkoutPreview.value.total_payment || 0);
    }

    return Math.max(
      checkoutSubtotal.value +
        checkoutDeliveryCost.value -
        checkoutDiscountAmount.value,
      0,
    );
  });

  const appliedDiscount = computed(() => {
    return checkoutPreview.value?.discount || null;
  });

  const selectedAddress = computed(() => {
    const id = Number(checkoutForm.shipping_address_id);

    if (!id) {
      return null;
    }

    return (
      addresses.value.find((address) => {
        return Number(address.id) === id;
      }) || null
    );
  });

  const selectedDelivery = computed(() => {
    const id = Number(checkoutForm.delivery_id);

    return (
      deliveryMethods.value.find((method) => {
        return Number(method.id) === id;
      }) || null
    );
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

  function normalizeIds(ids = []) {
    if (typeof ids === "string") {
      ids = ids.split(",");
    }

    return [...new Set(ids.map((id) => Number(id)).filter(Boolean))];
  }

  function setCheckoutItemIds(ids = []) {
    checkoutForm.cart_item_ids = normalizeIds(ids);
  }

  function resetCheckoutState() {
    checkoutPreview.value = null;
    createdOrder.value = null;

    checkoutForm.cart_item_ids = [];
    checkoutForm.discount_code = "";
    checkoutForm.note = "";
    checkoutForm.payment_method = "COD";
  }

  function applyAddressToForm(address) {
    if (!address) {
      checkoutForm.shipping_address_id = "";
      checkoutForm.receiver_name = "";
      checkoutForm.receiver_phone = "";
      checkoutForm.province = "";
      checkoutForm.district = "";
      checkoutForm.ward = "";
      checkoutForm.province_id = "";
      checkoutForm.district_id = "";
      checkoutForm.ward_id = "";
      checkoutForm.address_detail = "";
      return;
    }

    checkoutForm.shipping_address_id = address.id;

    checkoutForm.receiver_name = address.receiver_name || "";
    checkoutForm.receiver_phone = address.receiver_phone || "";
    checkoutForm.province = address.province || "";
    checkoutForm.district = address.district || "";
    checkoutForm.ward = address.ward || "";
    checkoutForm.province_id = address.province_id || "";
    checkoutForm.district_id = address.district_id || "";
    checkoutForm.ward_id = address.ward_id || "";
    checkoutForm.address_detail = address.address_detail || "";
  }

  function selectAddress(addressId) {
    const address = addresses.value.find((item) => {
      return Number(item.id) === Number(addressId);
    });

    applyAddressToForm(address || null);
  }

  function selectDefaultAddress() {
    const defaultAddress =
      addresses.value.find((item) => item.is_default) ||
      addresses.value[0] ||
      null;

    applyAddressToForm(defaultAddress);
  }

  function selectDefaultDelivery() {
    if (checkoutForm.delivery_id) {
      return;
    }

    const defaultDelivery =
      deliveryMethods.value.find((item) => item.is_default) ||
      deliveryMethods.value[0] ||
      null;

    checkoutForm.delivery_id = defaultDelivery?.id || "";
  }

  function normalizeAddToCartPayload(input, quantity = 1) {
    if (input && typeof input === "object" && !Array.isArray(input)) {
      return {
        package_id: Number(input.package_id),
        quantity: Number(input.quantity || quantity || 1),
      };
    }

    return {
      package_id: Number(input),
      quantity: Number(quantity || 1),
    };
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

  async function addToCart(input, quantity = 1) {
    saving.value = true;
    clearMessages();

    try {
      const payload = normalizeAddToCartPayload(input, quantity);

      const response = await CartService.addItem(payload);

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
        quantity: Number(quantity),
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

      checkoutForm.cart_item_ids = checkoutForm.cart_item_ids.filter((id) => {
        return Number(id) !== Number(itemId);
      });

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
      checkoutForm.cart_item_ids = [];

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
    clearMessages();

    try {
      const response = await CheckoutService.getOptions();

      checkoutOptions.value = {
        addresses: response.data?.data?.addresses || [],
        delivery_methods: response.data?.data?.delivery_methods || [],
        payment_methods: response.data?.data?.payment_methods || [],
      };

      selectDefaultDelivery();

      if (!checkoutForm.shipping_address_id) {
        selectDefaultAddress();
      }

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }

  async function fetchAddresses() {
    clearMessages();

    try {
      const response = await ShippingAddressService.getAddresses();

      checkoutOptions.value.addresses = response.data?.data || [];

      if (!checkoutForm.shipping_address_id) {
        selectDefaultAddress();
      }

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }

  async function saveAddress(payload) {
    saving.value = true;
    clearMessages();

    try {
      const response = payload.id
        ? await ShippingAddressService.update(payload.id, payload)
        : await ShippingAddressService.create(payload);

      await fetchAddresses();

      const savedAddress = response.data?.data || null;

      if (savedAddress) {
        selectAddress(savedAddress.id);
      }

      message.value = response.data?.message || "Lưu địa chỉ thành công.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function removeAddress(addressId) {
    saving.value = true;
    clearMessages();

    try {
      const response = await ShippingAddressService.remove(addressId);

      await fetchAddresses();

      if (Number(checkoutForm.shipping_address_id) === Number(addressId)) {
        selectDefaultAddress();
      }

      message.value = response.data?.message || "Xóa địa chỉ thành công.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function setDefaultAddress(addressId) {
    saving.value = true;
    clearMessages();

    try {
      const response = await ShippingAddressService.setDefault(addressId);

      await fetchAddresses();
      selectAddress(addressId);

      message.value = response.data?.message || "Đã đặt địa chỉ mặc định.";

      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  function buildPreviewPayload(itemIds = null) {
    const ids = normalizeIds(itemIds || checkoutForm.cart_item_ids);

    return {
      cart_item_ids: ids,
      delivery_id: checkoutForm.delivery_id,
      discount_code: checkoutForm.discount_code || null,
    };
  }

  async function previewCheckout(itemIds = null) {
    previewing.value = true;
    clearMessages();

    try {
      const payload = buildPreviewPayload(itemIds);

      if (!payload.cart_item_ids.length) {
        throw new Error("Vui lòng chọn sản phẩm cần thanh toán.");
      }

      const response = await CheckoutService.preview(payload);

      checkoutPreview.value = response.data?.data || null;

      return response;
    } catch (error) {
      checkoutPreview.value = null;

      if (error.response) {
        setErrors(error);
      } else {
        errorMsg.value = error.message || "Không tính được đơn hàng.";
      }

      throw error;
    } finally {
      previewing.value = false;
    }
  }

  function buildCheckoutPayload(itemIds = null) {
    const ids = normalizeIds(itemIds || checkoutForm.cart_item_ids);

    const payload = {
      cart_item_ids: ids,

      shipping_address_id: checkoutForm.shipping_address_id || null,

      delivery_id: checkoutForm.delivery_id,
      discount_code: checkoutForm.discount_code || null,
      payment_method: checkoutForm.payment_method || "COD",
      note: checkoutForm.note || null,
    };

    if (!payload.shipping_address_id) {
      payload.receiver_name = checkoutForm.receiver_name;
      payload.receiver_phone = checkoutForm.receiver_phone;
      payload.province = checkoutForm.province;
      payload.district = checkoutForm.district;
      payload.ward = checkoutForm.ward;
      payload.province_id = checkoutForm.province_id || null;
      payload.district_id = checkoutForm.district_id || null;
      payload.ward_id = checkoutForm.ward_id || null;
      payload.address_detail = checkoutForm.address_detail;
    }

    return payload;
  }

  async function checkout(itemIds = null) {
    checkingOut.value = true;
    clearMessages();

    try {
      const payload = buildCheckoutPayload(itemIds);

      if (!payload.cart_item_ids.length) {
        throw new Error("Vui lòng chọn sản phẩm cần thanh toán.");
      }

      const response = await CheckoutService.checkout(payload);

      createdOrder.value = response.data?.data?.order || null;
      message.value = response.data?.message || "Đặt hàng thành công.";

      await fetchCart();

      checkoutPreview.value = null;
      checkoutForm.cart_item_ids = [];

      return response;
    } catch (error) {
      if (error.response) {
        setErrors(error);
      } else {
        errorMsg.value = error.message || "Không đặt được đơn hàng.";
      }

      throw error;
    } finally {
      checkingOut.value = false;
    }
  }

  async function loadCheckoutData(itemIds = []) {
    loading.value = true;
    clearMessages();

    try {
      setCheckoutItemIds(itemIds);

      await Promise.all([fetchCart(), fetchCheckoutOptions()]);

      const validIds = items.value
        .filter((item) => {
          return checkoutForm.cart_item_ids.includes(Number(item.id));
        })
        .map((item) => Number(item.id));

      setCheckoutItemIds(validIds);

      if (checkoutForm.cart_item_ids.length > 0 && checkoutForm.delivery_id) {
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
    addresses,
    deliveryMethods,
    paymentMethods,

    checkoutPreview,
    createdOrder,
    checkoutForm,

    selectedCheckoutItems,
    checkoutSubtotal,
    checkoutTotalQuantity,
    checkoutDeliveryCost,
    checkoutDiscountAmount,
    checkoutTotalPayment,
    appliedDiscount,
    selectedAddress,
    selectedDelivery,

    loading,
    saving,
    previewing,
    checkingOut,

    message,
    errorMsg,
    errors,

    clearMessages,
    setErrors,
    fieldError,

    normalizeIds,
    setCheckoutItemIds,
    resetCheckoutState,

    applyAddressToForm,
    selectAddress,
    selectDefaultAddress,
    selectDefaultDelivery,

    fetchCart,
    addToCart,
    updateItem,
    removeItem,
    clearCart,

    fetchCheckoutOptions,
    fetchAddresses,
    saveAddress,
    removeAddress,
    setDefaultAddress,

    buildPreviewPayload,
    previewCheckout,
    buildCheckoutPayload,
    checkout,
    loadCheckoutData,
  };
});
