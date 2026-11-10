import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import FarmService from "@/services/shared/farmUtility.service";
import ClientProductService from "@/services/client/clientProduct.service";
import { apiError } from "@/utils/farmApi";

export function useFarmUtility() {
  const route = useRoute(),
    router = useRouter();
  const filters = reactive({ search: "", crop_id: "" });
  const guides = ref([]),
    loading = ref(false),
    error = ref("");
  const meta = reactive({ current_page: 1, last_page: 1, total: 0 });
  const selectedGuide = ref(null),
    product = ref(null),
    selecting = ref(false),
    productError = ref("");
  const selectionError = ref("");
  const productId = computed(() =>
    /^\d+$/.test(String(route.query.product_id || ""))
      ? String(route.query.product_id)
      : "",
  );
  const variantId = computed(() =>
    /^\d+$/.test(String(route.query.variant_id || ""))
      ? String(route.query.variant_id)
      : "",
  );
  let listController,
    selectController,
    listVersion = 0,
    selectVersion = 0,
    timer,
    disposed = false;

  function clearSelection() {
    selectVersion++;
    selectController?.abort();
    selectedGuide.value = null;
    product.value = null;
    selecting.value = false;
    productError.value = "";
    selectionError.value = "";
  }

  async function load(page = 1) {
    listController?.abort();
    listController = new AbortController();
    const id = ++listVersion;
    loading.value = true;
    error.value = "";
    try {
      const params = { search: filters.search, page, per_page: 9 };
      if (filters.crop_id) params.crop_id = filters.crop_id;
      if (productId.value) params.product_id = productId.value;
      if (variantId.value) params.variant_id = variantId.value;
      const response = await FarmService.publicGuides(
        params,
        listController.signal,
      );
      if (disposed || id !== listVersion) return;
      guides.value = response.data.data || [];
      Object.assign(meta, response.data.meta);
    } catch (cause) {
      if (disposed || id !== listVersion || cause.code === "ERR_CANCELED")
        return;
      error.value = apiError(cause);
      guides.value = [];
    } finally {
      if (!disposed && id === listVersion) loading.value = false;
    }
  }

  async function selectGuide(id) {
    clearSelection();
    selectController = new AbortController();
    const version = ++selectVersion;
    selecting.value = true;
    try {
      const response = await FarmService.publicGuide(
        id,
        selectController.signal,
      );
      if (disposed || version !== selectVersion) return;
      const guide = response.data.data;
      if (!guide?.id || !guide.variant?.product_id)
        throw new Error("Không lấy được hướng dẫn hợp lệ.");
      selectedGuide.value = guide;
      try {
        const response = await ClientProductService.getProduct(
          guide.variant.product_id,
        );
        if (disposed || version !== selectVersion) return;
        product.value = response.data.data || null;
        if (
          !product.value?.variants?.some(
            (variant) => String(variant.id) === String(guide.variant_id),
          )
        ) {
          throw new Error("Biến thể này không còn trong sản phẩm.");
        }
      } catch (cause) {
        if (disposed || version !== selectVersion) return;
        product.value = null;
        productError.value = apiError(
          cause,
          "Không tải được giá và quy cách. Bạn vẫn có thể đọc hướng dẫn.",
        );
      }
    } catch (cause) {
      if (
        disposed ||
        version !== selectVersion ||
        cause.code === "ERR_CANCELED"
      )
        return;
      selectionError.value = apiError(cause);
    } finally {
      if (!disposed && version === selectVersion) selecting.value = false;
    }
  }

  function clearProductFilter() {
    const query = { ...route.query };
    delete query.product_id;
    delete query.variant_id;
    router.replace({ name: "farm-utilities", query });
  }

  watch(
    [() => filters.search, () => filters.crop_id, productId, variantId],
    () => {
      clearSelection();
      listController?.abort();
      listVersion++;
      loading.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => load(1), 300);
    },
  );
  onBeforeUnmount(() => {
    disposed = true;
    listVersion++;
    selectVersion++;
    clearTimeout(timer);
    listController?.abort();
    selectController?.abort();
  });
  return {
    filters,
    guides,
    loading,
    error,
    meta,
    selectedGuide,
    product,
    selecting,
    productError,
    selectionError,
    productId,
    variantId,
    load,
    selectGuide,
    clearProductFilter,
    clearSelection,
  };
}