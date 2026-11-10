<script setup>
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { formatRange, hasValue } from "@/utils/farmUsageCalculator";
defineProps({
  items: { type: Array, required: true },
  loading: Boolean,
  busy: Boolean,
});
defineEmits(["edit", "delete"]);
const auth = useAuthStore();
</script>
<template>
  <div v-if="loading" role="status" class="py-10 text-center text-text-light">
    <Icon
      icon="solar:refresh-bold"
      class="mx-auto mb-2 animate-spin text-3xl"
    />
    <p class="text-sm">Đang tải hướng dẫn...</p>
  </div>
  <div v-else class="overflow-x-auto">
    <table class="w-full min-w-[1050px]">
      <thead class="bg-bg">
        <tr>
          <th
            v-for="label in [
              'Sản phẩm / Biến thể',
              'Cây trồng',
              'Mục đích',
              'Định mức',
              'Cách ly',
              'Trạng thái',
              'Thao tác',
            ]"
            :key="label"
            class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light"
          >
            {{ label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-border hover:bg-primary/5"
        >
          <td class="p-3">
            <div class="flex items-center gap-3">
              <span
                class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
                ><Icon icon="solar:document-text-bold-duotone" class="text-xl"
              /></span>
              <div class="max-w-[240px]">
                <strong class="block text-sm font-semibold">{{
                  item.variant?.product?.product_name
                }}</strong>
                <span class="text-xs text-text-light"
                  >{{ item.variant?.variant_name }} · #{{ item.id }}</span
                >
              </div>
            </div>
          </td>
          <td class="p-3 text-sm">
            <span class="badge-gray">{{ item.crop?.name }}</span>
          </td>
          <td class="max-w-[250px] p-3 text-sm">
            <strong class="block">{{ item.purpose }}</strong>
            <div class="mt-1 text-xs text-text-light">
              {{ item.application_method
              }}<template v-if="item.growth_stage">
                · {{ item.growth_stage }}</template
              >
            </div>
          </td>
          <td class="p-3 text-xs leading-6">
            <div v-if="hasValue(item.dose_per_ha_min)">
              {{ formatRange(item.dose_per_ha_min, item.dose_per_ha_max) }}
              {{ item.dose_unit }}/ha
            </div>
            <div v-if="hasValue(item.dose_per_liter_min)">
              {{
                formatRange(item.dose_per_liter_min, item.dose_per_liter_max)
              }}
              {{ item.dose_unit }}/lít nước
            </div>
            <div
              v-if="hasValue(item.water_l_per_ha_min)"
              class="text-text-light"
            >
              Nước:
              {{
                formatRange(item.water_l_per_ha_min, item.water_l_per_ha_max)
              }}
              lít/ha
            </div>
            <span
              v-if="
                !hasValue(item.dose_per_ha_min) &&
                !hasValue(item.dose_per_liter_min)
              "
              class="text-text-light"
              >Chỉ hướng dẫn chữ</span
            >
          </td>
          <td class="p-3 text-sm">
            {{
              item.pre_harvest_days == null
                ? "Chưa có thông tin"
                : item.pre_harvest_days + " ngày"
            }}
          </td>
          <td class="p-3">
            <span :class="item.is_active ? 'badge-active' : 'badge-inactive'">{{
              item.is_active ? "Đã bật" : "Bản nháp"
            }}</span>
            <small
              v-if="
                item.is_active &&
                (!item.crop?.is_active || !item.variant?.product?.is_show)
              "
              class="mt-1 block text-xs text-amber-600"
              >Cây trồng / sản phẩm đang ẩn</small
            >
            <small
              v-else-if="item.is_active && !item.can_calculate"
              class="mt-1 block text-xs text-text-light"
              >Chỉ đọc hướng dẫn</small
            >
          </td>
          <td class="p-3">
            <div class="flex gap-2">
              <button
                v-if="auth.hasPermission('usage-guide.update')"
                type="button"
                :disabled="busy"
                title="Sửa hướng dẫn"
                aria-label="Sửa hướng dẫn"
                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                @click="$emit('edit', item)"
              >
                <Icon icon="solar:pen-bold" />
              </button>
              <button
                v-if="auth.hasPermission('usage-guide.delete')"
                type="button"
                :disabled="busy"
                title="Xóa hướng dẫn"
                aria-label="Xóa hướng dẫn"
                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                @click="$emit('delete', item)"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </button>
              <span
                v-if="
                  !auth.hasPermission('usage-guide.update') &&
                  !auth.hasPermission('usage-guide.delete')
                "
                class="text-xs text-text-light"
                >Chỉ xem</span
              >
            </div>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="7" class="p-8 text-center text-sm text-text-light">
            Chưa có hướng dẫn phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>