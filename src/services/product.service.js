import apiClient from "@/api/client";

class ProductService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  async getProducts(params = {}) {
    return apiClient.get("/api/v1/products", {
      params,
    });
  }

  async getProduct(id) {
    return apiClient.get(`/api/v1/products/${id}`);
  }

  async getCategories() {
    return apiClient.get("/api/v1/categories");
  }

  async getSubcategories(params = {}) {
    return apiClient.get("/api/v1/subcategories", {
      params,
    });
  }

  async getOrigins(params = {}) {
    return apiClient.get("/api/v1/origins", {
      params,
    });
  }

  async createProduct(formData) {
    await this.csrf();

    return apiClient.post("/api/v1/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async updateProduct(id, formData) {
    await this.csrf();

    formData.append("_method", "PUT");

    return apiClient.post(`/api/v1/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async deleteProduct(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/products/${id}`);
  }
}

export default new ProductService();
