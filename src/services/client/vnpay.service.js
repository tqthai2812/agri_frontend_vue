import apiClient from "@/api/client";

export default {
  async pay(id) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.post(`/api/v1/my-orders/${id}/vnpay/pay`);
  },
  async check(id) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.post(`/api/v1/my-orders/${id}/vnpay/check`);
  },
  redirect(value) {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "sandbox.vnpayment.vn" ||
      url.pathname !== "/paymentv2/vpcpay.html" ||
      url.username ||
      url.password
    ) {
      throw new Error("Địa chỉ thanh toán không hợp lệ.");
    }
    window.location.assign(url.href);
  },
};
