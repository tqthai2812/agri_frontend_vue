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

  adjustmentContext(packageId, lotId, signal) {
    return apiClient.get(
      `/api/v1/inventory/${packageId}/lots/${lotId}/adjustment`,
      { signal },
    );
  }

  adjustmentEvent(eventKey, signal) {
    return apiClient.get(`/api/v1/inventory-adjustments/${eventKey}`, {
      signal,
    });
  }

  async adjust(data, maySend = () => true) {
    try {
      await this.csrf();
    } catch (error) {
      error.inventoryPostStarted = false;
      throw error;
    }
    if (!maySend()) {
      const error = new Error(
        "Phiên làm việc đã thay đổi. Chưa gửi điều chỉnh.",
      );
      error.inventoryPostStarted = false;
      throw error;
    }
    try {
      return await apiClient.post("/api/v1/inventory-transactions", data);
    } catch (error) {
      error.inventoryPostStarted = true;
      throw error;
    }
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
