import apiClient from "@/api/client";
export default {
  list(params = {}) {
    return apiClient.get("/api/v1/public/vouchers", { params });
  },
};
