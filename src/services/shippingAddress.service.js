import apiClient from "@/api/client";

class ShippingAddressService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getAddresses() {
    return apiClient.get("/api/v1/shipping-addresses");
  }

  async create(data) {
    await this.csrf();

    return apiClient.post("/api/v1/shipping-addresses", data);
  }

  async update(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/shipping-addresses/${id}`, data);
  }

  async remove(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/shipping-addresses/${id}`);
  }

  async setDefault(id) {
    await this.csrf();

    return apiClient.patch(`/api/v1/shipping-addresses/${id}/default`);
  }
}

export default new ShippingAddressService();
