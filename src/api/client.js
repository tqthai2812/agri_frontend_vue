import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (!error.config?.skipAuthEvents) {
      if (status === 401 || error.response?.data?.code === "ACCOUNT_INACTIVE") {
        localStorage.removeItem("auth_user");
        window.dispatchEvent(
          new CustomEvent("auth:unauthorized", {
            detail: error.response?.data?.code,
          }),
        );
      } else if (status === 403) {
        window.dispatchEvent(new Event("auth:permissions-stale"));
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;