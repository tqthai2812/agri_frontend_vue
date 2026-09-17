<template>
    <div>
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold">Quản lý giảm giá</h1>
                <p class="text-text-light text-sm">
                    Quản lý mã giảm giá, phần trăm giảm, giới hạn sử dụng và thời hạn áp dụng.
                </p>
            </div>

            <div class="flex flex-wrap gap-3">
                <button class="btn-outline-sm" @click="handleReload">
                    <Icon icon="solar:refresh-bold" :class="store.loading ? 'animate-spin' : ''" />
                    Tải lại
                </button>

                <button v-if="authStore.hasPermission('discount.create')" class="btn-primary"
                    @click="store.openCreateModal">
                    <Icon icon="solar:add-circle-bold" />
                    Thêm giảm giá
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="stat-card-info">
                <div class="stat-label">Tổng giảm giá</div>
                <div class="stat-value text-info">{{ store.meta.total }}</div>
            </div>

            <div class="stat-card-success">
                <div class="stat-label">Có hiệu lực</div>
                <div class="stat-value text-success">{{ store.availableDiscounts.length }}</div>
            </div>

            <div class="stat-card-warning">
                <div class="stat-label">Hết hạn</div>
                <div class="stat-value">{{ store.expiredDiscounts.length }}</div>
            </div>

            <div class="stat-card-danger">
                <div class="stat-label">Đã tắt / hết lượt</div>
                <div class="stat-value text-danger">
                    {{ store.inactiveDiscounts.length + store.usedUpDiscounts.length }}
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

                    <input v-model.trim="store.filters.search" type="text" placeholder="Tìm mã hoặc mô tả giảm giá..."
                        class="search-input" @input="handleSearch" />
                </div>

                <select v-model="store.filters.status" class="filter-select flex-1 sm:flex-none"
                    @change="handleFilterChange">
                    <option value="">Tất cả trạng thái</option>
                    <option value="available">Có hiệu lực</option>
                    <option value="expired">Hết hạn</option>
                    <option value="used_up">Hết lượt</option>
                </select>

                <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
                    @change="handleFilterChange">
                    <option value="">Bật / tắt</option>
                    <option value="1">Đang bật</option>
                    <option value="0">Đã tắt</option>
                </select>

                <button class="btn-outline-sm" @click="handleResetFilters">
                    <Icon icon="solar:restart-bold" />
                    Xóa lọc
                </button>
            </div>

            <!-- Loading -->
            <div v-if="store.loading" class="py-10 text-center text-text-light">
                <Icon icon="solar:refresh-bold" class="animate-spin text-3xl mx-auto mb-2" />
                <p class="text-sm">Đang tải giảm giá...</p>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[1200px]">
                    <thead class="bg-bg">
                        <tr>
                            <th class="table-th">Mã</th>
                            <th class="table-th">Mô tả</th>
                            <th class="table-th">Giảm</th>
                            <th class="table-th">Giảm tối đa</th>
                            <th class="table-th">Đơn tối thiểu</th>
                            <th class="table-th">Sử dụng</th>
                            <th class="table-th">Hết hạn</th>
                            <th class="table-th">Trạng thái</th>
                            <th class="table-th">Đơn hàng</th>
                            <th class="table-th">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="discount in store.discounts" :key="discount.id" class="table-row">
                            <td class="table-td">
                                <span class="badge-gray font-mono">
                                    {{ discount.discount_code }}
                                </span>
                            </td>

                            <td class="table-td">
                                <div class="font-semibold text-sm max-w-[320px]">
                                    {{ discount.discount_description }}
                                </div>

                                <div v-if="discount.user" class="text-xs text-text-light">
                                    Áp dụng cho: {{ discount.user.name }}
                                </div>

                                <div v-else class="text-xs text-text-light">
                                    Áp dụng chung
                                </div>
                            </td>

                            <td class="table-td">
                                <span class="badge-gray">
                                    {{ discount.discount_percent }}%
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ formatVND(discount.max_discount_amount) }}
                            </td>

                            <td class="table-td font-mono">
                                {{ formatVND(discount.min_order_value) }}
                            </td>

                            <td class="table-td">
                                <div class="font-mono text-sm">
                                    {{ discount.used_count }}
                                    /
                                    {{ discount.usage_limit ?? "∞" }}
                                </div>

                                <div class="text-xs text-text-light">
                                    Còn lại:
                                    {{ discount.remaining_usage ?? "Không giới hạn" }}
                                </div>
                            </td>

                            <td class="table-td text-sm">
                                {{ formatDate(discount.expire_date) }}
                            </td>

                            <td class="table-td">
                                <span :class="statusBadgeClass(discount.status)">
                                    {{ discount.status_label }}
                                </span>
                            </td>

                            <td class="table-td font-mono">
                                {{ discount.orders_count ?? 0 }}
                            </td>

                            <td class="table-td">
                                <div class="flex gap-2">
                                    <button v-if="authStore.hasPermission('discount.update')" class="btn-outline-icon"
                                        title="Sửa" @click="store.openEditModal(discount)">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button v-if="authStore.hasPermission('discount.update')" class="btn-outline-icon"
                                        :class="discount.is_active ? 'text-warning' : 'text-success'" title="Bật / tắt"
                                        :disabled="store.saving" @click="handleToggle(discount)">
                                        <Icon
                                            :icon="discount.is_active ? 'solar:pause-circle-bold' : 'solar:play-circle-bold'" />
                                    </button>

                                    <button v-if="authStore.hasPermission('discount.delete')" class="btn-danger-icon"
                                        title="Xóa" :disabled="store.deleting || Number(discount.orders_count || 0) > 0"
                                        @click="handleDelete(discount)">
                                        <Icon icon="solar:trash-bin-trash-bold" />
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <tr v-if="!store.discounts.length">
                            <td colspan="10" class="empty-cell">
                                Không có chương trình giảm giá nào.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
                <span class="text-sm text-text-light">
                    Hiển thị {{ store.discounts.length }} / {{ store.meta.total }} giảm giá
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
                            {{ store.selectedDiscount ? "Cập nhật giảm giá" : "Thêm giảm giá" }}
                        </h2>
                        <p class="text-sm text-text-light">
                            Cấu hình mã giảm giá, phần trăm giảm, giới hạn và ngày hết hạn.
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
                            Mã giảm giá <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.form.discount_code" class="form-control uppercase font-mono"
                            placeholder="Ví dụ: SALE10, WELCOME15" @input="handleCodeInput" />

                        <p class="text-xs text-text-light mt-1">
                            Khách hàng sẽ nhập mã này khi áp dụng giảm giá.
                            Chỉ nên dùng chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.
                        </p>

                        <p v-if="store.fieldError('discount_code')" class="error-text">
                            {{ store.fieldError("discount_code") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            Mô tả giảm giá <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.form.discount_description" class="form-control"
                            placeholder="Ví dụ: Giảm 10% cho đơn từ 200.000đ" />

                        <p v-if="store.fieldError('discount_description')" class="error-text">
                            {{ store.fieldError("discount_description") }}
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">
                                Phần trăm giảm <span class="text-primary">*</span>
                            </label>

                            <input v-model.number="store.form.discount_percent" type="number" min="1" max="100"
                                class="form-control" placeholder="10" />

                            <p v-if="store.fieldError('discount_percent')" class="error-text">
                                {{ store.fieldError("discount_percent") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                Ngày hết hạn <span class="text-primary">*</span>
                            </label>

                            <input v-model="store.form.expire_date" type="date" class="form-control" />

                            <p v-if="store.fieldError('expire_date')" class="error-text">
                                {{ store.fieldError("expire_date") }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">
                                Giảm tối đa <span class="text-primary">*</span>
                            </label>

                            <input v-model.number="store.form.max_discount_amount" type="number" min="0"
                                class="form-control" placeholder="50000" />

                            <p v-if="store.fieldError('max_discount_amount')" class="error-text">
                                {{ store.fieldError("max_discount_amount") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                Đơn tối thiểu <span class="text-primary">*</span>
                            </label>

                            <input v-model.number="store.form.min_order_value" type="number" min="0"
                                class="form-control" placeholder="200000" />

                            <p v-if="store.fieldError('min_order_value')" class="error-text">
                                {{ store.fieldError("min_order_value") }}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Giới hạn sử dụng</label>

                            <input v-model="store.form.usage_limit" type="number" min="1" class="form-control"
                                placeholder="Để trống nếu không giới hạn" />

                            <p v-if="store.fieldError('usage_limit')" class="error-text">
                                {{ store.fieldError("usage_limit") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Số lượt đã dùng</label>

                            <input v-model.number="store.form.used_count" type="number" min="0" class="form-control"
                                placeholder="0" />

                            <p v-if="store.fieldError('used_count')" class="error-text">
                                {{ store.fieldError("used_count") }}
                            </p>
                        </div>
                    </div>

                    <label class="switch-card">
                        <div>
                            <div class="font-semibold text-sm">Kích hoạt</div>
                            <div class="text-xs text-text-light">
                                Cho phép sử dụng chương trình giảm giá này.
                            </div>
                        </div>

                        <label class="toggle">
                            <input v-model="store.form.is_active" type="checkbox" />
                            <span class="toggle-slider"></span>
                        </label>
                    </label>

                    <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                        <button type="button" class="btn-outline" @click="store.closeModal">
                            Hủy
                        </button>

                        <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="store.saving">
                            <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                                :class="store.saving ? 'animate-spin' : ''" />

                            {{ store.saving ? "Đang lưu..." : "Lưu giảm giá" }}
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
import { useDiscountStore } from "@/stores/discountStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useDiscountStore();
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

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("vi-VN");
}

function statusBadgeClass(status) {
    if (status === "available") {
        return "badge-active";
    }

    if (status === "expired" || status === "used_up") {
        return "badge-pending";
    }

    return "badge-inactive";
}

function handleCodeInput() {
    store.form.discount_code = String(store.form.discount_code || "")
        .toUpperCase()
        .replace(/\s+/g, "");
}

async function handleReload() {
    await store.fetchDiscounts();
}

function handleSearch() {
    if (searchTimer) {
        clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(async () => {
        store.filters.page = 1;
        await store.fetchDiscounts();
    }, 350);
}

async function handleFilterChange() {
    store.filters.page = 1;
    await store.fetchDiscounts();
}

async function handleResetFilters() {
    store.resetFilters();
    await store.fetchDiscounts();
}

async function handleSave() {
    await store.saveDiscount();
}

async function handleToggle(discount) {
    await store.toggleActive(discount);
}

async function handleDelete(discount) {
    const confirmed = window.confirm(
        `Bạn có chắc muốn xóa giảm giá "${discount.discount_description}" không?`,
    );

    if (!confirmed) {
        return;
    }

    await store.deleteDiscount(discount);
}

function handlePageChange(page) {
    if (page < 1 || page > store.meta.last_page || page === store.meta.current_page) {
        return;
    }

    store.setPage(page);
}

onMounted(async () => {
    await store.fetchDiscounts();
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