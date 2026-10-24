import apiClient from "@/api/client";

const root = "/api/v1/inventory-documents";
export default {
  list(params = {}) {
    return apiClient.get(root, { params });
  },
  detail(id) {
    return apiClient.get(`${root}/${id}`);
  },
  packages(params = {}) {
    return apiClient.get("/api/v1/inventory", { params });
  },
  suppliers(params = {}) {
    return apiClient.get("/api/v1/suppliers", { params });
  },
  async write(operation, maySend = () => true) {
    try {
      await apiClient.get("/sanctum/csrf-cookie");
    } catch (error) {
      error.documentWriteStarted = false;
      throw error;
    }
    if (!maySend()) {
      const error = new Error("Phiên làm việc đã thay đổi. Chưa gửi yêu cầu.");
      error.documentWriteStarted = false;
      throw error;
    }
    const { kind, id, payload } = operation;
    try {
      if (kind === "create") return await apiClient.post(root, payload);
      if (kind === "update")
        return await apiClient.put(`${root}/${id}`, payload);
      if (kind === "post")
        return await apiClient.post(`${root}/${id}/post`, payload);
      if (kind === "cancel")
        return await apiClient.patch(`${root}/${id}/cancel`, {});
      throw new Error("Thao tác không hợp lệ.");
    } catch (error) {
      error.documentWriteStarted = true;
      throw error;
    }
  },
};
