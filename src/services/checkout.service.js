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
    return apiClient.post("/api/v1/checkout/preview", data);
  }

  async checkout(data) {
    await this.csrf();
    return apiClient.post("/api/v1/checkout", data);
  }
}

export default new CheckoutService();
