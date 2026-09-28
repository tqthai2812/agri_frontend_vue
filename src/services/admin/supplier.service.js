import apiClient from "@/api/client";

class SupplierService {
  csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getSuppliers(params = {}) {
    return apiClient.get("/api/v1/suppliers", { params });
  }

  getSupplier(id) {
    return apiClient.get(`/api/v1/suppliers/${id}`);
  }

  async createSupplier(data) {
    await this.csrf();

    return apiClient.post("/api/v1/suppliers", data);
  }

  async updateSupplier(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/suppliers/${id}`, data);
  }

  async deleteSupplier(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/suppliers/${id}`);
  }

  getProducts(params = {}) {
    return apiClient.get("/api/v1/products", { params });
  }
}

export default new SupplierService();
