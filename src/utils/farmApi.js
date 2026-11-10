export function apiError(error, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  const status = error.response?.status;
  if (status >= 500) return "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.";
  if (status === 401) return "Vui lòng đăng nhập lại để tiếp tục.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 419) return "Phiên làm việc đã hết hạn. Hãy tải lại trang.";
  const first = Object.values(error.response?.data?.errors || {})[0];
  return (
    (Array.isArray(first) ? first[0] : first) ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
}