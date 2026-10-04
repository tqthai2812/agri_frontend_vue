import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import ContactService from "@/services/admin/contact.service";

export const useAdminContactStore = defineStore("adminContacts", () => {
  const contacts = ref([]),
    selected = ref(null),
    selectedId = ref(null),
    showDetail = ref(false);
  const loading = ref(false),
    loadingDetail = ref(false),
    saving = ref(false),
    needsReload = ref(false);
  const listError = ref(""),
    detailError = ref(""),
    actionError = ref(""),
    message = ref("");
  const filters = reactive({
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 15,
  });
  const meta = reactive({ current_page: 1, last_page: 1, total: 0 });
  const summary = reactive({ total: 0, pending: 0, resolved: 0, rejected: 0 });
  const form = reactive({ status: "pending", admin_note: "" });
  const dirty = computed(
    () =>
      Boolean(selected.value) &&
      (form.status !== selected.value.status ||
        form.admin_note !== (selected.value.admin_note || "")),
  );
  let generation = 0,
    listVersion = 0,
    detailVersion = 0;
  function errorText(err, fallback) {
    const first = Object.values(err.response?.data?.errors || {})[0];
    return (
      (Array.isArray(first) ? first[0] : first) ||
      err.response?.data?.message ||
      fallback
    );
  }
  function acceptDetail(data) {
    selected.value = data;
    form.status = data?.status || "pending";
    form.admin_note = data?.admin_note || "";
  }
  async function fetchContacts(page = filters.page, correctPage = true) {
    const ticket = generation,
      request = ++listVersion;
    filters.page = page;
    loading.value = true;
    listError.value = "";
    try {
      const response = await ContactService.getContacts({ ...filters, page });
      if (ticket !== generation || request !== listVersion) return false;
      const data = response.data?.meta || {},
        last = Math.max(1, Number(data.last_page || 1));
      if (correctPage && page > last) return await fetchContacts(last, false);
      contacts.value = response.data?.data || [];
      Object.assign(meta, {
        current_page: Number(data.current_page || page),
        last_page: last,
        total: Number(data.total || 0),
      });
      for (const key of Object.keys(summary))
        summary[key] = Number(response.data?.summary?.[key] || 0);
      return true;
    } catch (err) {
      if (ticket !== generation || request !== listVersion) return false;
      contacts.value = [];
      listError.value = errorText(err, "Không tải được danh sách liên hệ.");
      return false;
    } finally {
      if (ticket === generation && request === listVersion)
        loading.value = false;
    }
  }
  async function fetchDetail(id = selectedId.value) {
    if (!id || saving.value) return false;
    const ticket = generation,
      request = ++detailVersion;
    selectedId.value = id;
    acceptDetail(null);
    loadingDetail.value = true;
    detailError.value = actionError.value = "";
    needsReload.value = false;
    try {
      const response = await ContactService.getContact(id);
      if (
        ticket !== generation ||
        request !== detailVersion ||
        !showDetail.value
      )
        return false;
      acceptDetail(response.data?.data || null);
      return true;
    } catch (err) {
      if (
        ticket !== generation ||
        request !== detailVersion ||
        !showDetail.value
      )
        return false;
      detailError.value = errorText(err, "Không tải được chi tiết liên hệ.");
      return false;
    } finally {
      if (ticket === generation && request === detailVersion)
        loadingDetail.value = false;
    }
  }
  function openDetail(contact) {
    if (saving.value) return;
    message.value = "";
    showDetail.value = true;
    return fetchDetail(contact.id);
  }
  function closeDetail() {
    if (saving.value) return;
    detailVersion++;
    showDetail.value = false;
    selectedId.value = null;
    acceptDetail(null);
    loadingDetail.value = false;
    needsReload.value = false;
    detailError.value = actionError.value = "";
  }
  async function save() {
    if (
      saving.value ||
      loadingDetail.value ||
      needsReload.value ||
      !selected.value
    )
      return false;
    actionError.value = message.value = "";
    const note = form.admin_note.trim();
    if (
      Array.from(note).length > 5000 ||
      (form.status === "rejected" && !note)
    ) {
      actionError.value =
        "Ghi chú tối đa 5.000 ký tự; cần ghi lý do khi từ chối.";
      return false;
    }
    const ticket = generation,
      id = selected.value.id;
    const payload = {
      status: form.status,
      admin_note: note || null,
      expected_version: selected.value.lock_version,
    };
    saving.value = true;
    let response;
    try {
      response = await ContactService.update(id, payload);
    } catch (err) {
      if (ticket === generation) {
        actionError.value = errorText(
          err,
          "Không lưu được thay đổi. Nội dung đang nhập vẫn được giữ lại.",
        );
        needsReload.value = err.response?.status === 409;
        saving.value = false;
      }
      return false;
    }
    if (ticket !== generation) return true;
    acceptDetail(response.data?.data || null);
    message.value = response.data?.message || "Đã lưu xử lý liên hệ.";
    const refreshed = await fetchContacts();
    if (ticket === generation) {
      if (!refreshed)
        listError.value =
          "Đã lưu thành công nhưng chưa tải lại được danh sách. Bấm Tải lại.";
      saving.value = false;
    }
    return true;
  }
  function resetFilters() {
    Object.assign(filters, {
      search: "",
      status: "",
      date_from: "",
      date_to: "",
      page: 1,
    });
  }
  function dispose() {
    generation++;
    listVersion++;
    detailVersion++;
    contacts.value = [];
    selectedId.value = null;
    acceptDetail(null);
    showDetail.value = false;
    loading.value = loadingDetail.value = saving.value = false;
    listError.value =
      detailError.value =
      actionError.value =
      message.value =
        "";
    needsReload.value = false;
    Object.assign(summary, { total: 0, pending: 0, resolved: 0, rejected: 0 });
    Object.assign(meta, { current_page: 1, last_page: 1, total: 0 });
    resetFilters();
  }
  return {
    contacts,
    selected,
    selectedId,
    showDetail,
    loading,
    loadingDetail,
    saving,
    needsReload,
    listError,
    detailError,
    actionError,
    message,
    filters,
    meta,
    summary,
    form,
    dirty,
    fetchContacts,
    fetchDetail,
    openDetail,
    closeDetail,
    save,
    resetFilters,
    dispose,
  };
});
