import apiClient from "@/api/client";

class ProductReviewService {
  getOrderReviews(orderId) {
    return apiClient.get(`/api/v1/my-orders/${orderId}/reviews`);
  }

  async submitOrderReviews(orderId, reviews) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.post(`/api/v1/my-orders/${orderId}/reviews`, { reviews });
  }

  getProductReviews(productId, params = {}) {
    return apiClient.get(`/api/v1/public/products/${productId}/reviews`, {
      params,
    });
  }
}

export default new ProductReviewService();
