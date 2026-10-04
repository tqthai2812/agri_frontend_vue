import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import CartService from "@/services/client/cart.service";
import CheckoutService from "@/services/client/checkout.service";
import ShippingAddressService from "@/services/client/shippingAddress.service";
export const useCartStore = defineStore("cart", () => {
  const cart = ref(null);
  const checkoutOptions = ref({
    addresses: [],
    delivery_methods: [],
    payment_methods: [],
  });
  const checkoutPreview = ref(null);
  const createdOrder = ref(null);
  const checkoutUncertain = ref(false);
  const loadingCount = ref(0);
  const loading = computed(() => loadingCount.value > 0);
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
  const addressFields = [
    "receiver_name",
    "receiver_phone",
    "province",
    "district",
    "ward",
    "province_id",
    "district_id",
    "ward_id",
    "address_detail",
  ];
  const requiredAddressFields = [
    "receiver_name",
    "receiver_phone",
    "province_id",
    "ward_id",
    "address_detail",
  ];
  let cartRequestVersion = 0;
  let optionsVersion = 0;
  let previewVersion = 0;
  const addressRevision = ref(0);
  const items = computed(() => cart.value?.items || []);
  const subtotal = computed(() => Number(cart.value?.subtotal ?? 0));
  const totalQuantity = computed(() => Number(cart.value?.total_quantity ?? 0));
  const addresses = computed(() => checkoutOptions.value.addresses || []);
  const deliveryMethods = computed(
    () => checkoutOptions.value.delivery_methods || [],
  );
  const paymentMethods = computed(
    () => checkoutOptions.value.payment_methods || [],
  );
  const selectedCheckoutItems = computed(() => {
    const ids = new Set(normalizeIds(checkoutForm.cart_item_ids));
    return items.value.filter((item) => ids.has(Number(item.id)));
  });
  const checkoutSubtotal = computed(() => {
    if (checkoutPreview.value) {
      return Number(checkoutPreview.value.subtotal ?? 0);
    }
    return selectedCheckoutItems.value.reduce(
      (sum, item) =>
        sum +
        Number(item.package?.price ?? item.price ?? 0) *
          Number(item.quantity ?? 0),
      0,
    );
  });
  const checkoutTotalQuantity = computed(() => {
    if (checkoutPreview.value) {
      return Number(checkoutPreview.value.total_quantity ?? 0);
    }
    return selectedCheckoutItems.value.reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0,
    );
  });
  // Chưa có preview thì chưa biết phí/tổng thanh toán.
  const checkoutDeliveryCost = computed(() =>
    checkoutPreview.value
      ? Number(checkoutPreview.value.delivery_cost ?? 0)
      : null,
  );
  const checkoutDiscountAmount = computed(() =>
    checkoutPreview.value
      ? Number(checkoutPreview.value.discount_amount ?? 0)
      : null,
  );
  const checkoutTotalPayment = computed(() =>
    checkoutPreview.value
      ? Number(checkoutPreview.value.total_payment ?? 0)
      : null,
  );
  const appliedDiscount = computed(
    () => checkoutPreview.value?.discount || null,
  );
  const selectedAddress = computed(
    () =>
      addresses.value.find(
        (address) =>
          Number(address.id) === Number(checkoutForm.shipping_address_id),
      ) || null,
  );
  const selectedDelivery = computed(
    () =>
      deliveryMethods.value.find(
        (method) => Number(method.id) === Number(checkoutForm.delivery_id),
      ) || null,
  );
  const hasCheckoutAddress = computed(() => {
    if (checkoutForm.shipping_address_id) {
      const address = selectedAddress.value;
      return Boolean(
        address &&
        address.province_id &&
        address.ward_id &&
        !String(address.district || "").trim() &&
        !String(address.district_id || "").trim(),
      );
    }
    return requiredAddressFields.every((field) =>
      String(checkoutForm[field] ?? "").trim(),
    );
  });
  const canPreview = computed(
    () =>
      checkoutForm.cart_item_ids.length > 0 &&
      Boolean(selectedDelivery.value) &&
      hasCheckoutAddress.value,
  );
  function clearMessages() {
    message.value = "";
    errorMsg.value = "";
    Object.keys(errors).forEach((key) => delete errors[key]);
  }
  function setErrors(error) {
    clearMessages();
    Object.entries(error?.response?.data?.errors || {}).forEach(
      ([key, value]) => {
        errors[key] = Array.isArray(value)
          ? value[0] || ""
          : String(value || "");
      },
    );
    errorMsg.value =
      Object.values(errors)[0] ||
      error?.response?.data?.message ||
      error?.message ||
      "Có lỗi xảy ra. Vui lòng thử lại.";
  }
  function fieldError(key) {
    return errors[key] || "";
  }
  function normalizeIds(ids = []) {
    const values =
      typeof ids === "string" ? ids.split(",") : Array.isArray(ids) ? ids : [];
    return [
      ...new Set(
        values.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    ];
  }
  function positiveInteger(value, label) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1) {
      throw new Error(`${label} phải là số nguyên lớn hơn 0.`);
    }
    return number;
  }
  function isTrue(value) {
    return value === true || value === 1 || value === "1";
  }
  function isFalse(value) {
    return value === false || value === 0 || value === "0";
  }
  function sellableQuantity(item) {
    const raw = item?.available_to_sell ?? item?.package?.available_to_sell;
    if (raw === null || raw === undefined || raw === "") {
      return null;
    }
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  function itemUnavailableReason(item) {
    const product =
      item?.package?.variant?.product ||
      item?.variant?.product ||
      item?.product;
    if (!item?.package || !product) {
      return "Sản phẩm không còn tồn tại.";
    }
    if (isFalse(product.is_show)) {
      return "Sản phẩm hiện ngừng bán.";
    }
    const quantity = Number(item.quantity);
    const stock = sellableQuantity(item);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return "Số lượng sản phẩm không hợp lệ.";
    }
    if (stock === null) {
      return "Chưa xác định được lượng có thể bán. Vui lòng tải lại giỏ.";
    }
    if (stock === 0) {
      return "Sản phẩm đã hết hàng.";
    }
    if (quantity > stock) {
      return `Chỉ còn ${stock} sản phẩm có thể bán.`;
    }
    if (isFalse(item.can_checkout)) {
      return "Sản phẩm hiện chưa thể thanh toán.";
    }
    return "";
  }
  function invalidatePreview() {
    previewVersion++;
    checkoutPreview.value = null;
    previewing.value = false;
  }
  function setCheckoutItemIds(ids = []) {
    const next = normalizeIds(ids);
    if (JSON.stringify(next) !== JSON.stringify(checkoutForm.cart_item_ids)) {
      checkoutForm.cart_item_ids = next;
    }
  }
  function buildAddressPayload() {
    if (checkoutForm.shipping_address_id) {
      return {
        shipping_address_id: positiveInteger(
          checkoutForm.shipping_address_id,
          "Mã địa chỉ",
        ),
      };
    }
    return {
      shipping_address_id: null,
      receiver_name: String(checkoutForm.receiver_name || "").trim(),
      receiver_phone: String(checkoutForm.receiver_phone || "").trim(),
      province_id: String(checkoutForm.province_id || "").trim(),
      ward_id: String(checkoutForm.ward_id || "").trim(),
      province: String(checkoutForm.province || "").trim(),
      ward: String(checkoutForm.ward || "").trim(),
      district: null,
      district_id: null,
      address_detail: String(checkoutForm.address_detail || "").trim(),
    };
  }
  function buildPreviewPayload(itemIds = null) {
    return {
      cart_item_ids: normalizeIds(itemIds ?? checkoutForm.cart_item_ids),
      delivery_id: checkoutForm.delivery_id,
      discount_code:
        String(checkoutForm.discount_code || "")
          .trim()
          .toUpperCase() || null,
      ...buildAddressPayload(),
    };
  }
  // Checkout.vue dùng khóa này để lên lịch tính lại.
  const previewKey = computed(() =>
    JSON.stringify({
      ids: checkoutForm.cart_item_ids,
      delivery_id: checkoutForm.delivery_id,
      discount_code: checkoutForm.discount_code,
      shipping_address_id: checkoutForm.shipping_address_id,
      address: addressFields.map((field) => checkoutForm[field]),
      addressRevision: addressRevision.value,
    }),
  );
  watch(previewKey, invalidatePreview, { flush: "sync" });
  function resetCheckoutState() {
    invalidatePreview();
    createdOrder.value = null;
    checkoutForm.cart_item_ids = [];
    checkoutForm.discount_code = "";
    checkoutForm.note = "";
    checkoutForm.payment_method = "COD";
  }
  function applyAddressToForm(address) {
    checkoutForm.shipping_address_id = address?.id ?? "";
    addressFields.forEach((field) => {
      checkoutForm[field] = address?.[field] ?? "";
    });
  }
  function selectAddress(addressId) {
    applyAddressToForm(
      addresses.value.find((item) => Number(item.id) === Number(addressId)) ||
        null,
    );
  }
  function selectDefaultAddress() {
    applyAddressToForm(
      addresses.value.find((item) => isTrue(item.is_default)) ||
        addresses.value[0] ||
        null,
    );
  }
  function refreshSelectedAddress() {
    const current = addresses.value.find(
      (item) => Number(item.id) === Number(checkoutForm.shipping_address_id),
    );
    if (current) {
      applyAddressToForm(current);
    } else {
      selectDefaultAddress();
    }
    addressRevision.value++;
  }
  function selectDefaultDelivery() {
    if (
      deliveryMethods.value.some(
        (item) => Number(item.id) === Number(checkoutForm.delivery_id),
      )
    ) {
      return;
    }
    const method =
      deliveryMethods.value.find((item) => isTrue(item.is_default)) ||
      deliveryMethods.value[0];
    checkoutForm.delivery_id = method?.id ?? "";
  }
  function acceptCart(response) {
    cart.value = response.data?.data || null;
    invalidatePreview();
    const validIds = new Set(items.value.map((item) => Number(item.id)));
    setCheckoutItemIds(
      checkoutForm.cart_item_ids.filter((id) => validIds.has(Number(id))),
    );
  }
  async function fetchCart({ preserveMessages = false } = {}) {
    const version = ++cartRequestVersion;
    loadingCount.value++;
    if (!preserveMessages) clearMessages();
    try {
      const response = await CartService.getCart();
      if (version === cartRequestVersion) acceptCart(response);
      return response;
    } catch (error) {
      if (version === cartRequestVersion) setErrors(error);
      throw error;
    } finally {
      loadingCount.value--;
    }
  }
  async function withSaving(action) {
    if (saving.value || checkingOut.value) {
      throw new Error("Đang xử lý yêu cầu trước. Vui lòng chờ.");
    }
    saving.value = true;
    clearMessages();
    try {
      return await action();
    } catch (error) {
      setErrors(error);
      throw error;
    } finally {
      saving.value = false;
    }
  }
  async function mutateCart(request, successMessage) {
    return withSaving(async () => {
      cartRequestVersion++;
      invalidatePreview();
      const response = await request();
      cartRequestVersion++;
      acceptCart(response);
      message.value = response.data?.message || successMessage;
      return response;
    });
  }
  function normalizeAddToCartPayload(input, quantity = 1) {
    const objectInput =
      input && typeof input === "object" && !Array.isArray(input);
    return {
      package_id: positiveInteger(
        objectInput ? input.package_id : input,
        "Mã quy cách",
      ),
      quantity: positiveInteger(
        objectInput ? (input.quantity ?? quantity) : quantity,
        "Số lượng",
      ),
    };
  }
  function addToCart(input, quantity = 1) {
    return mutateCart(
      () => CartService.addItem(normalizeAddToCartPayload(input, quantity)),
      "Thêm vào giỏ hàng thành công.",
    );
  }
  function updateItem(itemId, quantity) {
    return mutateCart(
      () =>
        CartService.updateItem(positiveInteger(itemId, "Mã dòng giỏ hàng"), {
          quantity: positiveInteger(quantity, "Số lượng"),
        }),
      "Cập nhật giỏ hàng thành công.",
    );
  }
  function removeItem(itemId) {
    return mutateCart(
      () => CartService.removeItem(positiveInteger(itemId, "Mã dòng giỏ hàng")),
      "Xóa sản phẩm thành công.",
    );
  }
  async function clearCart() {
    const response = await mutateCart(
      () => CartService.clearCart(),
      "Đã xóa giỏ hàng.",
    );
    setCheckoutItemIds([]);
    return response;
  }
  async function fetchCheckoutOptions() {
    const version = ++optionsVersion;
    try {
      const response = await CheckoutService.getOptions();
      if (version !== optionsVersion) return response;
      const data = response.data?.data || {};
      checkoutOptions.value = {
        addresses: data.addresses || [],
        delivery_methods: data.delivery_methods || [],
        payment_methods: data.payment_methods || [],
      };
      selectDefaultDelivery();
      refreshSelectedAddress();
      return response;
    } catch (error) {
      if (version === optionsVersion) setErrors(error);
      throw error;
    }
  }
  async function fetchAddresses() {
    try {
      const response = await ShippingAddressService.getAddresses();
      checkoutOptions.value.addresses = response.data?.data || [];
      refreshSelectedAddress();
      return response;
    } catch (error) {
      setErrors(error);
      throw error;
    }
  }
  async function refreshAddressesAfterWrite(response, selectedId, fallback) {
    const successMessage = response.data?.message || fallback;
    const saved = response.data?.data;
    // Dùng ngay bản ghi API trả về nếu có đầy đủ dữ liệu.
    if (saved?.id && saved.receiver_name) {
      const list = addresses.value.filter(
        (item) => Number(item.id) !== Number(saved.id),
      );
      checkoutOptions.value.addresses = [...list, saved];
      applyAddressToForm(saved);
      addressRevision.value++;
    }
    try {
      await fetchAddresses();
      if (
        selectedId != null &&
        addresses.value.some((item) => Number(item.id) === Number(selectedId))
      ) {
        selectAddress(selectedId);
      }
      message.value = successMessage;
    } catch {
      message.value = successMessage;
      errorMsg.value =
        "Đã lưu thay đổi nhưng chưa tải lại được danh sách địa chỉ. Vui lòng tải lại để kiểm tra.";
    }
    return response;
  }
  function saveAddress(payload) {
    return withSaving(async () => {
      const response = payload.id
        ? await ShippingAddressService.update(payload.id, payload)
        : await ShippingAddressService.create(payload);
      return refreshAddressesAfterWrite(
        response,
        response.data?.data?.id ?? payload.id ?? null,
        "Lưu địa chỉ thành công.",
      );
    });
  }
  function removeAddress(addressId) {
    return withSaving(async () => {
      const response = await ShippingAddressService.remove(addressId);
      checkoutOptions.value.addresses = addresses.value.filter(
        (item) => Number(item.id) !== Number(addressId),
      );
      refreshSelectedAddress();
      return refreshAddressesAfterWrite(
        response,
        null,
        "Xóa địa chỉ thành công.",
      );
    });
  }
  function setDefaultAddress(addressId) {
    return withSaving(async () => {
      const response = await ShippingAddressService.setDefault(addressId);
      return refreshAddressesAfterWrite(
        response,
        addressId,
        "Đã đặt địa chỉ mặc định.",
      );
    });
  }
  async function previewCheckout(itemIds = null) {
    if (checkingOut.value || saving.value) {
      throw new Error("Đang cập nhật dữ liệu. Vui lòng chờ.");
    }
    if (itemIds !== null) setCheckoutItemIds(itemIds);
    const version = ++previewVersion;
    const key = previewKey.value;
    previewing.value = true;
    checkoutPreview.value = null;
    clearMessages();
    try {
      if (!checkoutForm.cart_item_ids.length) {
        throw new Error("Vui lòng chọn sản phẩm cần thanh toán.");
      }
      if (!hasCheckoutAddress.value) {
        throw new Error("Vui lòng chọn hoặc nhập đầy đủ địa chỉ nhận hàng.");
      }
      if (!selectedDelivery.value) {
        throw new Error("Vui lòng chọn phương thức giao hàng.");
      }
      const response = await CheckoutService.preview(buildPreviewPayload());
      if (version !== previewVersion || key !== previewKey.value) {
        return null;
      }
      const data = response.data?.data;
      if (!data || !Number.isFinite(Number(data.total_payment))) {
        throw new Error("Dữ liệu tính tiền không hợp lệ. Vui lòng thử lại.");
      }
      checkoutPreview.value = data;
      return response;
    } catch (error) {
      if (version !== previewVersion || key !== previewKey.value) {
        return null;
      }
      checkoutPreview.value = null;
      setErrors(error);
      throw error;
    } finally {
      if (version === previewVersion) previewing.value = false;
    }
  }
  function buildCheckoutPayload(itemIds = null) {
    return {
      ...buildPreviewPayload(itemIds),
      payment_method: checkoutForm.payment_method,
      note: String(checkoutForm.note || "").trim() || null,
    };
  }
  async function checkout(itemIds = null) {
    if (checkingOut.value || saving.value || previewing.value) {
      throw new Error("Đang xử lý yêu cầu. Vui lòng chờ.");
    }
    if (checkoutUncertain.value) {
      throw new Error(
        "Yêu cầu trước chưa rõ kết quả. Hãy kiểm tra Đơn mua trước khi đặt lại.",
      );
    }
    if (itemIds !== null) setCheckoutItemIds(itemIds);
    if (!checkoutPreview.value || !canPreview.value) {
      throw new Error("Vui lòng tính lại đơn hàng trước khi đặt.");
    }
    const method = paymentMethods.value.find(
      (item) => item.value === checkoutForm.payment_method,
    );
    if (!method || !isTrue(method.enabled)) {
      throw new Error("Phương thức thanh toán chưa được kích hoạt.");
    }
    const payload = buildCheckoutPayload();
    checkingOut.value = true;
    createdOrder.value = null;
    clearMessages();
    try {
      let response;
      try {
        response = await CheckoutService.checkout(payload);
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        // Không tự gửi lại POST khi chưa biết server đã tạo đơn hay chưa.
        if (!status || status >= 500 || status === 408) {
          checkoutUncertain.value = true;
          errorMsg.value =
            "Chưa xác nhận được kết quả đặt hàng. Hãy kiểm tra Đơn mua; không gửi lại ngay.";
        } else {
          setErrors(error);
        }
        invalidatePreview();
        throw error;
      }
      createdOrder.value = response.data?.data?.order || null;
      const successMessage = response.data?.message || "Đặt hàng thành công.";
      setCheckoutItemIds([]);
      checkoutForm.discount_code = "";
      checkoutForm.note = "";
      invalidatePreview();
      try {
        await fetchCart({ preserveMessages: true });
        message.value = successMessage;
      } catch {
        message.value = successMessage;
        errorMsg.value =
          "Đơn hàng đã được tạo nhưng chưa tải lại được giỏ hàng. Hãy xem Đơn mua; không đặt lại.";
      }
      return response;
    } finally {
      checkingOut.value = false;
    }
  }
  // Chỉ tải dữ liệu. Checkout.vue quyết định thời điểm gọi preview.
  async function loadCheckoutData(itemIds = []) {
    loadingCount.value++;
    clearMessages();
    invalidatePreview();
    const requested = normalizeIds(itemIds);
    try {
      const results = await Promise.allSettled([
        fetchCart({ preserveMessages: true }),
        fetchCheckoutOptions(),
      ]);
      const failed = results.find((result) => result.status === "rejected");
      if (failed) throw failed.reason;
      const validIds = new Set(items.value.map((item) => Number(item.id)));
      const remaining = requested.filter((id) => validIds.has(id));
      setCheckoutItemIds(remaining);
      checkoutForm.payment_method = "COD";
      return {
        missingItemIds: requested.filter((id) => !validIds.has(id)),
      };
    } finally {
      loadingCount.value--;
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
    checkoutUncertain,
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
    hasCheckoutAddress,
    canPreview,
    previewKey,
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
    sellableQuantity,
    itemUnavailableReason,
    invalidatePreview,
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
