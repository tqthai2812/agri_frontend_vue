import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import ContactService from "@/services/client/contact.service";

export const useClientContactStore = defineStore("clientContacts", () => {
  const contacts = ref([]),
    receipt = ref(null),
    loading = ref(false),
    submitting = ref(false);
  const listError = ref(""),
    error = ref(""),
    fieldErrors = ref({});
  const form = reactive({ subject: "", message: "" });
  const filters = reactive({ status: "", page: 1 });
  const meta = reactive({ current_page: 1, last_page: 1, total: 0 });
  let generation = 0,
    listVersion = 0,
    requestKey = null,
    signature = "";

  function reset() {
    generation++;
    listVersion++;
    contacts.value = [];
    receipt.value = null;
    loading.value = submitting.value = false;
    listError.value = error.value = "";
    fieldErrors.value = {};
    form.subject = form.message = "";
    filters.status = "";
    filters.page = 1;
    Object.assign(meta, { current_page: 1, last_page: 1, total: 0 });
    requestKey = null;
    signature = "";
  }
  async function fetchContacts(page = filters.page, correctPage = true) {
    const ticket = generation,
      request = ++listVersion;
    filters.page = page;
    loading.value = true;
    listError.value = "";
    try {
      const response = await ContactService.getContacts({
        status: filters.status || undefined,
        page,
        per_page: 5,
      });
      if (ticket !== generation || request !== listVersion) return false;
      const data = response.data?.meta || {};
      const last = Math.max(1, Number(data.last_page || 1));
      if (correctPage && page > last) return await fetchContacts(last, false);
      contacts.value = response.data?.data || [];
      Object.assign(meta, {
        current_page: Number(data.current_page || page),
        last_page: last,
        total: Number(data.total || 0),
      });
      return true;
    } catch (err) {
      if (ticket !== generation || request !== listVersion) return false;
      contacts.value = [];
      listError.value =
        err.response?.data?.message || "Không tải được lịch sử liên hệ.";
      return false;
    } finally {
      if (ticket === generation && request === listVersion)
        loading.value = false;
    }
  }
  async function submit() {
    if (submitting.value) return null;
    error.value = "";
    fieldErrors.value = {};
    const payload = {
      subject: form.subject.trim(),
      message: form.message.trim(),
    };
    const length = (text) => Array.from(text).length;
    if (length(payload.subject) < 5 || length(payload.subject) > 150)
      fieldErrors.value.subject = "Chủ đề cần từ 5 đến 150 ký tự.";
    if (length(payload.message) < 20 || length(payload.message) > 2000)
      fieldErrors.value.message = "Nội dung cần từ 20 đến 2.000 ký tự.";
    if (Object.keys(fieldErrors.value).length) return null;
    const ticket = generation;
    submitting.value = true;
    let response;
    try {
      const nextSignature = JSON.stringify(payload);
      if (!requestKey || nextSignature !== signature) {
        requestKey = crypto.randomUUID();
        signature = nextSignature;
      }
      response = await ContactService.submit({
        ...payload,
        request_key: requestKey,
      });
    } catch (err) {
      if (ticket === generation) {
        for (const [key, value] of Object.entries(
          err.response?.data?.errors || {},
        ))
          fieldErrors.value[key] = Array.isArray(value) ? value[0] : value;
        error.value =
          err.response?.status === 429
            ? "Bạn gửi quá nhanh. Vui lòng chờ khoảng một phút rồi thử lại."
            : err.response?.data?.message ||
              "Chưa xác nhận được kết quả gửi. Bạn có thể tải lại lịch sử hoặc gửi lại nguyên nội dung để kiểm tra.";
        submitting.value = false;
      }
      return null;
    }
    if (ticket !== generation) return null;
    const saved = response.data?.data;
    if (!saved?.id) {
      error.value =
        "Máy chủ đã phản hồi nhưng thiếu mã yêu cầu. Tải lại lịch sử trước khi gửi tiếp.";
      submitting.value = false;
      return null;
    }
    receipt.value = saved;
    form.subject = form.message = "";
    requestKey = null;
    signature = "";
    filters.status = "";
    const refreshed = await fetchContacts(1);
    if (ticket !== generation) return null;
    if (!refreshed)
      listError.value =
        "Yêu cầu đã gửi thành công nhưng chưa tải lại được lịch sử. Bấm Tải lại.";
    submitting.value = false;
    return saved;
  }
  function newRequest() {
    if (submitting.value) return;
    receipt.value = null;
    error.value = "";
    fieldErrors.value = {};
  }
  return {
    contacts,
    receipt,
    loading,
    submitting,
    listError,
    error,
    fieldErrors,
    form,
    filters,
    meta,
    reset,
    fetchContacts,
    submit,
    newRequest,
  };
});
