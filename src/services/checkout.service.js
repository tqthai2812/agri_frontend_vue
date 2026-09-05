import apiClient from "@/api/client";

class CheckoutService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getOptions() {
    return apiClient.get("/api/v1/checkout/options");
  }

  async preview(data) {
    await this.csrf();

    return apiClient.post("/api/v1/checkout/preview", {
      cart_item_ids: data.cart_item_ids || [],
      delivery_id: data.delivery_id,
      discount_code: data.discount_code || null,
    });
  }

  async checkout(data) {
    await this.csrf();

    return apiClient.post("/api/v1/checkout", data);
  }
}

export default new CheckoutService();
