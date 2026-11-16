<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
const props = defineProps({
  kind: { type: String, required: true },
  items: { type: Array, required: true },
  loading: Boolean,
  busy: Boolean,
});
defineEmits(["edit", "delete"]);
const auth = useAuthStore();
const permission = computed(() =>
  props.kind === "stages" ? "crop-growth-stage" : "product-purpose",
);
const labels = computed(() =>
  props.kind === "stages"
    ? [
        "Giai đoạn",
        "Cây trồng",
        "Thứ tự",
        "Hướng dẫn",
        "Trạng thái",
        "Thao tác",
      ]
    : ["Công dụng", "Tên gọi khác", "Hướng dẫn", "Trạng thái", "Thao tác"],
);
</script>
<template>
  <div v-if="loading" role="status" class="py-10 text-center text-text-light">
    <Icon
      icon="solar:refresh-bold"
      class="mx-auto mb-2 animate-spin text-3xl"
    />
    <p class="text-sm">Đang tải dữ liệu...</p>
  </div>
  <div v-else class="overflow-x-auto">
    <table class="w-full min-w-[800px] whitespace-nowrap">
      <thead class="bg-bg">
        <tr>
          <th
            v-for="label in labels"
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
          <td class="p-3 text-left">
            <strong class="block text-sm font-semibold">{{ item.name }}</strong
            ><span class="text-xs text-text-light">{{ item.slug }}</span>
          </td>
          <template v-if="kind === 'stages'"
            ><td class="p-3 text-left text-sm">{{ item.crop?.name }}</td>
            <td class="p-3 text-left text-sm">
              {{ item.sort_order }}
            </td></template
          >
          <td v-else class="p-3 text-left text-sm">
            {{ item.aliases?.join(", ") || "—" }}
          </td>
          <td class="p-3 text-left text-sm">
            {{ item.usage_guides_count ?? 0 }}
          </td>
          <td class="p-3 text-left">
            <span :class="item.is_active ? 'badge-active' : 'badge-inactive'">{{
              item.is_active ? "Đang sử dụng" : "Đang ẩn"
            }}</span>
          </td>
          <td class="p-3 text-left">
            <div class="flex gap-2">
              <button
                v-if="auth.hasPermission(permission + '.update')"
                type="button"
                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                :disabled="busy"
                :aria-label="'Sửa ' + item.name"
                @click="$emit('edit', item)"
              >
                <Icon icon="solar:pen-bold" /></button
              ><button
                v-if="auth.hasPermission(permission + '.delete')"
                type="button"
                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                :disabled="busy"
                :aria-label="'Xóa ' + item.name"
                @click="$emit('delete', item)"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td
            :colspan="labels.length"
            class="p-10 text-center text-sm text-text-light"
          >
            Chưa có dữ liệu phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>