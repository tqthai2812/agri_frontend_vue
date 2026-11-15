<script setup>
import "@/assets/finance.css";
import { Icon } from "@iconify/vue";
import { ref, watch, onBeforeUnmount } from "vue";
import api from "@/services/admin/finance.service";
import { money, errorText } from "@/composables/useFinance";
const props = defineProps({
  kind: String,
  label: String,
  modelValue: [Number, String],
  selectedLabel: String,
  orderId: [Number, String],
  disabled: Boolean,
  activeOnly: Boolean,
});
const emit = defineEmits(["update:modelValue", "select"]);
const search = ref(""),
  rows = ref([]),
  error = ref(""),
  open = ref(false),
  loading = ref(false);
let controller,
  g = 0;
async function lookup() {
  const n = ++g;
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  open.value = true;
  error.value = "";
  try {
    const category = props.kind === "expense-categories";
    const r = await api.get(
      category ? "/expense-categories" : "/finance/lookups/" + props.kind,
      {
        search: search.value,
        order_id: props.orderId || undefined,
        ...(category
          ? { per_page: 20, is_active: props.activeOnly ? 1 : undefined }
          : {}),
      },
      controller.signal,
    );
    if (n === g)
      rows.value = category
        ? r.data.data.map((c) => ({
            id: c.id,
            label: c.code + " · " + c.name + (c.is_active ? "" : " (đã tắt)"),
          }))
        : r.data.data;
  } catch (e) {
    if (n === g && e.code !== "ERR_CANCELED" && e.name !== "AbortError")
      error.value = await errorText(e);
  } finally {
    if (n === g) loading.value = false;
  }
}
function select(row) {
  emit("update:modelValue", row?.id ?? null);
  emit("select", row);
  open.value = false;
}
watch(
  () => [props.kind, props.orderId],
  () => {
    ++g;
    controller?.abort();
    rows.value = [];
    open.value = false;
    loading.value = false;
  },
);
onBeforeUnmount(() => {
  ++g;
  controller?.abort();
});
</script>
<template>
  <div class="product-admin">
    <label class="form-group"
      ><span class="form-label">{{ label }}
      </span><div class="flex gap-2">
        <input class="form-control"
          v-model="search"
          :disabled="disabled"
          :placeholder="
            modelValue
              ? selectedLabel || 'Đã chọn #' + modelValue
              : 'Nhập mã để tìm'
          "
          @keydown.enter.prevent="lookup"
        /><button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="disabled || loading"
          @click="lookup"
        >
<Icon icon="solar:magnifer-bold" aria-hidden="true" />
          Tìm
        </button>
      </div></label
    >
    <div
      v-if="modelValue"
      class="mt-2 flex items-center justify-between gap-2 text-xs"
    >
      <span>{{ selectedLabel || "Đã chọn #" + modelValue }}</span
      ><button
        type="button"
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        :disabled="disabled"
        @click="select(null)"
      >
         <Icon icon="solar:close-circle-bold" class="shrink-0" aria-hidden="true" />
        Bỏ chọn
      </button>
    </div>
    <p v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
    <div
      v-if="open"
      class="mt-2 max-h-48 overflow-auto rounded-lg border border-border"
    >
      <p v-if="loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />Đang tìm...</p>
      <template v-else
        ><button
          v-for="row in rows"
          :key="row.id"
          type="button"
          class="block w-full border-b border-border p-3 text-left text-xs hover:bg-bg cursor-pointer disabled:cursor-not-allowed"
          @click="select(row)"
        >
          {{ row.label }}
          <span v-if="row.amount">· {{ money(row.amount) }}</span>
        </button>
        <p v-if="!rows.length" class="p-3 text-xs">
          Không có kết quả.
        </p></template
      >
    </div>
  </div>
</template>