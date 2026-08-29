import apiClient from "@/api/client";

class OrderService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getOrders(params = {}) {
    return apiClient.get("/api/v1/orders", { params });
  }

  getOrder(id) {
    return apiClient.get(`/api/v1/orders/${id}`);
  }

  getStatusCounts() {
    return apiClient.get("/api/v1/orders/status-counts");
  }

  async updateStatus(id, data) {
    await this.csrf();

    return apiClient.patch(`/api/v1/orders/${id}/status`, data);
  }
}

export default new OrderService();
