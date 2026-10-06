import apiClient from "@/api/client";
const base = "/api/v1";
export default {
  get(path, params = {}, signal) {
    return apiClient.get(base + path, { params, signal });
  },
  async write(method, path, data) {
    await apiClient.get("/sanctum/csrf-cookie");
    return apiClient[method](base + path, data);
  },
  export(params, signal) {
    return apiClient.get(base + "/reports/profit/export", {
      params,
      signal,
      responseType: "blob",
    });
  },
};
