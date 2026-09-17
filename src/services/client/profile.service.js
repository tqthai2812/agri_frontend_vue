import apiClient from "@/api/client";

class ProfileService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  getProfile() {
    return apiClient.get("/api/v1/profile");
  }

  async updateProfile(formData) {
    await this.csrf();

    return apiClient.post("/api/v1/profile", formData);
  }

  async changePassword(data) {
    await this.csrf();

    return apiClient.put("/api/v1/profile/password", {
      current_password: data.current_password,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
  }
}

export default new ProfileService();
