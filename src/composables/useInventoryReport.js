import { ref, computed, onBeforeUnmount, watch } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import service from "@/services/admin/inventory-report.service";
export function todayVN() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function money(value, digits = 2) {
  if (value === null || value === undefined || value === "")
    return "Chưa xác định";
  const [whole, fraction = ""] = String(value).split(".");
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction)) return "Chưa xác định";
  return `${BigInt(whole).toLocaleString("vi-VN")}${digits ? "," + fraction.padEnd(digits, "0").slice(0, digits) : ""} ₫`;
}
export function quantity(value) {
  return value === null || value === undefined
    ? "Chưa xác định"
    : Number(value).toLocaleString("vi-VN");
}
export function dateText(value) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value))
    return value.split("-").reverse().join("/");
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
export async function errorText(error) {
  let d = error.response?.data;
  if (d instanceof Blob) {
    try {
      d = JSON.parse(await d.text());
    } catch {
      d = null;
    }
  }
  if (d?.errors) return Object.values(d.errors).flat().join(" ");
  return (
    d?.message || "Không tải được báo cáo. Kiểm tra kết nối API rồi thử lại."
  );
}
export const documentType = {
  supplier_receipt: "Nhập nhà cung cấp",
  sale_issue: "Xuất bán",
  adjustment: "Điều chỉnh",
  opening_balance: "Mở sổ theo lô",
};
export const lotStatus = {
  available: "Sẵn sàng",
  quarantined: "Cách ly",
  blocked: "Đã khóa",
};
export function useInventoryReport() {
  const auth = useAuthStore();
  const canView = computed(
    () =>
      auth.isAuthenticated &&
      auth.hasPermission("inventory.view") &&
      auth.hasPermission("report.inventory.view"),
  );
  const canExport = computed(
    () => canView.value && auth.hasPermission("report.inventory.export"),
  );
  const result = ref(null),
    loading = ref(false),
    error = ref("");
  let controller,
    generation = 0;
  function clear() {
    generation++;
    controller?.abort();
    result.value = null;
    loading.value = false;
    error.value = "";
  }
  async function load(params) {
    const seq = ++generation;
    controller?.abort();
    controller = new AbortController();
    result.value = null;
    error.value = "";
    if (!canView.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const response = await service.report(params, controller.signal);
      if (seq === generation && canView.value) result.value = response.data;
    } catch (e) {
      const message = await errorText(e);
      if (seq === generation && !controller.signal.aborted)
        error.value = message;
    } finally {
      if (seq === generation) loading.value = false;
    }
  }
  watch(() => [auth.user?.id, canView.value], clear);
  onBeforeUnmount(clear);
  return {
    canView,
    canExport,
    result,
    loading,
    error,
    load,
  };
}
