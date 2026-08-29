import apiClient from "@/api/client";

class DiscountService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getDiscounts(params = {}) {
    return apiClient.get("/api/v1/discounts", { params });
  }

  getDiscount(id) {
    return apiClient.get(`/api/v1/discounts/${id}`);
  }

  async createDiscount(data) {
    await this.csrf();

    return apiClient.post("/api/v1/discounts", data);
  }

  async updateDiscount(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/discounts/${id}`, data);
  }

  async deleteDiscount(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/discounts/${id}`);
  }
}

export default new DiscountService();
