import apiClient from "@/api/client";

class InventoryService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getInventory(params = {}) {
    return apiClient.get("/api/v1/inventory", { params });
  }

  getInventoryDetail(packageId) {
    return apiClient.get(`/api/v1/inventory/${packageId}`);
  }

  getTransactions(params = {}) {
    return apiClient.get("/api/v1/inventory-transactions", { params });
  }

  async createTransaction(data) {
    await this.csrf();

    return apiClient.post("/api/v1/inventory-transactions", data);
  }

  async updateTransaction(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/inventory-transactions/${id}`, data);
  }

  getCategories() {
    return apiClient.get("/api/v1/categories");
  }
}

export default new InventoryService();
