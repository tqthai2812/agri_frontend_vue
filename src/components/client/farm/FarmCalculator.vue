<script setup>
import { computed, reactive } from "vue";
import { Icon } from "@iconify/vue";
import FarmGuideInstructions from "./FarmGuideInstructions.vue";
import FarmPackageEstimate from "./FarmPackageEstimate.vue";
import {
  calculateUsage,
  formatRange,
  hasValue,
} from "@/utils/farmUsageCalculator";
const props = defineProps({
  guide: { type: Object, required: true },
  product: { type: Object, default: null },
  loading: Boolean,
  productError: { type: String, default: "" },
  showProductLink: { type: Boolean, default: true },
});
defineEmits(["retry"]);
const inputs = reactive({ area: "", areaUnit: "m2", water: "" });
const result = computed(() => calculateUsage(props.guide, inputs));
const needsArea = computed(
  () =>
    hasValue(props.guide.dose_per_ha_min) ||
    hasValue(props.guide.water_l_per_ha_min),
);
const needsWater = computed(
  () =>
    hasValue(props.guide.dose_per_liter_min) ||
    hasValue(props.guide.water_l_per_ha_min),
);
const quantitative = computed(
  () => result.value.kind !== "text" && result.value.kind !== "empty",
);
</script>
<template>
  <div class="space-y-5">
    <section
      class="overflow-hidden rounded-2xl border border-[#dce8df] bg-white"
    >
      <header class="border-b border-[#e3ece6] bg-[#f5faf6] p-5 sm:p-6">
        <span
          class="text-xs font-bold uppercase tracking-wider text-[#b18d14]"
          >{{ guide.crop?.name }}</span
        >
        <h2 class="mt-2 text-xl font-bold text-[#153f29]">
          {{ guide.variant?.product?.product_name }}
        </h2>
        <p class="mt-2 text-xs text-slate-500">
          {{ guide.variant?.variant_name }} · {{ guide.application_method
          }}<template v-if="guide.growth_stage">
            · {{ guide.growth_stage }}</template
          >
        </p>
        <p class="mt-3 text-sm font-semibold text-[#07532b]">
          {{ guide.purpose }}
        </p>
      </header>
      <div class="p-5 sm:p-6">
        <div v-if="quantitative">
          <h3 class="flex items-center gap-2 font-bold text-[#153f29]">
            <Icon icon="solar:calculator-bold-duotone" class="text-xl" />Tính
            lượng cho một lần sử dụng
          </h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div v-if="needsArea">
              <label class="block text-xs font-bold text-slate-600"
                >Diện tích áp dụng
                <input
                  v-model="inputs.area"
                  type="text"
                  inputmode="decimal"
                  maxlength="15"
                  class="farm-input mt-2"
                  placeholder="Nhập diện tích"
                />
              </label>
              <select
                v-model="inputs.areaUnit"
                class="farm-input mt-2"
                aria-label="Đơn vị diện tích"
              >
                <option value="m2">m² (mét vuông)</option>
                <option value="ha">ha (hecta)</option>
              </select>
            </div>
            <label
              v-if="needsWater"
              class="block text-xs font-bold text-slate-600"
              >Tổng lượng nước (lít)
              <input
                v-model="inputs.water"
                aria-label="Tổng lượng nước (lít)"
                type="text"
                inputmode="decimal"
                maxlength="15"
                class="farm-input mt-2"
                placeholder="Lượng nước cho diện tích này"
              />
              <span
                class="mt-2 block text-xs font-normal leading-5 text-slate-400"
                >Tổng nước sử dụng trong lần này, không phải dung tích riêng của
                một bình.</span
              >
            </label>
          </div>
          <div
            class="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500"
          >
            <p v-if="hasValue(guide.dose_per_ha_min)">
              Định mức diện tích:
              {{ formatRange(guide.dose_per_ha_min, guide.dose_per_ha_max) }}
              {{ guide.dose_unit }}/ha.
            </p>
            <p v-if="hasValue(guide.dose_per_liter_min)">
              Định mức pha:
              {{
                formatRange(guide.dose_per_liter_min, guide.dose_per_liter_max)
              }}
              {{ guide.dose_unit }}/lít nước.
            </p>
            <p v-if="hasValue(guide.water_l_per_ha_min)">
              Lượng nước:
              {{
                formatRange(guide.water_l_per_ha_min, guide.water_l_per_ha_max)
              }}
              lít/ha.
            </p>
          </div>
        </div>
        <div class="mt-4" aria-live="polite" aria-atomic="true">
          <div
            v-if="result.kind === 'result'"
            class="rounded-2xl bg-[#07532b] p-5 text-white"
          >
            <p class="text-xs text-white/70">
              Lượng sản phẩm cho một lần sử dụng
            </p>
            <strong class="mt-2 block break-words text-3xl"
              >{{ formatRange(result.min, result.max) }}
              {{ result.unit }}</strong
            >
            <p
              v-if="result.constraints.length > 1"
              class="mt-3 text-xs leading-6 text-white/70"
            >
              Khoảng kết quả thỏa đồng thời định mức theo diện tích và lượng
              nước.
            </p>
            <div
              v-for="item in result.constraints"
              :key="item.label"
              class="mt-2 text-xs text-white/80"
            >
              {{ item.label }}: {{ formatRange(item.min, item.max) }}
              {{ result.unit }}
            </div>
            <p class="mt-4 text-xs leading-6 text-white/70">
              Kết quả hiển thị đến 6 chữ số thập phân. Đọc điều kiện áp dụng và
              nội dung nhãn bên dưới; không tự cộng hai liều hoặc nhân thành
              tổng cả vụ.
            </p>
          </div>
          <p
            v-else
            :role="result.kind === 'error' ? 'alert' : 'status'"
            class="rounded-xl p-4 text-sm leading-6"
            :class="
              result.kind === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-[#f3f8f5] text-slate-500'
            "
          >
            {{ result.message }}
          </p>
        </div>
      </div>
    </section>
    <FarmPackageEstimate
      v-if="result.kind === 'result'"
      :key="guide.id"
      :result="result"
      :product="product"
      :variant-id="guide.variant_id"
      :loading="loading"
      :error="productError"
      :show-product-link="showProductLink"
      @retry="$emit('retry')"
    />
    <FarmGuideInstructions :guide="guide" />
  </div>
</template>