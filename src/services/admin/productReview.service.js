import apiClient from "@/api/client";

class AdminProductReviewService {
  getReviews(params = {}) {
    return apiClient.get("/api/v1/reviews", { params });
  }
  getReview(id) {
    return apiClient.get(`/api/v1/reviews/${id}`);
  }
  getProducts(search = "") {
    return apiClient.get("/api/v1/reviews/products", { params: { search } });
  }

  async moderate(id, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.patch(`/api/v1/reviews/${id}/status`, data);
  }
  async createReply(id, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.post(`/api/v1/reviews/${id}/reply`, data);
  }
  async editReply(id, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.patch(`/api/v1/reviews/${id}/reply`, data);
  }
  async moderateReply(id, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.patch(`/api/v1/reviews/${id}/reply/status`, data);
  }
}

export default new AdminProductReviewService();
