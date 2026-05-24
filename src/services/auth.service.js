import apiClient from "@/api/client";

class AuthService {
  async csrf() {
    return apiClient.get("/sanctum/csrf-cookie");
  }

  async sendRegisterCode(email) {
    await this.csrf();

    return apiClient.post("/api/send-register-code", {
      email,
    });
  }

  async verifyRegisterCode(email, code) {
    await this.csrf();

    return apiClient.post("/api/verify-register-code", {
      email,
      code,
    });
  }

  async register(data) {
    await this.csrf();

    return apiClient.post("/api/register", {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
  }

  async login(email, password, remember = false) {
    await this.csrf();

    return apiClient.post("/api/login", {
      email,
      password,
      remember,
    });
  }

  async logout() {
    await this.csrf();

    return apiClient.post("/api/logout");
  }

  async getUser() {
    return apiClient.get("/api/user");
  }

  async forgotPassword(email) {
    await this.csrf();

    return apiClient.post("/api/forgot-password", {
      email,
    });
  }

  async resetPassword(data) {
    await this.csrf();

    return apiClient.post("/api/reset-password", {
      token: data.token,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
  }
}

export default new AuthService();
