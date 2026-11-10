import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import FarmService from "@/services/shared/farmUtility.service";
import { apiError } from "@/utils/farmApi";

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const active = (value) => value === true || value === 1 || value === "1";

export function useProductUsageModal(getProductId, getVariantId) {
  const search = ref("");
  const guides = ref([]);
  const meta = reactive({ current_page: 1, last_page: 1, total: 0 });
  const selectedId = ref("");
  const selectedGuide = ref(null);
  const loadingList = ref(false);
  const loadingGuide = ref(false);
  const listError = ref("");
  const guideError = ref("");
  const busy = computed(() => loadingList.value || loadingGuide.value);
  let listController,
    guideController,
    listVersion = 0,
    guideVersion = 0,
    timer,
    disposed = false;

  function clearGuide() {
    guideVersion++;
    guideController?.abort();
    selectedId.value = "";
    selectedGuide.value = null;
    guideError.value = "";
    loadingGuide.value = false;
  }

  function belongsToVariant(guide) {
    return (
      sameId(guide.variant_id, getVariantId()) &&
      sameId(guide.variant?.product_id, getProductId())
    );
  }

  async function selectGuide(value) {
    clearGuide();
    if (!value || disposed) return;
    selectedId.value = String(value);
    guideController = new AbortController();
    const requestId = ++guideVersion;
    loadingGuide.value = true;
    try {
      const response = await FarmService.publicGuide(
        value,
        guideController.signal,
      );
      if (disposed || requestId !== guideVersion) return;
      const guide = response.data?.data;
      if (
        !guide?.id ||
        !sameId(guide.id, value) ||
        !belongsToVariant(guide) ||
        !active(guide.is_active) ||
        !active(guide.crop?.is_active) ||
        !active(guide.variant?.product?.is_show)
      ) {
        throw new Error(
          "Hướng dẫn không thuộc biến thể đang chọn hoặc đã bị ẩn. Hãy tải lại danh sách.",
        );
      }
      selectedGuide.value = guide;
    } catch (cause) {
      if (
        disposed ||
        requestId !== guideVersion ||
        cause.code === "ERR_CANCELED"
      )
        return;
      guideError.value = apiError(
        cause,
        "Không tải được hướng dẫn. Vui lòng thử lại.",
      );
    } finally {
      if (!disposed && requestId === guideVersion) loadingGuide.value = false;
    }
  }

  async function load(page = 1) {
    clearTimeout(timer);
    listController?.abort();
    clearGuide();
    const requestId = ++listVersion;
    listError.value = "";
    guides.value = [];
    if (!getProductId() || !getVariantId()) {
      listError.value =
        "Vui lòng chọn biến thể sản phẩm trước khi xem hướng dẫn.";
      loadingList.value = false;
      return;
    }
    listController = new AbortController();
    loadingList.value = true;
    try {
      const response = await FarmService.publicGuides(
        {
          product_id: getProductId(),
          variant_id: getVariantId(),
          search: search.value.trim(),
          page,
          per_page: 24,
        },
        listController.signal,
      );
      if (disposed || requestId !== listVersion) return;
      const data = response.data?.data;
      if (
        !Array.isArray(data) ||
        data.some((guide) => !belongsToVariant(guide))
      ) {
        throw new Error("Danh sách hướng dẫn không khớp biến thể đang chọn.");
      }
      guides.value = data;
      Object.assign(meta, response.data.meta);
      if (meta.total === 1 && data.length === 1) await selectGuide(data[0].id);
    } catch (cause) {
      if (
        disposed ||
        requestId !== listVersion ||
        cause.code === "ERR_CANCELED"
      )
        return;
      listError.value = apiError(cause, "Không tải được danh sách hướng dẫn.");
    } finally {
      if (!disposed && requestId === listVersion) loadingList.value = false;
    }
  }

  function scheduleLoad() {
    clearTimeout(timer);
    listController?.abort();
    listVersion++;
    clearGuide();
    guides.value = [];
    listError.value = "";
    loadingList.value = true;
    timer = setTimeout(() => load(1), 300);
  }

  watch(search, scheduleLoad);
  watch(
    [getProductId, getVariantId],
    () => {
      // Không chạy request tìm kiếm còn chờ của sản phẩm/biến thể cũ.
      clearTimeout(timer);
      if (search.value) {
        search.value = "";
        // Watch search sẽ tải lại với ID mới.
      } else {
        load(1);
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    disposed = true;
    listVersion++;
    guideVersion++;
    clearTimeout(timer);
    listController?.abort();
    guideController?.abort();
  });

  return {
    search,
    guides,
    meta,
    selectedId,
    selectedGuide,
    loadingList,
    loadingGuide,
    listError,
    guideError,
    busy,
    load,
    selectGuide,
  };
}