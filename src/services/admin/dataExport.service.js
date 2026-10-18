import api from "@/api/client";
const base = "/api/v1/data-exports";
export default {
  list(params, signal) {
    return api.get(base, { params, signal });
  },
  create(payload, signal) {
    return api.post(base, payload, { signal });
  },
  retry(id, signal) {
    return api.post(`${base}/${id}/retry`, {}, { signal });
  },
  download(id, signal) {
    return api.get(`${base}/${id}/download`, { responseType: "blob", signal });
  },
};
export async function exportError(error) {
  let data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  if (error?.response?.status === 403)
    return "Bạn không có quyền thực hiện thao tác này.";
  if (error?.response?.status === 401) return "Phiên đăng nhập đã hết hạn.";
  if (error?.response?.status === 429)
    return "Thao tác quá nhanh. Vui lòng thử lại sau.";
  if (error?.response?.status >= 500)
    return "Server chưa xử lý được yêu cầu. Vui lòng thử lại.";
  return data?.message || "Không kết nối được server. Vui lòng thử lại.";
}
export function requestKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
