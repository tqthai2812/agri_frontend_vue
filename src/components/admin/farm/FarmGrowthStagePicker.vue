<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import FarmService from "@/services/shared/farmUtility.service";
import { apiError } from "@/utils/farmApi";
const props = defineProps({
  modelValue: { type: Array, required: true },
  cropId: { type: [String, Number], default: "" },
  selectedStages: { type: Array, default: () => [] },
  disabled: Boolean,
});
const emit = defineEmits(["update:modelValue"]);
const search = ref(""),
  items = ref([]),
  cache = ref(new Map()),
  loading = ref(false),
  error = ref("");
const page = ref(1),
  lastPage = ref(1);
const selected = computed(() => new Set(props.modelValue.map(String)));
const selectedRows = computed(() =>
  props.modelValue.map(
    (id) =>
      cache.value.get(String(id)) ||
      props.selectedStages.find((s) => String(s.id) === String(id)) || {
        id,
        name: "Giai đoạn #" + id,
      },
  ),
);
let controller,
  timer,
  version = 0,
  disposed = false;
function toggle(id, checked) {
  const next = props.modelValue.filter((value) => String(value) !== String(id));
  if (checked) next.push(id);
  emit("update:modelValue", next);
}
async function load(nextPage = 1) {
  controller?.abort();
  const requestId = ++version;
  if (!props.cropId) {
    items.value = [];
    loading.value = false;
    return;
  }
  controller = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    const response = await FarmService.growthStageOptions(
      { crop_id: props.cropId, search: search.value, page: nextPage },
      controller.signal,
    );
    if (disposed || requestId !== version) return;
    const data = response.data.data || [];
    if (data.some((stage) => String(stage.crop_id) !== String(props.cropId)))
      throw new Error("Danh sách giai đoạn không khớp cây trồng.");
    items.value =
      nextPage === 1
        ? data
        : [...items.value, ...data].filter(
            (row, index, all) =>
              all.findIndex((r) => String(r.id) === String(row.id)) === index,
          );
    for (const stage of data) cache.value.set(String(stage.id), stage);
    page.value = response.data.meta?.current_page || 1;
    lastPage.value = response.data.meta?.last_page || 1;
  } catch (cause) {
    if (!disposed && requestId === version && cause.code !== "ERR_CANCELED")
      error.value = apiError(cause);
  } finally {
    if (!disposed && requestId === version) loading.value = false;
  }
}
watch(search, () => {
  controller?.abort();
  version++;
  loading.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => load(1), 300);
});
watch(
  () => props.cropId,
  () => {
    clearTimeout(timer);
    items.value = [];
    cache.value = new Map();
    load();
  },
);
onMounted(() => load());
onBeforeUnmount(() => {
  disposed = true;
  version++;
  controller?.abort();
  clearTimeout(timer);
});
</script>
<template>
  <div class="space-y-3 rounded-xl border border-border p-4">
    <label class="form-group"
      ><span class="form-label">Chọn giai đoạn áp dụng</span
      ><input
        v-model="search"
        type="search"
        maxlength="255"
        class="form-control"
        placeholder="Tìm giai đoạn của cây đã chọn..."
        :disabled="disabled || !cropId"
    /></label>
    <p v-if="!cropId" class="text-sm text-text-light">Chọn cây trồng trước.</p>
    <div
      v-if="selectedRows.length"
      class="flex flex-wrap gap-2"
      aria-label="Giai đoạn đã chọn"
    >
      <span
        v-for="stage in selectedRows"
        :key="stage.id"
        class="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary"
        >{{ stage.name
        }}<button
          type="button"
          class="cursor-pointer text-base disabled:cursor-not-allowed"
          :aria-label="'Bỏ chọn ' + stage.name"
          :disabled="disabled"
          @click="toggle(stage.id, false)"
        >
          ×
        </button></span
      >
    </div>
    <p v-if="loading" role="status" class="text-sm text-text-light">
      Đang tải giai đoạn...
    </p>
    <p v-if="error" role="alert" class="text-sm text-red-600">
      {{ error }}
      <button
        type="button"
        class="cursor-pointer underline"
        :disabled="disabled"
        @click="load()"
      >
        Thử lại
      </button>
    </p>
    <div v-else-if="items.length" class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="stage in items"
        :key="stage.id"
        class="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        ><input
          type="checkbox"
          class="mt-1 cursor-pointer"
          :checked="selected.has(String(stage.id))"
          :disabled="disabled || loading"
          :aria-label="stage.name"
          @change="toggle(stage.id, $event.target.checked)"
        /><span
          >{{ stage.name
          }}<small v-if="!stage.is_active" class="ml-1 text-text-light"
            >(đang ẩn)</small
          ></span
        ></label
      >
    </div>
    <p v-else-if="cropId && !loading && !error" class="text-sm text-text-light">
      Chưa có giai đoạn phù hợp. Thêm tại mục Giai đoạn sinh trưởng.
    </p>
    <button
      v-if="page < lastPage && !error"
      type="button"
      class="cursor-pointer text-xs font-semibold underline disabled:cursor-not-allowed"
      :disabled="disabled || loading"
      @click="load(page + 1)"
    >
      Tải thêm giai đoạn
    </button>
  </div>
</template>