<script setup>
import { computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FarmService from "@/services/shared/farmUtility.service";
import { useFarmAdmin } from "@/composables/admin/useFarmAdmin";
import FarmAdminToolbar from "./FarmAdminToolbar.vue";
import FarmAdminPagination from "./FarmAdminPagination.vue";
import FarmAdminDialog from "./FarmAdminDialog.vue";
import FarmAdminNav from "./FarmAdminNav.vue";
import FarmCatalogTable from "./FarmCatalogTable.vue";
import FarmCatalogForm from "./FarmCatalogForm.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
const props = defineProps({ kind: { type: String, required: true } });
const auth = useAuthStore();
const isStage = props.kind === "stages";
const title = isStage ? "giai đoạn sinh trưởng" : "công dụng sản phẩm";
const permission = isStage ? "crop-growth-stage" : "product-purpose";
const service = isStage ? FarmService.growthStages : FarmService.purposes;
const {
  items,
  meta,
  filters,
  loading,
  saving,
  deleting,
  error,
  message,
  formError,
  errors,
  modalOpen,
  editing,
  deleteTarget,
  form,
  load,
  open,
  save,
  remove,
} = useFarmAdmin(service, () => ({
  name: "",
  slug: "",
  aliases: [],
  description: "",
  is_active: true,
  ...(isStage ? { crop_id: "", sort_order: 0 } : {}),
}));
const modalTitle = computed(
  () => (editing.value ? "Chỉnh sửa " : "Thêm ") + title,
);
onMounted(() => load());
</script>
<template>
  <div>
    <div
      class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold">Quản lý {{ title }}</h1>
        <p class="text-sm text-text-light">
          {{ meta.total }} mục phù hợp bộ lọc
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="load(meta.current_page)"
        >
          <Icon
            icon="solar:refresh-bold"
            :class="{ 'animate-spin': loading }"
          />Tải lại</button
        ><button
          v-if="auth.hasPermission(permission + '.create')"
          type="button"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed"
          :disabled="saving"
          @click="open()"
        >
          <Icon icon="solar:add-circle-bold" />{{
            isStage ? "Thêm giai đoạn" : "Thêm công dụng"
          }}
        </button>
      </div>
    </div>
    <FarmAdminNav />
    <p
      v-if="message"
      role="status"
      class="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {{ message }}
    </p>
    <p
      v-if="error"
      role="alert"
      class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </p>
    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <FarmAdminToolbar :filters="filters" /><FarmCatalogTable
        :kind="kind"
        :items="items"
        :loading="loading"
        :busy="saving || deleting"
        @edit="open"
        @delete="deleteTarget = $event"
      /><FarmAdminPagination
        :meta="meta"
        :count="items.length"
        :loading="loading"
        @change="load"
      />
    </section>
    <FarmAdminDialog
      v-if="modalOpen"
      :title="modalTitle"
      :busy="saving"
      @close="modalOpen = false"
      ><p
        v-if="formError"
        role="alert"
        class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ formError }}
      </p>
      <FarmCatalogForm
        :kind="kind"
        :form="form"
        :editing="editing"
        :busy="saving"
        :errors="errors"
        @submit="save"
        @cancel="modalOpen = false"
    /></FarmAdminDialog>
    <ConfirmModal
      :model-value="!!deleteTarget"
      title="Xác nhận xóa"
      :message="deleteTarget ? 'Xóa ' + deleteTarget.name + '?' : ''"
      confirm-text="Xóa"
      cancel-text="Hủy"
      loading-text="Đang xóa..."
      type="danger"
      icon="solar:trash-bin-trash-bold"
      :loading="deleting"
      @confirm="remove"
      @update:model-value="!$event && !deleting && (deleteTarget = null)"
    />
  </div>
</template>