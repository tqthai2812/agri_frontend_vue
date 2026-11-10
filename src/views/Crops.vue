<script setup>
import { onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FarmService from "@/services/shared/farmUtility.service";
import { useFarmAdmin } from "@/composables/admin/useFarmAdmin";
import FarmAdminToolbar from "@/components/admin/farm/FarmAdminToolbar.vue";
import FarmAdminPagination from "@/components/admin/farm/FarmAdminPagination.vue";
import FarmAdminDialog from "@/components/admin/farm/FarmAdminDialog.vue";
import CropTable from "@/components/admin/farm/CropTable.vue";
import CropForm from "@/components/admin/farm/CropForm.vue";
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
} = useFarmAdmin(FarmService.crops, () => ({
  name: "",
  slug: "",
  is_active: true,
}));
onMounted(() => load());
</script>
<template>
  <div>
    <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Quản lý cây trồng</h1>
        <p class="text-sm text-text-light">
          {{ meta.total }} cây trồng phù hợp bộ lọc
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="load(meta.current_page)"
        >
          <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" />
          Tải lại
        </button>
        <button
          v-if="auth.hasPermission('crop.create')"
          type="button"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed"
          :disabled="saving"
          @click="open()"
        >
          <Icon icon="solar:add-circle-bold" /> Thêm cây trồng
        </button>
      </div>
    </div>
    <nav class="mb-6 flex flex-wrap gap-2" aria-label="Quản lý tiện ích">
      <RouterLink
        v-if="auth.hasPermission('crop.view')"
        :to="{ name: 'admin-crops' }"
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        :class="{
          '!border-primary !text-primary !bg-primary/5':
            $route.name === 'admin-crops',
        }"
        >Cây trồng</RouterLink
      >
      <RouterLink
        v-if="auth.hasPermission('usage-guide.view')"
        :to="{ name: 'admin-usage-guides' }"
        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
        :class="{
          '!border-primary !text-primary !bg-primary/5':
            $route.name === 'admin-usage-guides',
        }"
        >Hướng dẫn sử dụng</RouterLink
      >
    </nav>
    <div
      v-if="message"
      role="status"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ message }}</span>
    </div>
    <div
      v-if="error"
      role="alert"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
      <span>{{ error }}</span>
    </div>
    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <FarmAdminToolbar
        :filters="filters"
      />
      <CropTable
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
      :title="(editing ? 'Chỉnh sửa ' : 'Thêm ') + 'cây trồng'"
      :busy="saving"
      @close="modalOpen = false"
    >
      <p
        v-if="formError"
        role="alert"
        class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ formError }}
      </p>
      <CropForm
        :form="form"
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