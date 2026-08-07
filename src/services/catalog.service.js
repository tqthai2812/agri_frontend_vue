import apiClient from "@/api/client";

class CatalogService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getCategories(params = {}) {
    return apiClient.get("/api/v1/categories", { params });
  }

  async createCategory(data) {
    await this.csrf();
    return apiClient.post("/api/v1/categories", data);
  }

  async updateCategory(id, data) {
    await this.csrf();
    return apiClient.put(`/api/v1/categories/${id}`, data);
  }

  async deleteCategory(id) {
    await this.csrf();
    return apiClient.delete(`/api/v1/categories/${id}`);
  }

  getSubcategories(params = {}) {
    return apiClient.get("/api/v1/subcategories", { params });
  }

  async createSubcategory(data) {
    await this.csrf();
    return apiClient.post("/api/v1/subcategories", data);
  }

  async updateSubcategory(id, data) {
    await this.csrf();
    return apiClient.put(`/api/v1/subcategories/${id}`, data);
  }

  async deleteSubcategory(id) {
    await this.csrf();
    return apiClient.delete(`/api/v1/subcategories/${id}`);
  }

  getOrigins(params = {}) {
    return apiClient.get("/api/v1/origins", { params });
  }

  async createOrigin(formData) {
    await this.csrf();

    return apiClient.post("/api/v1/origins", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async updateOrigin(id, formData) {
    await this.csrf();

    formData.append("_method", "PUT");

    return apiClient.post(`/api/v1/origins/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async deleteOrigin(id) {
    await this.csrf();
    return apiClient.delete(`/api/v1/origins/${id}`);
  }
}

export default new CatalogService();
