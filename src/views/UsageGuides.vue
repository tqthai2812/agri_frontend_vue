<script setup>
import { onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FarmService from "@/services/shared/farmUtility.service";
import { useFarmAdmin } from "@/composables/admin/useFarmAdmin";
import FarmAdminToolbar from "@/components/admin/farm/FarmAdminToolbar.vue";
import FarmAdminPagination from "@/components/admin/farm/FarmAdminPagination.vue";
import FarmAdminDialog from "@/components/admin/farm/FarmAdminDialog.vue";
import UsageGuideTable from "@/components/admin/farm/UsageGuideTable.vue";
import UsageGuideForm from "@/components/admin/farm/UsageGuideForm.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";

const auth = useAuthStore();
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
} = useFarmAdmin(FarmService.guides, () => ({
  variant_id: "",
  crop_id: "",
  purpose: "",
  growth_stage: "",
  application_method: "",
  dose_unit: "",
  dose_per_ha_min: "",
  dose_per_ha_max: "",
  dose_per_liter_min: "",
  dose_per_liter_max: "",
  water_l_per_ha_min: "",
  water_l_per_ha_max: "",
  pre_harvest_days: "",
  instructions: "",
  safety_warning: "",
  label_source: "",
  is_active: false,
}));
onMounted(() => load());
</script>
<template>
  <div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Hướng dẫn sử dụng vật tư</h1>
        <p class="mt-1 text-sm text-text-light">
          Gắn định mức với đúng biến thể, cây trồng và điều kiện sử dụng.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'farm-utilities' }" class="btn-outline"
          >Xem tiện ích</RouterLink
        >
        <button
          v-if="auth.hasPermission('usage-guide.create')"
          type="button"
          class="btn-primary cursor-pointer"
          :disabled="saving"
          @click="open()"
        >
          <Icon icon="solar:add-circle-bold" /> Thêm hướng dẫn
        </button>
      </div>
    </div>
    <nav class="mb-6 flex flex-wrap gap-2" aria-label="Quản lý tiện ích">
      <RouterLink
        v-if="auth.hasPermission('crop.view')"
        :to="{ name: 'admin-crops' }"
        class="btn-outline"
        :class="{
          '!border-primary !text-primary !bg-primary/5':
            $route.name === 'admin-crops',
        }"
        >Cây trồng</RouterLink
      >
      <RouterLink
        v-if="auth.hasPermission('usage-guide.view')"
        :to="{ name: 'admin-usage-guides' }"
        class="btn-outline"
        :class="{
          '!border-primary !text-primary !bg-primary/5':
            $route.name === 'admin-usage-guides',
        }"
        >Hướng dẫn sử dụng</RouterLink
      >
    </nav>
    <p
      v-if="message"
      role="status"
      class="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700"
    >
      {{ message }}
    </p>
    <p
      v-if="error"
      role="alert"
      class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600"
    >
      {{ error }}
    </p>
    <section class="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="font-bold">Danh sách hướng dẫn sử dụng vật tư</h2>
        <span
          class="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
          >{{ meta.total }} kết quả</span
        >
      </div>
      <FarmAdminToolbar
        :filters="filters"
        :loading="loading"
        @refresh="load(meta.current_page)"
      />
      <UsageGuideTable
        :items="items"
        :loading="loading"
        :busy="saving || deleting"
        @edit="open"
        @delete="deleteTarget = $event"
      />
      <FarmAdminPagination
        :meta="meta"
        :count="items.length"
        :loading="loading"
        @change="load"
      />
    </section>
    <FarmAdminDialog
      v-if="modalOpen"
      :title="(editing ? 'Chỉnh sửa ' : 'Thêm ') + 'hướng dẫn'"
      :busy="saving"
      @close="modalOpen = false"
    >
      <p
        v-if="formError"
        role="alert"
        class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600"
      >
        {{ formError }}
      </p>
      <UsageGuideForm
        :form="form"
        :editing="editing"
        :busy="saving"
        :errors="errors"
        @submit="save"
        @cancel="modalOpen = false"
      />
    </FarmAdminDialog>
    <ConfirmModal
      :model-value="!!deleteTarget"
      title="Xác nhận xóa"
      :message="
        deleteTarget
          ? 'Xóa ' + (deleteTarget.name || deleteTarget.purpose) + '?'
          : ''
      "
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