<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import { useCartStore } from "@/stores/client/cartStore";
import {
  packageEstimate,
  stockOf,
  formatMoney,
  formatAmount,
  purchaseTotal,
} from "@/utils/farmUsageCalculator";
import { apiError } from "@/utils/farmApi";

const props = defineProps({
  result: { type: Object, required: true },
  product: { type: Object, default: null },
  variantId: { type: [Number, String], required: true },
  loading: Boolean,
  error: { type: String, default: "" },
  showProductLink: { type: Boolean, default: true },
});
defineEmits(["retry"]);
const auth = useAuthStore(),
  cart = useCartStore(),
  route = useRoute(),
  router = useRouter();
const selectedId = ref(""),
  quantity = ref(""),
  busy = ref(false),
  message = ref(""),
  failure = ref("");
let disposed = false,
  revision = 0;
const packages = computed(
  () =>
    (props.product?.variants || []).find(
      (v) => String(v.id) === String(props.variantId),
    )?.packages || [],
);
const compatible = computed(() =>
  packages.value.filter((pkg) => packageEstimate(props.result, pkg)),
);
const selected = computed(
  () =>
    compatible.value.find(
      (pkg) => String(pkg.id) === String(selectedId.value),
    ) || null,
);
const estimate = computed(() => packageEstimate(props.result, selected.value));
const stock = computed(() => stockOf(selected.value));
const count = computed(() =>
  /^[1-9]\d{0,9}$/.test(String(quantity.value)) ? Number(quantity.value) : null,
);
const total = computed(() =>
  selected.value ? purchaseTotal(selected.value.price, quantity.value) : null,
);
const canAdd = computed(
  () =>
    props.product?.is_show &&
    selected.value &&
    estimate.value &&
    total.value &&
    count.value !== null &&
    Number.isSafeInteger(count.value) &&
    stock.value !== null &&
    count.value <= stock.value &&
    stock.value > 0 &&
    !busy.value &&
    !props.loading &&
    !cart.saving,
);
const stockMessage = computed(() =>
  stock.value === null
    ? "Chưa lấy được tồn khả dụng."
    : stock.value > 0
      ? "Còn " + stock.value + " quy cách có thể mua."
      : "Quy cách này hiện hết hàng.",
);

