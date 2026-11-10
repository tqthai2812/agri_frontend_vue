import apiClient from "@/api/client";

const adminBase = "/api/v1/farm-utilities";
const publicBase = "/api/v1/public/farm-utilities";

async function withCsrf(callback) {
  await apiClient.get("/sanctum/csrf-cookie");
  return callback();
}

function resource(path) {
  return {
    list: (params = {}, signal) =>
      apiClient.get(adminBase + path, { params, signal }),
    show: (id, signal) =>
      apiClient.get(adminBase + path + "/" + id, { signal }),
    create: (data) => withCsrf(() => apiClient.post(adminBase + path, data)),
    update: (id, data) =>
      withCsrf(() => apiClient.put(adminBase + path + "/" + id, data)),
    remove: (id) =>
      withCsrf(() => apiClient.delete(adminBase + path + "/" + id)),
  };
}

export default {
  crops: resource("/crops"),
  guides: resource("/usage-guides"),
  cropOptions: (params = {}, signal) =>
    apiClient.get(adminBase + "/options/crops", { params, signal }),
  variantOptions: (params = {}, signal) =>
    apiClient.get(adminBase + "/options/variants", { params, signal }),
  publicCrops: (params = {}, signal) =>
    apiClient.get(publicBase + "/crops", { params, signal }),
  publicGuides: (params = {}, signal) =>
    apiClient.get(publicBase + "/usage-guides", { params, signal }),
  publicGuide: (id, signal) =>
    apiClient.get(publicBase + "/usage-guides/" + id, { signal }),
};