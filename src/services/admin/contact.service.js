import apiClient from "@/api/client";
class AdminContactService {
  getContacts(params = {}) {
    return apiClient.get("/api/v1/contacts", { params });
  }
  getContact(id) {
    return apiClient.get(`/api/v1/contacts/${id}`);
  }
  async update(id, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.patch(`/api/v1/contacts/${id}`, data);
  }
}
export default new AdminContactService();
