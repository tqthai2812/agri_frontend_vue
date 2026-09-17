import apiClient from "@/api/client";

class WishlistService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getWishlist() {
    return apiClient.get("/api/v1/wishlist");
  }

  async addItem(productId) {
    await this.csrf();

    return apiClient.post("/api/v1/wishlist/items", {
      product_id: productId,
    });
  }

  async toggle(productId) {
    await this.csrf();

    return apiClient.post("/api/v1/wishlist/toggle", {
      product_id: productId,
    });
  }

  async removeItem(wishlistId) {
    await this.csrf();

    return apiClient.delete(`/api/v1/wishlist/items/${wishlistId}`);
  }

  async removeItems(ids = []) {
    await this.csrf();

    return apiClient.delete("/api/v1/wishlist/items", {
      data: {
        ids,
      },
    });
  }
}

export default new WishlistService();
