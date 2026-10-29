import api from "@/api/client";
export const payload = (r) => r.data;
export async function write(method, url, data) {
  await api.get("/sanctum/csrf-cookie");
  const multipart = typeof FormData !== "undefined" && data instanceof FormData;
  return payload(
    await api.request({
      method,
      url,
      data,
      ...(multipart
        ? {
            headers: { "Content-Type": undefined },
            // Run after shared request interceptors. Keep the File bytes intact and
            // let the browser add the multipart boundary, even with JSON defaults.
            transformRequest: [
              (body, headers) => {
                headers.delete("Content-Type");
                return body;
              },
            ],
          }
        : {}),
    }),
  );
}
export const newsApi = {
  get: async (url, params) => payload(await api.get(url, { params })),
  write,
};
export const adminBase = "/api/v1/news-studio";
export function errorText(e) {
  return (
    Object.values(e.response?.data?.errors || {})
      .flat()
      .join(" ") ||
    e.response?.data?.message ||
    "Không thể xử lý. Vui lòng thử lại."
  );
}
export function dateText(value) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}