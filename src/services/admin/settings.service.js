import apiClient from "@/api/client";

class SettingsService {
  csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  async updateProfile({ name, phone_number, avatar }) {
    const data = new FormData();
    data.append("name", name);
    data.append("phone_number", phone_number || "");
    if (avatar) data.append("avatar", avatar);

    await this.csrf();
    return apiClient.post("/api/v1/profile", data, {
      // Let the browser generate the multipart boundary; client defaults to JSON.
      headers: { "Content-Type": undefined },
    });
  }

  async changePassword({ current_password, password, password_confirmation }) {
    await this.csrf();
    return apiClient.put("/api/v1/profile/password", {
      current_password,
      password,
      password_confirmation,
    });
  }
}

export default new SettingsService();