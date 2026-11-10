<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import FarmCalculator from "@/components/client/farm/FarmCalculator.vue";
import { useProductUsageModal } from "@/composables/client/useProductUsageModal";
import "@/assets/farm-utilities.css";

const props = defineProps({
  product: { type: Object, required: true },
  variantId: { type: [String, Number], required: true },
});
const emit = defineEmits(["close"]);
const route = useRoute();
const dialog = ref(null);
const body = ref(null);
const variant = computed(() =>
  (props.product.variants || []).find(
    (item) => String(item.id) === String(props.variantId),
  ),
);
const {
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
} = useProductUsageModal(
  () => props.product.id,
  () => props.variantId,
);

let previousFocus,
  previousOverflow,
  closed = false;
function close() {
  closed = true;
  emit("close");
}
function guideLabel(guide) {
  return [
    guide.crop?.name,
    guide.purpose,
    guide.growth_stage,
    guide.application_method,
  ]
    .filter(Boolean)
    .join(" · ");
}
function keydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const nodes = [
    ...dialog.value.querySelectorAll(
      "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
    ),
  ].filter((node) => node.getClientRects().length && node.tabIndex >= 0);
  const first = nodes[0],
    last = nodes.at(-1);
  if (!first) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function changeGuide(event) {
  selectGuide(event.target.value);
}
onMounted(async () => {
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  if (!closed) dialog.value?.focus();
});
watch(() => route.fullPath, close);
onBeforeUnmount(() => {
  closed = true;
  document.body.style.overflow = previousOverflow;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
});
</script>

<template>
  <Teleport to="body">
    <div
      class="nf-farm fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-2 text-slate-700 sm:p-5"
      @click.self="close"
    >
      <section
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn & tính lượng sử dụng"
        tabindex="-1"
        class="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f8faf8] shadow-2xl outline-none"
        @keydown="keydown"
      >
        <header
          class="flex shrink-0 items-start justify-between gap-3 border-b border-[#dce8df] bg-white p-4 sm:px-6 sm:py-5"
        >
          <div class="min-w-0">
            <h2 class="text-lg font-bold text-[#153f29]">
              Hướng dẫn & tính lượng sử dụng
            </h2>
            <p class="mt-1 break-words text-xs leading-5 text-slate-500">
              {{ product.product_name || product.name
              }}<span v-if="variant"> · {{ variant.variant_name }}</span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng hướng dẫn"
            class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-[#07532b] transition hover:bg-[#edf5f0] focus-visible:outline-2"
            @click="close"
          >
            <span aria-hidden="true" class="text-2xl leading-none">×</span>
          </button>
        </header>

        <div
          ref="body"
          class="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-3 sm:p-6"
        >
          <section
            class="rounded-2xl border border-[#dce8df] bg-white p-4 sm:p-5"
            :aria-busy="busy"
          >
            <label class="block text-xs font-bold text-slate-600"
              >Tìm theo cây trồng hoặc mục đích
              <input
                v-model="search"
                type="search"
                maxlength="255"
                class="farm-input mt-2"
                placeholder="Nhập từ khóa tìm hướng dẫn..."
                aria-label="Tìm hướng dẫn cho biến thể"
              />
            </label>
            <p
              v-if="loadingList"
              role="status"
              class="mt-4 text-sm text-slate-500"
            >
              Đang tải hướng dẫn cho biến thể này...
            </p>
            <div
              v-else-if="listError"
              role="alert"
              class="mt-4 text-sm text-red-600"
            >
              {{ listError }}
              <button
                type="button"
                class="ml-1 cursor-pointer font-semibold underline"
                @click="load(1)"
              >
                Thử lại
              </button>
            </div>
            <template v-else-if="guides.length">
              <label class="mt-4 block text-xs font-bold text-slate-600"
                >Chọn hướng dẫn sử dụng
                <select
                  :value="selectedId"
                  class="farm-input mt-2"
                  :disabled="loadingGuide"
                  @change="changeGuide"
                >
                  <option value="">Chọn cây trồng và mục đích phù hợp</option>
                  <option
                    v-for="guide in guides"
                    :key="guide.id"
                    :value="guide.id"
                  >
                    {{ guideLabel(guide) }}
                  </option>
                </select>
              </label>
              <p class="mt-2 text-xs leading-5 text-slate-400">
                Hướng dẫn gắn với biến thể đang chọn. Kiểm tra cây trồng, giai
                đoạn và cách sử dụng trước khi tính.
              </p>
              <div
                v-if="meta.last_page > 1"
                class="mt-4 flex items-center justify-between gap-2 text-xs"
              >
                <button
                  type="button"
                  class="farm-outline"
                  :disabled="busy || meta.current_page <= 1"
                  @click="load(meta.current_page - 1)"
                >
                  Trang trước
                </button>
                <span>{{ meta.current_page }} / {{ meta.last_page }}</span>
                <button
                  type="button"
                  class="farm-outline"
                  :disabled="busy || meta.current_page >= meta.last_page"
                  @click="load(meta.current_page + 1)"
                >
                  Trang sau
                </button>
              </div>
            </template>
            <p
              v-else
              role="status"
              class="mt-4 text-sm leading-6 text-slate-500"
            >
              {{
                search.trim()
                  ? "Không tìm thấy hướng dẫn phù hợp từ khóa."
                  : "Biến thể này chưa có hướng dẫn được công bố."
              }}
            </p>
          </section>

          <p
            v-if="loadingGuide && !loadingList"
            role="status"
            class="rounded-xl bg-white p-4 text-sm text-slate-500"
          >
            Đang mở hướng dẫn...
          </p>
          <div
            v-if="guideError"
            role="alert"
            class="rounded-xl bg-red-50 p-4 text-sm text-red-600"
          >
            {{ guideError }}
            <button
              type="button"
              class="ml-1 cursor-pointer font-semibold underline"
              @click="selectGuide(selectedId)"
            >
              Thử lại
            </button>
          </div>
          <FarmCalculator
            v-if="selectedGuide"
            :key="selectedGuide.id"
            :guide="selectedGuide"
            :product="product"
            :show-product-link="false"
          />
          <p
            v-else-if="!busy && !listError && !guideError && guides.length"
            class="rounded-2xl border border-dashed border-[#cadccc] bg-white p-6 text-center text-sm leading-6 text-slate-500"
          >
            Chọn hướng dẫn phía trên để đọc và nhập thông số tính lượng.
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>