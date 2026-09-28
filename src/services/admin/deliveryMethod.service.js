import apiClient from "@/api/client";

class DeliveryMethodService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getDeliveryMethods(params = {}) {
    return apiClient.get("/api/v1/delivery-methods", { params });
  }

  getDeliveryMethod(id) {
    return apiClient.get(`/api/v1/delivery-methods/${id}`);
  }

  async createDeliveryMethod(data) {
    await this.csrf();

    return apiClient.post("/api/v1/delivery-methods", data);
  }

  async updateDeliveryMethod(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/delivery-methods/${id}`, data);
  }

  async deleteDeliveryMethod(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/delivery-methods/${id}`);
  }
}

export default new DeliveryMethodService();
