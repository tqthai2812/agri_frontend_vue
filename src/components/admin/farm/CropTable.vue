<script setup>
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
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
    />Đang tải cây trồng...
  </div>
  <div v-else class="overflow-x-auto">
    <table class="w-full min-w-[650px]">
      <thead class="bg-bg">
        <tr>
          <th
            v-for="label in [
              'Cây trồng',
              'Đường dẫn',
              'Hướng dẫn',
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
                class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"
                ><Icon icon="solar:leaf-bold-duotone" class="text-xl"
              /></span>
              <div>
                <strong class="block text-sm">{{ item.name }}</strong
                ><small class="text-text-light">ID: {{ item.id }}</small>
              </div>
            </div>
          </td>
          <td class="p-3 text-sm text-text-light">{{ item.slug }}</td>
          <td class="p-3 text-sm">{{ item.usage_guides_count ?? 0 }}</td>
          <td class="p-3">
            <span :class="item.is_active ? 'badge-active' : 'badge-inactive'">{{
              item.is_active ? "Đang hiển thị" : "Đang ẩn"
            }}</span>
          </td>
          <td class="p-3">
            <div class="flex gap-2">
              <button
                v-if="auth.hasPermission('crop.update')"
                type="button"
                title="Sửa cây trồng"
                aria-label="Sửa cây trồng"
                :disabled="busy"
                class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                @click="$emit('edit', item)"
              >
                <Icon icon="solar:pen-bold" />
              </button>
              <button
                v-if="auth.hasPermission('crop.delete')"
                type="button"
                title="Xóa cây trồng"
                aria-label="Xóa cây trồng"
                :disabled="busy"
                class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                @click="$emit('delete', item)"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </button>
              <span
                v-if="
                  !auth.hasPermission('crop.update') &&
                  !auth.hasPermission('crop.delete')
                "
                class="text-xs text-text-light"
                >Chỉ xem</span
              >
            </div>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="5" class="p-8 text-center text-text-light">
            Chưa có cây trồng phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>