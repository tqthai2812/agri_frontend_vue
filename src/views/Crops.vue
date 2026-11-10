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
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Cây trồng</h1>
        <p class="mt-1 text-sm text-text-light">
          Danh mục cây trồng dùng cho hướng dẫn và tính lượng vật tư.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'farm-utilities' }" class="btn-outline"
          >Xem tiện ích</RouterLink
        >
        <button
          v-if="auth.hasPermission('crop.create')"
          type="button"
          class="btn-primary cursor-pointer"
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
        <h2 class="font-bold">Danh sách cây trồng</h2>
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
        class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600"
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