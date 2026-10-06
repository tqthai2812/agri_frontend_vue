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

export const useDashboardStore = defineStore("admin-dashboard", () => {
  const initial = vietnamToday();
  const filters = reactive({
    date_from: `${initial.slice(0, 7)}-01`,
    date_to: initial,
  });
  const overview = ref(null);
  const loading = ref(false);
  const error = ref("");
  let controller = null;
  let version = 0;

  function dispose() {
    version++;
    controller?.abort();
    controller = null;
    overview.value = null;
    loading.value = false;
    error.value = "";
  }

  async function fetchOverview() {
    const current = ++version;
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = "";
    // Never label a previous response with a new date range, or render request failure as zero sales.
    overview.value = null;
    try {
      const response = await DashboardService.getOverview(
        { ...filters },
        controller.signal,
      );
      if (current !== version) return;
      if (!response.data?.data?.period || !response.data.data.summary) {
        throw new Error("Phản hồi thống kê không hợp lệ.");
      }
      overview.value = response.data.data;
    } catch (failure) {
      if (
        current !== version ||
        failure.code === "ERR_CANCELED" ||
        failure.name === "AbortError"
      )
        return;
      const errors = failure.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      error.value =
        failure.response?.status === 403
          ? "Bạn không có quyền xem Dashboard."
          : first ||
            failure.response?.data?.message ||
            "Không tải được thống kê. Vui lòng thử lại.";
    } finally {
      if (current === version) {
        loading.value = false;
        controller = null;
      }
    }
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

  return { filters, overview, loading, error, fetchOverview, preset, dispose };
});
