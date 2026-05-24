import apiClient from "./client";

export const categoryApi = {
  getAll: () => apiClient.get("/v1/categories"),
  getById: (id) => apiClient.get(`/v1/categories/${id}`),
  create: (data) => apiClient.post("/v1/categories", data),
  update: (id, data) => apiClient.put(`/v1/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/v1/categories/${id}`),
};

export const productApi = {
  getAll: () => apiClient.get("/v1/products"),
  getById: (id) => apiClient.get(`/v1/products/${id}`),
  create: (data) => apiClient.post("/v1/products", data),
  update: (id, data) => apiClient.put(`/v1/products/${id}`, data),
  delete: (id) => apiClient.delete(`/v1/products/${id}`),
};

// Tương tự cho artisans, orders, inventory, articles...
