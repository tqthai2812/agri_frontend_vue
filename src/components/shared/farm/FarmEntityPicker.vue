<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiError } from "@/utils/farmApi";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, required: true },
  selectedLabel: { type: String, default: "" },
  fetchOptions: { type: Function, required: true },
  formatLabel: { type: Function, default: (item) => item.name },
  disabled: Boolean,
  optional: Boolean,
});
const emit = defineEmits(["update:modelValue"]);
const search = ref(""),
  items = ref([]),
  loading = ref(false),
  error = ref("");
const page = ref(1),
  lastPage = ref(1);
let controller,
  timer,
  version = 0,
  disposed = false;
const selectedMissing = computed(
  () =>
    props.modelValue !== "" &&
    props.modelValue != null &&
    !items.value.some((item) => String(item.id) === String(props.modelValue)),
);
async function load(nextPage = 1) {
  controller?.abort();
  controller = new AbortController();
  const id = ++version;
  loading.value = true;
  error.value = "";
  try {
    const response = await props.fetchOptions(
      { search: search.value, page: nextPage },
      controller.signal,
    );
    if (disposed || id !== version) return;
    const data = response.data.data || [];
    items.value =
      nextPage === 1
        ? data
        : [...items.value, ...data].filter(
            (item, index, all) =>
              all.findIndex((a) => String(a.id) === String(item.id)) === index,
          );
    page.value = response.data.meta?.current_page || 1;
    lastPage.value = response.data.meta?.last_page || 1;
  } catch (cause) {
    if (!disposed && id === version && cause.code !== "ERR_CANCELED")
      error.value = apiError(cause);
  } finally {
    if (!disposed && id === version) loading.value = false;
  }
}
watch(search, () => {
  controller?.abort();
  version++;
  loading.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => load(1), 300);
});
onMounted(() => load());
onBeforeUnmount(() => {
  disposed = true;
  version++;
  controller?.abort();
  clearTimeout(timer);
});
</script>

<template>
  <div class="farm-picker space-y-2">
    <label class="form-group">
      <span class="form-label">{{ label }}</span>
      <input
        v-model="search"
        type="search"
        maxlength="255"
        :disabled="disabled"
        :aria-label="'Tìm ' + label.toLowerCase()"
        placeholder="Nhập từ khóa để tìm..."
        class="form-control"
      />
    </label>
    <select
      :value="modelValue"
      class="form-control cursor-pointer disabled:cursor-not-allowed"
      :disabled="disabled || loading"
      :aria-label="'Chọn ' + label.toLowerCase()"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ optional ? "Tất cả" : "Chọn một mục" }}</option>
      <option v-if="selectedMissing" :value="modelValue">
        {{ selectedLabel || "Đã chọn #" + modelValue }}
      </option>
      <option v-for="item in items" :key="item.id" :value="item.id">
        {{ formatLabel(item) }}
      </option>
    </select>
    <p v-if="loading" role="status" class="text-xs text-text-light">
      Đang tải lựa chọn...
    </p>
    <p v-if="error" role="alert" class="text-xs text-red-600">
      {{ error }}
      <button
        type="button"
        class="cursor-pointer underline disabled:cursor-not-allowed"
        :disabled="disabled"
        @click="load()"
      >
        Thử lại
      </button>
    </p>
    <button
      v-if="page < lastPage"
      type="button"
      :disabled="loading || disabled"
      class="cursor-pointer text-xs font-semibold underline disabled:cursor-not-allowed"
      @click="load(page + 1)"
    >
      Tải thêm lựa chọn
    </button>
    <p v-if="!loading && !error && !items.length" class="text-xs text-text-light">
      Không có lựa chọn phù hợp.
    </p>
  </div>
</template>