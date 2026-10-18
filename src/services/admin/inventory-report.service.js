import apiClient from "@/api/client";
const base = "/api/v1/reports/inventory";
export default {
  report: (params, signal) => apiClient.get(base, { params, signal }),
  journal: (id, params, signal) =>
    apiClient.get(`${base}/packages/${id}/journal`, { params, signal }),
  document: (id, signal) =>
    apiClient.get(`${base}/documents/${id}`, { signal }),
  adjustmentContext: (packageId, lotId, signal) =>
    apiClient.get(`${base}/packages/${packageId}/lots/${lotId}/adjustment`, {
      signal,
    }),
  adjustmentEvent: (eventKey, signal) =>
    apiClient.get(`${base}/adjustment-events/${eventKey}`, { signal }),
  async adjust(data, maySend = () => true) {
    try {
      await apiClient.get("/sanctum/csrf-cookie");
    } catch (error) {
      error.inventoryPostStarted = false;
      throw error;
    }
    if (!maySend()) {
      const error = new Error(
        "Phiên làm việc đã thay đổi. Chưa gửi yêu cầu điều chỉnh.",
      );
      error.inventoryPostStarted = false;
      throw error;
    }
    try {
      return await apiClient.post("/api/v1/inventory-transactions", data);
    } catch (error) {
      error.inventoryPostStarted = true;
      throw error;
    }
  },
};
