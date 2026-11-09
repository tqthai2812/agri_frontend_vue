import api from "@/api/client";

class RoleService {
  csrf() {
    return api.get("/sanctum/csrf-cookie");
  }
  getRoles(params = {}, config = {}) {
    return api.get("/api/v1/roles", { ...config, params });
  }
  getRole(id, params = {}) {
    return api.get(`/api/v1/roles/${id}`, { params });
  }
  getPermissions(config = {}) {
    return api.get("/api/v1/permissions", config);
  }
  getUsers(params = {}, config = {}) {
    return api.get("/api/v1/users", { ...config, params });
  }
  getUser(id) {
    return api.get(`/api/v1/users/${id}`);
  }
  async createRole(data) {
    await this.csrf();
    return api.post("/api/v1/roles", data);
  }
  async updateRole(id, data) {
    await this.csrf();
    return api.put(`/api/v1/roles/${id}`, data);
  }
  async deleteRole(id) {
    await this.csrf();
    return api.delete(`/api/v1/roles/${id}`);
  }
  async syncPermissions(id, permissions) {
    await this.csrf();
    return api.put(`/api/v1/roles/${id}/permissions`, { permissions });
  }
  async assignRoles(id, roles) {
    await this.csrf();
    return api.put(`/api/v1/users/${id}/roles`, { roles });
  }
  async assignPermissions(id, permissions) {
    await this.csrf();
    return api.put(`/api/v1/users/${id}/permissions`, { permissions });
  }
}

export default new RoleService();