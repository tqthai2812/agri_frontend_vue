import apiClient from "@/api/client";

class RoleService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  async getAll() {
    return apiClient.get("/api/v1/roles");
  }

  async getPermissions() {
    return apiClient.get("/api/v1/permissions");
  }

  async getUsers(params = {}) {
    return apiClient.get("/api/v1/users", {
      params,
    });
  }

  async create(data) {
    await this.csrf();

    return apiClient.post("/api/v1/roles", {
      name: data.name,
      permissions: data.permissions || [],
    });
  }

  async update(id, data) {
    await this.csrf();

    return apiClient.put(`/api/v1/roles/${id}`, {
      name: data.name,
      permissions: data.permissions || [],
    });
  }

  async syncPermissions(id, permissions) {
    await this.csrf();

    return apiClient.put(`/api/v1/roles/${id}/permissions`, {
      permissions,
    });
  }

  async delete(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/roles/${id}`);
  }

  async assignRolesToUser(userId, roles) {
    await this.csrf();

    return apiClient.put(`/api/v1/users/${userId}/roles`, {
      roles,
    });
  }
}

export default new RoleService();
