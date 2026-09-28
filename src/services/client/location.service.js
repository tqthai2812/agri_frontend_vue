import apiClient from "@/api/client";

class LocationService {
  getProvinces() {
    return apiClient.get("/api/v1/locations/provinces");
  }

  getWards(provinceId) {
    return apiClient.get(
      `/api/v1/locations/provinces/${encodeURIComponent(provinceId)}/wards`,
    );
  }

  getShippingRegions() {
    return apiClient.get("/api/v1/locations/shipping-regions");
  }
}

export default new LocationService();
