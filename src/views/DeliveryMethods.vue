<script setup>
import { Icon } from "@iconify/vue";
import { onBeforeUnmount, onMounted } from "vue";
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";
import { useAuthStore } from "@/stores/shared/authStore";

import DeliveryMethodStats from "@/components/admin/delivery-methods/DeliveryMethodStats.vue";
import DeliveryMethodFilters from "@/components/admin/delivery-methods/DeliveryMethodFilters.vue";
import DeliveryMethodTable from "@/components/admin/delivery-methods/DeliveryMethodTable.vue";
import DeliveryMethodPagination from "@/components/admin/delivery-methods/DeliveryMethodPagination.vue";
import DeliveryMethodModal from "@/components/admin/delivery-methods/DeliveryMethodModal.vue";

const store = useDeliveryMethodStore();
const authStore = useAuthStore();

let searchTimer = null;





function clearSearchTimer() {
    window.clearTimeout(searchTimer);
}

async function run(action) {
    try {
        await action();
    } catch {
        // Store đã ghi thông báo lỗi để giao diện hiển thị.
    }
}

async function handleReload() {
    clearSearchTimer();

    await Promise.allSettled([
        store.fetchDeliveryMethods(),
        store.fetchShippingRegions(),
    ]);
}

function handleSearch() {
    clearSearchTimer();

    searchTimer = window.setTimeout(() => {
        store.filters.page = 1;
        run(() => store.fetchDeliveryMethods());
    }, 350);
}

async function handleFilterChange() {
    clearSearchTimer();
    store.filters.page = 1;

    await run(() => store.fetchDeliveryMethods());
}

async function handleResetFilters() {
    clearSearchTimer();
    store.resetFilters();

    await run(() => store.fetchDeliveryMethods());
}

async function handleSave() {
    clearSearchTimer();
    await run(() => store.saveDeliveryMethod());
}

async function handleToggleActive(method) {
    clearSearchTimer();
    await run(() => store.toggleActive(method));
}

async function handleSetDefault(method) {
    clearSearchTimer();
    await run(() => store.setDefault(method));
}

async function handleDelete(method) {
    if (store.busy) return;

    const confirmed = window.confirm(
        `Bạn có chắc muốn xóa phương thức "${method.name}" không?`,
    );

    if (!confirmed) return;

    clearSearchTimer();
    await run(() => store.deleteDeliveryMethod(method));
}

async function handlePageChange(page) {
    if (
        store.loading ||
        store.busy ||
        page < 1 ||
        page > store.meta.last_page ||
        page === store.meta.current_page
    ) {
        return;
    }

    clearSearchTimer();
    await run(() => store.setPage(page));
}

onMounted(handleReload);
onBeforeUnmount(clearSearchTimer);
</script>

<template>
    <div>
        <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h1 class="text-2xl font-bold">Phương thức giao hàng</h1>
                <p class="text-sm text-text-light">
                    Quản lý phí vận chuyển, khu vực áp dụng và phương thức mặc định.
                </p>
            </div>

            <div class="flex flex-wrap gap-3">
                <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                    :disabled="store.loading || store.busy || store.regionsLoading" @click="handleReload">
                    <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
                    Tải lại
                </button>

                <button v-if="authStore.hasPermission('delivery-method.create')" type="button"
                    class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="store.busy"
                    @click="store.openCreateModal">
                    <Icon icon="solar:add-circle-bold" />
                    Thêm phương thức
                </button>
            </div>
        </div>

        <DeliveryMethodStats />

        <div v-if="store.message" role="status"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
            <span>{{ store.message }}</span>
        </div>

        <div v-if="store.errorMsg" role="alert"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
            <span>{{ store.errorMsg }}</span>
        </div>

        <div v-if="store.regionsError" role="alert"
            class="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {{ store.regionsError }}
            <button type="button" class="ml-2 font-semibold underline cursor-pointer disabled:cursor-not-allowed"
                :disabled="store.regionsLoading" @click="run(() => store.fetchShippingRegions())">
                Thử lại
            </button>
        </div>

        <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <DeliveryMethodFilters @search="handleSearch" @filter-change="handleFilterChange"
                @reset="handleResetFilters" />

            <DeliveryMethodTable @set-default="handleSetDefault" @toggle-active="handleToggleActive"
                @delete="handleDelete" />

            <DeliveryMethodPagination @change="handlePageChange" />
        </div>

        <DeliveryMethodModal v-if="store.showModal" @save="handleSave"
            @reload-regions="run(() => store.fetchShippingRegions())" />
    </div>
</template>