watch(
  () => [props.result, props.variantId, selectedId.value],
  () => {
    revision++;
    quantity.value = "";
    message.value = "";
    failure.value = "";
  },
);
async function addToCart() {
  if (!canAdd.value) return;
  if (!auth.isLoggedIn) {
    await router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }
  const current = revision;
  busy.value = true;
  failure.value = "";
  message.value = "";
  try {
    await cart.addToCart({
      package_id: selected.value.id,
      quantity: count.value,
    });
    if (!disposed && current === revision)
      message.value = "Đã thêm quy cách bạn chọn vào giỏ hàng.";
  } catch (cause) {
    if (disposed || current !== revision) return;
    if (cause.response?.status === 401) {
      await router.push({ name: "login", query: { redirect: route.fullPath } });
      return;
    }
    failure.value = apiError(cause);
  } finally {
    if (!disposed) busy.value = false;
  }
}
onBeforeUnmount(() => {
  disposed = true;
  revision++;
});
</script>
<template>
  <section class="rounded-2xl border border-[#dce8df] bg-white p-5 sm:p-6">
    <h3 class="text-lg font-bold text-[#153f29]">Ước tính quy cách mua</h3>
    <p class="mt-2 text-xs leading-6 text-slate-500">
      Chọn quy cách của đúng biến thể. Số gói/chai được làm tròn lên để chứa đủ
      lượng tính được; lượng sử dụng vẫn theo kết quả bên trên.
    </p>
    <p v-if="loading" role="status" class="mt-4 text-sm text-slate-500">
      Đang tải giá và quy cách...
    </p>
    <div v-else-if="error" role="alert" class="mt-4 text-sm text-red-600">
      {{ error }}
      <button
        type="button"
        class="ml-1 cursor-pointer underline"
        @click="$emit('retry')"
      >
        Tải lại
      </button>
    </div>
    <template v-else-if="compatible.length">
      <label class="mt-4 block text-xs font-bold text-slate-600"
        >Quy cách mua
        <select v-model="selectedId" class="farm-input mt-2" :disabled="busy">
          <option value="">Chọn quy cách</option>
          <option v-for="pkg in compatible" :key="pkg.id" :value="pkg.id">
            {{ formatAmount(pkg.size) }} {{ pkg.unit }} ·
            {{ formatMoney(pkg.price) }} · {{ pkg.sku }}
          </option>
        </select>
      </label>
      <template v-if="selected && estimate">
        <div class="mt-4 rounded-xl bg-[#f3f8f5] p-4">
          <span class="text-xs text-slate-500"
            >Số quy cách chứa lượng đã tính</span
          >
          <strong class="mt-1 block text-xl text-[#07532b]"
            >{{
              estimate.min === estimate.max
                ? estimate.min
                : estimate.min + " – " + estimate.max
            }}
            gói/chai</strong
          >
          <p class="mt-2 text-xs leading-5 text-slate-500">
            Một quy cách chứa {{ formatAmount(estimate.capacity) }}
            {{ result.unit }}. Mua nguyên gói/chai không có nghĩa dùng hết một
            lần.
          </p>
        </div>
        <div class="mt-4 grid items-end gap-4 sm:grid-cols-2">
          <label class="block text-xs font-bold text-slate-600"
            >Số gói/chai bạn muốn mua
            <input
              v-model="quantity"
              type="number"
              min="1"
              :max="stock || undefined"
              step="1"
              :disabled="busy"
              class="farm-input mt-2"
              placeholder="Tự chọn số lượng"
            />
          </label>
          <div>
            <span class="text-xs text-slate-500">Tiền hàng ước tính</span
            ><strong class="mt-2 block text-xl text-[#0a8b43]">{{
              total || "—"
            }}</strong>
          </div>
        </div>
        <p
          class="mt-3 text-xs"
          :class="stock ? 'text-slate-500' : 'text-amber-700'"
        >
          {{ stockMessage }}
        </p>
        <p
          v-if="quantity && (!count || (stock !== null && count > stock))"
          class="mt-2 text-xs text-red-600"
        >
          Nhập số nguyên lớn hơn 0 và không vượt tồn khả dụng.
        </p>
        <button
          type="button"
          :disabled="!canAdd"
          class="farm-button mt-4 w-full"
          @click="addToCart"
        >
          <Icon
            :icon="busy ? 'mdi:loading' : 'mdi:cart-outline'"
            :class="{ 'animate-spin': busy }"
          />
          {{
            busy
              ? "Đang thêm..."
              : auth.isLoggedIn
                ? "Thêm vào giỏ hàng"
                : "Đăng nhập để thêm giỏ hàng"
          }}
        </button>
        <p class="mt-3 text-xs leading-5 text-slate-400">
          Giá tiền hàng theo số gói/chai đã chọn, chưa gồm vận chuyển hoặc giảm
          giá. Giỏ hàng sẽ kiểm tra lại giá và tồn kho.
        </p>
        <p v-if="message" role="status" class="mt-3 text-sm text-[#07532b]">
          {{ message }}
          <RouterLink to="/cart" class="font-semibold underline"
            >Xem giỏ hàng</RouterLink
          >
        </p>
        <p v-if="failure" role="alert" class="mt-3 text-sm text-red-600">
          {{ failure }}
        </p>
      </template>
    </template>
    <p v-else class="mt-4 text-sm leading-6 text-slate-500">
      Chưa có quy cách cùng đơn vị để quy đổi. Tiện ích không tự chuyển gam sang
      mililít hoặc suy đoán dung lượng từ đơn vị “cái”.
    </p>
    <RouterLink
      v-if="showProductLink && product?.id"
      :to="{ name: 'client-product-detail', params: { id: product.id } }"
      class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#07532b] underline"
      >Xem chi tiết sản phẩm<Icon icon="mdi:arrow-right"
    /></RouterLink>
  </section>
</template>