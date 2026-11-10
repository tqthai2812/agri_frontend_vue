<script setup>
import { Icon } from "@iconify/vue";
import { onBeforeUnmount, onMounted } from "vue";
import { useDiscountStore } from "@/stores/admin/discountStore";
import { useAuthStore } from "@/stores/shared/authStore";
import DiscountStats from "@/components/admin/discounts/DiscountStats.vue";
import DiscountFilters from "@/components/admin/discounts/DiscountFilters.vue";
import DiscountTable from "@/components/admin/discounts/DiscountTable.vue";
import DiscountPagination from "@/components/admin/discounts/DiscountPagination.vue";
import DiscountModal from "@/components/admin/discounts/DiscountModal.vue";

const store = useDiscountStore();
const authStore = useAuthStore();
let searchTimer = null;

function cancelSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = null;
}
async function run(action) {
  try { return await action(); } catch { /* Store đã ghi thông báo lỗi. */ }
}
async function handleReload() {
  cancelSearch();
  await run(() => store.fetchDiscounts());
}
function handleSearch() {
  cancelSearch();
  searchTimer = setTimeout(() => {
    searchTimer = null;
    store.filters.page = 1;
    run(() => store.fetchDiscounts());
  }, 350);
}
async function handleFilterChange() {
  cancelSearch();
  store.filters.page = 1;
  await run(() => store.fetchDiscounts());
}
async function handleResetFilters() {
  cancelSearch();
  store.resetFilters();
  await run(() => store.fetchDiscounts());
}
async function handleSave() {
  if (store.saving) return;
  cancelSearch();
  await run(() => store.saveDiscount());
}
async function handleToggle(discount) {
  if (store.saving) return;
  cancelSearch();
  await run(() => store.toggleActive(discount));
}
async function handleDelete(discount) {
  if (store.deleting) return;
  const confirmed = window.confirm(`Bạn có chắc muốn xóa giảm giá "${discount.discount_description}" không?`);
  if (!confirmed) return;
  cancelSearch();
  await run(() => store.deleteDiscount(discount));
}
function handlePageChange(page) {
  if (store.loading || page < 1 || page > store.meta.last_page || page === store.meta.current_page) return;
  cancelSearch();
  store.setPage(page);
}
onMounted(() => run(() => store.fetchDiscounts()));
onBeforeUnmount(cancelSearch);
</script>

<template>
<div>
  <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="text-2xl font-bold">Quản lý voucher</h1>
      <p class="text-sm text-text-light">{{ store.meta.total }} voucher phù hợp bộ lọc</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="store.loading" @click="handleReload">
        <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
        Tải lại
      </button>
      <button v-if="authStore.hasPermission('discount.create')" type="button" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.saving" @click="store.openCreateModal">
        <Icon icon="solar:add-circle-bold" />
        Thêm voucher
      </button>
    </div>
  </div>
  <DiscountStats />
  <div v-if="store.message" role="status" class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
    <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
    <span>{{ store.message }}</span>
  </div>
  <div v-if="store.errorMsg" role="alert" class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
    <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
    <span>{{ store.errorMsg }}</span>
  </div>
  <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <DiscountFilters @search="handleSearch" @filter-change="handleFilterChange" @reset="handleResetFilters" />
    <DiscountTable @toggle="handleToggle" @delete="handleDelete" />
    <DiscountPagination @change="handlePageChange" />
  </div>
  <DiscountModal v-if="store.showModal" @save="handleSave" />
</div>
</template>