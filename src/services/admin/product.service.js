import apiClient from "@/api/client";

class ProductService {
  csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getProducts(params = {}) {
    return apiClient.get("/api/v1/products", { params });
  }

  getProduct(id) {
    return apiClient.get(`/api/v1/products/${id}`);
  }

  getCategories(params = {}) {
    return apiClient.get("/api/v1/categories", { params });
  }

  getSubcategories(params = {}) {
    return apiClient.get("/api/v1/subcategories", { params });
  }

  getOrigins(params = {}) {
    return apiClient.get("/api/v1/origins", { params });
  }

  async createProduct(formData) {
    await this.csrf();

    return apiClient.post("/api/v1/products", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": undefined,
      },
    });
  }

  async updateProduct(id, formData) {
    await this.csrf();

    formData.set("_method", "PUT");

    return apiClient.post(`/api/v1/products/${id}`, formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": undefined,
      },
    });
  }

  async deleteProduct(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/products/${id}`);
  }
}

export default new ProductService();
