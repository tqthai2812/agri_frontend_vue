import apiClient from "@/api/client";

class CartService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getCart() {
    return apiClient.get("/api/v1/cart");
  }

  async addItem(data) {
    await this.csrf();

    return apiClient.post("/api/v1/cart/items", {
      package_id: data.package_id,
      quantity: data.quantity || 1,
    });
  }

  async updateItem(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/cart/items/${id}`, {
      quantity: data.quantity,
    });
  }

  async removeItem(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/cart/items/${id}`);
  }

  async clearCart() {
    await this.csrf();

    return apiClient.delete("/api/v1/cart");
  }
}

export default new CartService();
