import apiClient from "@/api/client";

class UserService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getUsers(params = {}) {
    return apiClient.get("/api/v1/users", { params });
  }

  getUser(id) {
    return apiClient.get(`/api/v1/users/${id}`);
  }

  getRoles() {
    return apiClient.get("/api/v1/roles");
  }

  async createUser(formData) {
    await this.csrf();

    return apiClient.post("/api/v1/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async updateUser(id, formData) {
    await this.csrf();

    formData.append("_method", "PUT");

    return apiClient.post(`/api/v1/users/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async deleteUser(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/users/${id}`);
  }

  async assignRoles(userId, roles) {
    await this.csrf();

    return apiClient.put(`/api/v1/users/${userId}/roles`, {
      roles,
    });
  }
}

export default new UserService();
