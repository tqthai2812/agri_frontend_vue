<script setup>
import { Icon } from "@iconify/vue";
import { formatRange, hasValue } from "@/utils/farmUsageCalculator";
defineProps({ guide: { type: Object, required: true }, selected: Boolean });
defineEmits(["select"]);
</script>
<template>
  <button
    type="button"
    class="farm-guide-card flex h-full w-full cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    :class="
      selected
        ? 'border-[#07532b] ring-2 ring-[#07532b]/15'
        : 'border-[#dce8df] hover:border-[#8caf99]'
    "
    :aria-pressed="selected"
    @click="$emit('select', guide.id)"
  >
    <span class="flex w-full items-center justify-between gap-2">
      <span
        class="rounded-full bg-[#edf5f0] px-3 py-1 text-[11px] font-bold text-[#07532b]"
        >{{ guide.crop?.name }}</span
      >
      <Icon icon="solar:leaf-bold-duotone" class="text-xl text-[#d2a900]" />
    </span>
    <strong class="mt-4 text-base text-[#153f29]">{{
      guide.variant?.product?.product_name
    }}</strong>
    <span class="mt-1 text-xs text-slate-500">{{
      guide.variant?.variant_name
    }}</span>
    <span class="mt-3 text-sm font-semibold text-slate-700">{{
      guide.purpose
    }}</span>
    <span class="mt-1 text-xs leading-5 text-slate-500"
      >{{ guide.application_method
      }}<template v-if="guide.growth_stage">
        · {{ guide.growth_stage }}</template
      ></span
    >
    <span class="my-4 h-px w-full bg-[#edf2ee]"></span>
    <span
      v-if="hasValue(guide.dose_per_ha_min)"
      class="text-sm font-semibold text-[#07532b]"
      >{{ formatRange(guide.dose_per_ha_min, guide.dose_per_ha_max) }}
      {{ guide.dose_unit }}/ha</span
    >
    <span
      v-if="hasValue(guide.dose_per_liter_min)"
      class="mt-1 text-sm font-semibold text-[#07532b]"
      >{{ formatRange(guide.dose_per_liter_min, guide.dose_per_liter_max) }}
      {{ guide.dose_unit }}/lít nước</span
    >
    <span
      class="mt-auto flex items-center justify-between gap-2 pt-4 text-xs font-bold text-[#07532b]"
      >{{ guide.can_calculate ? "Xem hướng dẫn & tính lượng" : "Đọc hướng dẫn"
      }}<Icon icon="mdi:arrow-right" class="text-lg"
    /></span>
  </button>
</template>