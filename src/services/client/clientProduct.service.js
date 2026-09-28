import apiClient from "@/api/client";

class ClientProductService {
  getProductFilters() {
    return apiClient.get("/api/v1/public/product-filters");
  }

  getCategories(params = {}) {
    return apiClient.get("/api/v1/public/categories", { params });
  }

  getProducts(params = {}) {
    return apiClient.get("/api/v1/public/products", { params });
  }

  getProduct(id) {
    return apiClient.get(`/api/v1/public/products/${id}`);
  }
}

export default new ClientProductService();
