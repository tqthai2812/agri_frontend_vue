import { onBeforeUnmount, reactive, ref, watch } from "vue";

import { apiError } from "@/utils/farmApi";

export function useFarmAdmin(service, emptyForm) {
  const items = ref([]);
  const meta = reactive({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const filters = reactive({ search: "", is_active: "", per_page: 15 });
  const loading = ref(false),
    saving = ref(false),
    deleting = ref(false);
  const error = ref(""),
    message = ref(""),
    formError = ref("");
  const errors = ref({}),
    modalOpen = ref(false),
    editing = ref(null),
    deleteTarget = ref(null);
  const form = reactive(emptyForm());
  let controller,
    version = 0,
    timer,
    disposed = false;

  async function load(page = 1) {
    controller?.abort();
    controller = new AbortController();
    const requestId = ++version;
    loading.value = true;
    error.value = "";
    try {
      const params = { ...filters, page };
      if (params.is_active === "") delete params.is_active;
      const response = await service.list(params, controller.signal);
      if (disposed || requestId !== version) return;
      items.value = response.data.data || [];
      Object.assign(meta, response.data.meta);
      if (!items.value.length && page > meta.last_page)
        return load(meta.last_page);
    } catch (cause) {
      if (disposed || requestId !== version || cause.code === "ERR_CANCELED")
        return;
      error.value = apiError(cause);
      items.value = [];
    } finally {
      if (!disposed && requestId === version) loading.value = false;
    }
  }

  function open(row = null) {
    if (saving.value) return;
    editing.value = row;
    Object.assign(form, emptyForm());
    if (row)
      for (const key of Object.keys(form))
        form[key] = row[key] ?? emptyForm()[key];
    formError.value = "";
    errors.value = {};
    modalOpen.value = true;
  }

  async function save() {
    if (saving.value) return;
    saving.value = true;
    errors.value = {};
    formError.value = "";
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );
    try {
      const response = editing.value
        ? await service.update(editing.value.id, payload)
        : await service.create(payload);
      if (disposed) return;
      modalOpen.value = false;
      message.value = response.data.message;
      await load(editing.value ? meta.current_page : 1);
    } catch (cause) {
      if (disposed) return;
      errors.value = cause.response?.data?.errors || {};
      formError.value = apiError(cause);
    } finally {
      if (!disposed) saving.value = false;
    }
  }

  async function remove() {
    if (deleting.value || !deleteTarget.value) return;
    deleting.value = true;
    const id = deleteTarget.value.id;
    try {
      const response = await service.remove(id);
      if (disposed) return;
      deleteTarget.value = null;
      message.value = response.data.message;
      await load(meta.current_page);
    } catch (cause) {
      if (!disposed) {
        error.value = apiError(cause);
        deleteTarget.value = null;
      }
    } finally {
      if (!disposed) deleting.value = false;
    }
  }

  watch(filters, () => {
    // Không để dữ liệu của bộ lọc cũ hiện thành kết quả mới trong thời gian debounce.
    controller?.abort();
    version++;
    loading.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => load(1), 300);
  });
  onBeforeUnmount(() => {
    disposed = true;
    version++;
    controller?.abort();
    clearTimeout(timer);
  });
  return {
    items,
    meta,
    filters,
    loading,
    saving,
    deleting,
    error,
    message,
    formError,
    errors,
    modalOpen,
    editing,
    deleteTarget,
    form,
    load,
    open,
    save,
    remove,
  };
}