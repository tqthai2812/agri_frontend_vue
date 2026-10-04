import apiClient from "@/api/client";
class ContactService {
  getContacts(params = {}) {
    return apiClient.get("/api/v1/my-contacts", { params });
  }
  async submit(data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient.post("/api/v1/my-contacts", data);
  }
}
export default new ContactService();
