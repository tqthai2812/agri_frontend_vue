<template>
    <div>
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold">Phương thức giao hàng</h1>
                <p class="text-text-light text-sm">
                    Quản lý phí vận chuyển, khu vực áp dụng và phương thức mặc định.
                </p>
            </div>

            <div class="flex flex-wrap gap-3">
                <button class="btn-outline-sm" @click="handleReload">
                    <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
                    Tải lại
                </button>

                <button v-if="authStore.hasPermission('delivery-method.create')" class="btn-primary"
                    @click="store.openCreateModal">
                    <Icon icon="solar:add-circle-bold" />
                    Thêm phương thức
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="stat-card-info">
                <div class="stat-label">Tổng phương thức</div>
                <div class="stat-value text-info">{{ store.meta.total }}</div>
            </div>

            <div class="stat-card-success">
                <div class="stat-label">Đang bật</div>
                <div class="stat-value text-success">{{ store.activeMethods.length }}</div>
            </div>

            <div class="stat-card-danger">
                <div class="stat-label">Đã tắt</div>
                <div class="stat-value text-danger">{{ store.inactiveMethods.length }}</div>
            </div>

            <div class="stat-card-warning">
                <div class="stat-label">Mặc định</div>
                <div class="stat-value text-sm truncate">
                    {{ store.defaultMethod?.name || "Chưa có" }}
                </div>
            </div>
        </div>

        <!-- Messages -->
        <div v-if="store.message"
            class="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-600 text-sm">
            <Icon icon="solar:check-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.message }}</span>
        </div>

        <div v-if="store.errorMsg"
            class="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
            <span>{{ store.errorMsg }}</span>
        </div>

        <div class="bg-surface rounded-2xl p-5 shadow-sm border border-border">
            <!-- Filters -->
            <div class="flex flex-wrap gap-3 mb-5">
                <div class="search-box">
                    <Icon icon="solar:magnifer-bold" class="text-text-light" />

                    <input v-model.trim="store.filters.search" type="text" placeholder="Tìm tên, mô tả, khu vực..."
                        class="search-input" @input="handleSearch" />
                </div>

                <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
                    @change="handleFilterChange">
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Đang bật</option>
                    <option value="0">Đã tắt</option>
                </select>

                <input v-model.trim="store.filters.region" class="filter-select flex-1 sm:flex-none"
                    placeholder="Lọc khu vực" @input="handleSearch" />

                <button class="btn-outline-sm" @click="handleResetFilters">
                    <Icon icon="solar:restart-bold" />
                    Xóa lọc
                </button>
            </div>

            <!-- Loading -->
            <div v-if="store.loading" class="py-10 text-center text-text-light">
                <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
                <p class="text-sm">Đang tải phương thức giao hàng...</p>
            </div>

            <!-- Table -->
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
                            <th class="table-th">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="method in store.deliveryMethods" :key="method.id" class="table-row">
                            <td class="table-td">
                                <div class="font-semibold text-sm">
                                    {{ method.name }}
                                </div>

                                <div class="text-xs text-text-light max-w-[320px]">
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
                                    {{ method.region || "Không giới hạn" }}
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ method.orders_count ?? 0 }}
                            </td>

                            <td class="table-td">
                                <span :class="method.is_active ? 'badge-active' : 'badge-inactive'">
                                    {{ method.is_active ? "Đang bật" : "Đã tắt" }}
                                </span>
                            </td>

                            <td class="table-td">
                                <span v-if="method.is_default" class="badge-pending">
                                    Mặc định
                                </span>

                                <button v-else-if="authStore.hasPermission('delivery-method.update')"
                                    class="text-xs text-primary font-semibold hover:underline" :disabled="store.saving"
                                    @click="handleSetDefault(method)">
                                    Đặt mặc định
                                </button>

                                <span v-else class="text-xs text-text-light">—</span>
                            </td>

                            <td class="table-td">
                                <div class="flex gap-2">
                                    <button v-if="authStore.hasPermission('delivery-method.update')"
                                        class="btn-outline-icon" title="Sửa" @click="store.openEditModal(method)">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button v-if="authStore.hasPermission('delivery-method.update')"
                                        class="btn-outline-icon"
                                        :class="method.is_active ? 'text-warning' : 'text-success'" title="Bật / tắt"
                                        :disabled="store.saving" @click="handleToggleActive(method)">
                                        <Icon
                                            :icon="method.is_active ? 'solar:pause-circle-bold' : 'solar:play-circle-bold'" />
                                    </button>

                                    <button v-if="authStore.hasPermission('delivery-method.delete')"
                                        class="btn-danger-icon" title="Xóa"
                                        :disabled="store.deleting || Number(method.orders_count || 0) > 0"
                                        @click="handleDelete(method)">
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

            <!-- Pagination -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
                <span class="text-sm text-text-light">
                    Hiển thị {{ store.deliveryMethods.length }} / {{ store.meta.total }} phương thức
                </span>

                <div class="flex flex-wrap justify-center gap-2">
                    <button class="page-btn" :disabled="store.meta.current_page <= 1"
                        @click="handlePageChange(store.meta.current_page - 1)">
                        <Icon icon="solar:arrow-left-bold" />
                    </button>

                    <button v-for="page in visiblePages" :key="page" class="page-btn"
                        :class="{ active: page === store.meta.current_page }" @click="handlePageChange(page)">
                        {{ page }}
                    </button>

                    <button class="page-btn" :disabled="store.meta.current_page >= store.meta.last_page"
                        @click="handlePageChange(store.meta.current_page + 1)">
                        <Icon icon="solar:arrow-right-bold" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="store.showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            @click.self="store.closeModal">
            <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
                <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
                    <div>
                        <h2 class="text-xl font-bold">
                            {{ store.selectedMethod ? "Cập nhật phương thức giao hàng" : "Thêm phương thức giao hàng" }}
                        </h2>
                        <p class="text-sm text-text-light">
                            Cấu hình phí giao hàng và khu vực áp dụng.
                        </p>
                    </div>

                    <button class="btn-outline-icon" @click="store.closeModal">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </div>

                <form class="p-6 space-y-5" @submit.prevent="handleSave">
                    <div v-if="store.errorMsg"
                        class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                        <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                        <span>{{ store.errorMsg }}</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            Tên phương thức <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.form.name" class="form-control"
                            placeholder="Ví dụ: Giao hàng tiêu chuẩn" />

                        <p v-if="store.fieldError('name')" class="error-text">
                            {{ store.fieldError("name") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mô tả</label>

                        <textarea v-model.trim="store.form.description" class="form-control" rows="3"
                            placeholder="Mô tả ngắn về phương thức giao hàng..."></textarea>

                        <p v-if="store.fieldError('description')" class="error-text">
                            {{ store.fieldError("description") }}
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">
                                Phí giao hàng <span class="text-primary">*</span>
                            </label>

                            <input v-model.number="store.form.base_price" type="number" min="0" class="form-control"
                                placeholder="30000" />

                            <p v-if="store.fieldError('base_price')" class="error-text">
                                {{ store.fieldError("base_price") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Đơn tối thiểu</label>

                            <input v-model.number="store.form.min_order_amount" type="number" min="0"
                                class="form-control" placeholder="0" />

                            <p v-if="store.fieldError('min_order_amount')" class="error-text">
                                {{ store.fieldError("min_order_amount") }}
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Khu vực</label>

                        <input v-model.trim="store.form.region" class="form-control"
                            placeholder="Ví dụ: Toàn quốc, Nội thành, Cần Thơ..." />

                        <p v-if="store.fieldError('region')" class="error-text">
                            {{ store.fieldError("region") }}
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label class="switch-card">
                            <div>
                                <div class="font-semibold text-sm">Kích hoạt</div>
                                <div class="text-xs text-text-light">Cho phép dùng phương thức này.</div>
                            </div>

                            <label class="toggle">
                                <input v-model="store.form.is_active" type="checkbox" />
                                <span class="toggle-slider"></span>
                            </label>
                        </label>

                        <label class="switch-card">
                            <div>
                                <div class="font-semibold text-sm">Đặt mặc định</div>
                                <div class="text-xs text-text-light">Chỉ có một phương thức mặc định.</div>
                            </div>

                            <label class="toggle">
                                <input v-model="store.form.is_default" type="checkbox" />
                                <span class="toggle-slider"></span>
                            </label>
                        </label>
                    </div>

                    <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                        <button type="button" class="btn-outline" @click="store.closeModal">
                            Hủy
                        </button>

                        <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="store.saving">
                            <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                                :class="store.saving ? 'animate-spin' : ''" />

                            {{ store.saving ? "Đang lưu..." : "Lưu phương thức" }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, onMounted } from "vue";
import { useDeliveryMethodStore } from "@/stores/deliveryMethodStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useDeliveryMethodStore();
const authStore = useAuthStore();

let searchTimer = null;

const visiblePages = computed(() => {
    const current = store.meta.current_page;
    const last = store.meta.last_page;
    const pages = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);

    for (let page = start; page <= end; page++) {
        pages.push(page);
    }

    return pages;
});

function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0));
}

