import apiClient from "@/api/client";

class NewsService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getNews(params = {}) {
    return apiClient.get("/api/v1/news", { params });
  }

  getNewsDetail(id) {
    return apiClient.get(`/api/v1/news/${id}`);
  }

  getStatusCounts() {
    return apiClient.get("/api/v1/news/status-counts");
  }

  async createNews(data) {
    await this.csrf();

    return apiClient.post("/api/v1/news", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async updateNews(id, data) {
    await this.csrf();

    return apiClient.post(`/api/v1/news/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async deleteNews(id) {
    await this.csrf();

    return apiClient.delete(`/api/v1/news/${id}`);
  }
}

export default new NewsService();
