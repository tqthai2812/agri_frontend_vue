import apiClient from "@/api/client";

class ClientNewsService {
  getNews(params = {}) {
    return apiClient.get("/api/v1/public/news", {
      params,
    });
  }

  getNewsDetail(slug) {
    return apiClient.get(`/api/v1/public/news/${slug}`);
  }
}

export default new ClientNewsService();
