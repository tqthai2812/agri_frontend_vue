import apiClient from "@/api/client";

class ClientOrderService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getOrders(params = {}) {
    return apiClient.get("/api/v1/my-orders", {
      params,
    });
  }

  getStatusCounts() {
    return apiClient.get("/api/v1/my-orders/status-counts");
  }

  getOrder(id) {
    return apiClient.get(`/api/v1/my-orders/${id}`);
  }

  async cancelOrder(id) {
    await this.csrf();

    return apiClient.patch(`/api/v1/my-orders/${id}/cancel`);
  }
}

export default new ClientOrderService();
