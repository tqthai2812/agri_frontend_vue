<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useDeliveryMethodStore();
const authStore = useAuthStore();

let searchTimer = null;

const visiblePages = computed(() => {
    const current = store.meta.current_page;
    const last = store.meta.last_page;
    const pages = [];

    for (
        let page = Math.max(1, current - 2);
        page <= Math.min(last, current + 2);
        page++
    ) {
        pages.push(page);
    }

    return pages;
});

const unknownFormRegion = computed(() => {
    const value = String(store.form.region ?? "").trim();

    return (
        store.regionsLoaded &&
        value !== "" &&
        !store.shippingRegions.some((region) => region.value === value)
    );
});

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}

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
                <button type="button" class="btn-outline-sm"
                    :disabled="store.loading || store.busy || store.regionsLoading" @click="handleReload">
                    <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
                    Tải lại
                </button>

                <button v-if="authStore.hasPermission('delivery-method.create')" type="button" class="btn-primary"
                    :disabled="store.busy" @click="store.openCreateModal">
                    <Icon icon="solar:add-circle-bold" />
                    Thêm phương thức
                </button>
            </div>
        </div>

        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="stat-card-info">
                <div class="stat-label">Tổng kết quả</div>
                <div class="stat-value text-info">{{ store.meta.total }}</div>
            </div>

            <div class="stat-card-success">
                <div class="stat-label">Đang bật trong trang</div>
                <div class="stat-value text-success">
                    {{ store.activeMethods.length }}
                </div>
            </div>

            <div class="stat-card-danger">
                <div class="stat-label">Đã tắt trong trang</div>
                <div class="stat-value text-danger">
                    {{ store.inactiveMethods.length }}
                </div>
            </div>

            <div class="stat-card-warning">
                <div class="stat-label">Mặc định trong trang</div>
                <div class="truncate text-sm font-bold">
                    {{ store.defaultMethod?.name || "Không có trong trang" }}
                </div>
            </div>
        </div>

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
            <button type="button" class="ml-2 font-semibold underline" :disabled="store.regionsLoading"
                @click="run(() => store.fetchShippingRegions())">
                Thử lại
            </button>
        </div>

        <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div class="mb-5 flex flex-wrap gap-3">
                <div class="search-box">
                    <Icon icon="solar:magnifer-bold" class="text-text-light" />
                    <input v-model.trim="store.filters.search" type="search" maxlength="255"
                        aria-label="Tìm phương thức giao hàng" placeholder="Tìm tên, mô tả..." class="search-input"
                        :disabled="store.busy" @input="handleSearch" />
                </div>

                <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
                    aria-label="Lọc trạng thái" :disabled="store.busy" @change="handleFilterChange">
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Đang bật</option>
                    <option value="0">Đã tắt</option>
                </select>

                <select v-model="store.filters.region" class="filter-select flex-1 sm:flex-none"
                    aria-label="Lọc khu vực" :disabled="store.busy || !store.regionsLoaded"
                    @change="handleFilterChange">
                    <option value="">Tất cả khu vực</option>
                    <option v-for="region in store.shippingRegions" :key="region.value" :value="region.value">
                        {{ region.label }}
                    </option>
                </select>

                <button type="button" class="btn-outline-sm" :disabled="store.busy" @click="handleResetFilters">
                    <Icon icon="solar:restart-bold" />
                    Xóa lọc
                </button>
            </div>

            <div v-if="store.loading" class="py-10 text-center text-text-light">
                <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
                <p class="text-sm">Đang tải phương thức giao hàng...</p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[1000px]">
                    <thead class="bg-bg">
                        <tr>
                            <th class="table-th">Phương thức</th>
                            <th class="table-th">Phí giao hàng</th>
                            <th class="table-th">Đơn tối thiểu</th>
                            <th class="table-th">Khu vực</th>
                            <th class="table-th">Đơn hàng</th>
                            <th class="table-th">Trạng thái</th>
                            <th class="table-th">Mặc định</th>
                            <th class="table-th">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="method in store.deliveryMethods" :key="method.id" class="table-row">
                            <td class="table-td">
                                <div class="text-sm font-semibold">{{ method.name }}</div>
                                <div class="max-w-[320px] text-xs text-text-light">
                                    {{ method.description || "Không có mô tả" }}
                                </div>
                            </td>

                            <td class="table-td font-mono font-bold">
                                {{ formatVND(method.base_price) }}
                            </td>

                            <td class="table-td font-mono">
                                {{ formatVND(method.min_order_amount) }}
                            </td>

                            <td class="table-td">
                                <span class="badge-gray">
                                    {{ store.regionLabel(method.region) }}
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ method.orders_count ?? 0 }}
                            </td>

                            <td class="table-td">
                                <span :class="store.isTrue(method.is_active)
                                    ? 'badge-active'
                                    : 'badge-inactive'
                                    ">
                                    {{ store.isTrue(method.is_active) ? "Đang bật" : "Đã tắt" }}
                                </span>
                            </td>

                            <td class="table-td">
                                <span v-if="store.isTrue(method.is_default)" class="badge-pending">
                                    Mặc định
                                </span>

                                <button v-else-if="authStore.hasPermission('delivery-method.update')" type="button"
                                    class="text-xs font-semibold text-primary hover:underline" :disabled="store.busy"
                                    @click="handleSetDefault(method)">
                                    Đặt mặc định
                                </button>

                                <span v-else class="text-xs text-text-light">—</span>
                            </td>

                            <td class="table-td">
                                <div class="flex gap-2">
                                    <button v-if="authStore.hasPermission('delivery-method.update')" type="button"
                                        class="btn-outline-icon" title="Sửa" aria-label="Sửa phương thức"
                                        :disabled="store.busy" @click="store.openEditModal(method)">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button v-if="authStore.hasPermission('delivery-method.update')" type="button"
                                        class="btn-outline-icon" :class="store.isTrue(method.is_active)
                                            ? 'text-warning'
                                            : 'text-success'
                                            " title="Bật / tắt" aria-label="Bật hoặc tắt phương thức"
                                        :disabled="store.busy" @click="handleToggleActive(method)">
                                        <Icon :icon="store.isTrue(method.is_active)
                                            ? 'solar:pause-circle-bold'
                                            : 'solar:play-circle-bold'
                                            " />
                                    </button>

                                    <button v-if="authStore.hasPermission('delivery-method.delete')" type="button"
                                        class="btn-danger-icon" title="Xóa" aria-label="Xóa phương thức" :disabled="store.busy || Number(method.orders_count || 0) > 0
                                            " @click="handleDelete(method)">
                                        <Icon icon="solar:trash-bin-trash-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <tr v-if="!store.deliveryMethods.length">
                            <td colspan="8" class="empty-cell">
                                Không có phương thức giao hàng nào.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <span class="text-sm text-text-light">
                    Hiển thị {{ store.deliveryMethods.length }} /
                    {{ store.meta.total }} phương thức
                </span>

                <div class="flex flex-wrap justify-center gap-2">
                    <button type="button" class="page-btn" aria-label="Trang trước" :disabled="store.loading || store.busy || store.meta.current_page <= 1
                        " @click="handlePageChange(store.meta.current_page - 1)">
                        <Icon icon="solar:arrow-left-bold" />
                    </button>

                    <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
                        :class="{ active: page === store.meta.current_page }" :aria-current="page === store.meta.current_page ? 'page' : undefined
                            " :disabled="store.loading || store.busy" @click="handlePageChange(page)">
                        {{ page }}
                    </button>

                    <button type="button" class="page-btn" aria-label="Trang sau" :disabled="store.loading ||
                        store.busy ||
                        store.meta.current_page >= store.meta.last_page
                        " @click="handlePageChange(store.meta.current_page + 1)">
                        <Icon icon="solar:arrow-right-bold" />
                    </button>
                </div>
            </div>
        </div>

        <div v-if="store.showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            @click.self="store.closeModal">
            <div role="dialog" aria-modal="true" aria-labelledby="delivery-modal-title"
                class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface">
                <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-6">
                    <div>
                        <h2 id="delivery-modal-title" class="text-xl font-bold">
                            {{
                                store.selectedMethod
                                    ? "Cập nhật phương thức giao hàng"
                                    : "Thêm phương thức giao hàng"
                            }}
                        </h2>
                        <p class="text-sm text-text-light">
                            Cấu hình phí giao hàng và khu vực áp dụng.
                        </p>
                    </div>

                    <button type="button" class="btn-outline-icon" aria-label="Đóng" :disabled="store.busy"
                        @click="store.closeModal">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </div>

                <form class="space-y-5 p-6" @submit.prevent="handleSave">
                    <div v-if="store.errorMsg" role="alert"
                        class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {{ store.errorMsg }}
                    </div>

                    <fieldset :disabled="store.saving" class="space-y-5">
                        <div class="form-group">
                            <label for="delivery-name" class="form-label">
                                Tên phương thức <span class="text-primary">*</span>
                            </label>

                            <input id="delivery-name" v-model.trim="store.form.name" required maxlength="255"
                                class="form-control" placeholder="Ví dụ: Giao hàng tiêu chuẩn" />

                            <p v-if="store.fieldError('name')" class="error-text">
                                {{ store.fieldError("name") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label for="delivery-description" class="form-label">
                                Mô tả
                            </label>

                            <textarea id="delivery-description" v-model.trim="store.form.description"
                                class="form-control" rows="3" maxlength="1000"
                                placeholder="Mô tả ngắn về phương thức giao hàng..."></textarea>

                            <p v-if="store.fieldError('description')" class="error-text">
                                {{ store.fieldError("description") }}
                            </p>
                        </div>

                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div class="form-group">
                                <label for="delivery-price" class="form-label">
                                    Phí giao hàng <span class="text-primary">*</span>
                                </label>

                                <input id="delivery-price" v-model.number="store.form.base_price" required type="number"
                                    min="0" step="0.01" class="form-control" placeholder="30000" />

                                <p v-if="store.fieldError('base_price')" class="error-text">
                                    {{ store.fieldError("base_price") }}
                                </p>
                            </div>

                            <div class="form-group">
                                <label for="delivery-minimum" class="form-label">
                                    Tiền hàng tối thiểu
                                </label>

                                <input id="delivery-minimum" v-model.number="store.form.min_order_amount" required
                                    type="number" min="0" step="0.01" class="form-control" placeholder="0" />

                                <p class="mt-1 text-xs text-text-light">
                                    Tính sau giảm giá. Đây là điều kiện áp dụng phương thức.
                                </p>

                                <p v-if="store.fieldError('min_order_amount')" class="error-text">
                                    {{ store.fieldError("min_order_amount") }}
                                </p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="delivery-region" class="form-label">
                                Khu vực giao hàng
                            </label>

                            <select id="delivery-region" v-model="store.form.region" class="form-control"
                                :disabled="store.regionsLoading || !store.regionsLoaded">
                                <option value="">
                                    {{
                                        store.regionsLoading
                                            ? "Đang tải khu vực..."
                                            : "Toàn quốc — không giới hạn tỉnh/thành"
                                    }}
                                </option>

                                <option v-if="unknownFormRegion" :value="store.form.region" disabled>
                                    Khu vực cũ: {{ store.form.region }} — hãy chọn lại
                                </option>

                                <option v-for="region in store.shippingRegions" :key="region.value"
                                    :value="region.value">
                                    {{ region.label }}
                                </option>
                            </select>

                            <p v-if="unknownFormRegion" class="error-text">
                                Khu vực cũ không còn khớp danh sách. Vui lòng chọn lại trước
                                khi lưu.
                            </p>

                            <div v-if="store.regionsError" class="mt-2 text-sm text-danger">
                                {{ store.regionsError }}
                                <button type="button" class="ml-2 font-semibold underline"
                                    :disabled="store.regionsLoading" @click="run(() => store.fetchShippingRegions())">
                                    Tải lại khu vực
                                </button>
                            </div>

                            <p v-if="store.fieldError('region')" class="error-text">
                                {{ store.fieldError("region") }}
                            </p>
                        </div>

                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div class="switch-card">
                                <div>
                                    <div class="text-sm font-semibold">Kích hoạt</div>
                                    <div class="text-xs text-text-light">
                                        Cho phép dùng phương thức này.
                                    </div>
                                </div>

                                <label class="toggle">
                                    <input v-model="store.form.is_active" type="checkbox"
                                        aria-label="Kích hoạt phương thức" />
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="switch-card">
                                <div>
                                    <div class="text-sm font-semibold">Đặt mặc định</div>
                                    <div class="text-xs text-text-light">
                                        Chỉ có một phương thức mặc định.
                                    </div>
                                </div>

                                <label class="toggle">
                                    <input v-model="store.form.is_default" type="checkbox"
                                        aria-label="Đặt phương thức mặc định" />
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <p v-if="store.fieldError('is_active')" class="error-text">
                            {{ store.fieldError("is_active") }}
                        </p>
                        <p v-if="store.fieldError('is_default')" class="error-text">
                            {{ store.fieldError("is_default") }}
                        </p>
                    </fieldset>

                    <div class="flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row">
                        <button type="button" class="btn-outline" :disabled="store.busy" @click="store.closeModal">
                            Hủy
                        </button>

                        <button type="submit" class="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="store.busy ||
                                store.regionsLoading ||
                                !store.formRegionValid
                                ">
                            <Icon :icon="store.saving
                                ? 'solar:refresh-bold'
                                : 'solar:diskette-bold-duotone'
                                " :class="{ 'animate-spin': store.saving }" />
                            {{ store.saving ? "Đang lưu..." : "Lưu phương thức" }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
    @apply rounded-2xl border-l-4 bg-surface p-4 shadow-sm;
}

.stat-card-success {
    @apply border-l-success;
}

.stat-card-warning {
    @apply border-l-warning;
}

.stat-card-danger {
    @apply border-l-danger;
}

.stat-card-info {
    @apply border-l-info;
}

.stat-label {
    @apply text-xs font-medium text-text-light;
}

.stat-value {
    @apply font-mono text-2xl font-bold;
}

.search-box {
    @apply flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2;
}

.search-input {
    @apply w-full bg-transparent text-sm outline-none;
}

.table-th {
    @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
    @apply p-3 align-middle;
}

.table-row {
    @apply border-b border-border transition hover:bg-primary/5;
}

.empty-cell {
    @apply p-8 text-center text-text-light;
}

.error-text {
    @apply mt-1 text-sm text-danger;
}

.switch-card {
    @apply flex items-center justify-between gap-4 rounded-2xl border border-border p-4 transition hover:border-primary;
}
</style>