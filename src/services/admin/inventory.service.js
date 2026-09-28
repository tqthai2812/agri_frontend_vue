import apiClient from "@/api/client";

class InventoryService {
  csrf() {
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

  getLots(packageId, params = {}) {
    return apiClient.get(`/api/v1/inventory/${packageId}/lots`, {
      params,
    });
  }

  async initializeLots(packageId, data) {
    await this.csrf();

    return apiClient.post(
      `/api/v1/inventory/${packageId}/initialize-lots`,
      data,
    );
  }

  async updateLot(packageId, lotId, data) {
    await this.csrf();

    return apiClient.patch(
      `/api/v1/inventory/${packageId}/lots/${lotId}`,
      data,
    );
  }

  getCategories(params = {}) {
    return apiClient.get("/api/v1/categories", { params });
  }

  getSuppliers(params = {}) {
    return apiClient.get("/api/v1/suppliers", { params });
  }
}

export default new InventoryService();
