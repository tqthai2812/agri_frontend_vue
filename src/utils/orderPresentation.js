export const tabs = [
  { key: "", countKey: "all", label: "Tất cả" },
  { key: "pending", countKey: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", countKey: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", countKey: "shipping", label: "Đang giao" },
  { key: "completed", countKey: "completed", label: "Hoàn thành" },
  { key: "cancelled", countKey: "cancelled", label: "Đã hủy" },
];
export const paymentMethods = [
  { value: "COD", label: "Thanh toán khi nhận hàng" },
  { value: "VNPAY", label: "VNPAY Sandbox" },
];
export function money(value) {
  if (value === null || value === undefined || value === "") {
    return "Chưa xác định";
  }
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
    : "Chưa xác định";
}
export function dateTime(value) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}
export function code(value) {
  return (
    value?.order_code ||
    value?.invoice_code ||
    (value?.id ? `DH${String(value.id).padStart(6, "0")}` : "—")
  );
}
export function statusLabel(status) {
  return tabs.find((tab) => tab.key === status)?.label || status || "—";
}
export function statusClass(status) {
  return (
    {
      pending: "badge-pending",
      confirmed: "badge-info-b",
      shipping: "badge-gray",
      completed: "badge-active",
      cancelled: "badge-inactive",
    }[status] || "badge-gray"
  );
}
export function paymentLabel(value) {
  return (
    paymentMethods.find((method) => method.value === value)?.label ||
    value ||
    "—"
  );
}
export function paymentStatus(value) {
  return (
    {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Không thành công",
      expired: "Hết hạn",
    }[value] ||
    value ||
    "—"
  );
}
export function paymentSummary(value, store) {
  if (value?.payment_review) return "Cần đối chiếu thanh toán";
  if (!store.paymentKnown(value)) {
    return "Chưa xác định thanh toán";
  }
  return store.isPaid(value) ? "Đã thanh toán" : "Chưa thanh toán";
}
export function fullAddress(value) {
  if (!value) return "Chưa có địa chỉ";
  return (
    value.full_address ||
    [value.address_detail, value.ward, value.district, value.province]
      .filter(Boolean)
      .join(", ")
  );
}
