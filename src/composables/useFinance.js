import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import api from "@/services/admin/finance.service";
export function uuid() {
  return crypto.randomUUID();
}
export function money(value) {
  if (value === null || value === undefined) return "Chưa đủ dữ liệu";
  const s = String(value);
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return "Không hợp lệ";
  const [whole, fraction = ""] = s.split(".");
  return (
    (s.startsWith("-0.") ? "-" : "") +
    BigInt(whole).toLocaleString("vi-VN") +
    (fraction && fraction !== "00" ? "," + fraction.padEnd(2, "0") : "") +
    " ₫"
  );
}
export function dateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
export function localInput(value = new Date()) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export const today = () => localInput().slice(0, 10);
export const monthStart = () => today().slice(0, 8) + "01";
export const statusLabel = (e) =>
  e.reverses_expense_id
    ? "Dòng đảo"
    : e.is_reversed
      ? "Đã đảo"
      : { draft: "Nháp", posted: "Đã ghi sổ", cancelled: "Đã hủy" }[e.status] ||
        e.status;
export const sourceLabel = (s) =>
  ({
    manual: "Nhập tay",
    inventory: "Từ kho",
    reversal: "Đảo chi phí",
    legacy: "Dữ liệu cũ",
  })[s] || s;
export const paymentLabel = (s) =>
  ({
    paid: "Đã trả tiền",
    unpaid: "Chưa trả tiền",
    draft: "Chưa ghi sổ",
    not_applicable: "Không áp dụng",
  })[s] || s;
export async function errorText(error) {
  let d = error.response?.data;
  if (d instanceof Blob) {
    try {
      d = JSON.parse(await d.text());
    } catch {
      d = {};
    }
  }
  return (
    Object.values(d?.errors || {}).flat()[0] ||
    d?.message ||
    "Không kết nối được máy chủ. Bạn có thể thử lại cùng thao tác."
  );
}

export function useFinance(permission) {
  const auth = useAuthStore(),
    allowed = computed(
      () => auth.isAuthenticated && auth.hasPermission(permission),
    );
  const data = ref(null),
    loading = ref(false),
    saving = ref(false),
    error = ref(""),
    message = ref(""),
    uncertain = ref(false);
  let generation = 0,
    controller,
    alive = true,
    pending = null;
  const can = (p) => auth.hasPermission(p);
  async function load(path, params = {}) {
    const g = ++generation;
    controller?.abort();
    controller = new AbortController();
    data.value = null;
    error.value = "";
    if (!allowed.value || !alive) return null;
    loading.value = true;
    try {
      const r = await api.get(path, params, controller.signal);
      if (alive && g === generation && allowed.value) {
        data.value = r.data;
        return r.data;
      }
    } catch (e) {
      if (
        alive &&
        g === generation &&
        e.code !== "ERR_CANCELED" &&
        e.name !== "AbortError"
      )
        error.value = await errorText(e);
    } finally {
      if (alive && g === generation) loading.value = false;
    }
    return null;
  }
  async function write(method, path, body, idempotent = true) {
    if (saving.value || !allowed.value || !alive) return null;
    const actor = auth.user?.id;
    // Keep the same key and exact payload on network retry. Never silently mint a replacement after an ambiguous failure.
    const signature = JSON.stringify([method, path, body]);
    if (pending && pending.signature !== signature) {
      error.value =
        "Thao tác trước chưa rõ kết quả. Hãy thử lại đúng nội dung trước hoặc tải lại danh sách để đối chiếu.";
      return null;
    }
    if (!pending)
      pending = {
        signature,
        key: uuid(),
        method,
        path,
        body: structuredClone(body),
        idempotent,
      };
    saving.value = true;
    error.value = "";
    message.value = "";
    uncertain.value = false;
    try {
      const r = await api.write(
        method,
        path,
        idempotent ? { ...body, request_key: pending.key } : body,
      );
      pending = null;
      if (alive && allowed.value && actor === auth.user?.id) {
        message.value = r.data.message || "Đã lưu thành công.";
        return r.data;
      }
      return null;
    } catch (e) {
      if (e.response && e.response.status < 500) pending = null;
      else uncertain.value = true;
      if (alive && actor === auth.user?.id) error.value = await errorText(e);
      return null;
    } finally {
      saving.value = false;
    }
  }
  function retryPending() {
    return pending
      ? write(pending.method, pending.path, pending.body, pending.idempotent)
      : Promise.resolve(null);
  }
  function clear() {
    ++generation;
    controller?.abort();
    data.value = null;
    loading.value = false;
    error.value = "";
    message.value = "";
    pending = null;
    uncertain.value = false;
  }
  watch(() => [auth.user?.id, allowed.value], clear);
  onBeforeUnmount(() => {
    alive = false;
    clear();
  });
  return {
    auth,
    allowed,
    can,
    data,
    loading,
    saving,
    error,
    message,
    load,
    write,
    uncertain,
    retryPending,
  };
}
