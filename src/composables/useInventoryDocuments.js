import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import api from "@/services/admin/inventory-document.service";
import {
  draftOf,
  draftPayload,
  signature,
  validateDraft,
  lotRows,
  lotPayload,
  validateLots,
  errorText,
  fieldErrors,
} from "@/utils/inventoryDocument";

export function useInventoryDocuments() {
  const auth = useAuthStore();
  const canCreate = computed(() => auth.hasPermission("inventory.create"));
  const canUpdate = computed(() => auth.hasPermission("inventory.update"));
  const rows = ref([]),
    meta = ref({ current_page: 1, last_page: 1, total: 0 });
  const filters = reactive({
    search: "",
    document_type: "",
    status: "",
    date_from: "",
    date_to: "",
  });
  const loading = ref(false),
    busy = ref(false),
    error = ref(""),
    errors = ref([]),
    message = ref("");
  const mode = ref(""),
    document = ref(null),
    form = ref(draftOf(null)),
    lots = ref([]);
  const pending = ref(null),
    recovery = ref(""),
    recoveredDocument = ref(null);
  let alive = true,
    listVersion = 0,
    openVersion = 0,
    sessionVersion = 0,
    original = "",
    cleanForm = "";
  const actor = () => String(auth.user?.id || "");
  const storageKey = () => `nfarm:receipt-write:v1:${actor()}`;
  const editable = computed(
    () =>
      document.value?.document_type === "supplier_receipt" &&
      document.value?.status === "draft",
  );
  const dirty = computed(
    () => mode.value === "edit" && JSON.stringify(form.value) !== cleanForm,
  );
  const locked = computed(() => busy.value || !!pending.value);
  function fail(e) {
    error.value = errorText(e);
    errors.value = fieldErrors(e);
  }
  function clearError() {
    error.value = "";
    errors.value = [];
  }
  function restore() {
    pending.value = null;
    recovery.value = "";
    recoveredDocument.value = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey()) || "null");
      if (
        saved &&
        ["create", "update", "post", "cancel"].includes(saved.kind) &&
        saved.actor === actor()
      )
        pending.value = saved;
    } catch {
      error.value =
        "Không đọc được thao tác đã lưu trong trình duyệt. Hãy kiểm tra phiếu trước khi lập lại.";
    }
  }
  function persist(operation) {
    sessionStorage.setItem(storageKey(), JSON.stringify(operation));
    pending.value = operation;
  }
  function forget() {
    sessionStorage.removeItem(storageKey());
    pending.value = null;
    recovery.value = "";
    recoveredDocument.value = null;
  }
  async function load(page = 1) {
    const version = ++listVersion,
      session = sessionVersion;
    loading.value = true;
    clearError();
    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_to < filters.date_from
    ) {
      error.value = "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
      loading.value = false;
      return;
    }
    try {
      const response = await api.list({
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== ""),
        ),
        page,
        per_page: 15,
      });
      if (!alive || version !== listVersion || session !== sessionVersion)
        return;
      rows.value = response.data.data;
      meta.value = response.data.meta;
    } catch (e) {
      if (alive && version === listVersion && session === sessionVersion)
        fail(e);
    } finally {
      if (alive && version === listVersion && session === sessionVersion)
        loading.value = false;
    }
  }
  function close() {
    if (busy.value) return;
    if (
      dirty.value &&
      !pending.value &&
      !window.confirm("Bỏ các thay đổi chưa lưu của phiếu này?")
    )
      return;
    ++openVersion;
    mode.value = "";
    clearError();
  }
  function create() {
    if (locked.value || !canCreate.value) return;
    clearError();
    message.value = "";
    document.value = null;
    form.value = draftOf(null);
    original = "";
    cleanForm = JSON.stringify(form.value);
    mode.value = "edit";
  }
  async function open(id, target = "detail") {
    if (busy.value || pending.value) return;
    const version = ++openVersion,
      session = sessionVersion;
    busy.value = true;
    clearError();
    message.value = "";
    try {
      const response = await api.detail(id);
      if (!alive || version !== openVersion || session !== sessionVersion)
        return;
      document.value = response.data.data;
      if (target !== "detail" && (!canUpdate.value || !editable.value))
        target = "detail";
      if (
        target === "post" &&
        document.value.items.some((item) => item.unit_cost === null)
      ) {
        target = "detail";
        error.value =
          "Phiếu còn dòng chưa có giá vốn. Chọn Sửa nháp để bổ sung trước khi ghi sổ.";
      }
      original = signature(document.value);
      form.value = draftOf(document.value);
      cleanForm = JSON.stringify(form.value);
      lots.value = lotRows(document.value);
      mode.value = target;
    } catch (e) {
      if (alive && session === sessionVersion) fail(e);
    } finally {
      if (alive && version === openVersion && session === sessionVersion)
        busy.value = false;
    }
  }
  function allowed(operation) {
    return operation.kind === "create" ? canCreate.value : canUpdate.value;
  }
  async function finish(doc, text = "Thao tác đã được xác nhận.") {
    forget();
    document.value = doc;
    mode.value = "detail";
    message.value = text;
    clearError();
    await load(meta.value.current_page || 1);
  }
  async function execute(operation) {
    if (busy.value || !allowed(operation)) return;
    const hadUncertainResult = !!pending.value;
    const owner = actor(),
      session = sessionVersion;
    const current = () =>
      alive &&
      actor() === owner &&
      session === sessionVersion &&
      allowed(operation);
    busy.value = true;
    clearError();
    recovery.value = "";
    recoveredDocument.value = null;
    try {
      persist(operation);
      const response = await api.write(operation, current);
      if (current())
        await finish(
          response.data.data,
          {
            create: "Đã lưu phiếu nháp. Tồn kho chưa thay đổi.",
            update: "Đã cập nhật phiếu nháp.",
            post: "Đã ghi sổ phiếu nhập và cập nhật tồn kho.",
            cancel: "Đã hủy phiếu nháp.",
          }[operation.kind],
        );
    } catch (e) {
      if (!alive || session !== sessionVersion || actor() !== owner) return;
      const status = e.response?.status;
      const definitive =
        e.documentWriteStarted === false ||
        [400, 401, 403, 404, 419, 422, 429].includes(status);
      if (definitive && !hadUncertainResult) {
        try {
          forget();
        } catch {
          /* Keep pending if local storage cannot be updated. */
        }
        fail(e);
      } else if (!pending.value) {
        error.value =
          "Không lưu được mã thao tác trong trình duyệt. Chưa gửi yêu cầu; kiểm tra quyền lưu dữ liệu của trình duyệt.";
      } else {
        error.value =
          "Chưa xác định được kết quả. Hãy bấm Kiểm tra kết quả trước khi thao tác tiếp.";
        errors.value = [errorText(e)];
      }
    } finally {
      if (alive && session === sessionVersion) busy.value = false;
    }
  }
  async function save() {
    if (locked.value) return;
    clearError();
    error.value = validateDraft(form.value);
    if (error.value) return;
    const kind = document.value ? "update" : "create";
    if (!allowed({ kind })) return;
    const payload = draftPayload(form.value);
    if (kind === "create") {
      payload.event_key = crypto.randomUUID();
      await execute({ kind, payload, actor: actor() });
    } else {
      const session = sessionVersion;
      busy.value = true;
      try {
        const fresh = (await api.detail(document.value.id)).data.data;
        if (!alive || session !== sessionVersion) return;
        if (fresh.status !== "draft" || signature(fresh) !== original) {
          error.value =
            "Phiếu đã thay đổi ở phiên khác. Đóng form và mở lại để xem dữ liệu mới.";
          return;
        }
      } catch (e) {
        if (alive && session === sessionVersion) fail(e);
        return;
      } finally {
        if (alive && session === sessionVersion) busy.value = false;
      }
      if (alive && session === sessionVersion)
        await execute({
          kind,
          id: document.value.id,
          payload,
          base: original,
          actor: actor(),
        });
    }
  }
  async function post() {
    if (locked.value || !editable.value || !canUpdate.value) return;
    clearError();
    error.value = validateLots(lots.value);
    if (error.value) return;
    if (
      !window.confirm(
        "Ghi sổ phiếu nhập này? Tồn kho sẽ tăng và phiếu không còn sửa trực tiếp được.",
      )
    )
      return;
    await execute({
      kind: "post",
      id: document.value.id,
      payload: lotPayload(lots.value),
      actor: actor(),
    });
  }
  async function cancel() {
    if (locked.value || !editable.value || !canUpdate.value) return;
    if (!window.confirm("Hủy phiếu nhập nháp này?")) return;
    await execute({
      kind: "cancel",
      id: document.value.id,
      payload: {},
      actor: actor(),
    });
  }
  async function recover() {
    if (busy.value || !pending.value) return;
    const operation = pending.value,
      session = sessionVersion;
    busy.value = true;
    clearError();
    recovery.value = "";
    recoveredDocument.value = null;
    try {
      let doc;
      if (operation.kind === "create") {
        // API hiện tại chưa có lọc event_key: đối chiếu phân trang, không đổi mã để tạo lại.
        for (let page = 1; page <= 100; page++) {
          const response = (
            await api.list({
              document_type: "supplier_receipt",
              per_page: 100,
              page,
            })
          ).data;
          if (!alive || session !== sessionVersion) return;
          const found = response.data.find(
            (row) =>
              row.event_key ===
              `receipt:${operation.payload.event_key.toLowerCase()}`,
          );
          if (found) {
            doc = (await api.detail(found.id)).data.data;
            break;
          }
          if (page >= response.meta.last_page) break;
        }
        if (!doc) recovery.value = "retry";
      } else {
        doc = (await api.detail(operation.id)).data.data;
        if (!alive || session !== sessionVersion) return;
        if (
          (operation.kind === "post" && doc.status === "posted") ||
          (operation.kind === "cancel" && doc.status === "cancelled")
        ) {
          await finish(doc);
          return;
        }
        if (
          operation.kind === "update" &&
          doc.status === "draft" &&
          signature(doc) === signature(operation.payload)
        ) {
          await finish(doc);
          return;
        }
        recoveredDocument.value = doc;
        recovery.value =
          doc.status === "draft" &&
          (operation.kind !== "update" || signature(doc) === operation.base)
            ? "retry"
            : "changed";
        doc = null;
      }
      if (!alive || session !== sessionVersion) return;
      if (doc) {
        await finish(doc);
        return;
      }
      error.value =
        recovery.value === "retry"
          ? "Chưa xác nhận thao tác đã hoàn tất. Có thể gửi lại đúng yêu cầu đang lưu; mã thao tác được giữ nguyên."
          : "Phiếu đã thay đổi. Hãy xem trạng thái mới trước khi tiếp tục.";
    } catch (e) {
      if (alive && session === sessionVersion) fail(e);
    } finally {
      if (alive && session === sessionVersion) busy.value = false;
    }
  }
  async function retry() {
    if (recovery.value !== "retry" || !pending.value) return;
    await execute(pending.value);
  }
  async function acceptCurrent() {
    if (!recoveredDocument.value || busy.value) return;
    if (
      !window.confirm(
        "Kết thúc kiểm tra thao tác cũ và mở phiên bản hiện tại của phiếu?",
      )
    )
      return;
    await finish(
      recoveredDocument.value,
      "Đã tải trạng thái hiện tại của phiếu.",
    );
  }
  function beforeUnload(event) {
    if (dirty.value && !pending.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  onBeforeRouteLeave(() =>
    busy.value
      ? false
      : !dirty.value ||
        !!pending.value ||
        window.confirm("Rời trang và bỏ thay đổi chưa lưu?"),
  );
  watch(
    () => auth.user?.id,
    () => {
      ++sessionVersion;
      ++openVersion;
      ++listVersion;
      busy.value = false;
      loading.value = false;
      mode.value = "";
      rows.value = [];
      document.value = null;
      form.value = draftOf(null);
      message.value = "";
      clearError();
      restore();
      if (auth.hasPermission("inventory.view")) load();
    },
  );
  onMounted(() => {
    restore();
    load();
    window.addEventListener("beforeunload", beforeUnload);
  });
  onBeforeUnmount(() => {
    alive = false;
    ++sessionVersion;
    window.removeEventListener("beforeunload", beforeUnload);
  });
  return {
    canCreate,
    canUpdate,
    rows,
    meta,
    filters,
    loading,
    busy,
    locked,
    error,
    errors,
    message,
    mode,
    document,
    form,
    lots,
    pending,
    recovery,
    recoveredDocument,
    editable,
    load,
    create,
    open,
    close,
    save,
    post,
    cancel,
    recover,
    retry,
    acceptCurrent,
  };
}
