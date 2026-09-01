import apiClient from "@/api/client";

class ClientHomeService {
  getCategories(params = {}) {
    return apiClient.get("/api/v1/public/categories", { params });
  }

  getProducts(params = {}) {
    return apiClient.get("/api/v1/public/products", { params });
  }
}

export default new ClientHomeService();
