import apiClient from "@/api/client";

const options = (signal) => ({
  signal,
  timeout: 115_000,
  skipAuthEvents: true,
});

export default {
  async send(payload, signal) {
    await apiClient.get("/sanctum/csrf-cookie", options(signal));
    return (
      await apiClient.post("/api/v1/ai-chat/messages", payload, options(signal))
    ).data;
  },
  async read(id, signal) {
    return (
      await apiClient.get(
        `/api/v1/ai-chat/sessions/${encodeURIComponent(id)}`,
        options(signal),
      )
    ).data;
  },
  async remove(id, signal) {
    await apiClient.get("/sanctum/csrf-cookie", options(signal));
    return apiClient.delete(
      `/api/v1/ai-chat/sessions/${encodeURIComponent(id)}`,
      options(signal),
    );
  },
};