import apiClient from "@/api/client";

export default {
  async list(params, signal) {
    return (await apiClient.get("/api/v1/ai-knowledge", { params, signal }))
      .data;
  },
  async reindex(kind, sourceId) {
    await apiClient.get("/sanctum/csrf-cookie");
    return (
      await apiClient.post("/api/v1/ai-knowledge/reindex", {
        kind,
        source_id: sourceId,
      })
    ).data;
  },
};