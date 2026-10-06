import apiClient from "@/api/client";

export default {
  getOverview(params, signal) {
    return apiClient.get("/api/v1/dashboard", { params, signal });
  },
};