async function handleReload() {
    await store.fetchDeliveryMethods();
}

function handleSearch() {
    if (searchTimer) {
        clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(async () => {
        store.filters.page = 1;
        await store.fetchDeliveryMethods();
    }, 350);
}

async function handleFilterChange() {
    store.filters.page = 1;
    await store.fetchDeliveryMethods();
}

async function handleResetFilters() {
    store.resetFilters();
    await store.fetchDeliveryMethods();
}

async function handleSave() {
    await store.saveDeliveryMethod();
}

async function handleToggleActive(method) {
    await store.toggleActive(method);
}

async function handleSetDefault(method) {
    await store.setDefault(method);
}

async function handleDelete(method) {
    const confirmed = window.confirm(
        `Bạn có chắc muốn xóa phương thức "${method.name}" không?`,
    );

    if (!confirmed) {
        return;
    }

    await store.deleteDeliveryMethod(method);
}

function handlePageChange(page) {
    if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
        return;
    }

    store.setPage(page);
}

onMounted(async () => {
    await store.fetchDeliveryMethods();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
    @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
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
    @apply text-text-light text-xs font-medium;
}

.stat-value {
    @apply text-2xl font-bold font-mono;
}

.search-box {
    @apply flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[220px];
}

.search-input {
    @apply bg-transparent outline-none text-sm w-full;
}

.table-th {
    @apply p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light;
}

.table-td {
    @apply p-3 align-middle;
}

.table-row {
    @apply border-b border-border hover:bg-primary/5 transition;
}

.empty-cell {
    @apply p-8 text-center text-text-light;
}

.error-text {
    @apply text-danger text-sm mt-1;
}

.switch-card {
    @apply flex items-center justify-between gap-4 rounded-2xl border border-border p-4 cursor-pointer hover:border-primary transition;
}
</style>