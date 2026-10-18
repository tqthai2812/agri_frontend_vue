import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import DashboardService from "@/services/admin/dashboard.service";

export function vietnamToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

// Phép tính lịch: tính cả ngày đầu và cuối, không phụ thuộc múi giờ máy chạy.
export function previousPeriodOf(period) {
  const parse = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? date.getTime()
      : null;
  };
  const from = parse(period?.date_from),
    to = parse(period?.date_to);
  const day = 86400000;
  if (from === null || to === null || to < from) return null;
  const days = (to - from) / day + 1;
  if (!Number.isInteger(days) || days > 366) return null;
  const format = (value) => new Date(value).toISOString().slice(0, 10);
  return {
    date_from: format(from - days * day),
    date_to: format(from - day),
    days,
  };
}

function matchesPeriod(payload, expected) {
  return (
    payload?.summary &&
    payload?.order_counts &&
    payload.period?.date_from === expected.date_from &&
    payload.period?.date_to === expected.date_to
  );
}
function cancelled(error) {
  return error.code === "ERR_CANCELED" || error.name === "AbortError";
}
function errorMessage(error, fallback) {
  const errors = error.response?.data?.errors;
  const first = errors ? Object.values(errors).flat()[0] : null;
  return error.response?.status === 403
    ? "Bạn không có quyền xem Dashboard."
    : first || error.response?.data?.message || fallback;
}

export const useDashboardStore = defineStore("admin-dashboard", () => {
  const initial = vietnamToday();
  const filters = reactive({
    date_from: `${initial.slice(0, 7)}-01`,
    date_to: initial,
  });
  const overview = ref(null);
  const loading = ref(false);
  const error = ref("");
  const previousOverview = ref(null);
  const comparisonPeriod = ref(null);
  const comparisonLoading = ref(false);
  const comparisonError = ref("");
  let controller = null,
    comparisonController = null;
  let version = 0,
    comparisonVersion = 0;

  function resetComparison() {
    comparisonVersion++;
    comparisonController?.abort();
    comparisonController = null;
    previousOverview.value = null;
    comparisonPeriod.value = null;
    comparisonLoading.value = false;
    comparisonError.value = "";
  }
  function dispose() {
    version++;
    controller?.abort();
    controller = null;
    overview.value = null;
    loading.value = false;
    error.value = "";
    resetComparison();
  }

  async function fetchComparison(ownerVersion, period) {
    resetComparison();
    const previous = previousPeriodOf(period);
    if (!previous) {
      comparisonError.value =
        "Không xác định được kỳ liền trước từ khoảng ngày này.";
      return;
    }
    comparisonPeriod.value = previous;
    comparisonLoading.value = true;
    const current = comparisonVersion;
    const requestController = new AbortController();
    comparisonController = requestController;
    const stillCurrent = () =>
      ownerVersion === version && current === comparisonVersion;
    try {
      // Dùng lại endpoint/service hiện có. Không ghi đè overview của kỳ đang xem.
      const response = await DashboardService.getOverview(
        {
          date_from: previous.date_from,
          date_to: previous.date_to,
        },
        requestController.signal,
      );
      if (!stillCurrent()) return;
      const payload = response.data?.data;
      if (!matchesPeriod(payload, previous))
        throw new Error("Invalid comparison response");
      previousOverview.value = payload;
    } catch (failure) {
      if (!stillCurrent() || cancelled(failure)) return;
      comparisonError.value = errorMessage(
        failure,
        "Không tải được kỳ trước. Số liệu kỳ đang xem vẫn được giữ nguyên.",
      );
    } finally {
      if (stillCurrent()) {
        comparisonLoading.value = false;
        comparisonController = null;
      }
    }
  }

  async function fetchOverview() {
    const current = ++version;
    controller?.abort();
    const requestController = new AbortController();
    controller = requestController;
    resetComparison();
    loading.value = true;
    error.value = "";
    overview.value = null;
    // Chốt bộ lọc tại lúc bấm Áp dụng; sửa input sau đó không đổi nhãn dữ liệu đã tải.
    const requested = { ...filters };
    try {
      const response = await DashboardService.getOverview(
        requested,
        requestController.signal,
      );
      if (current !== version) return;
      const payload = response.data?.data;
      if (!matchesPeriod(payload, requested))
        throw new Error("Invalid overview response");
      overview.value = payload;
    } catch (failure) {
      if (current !== version || cancelled(failure)) return;
      error.value = errorMessage(
        failure,
        "Không tải được thống kê. Vui lòng thử lại.",
      );
    } finally {
      if (current === version) {
        loading.value = false;
        controller = null;
      }
    }
    if (current === version && overview.value) {
      await fetchComparison(current, overview.value.period);
    }
  }

  function retryComparison() {
    if (!overview.value || loading.value || comparisonLoading.value) return;
    return fetchComparison(version, overview.value.period);
  }
  function preset(mode) {
    const today = vietnamToday();
    filters.date_to = today;
    if (mode === "today") filters.date_from = today;
    else if (mode === "month") filters.date_from = `${today.slice(0, 7)}-01`;
    else {
      const day = new Date(`${today}T00:00:00Z`);
      day.setUTCDate(day.getUTCDate() - 29);
      filters.date_from = day.toISOString().slice(0, 10);
    }
  }
  return {
    filters,
    overview,
    loading,
    error,
    fetchOverview,
    preset,
    dispose,
    previousOverview,
    comparisonPeriod,
    comparisonLoading,
    comparisonError,
    retryComparison,
  };
});
