<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useSupplierStore();
const authStore = useAuthStore();

let searchTimer = null;
let productTimer = null;

const canCreate = computed(() =>
    authStore.hasPermission("inventory.create"),
);

const canUpdate = computed(() =>
    authStore.hasPermission("inventory.update"),
);

const canViewProducts = computed(() =>
    authStore.hasPermission("product.view"),
);

const canManageProducts = computed(() =>
    !store.readOnly &&
    canViewProducts.value &&
    store.productsLoaded &&
    store.detailReady,
);

const canSave = computed(() =>
    store.mode === "create"
        ? canCreate.value
        : store.mode === "edit" && canUpdate.value,
);

const modalTitle = computed(() => {
    return {
        create: "Thêm nhà cung cấp",
        edit: "Sửa nhà cung cấp",
        view: "Chi tiết nhà cung cấp",
    }[store.mode] || "";
});

const fields = [
    {
        key: "supplier_code",
        label: "Mã nhà cung cấp",
        required: true,
        maxlength: 50,
        type: "text",
    },
    {
        key: "name",
        label: "Tên nhà cung cấp",
        required: true,
        maxlength: 255,
        type: "text",
    },
    {
        key: "contact_name",
        label: "Người liên hệ",
        maxlength: 255,
        type: "text",
    },
    {
        key: "phone",
        label: "Số điện thoại",
        maxlength: 30,
        type: "tel",
    },
    {
        key: "email",
        label: "Email",
        maxlength: 255,
        type: "email",
    },
    {
        key: "tax_code",
        label: "Mã số thuế",
        maxlength: 50,
        type: "text",
    },
];

const visiblePages = computed(() => {
    const current = store.meta.current_page;
    const last = store.meta.last_page;
    const pages = [];

    for (
        let page = Math.max(1, current - 2);
        page <= Math.min(last, current + 2);
        page += 1
    ) {
        pages.push(page);
    }

    return pages;
});

function clearSearchTimer() {
    clearTimeout(searchTimer);
    searchTimer = null;
}

function clearProductTimer() {
    clearTimeout(productTimer);
    productTimer = null;
}

function handleSearch() {
    clearSearchTimer();

    searchTimer = setTimeout(() => {
        store.filters.page = 1;
        void store.fetchSuppliers();
    }, 350);
}

async function handleFilterChange() {
    clearSearchTimer();
    store.filters.page = 1;

    await store.fetchSuppliers();
}

async function handleResetFilters() {
    clearSearchTimer();
    store.resetFilters();

    await store.fetchSuppliers();
}

async function handlePageChange(page) {
    clearSearchTimer();

    await store.setPage(page);
}

async function handleReload() {
    clearSearchTimer();

    await store.fetchSuppliers();
}

function openCreate() {
    clearProductTimer();
    store.openCreate();
}

async function openDetail(supplier, mode = "view") {
    clearProductTimer();

    await store.openDetail(supplier, mode);
}

function closeModal() {
    clearProductTimer();
    store.closeDialog();
}

function handleProductSearch() {
    clearProductTimer();
    store.invalidateProductSearch();

    productTimer = setTimeout(() => {
        if (canManageProducts.value) {
            void store.searchProducts(1);
        }
    }, 350);
}

async function loadProducts(page = 1) {
    clearProductTimer();

    if (canManageProducts.value) {
        await store.searchProducts(page);
    }
}

async function handleSave() {
    if (!canSave.value) {
        return;
    }

    clearProductTimer();

    await store.saveSupplier();
}

async function handleDelete(supplier) {
    if (!canUpdate.value || store.busy) {
        return;
    }

    const confirmed = window.confirm(
        `Xóa nhà cung cấp "${supplier.name}"?\n\n` +
        "Nhà cung cấp đang liên kết sản phẩm, phiếu kho hoặc lô hàng " +
        "có thể không được xóa. Khi đó hãy sửa và bỏ chọn Đang hoạt động.",
    );

    if (confirmed) {
        await store.deleteSupplier(supplier);
    }
}

onMounted(() => {
    void store.fetchSuppliers();
});

onBeforeUnmount(() => {
    clearSearchTimer();
    clearProductTimer();
    store.closeDialog();
});
</script>

<template>
    <div>
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h1 class="text-2xl font-bold">Nhà cung cấp</h1>
                <p class="text-sm text-text-light">
                    Quản lý thông tin liên hệ và sản phẩm có thể cung ứng.
                </p>
            </div>

            <div class="flex flex-wrap gap-3">
                <button type="button" class="btn-outline-sm" :disabled="store.loading || store.busy"
                    @click="handleReload">
                    <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />
                    Tải lại
                </button>

                <button v-if="canCreate" type="button" class="btn-primary" :disabled="store.busy" @click="openCreate">
                    <Icon icon="solar:add-circle-bold" />
                    Thêm nhà cung cấp
                </button>
            </div>
        </div>

        <div v-if="store.message" class="notice-success mb-4" role="status">
            {{ store.message }}
        </div>

        <div v-if="store.errorMsg" class="notice-error mb-4" role="alert">
            {{ store.errorMsg }}
        </div>

        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div class="mb-5 flex flex-wrap gap-3">
                <div class="search-box">
                    <Icon icon="solar:magnifer-bold" class="text-text-light" />
                    <input v-model.trim="store.filters.search" type="search" maxlength="255" class="search-input"
                        placeholder="Tìm mã, tên, số điện thoại, email..." aria-label="Tìm nhà cung cấp"
                        @input="handleSearch" />
                </div>

                <select v-model="store.filters.is_active" class="filter-select" aria-label="Trạng thái nhà cung cấp"
                    @change="handleFilterChange">
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Đang hoạt động</option>
                    <option value="0">Ngừng hoạt động</option>
                </select>

                <button type="button" class="btn-outline-sm" @click="handleResetFilters">
                    Xóa lọc
                </button>
            </div>

            <div v-if="store.loading" class="empty-cell">
                <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
                Đang tải nhà cung cấp...
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[1000px]">
                    <thead class="bg-bg">
                        <tr>
                            <th class="table-th">Nhà cung cấp</th>
                            <th class="table-th">Liên hệ</th>
                            <th class="table-th">Địa chỉ / MST</th>
                            <th class="table-th">Sản phẩm</th>
                            <th class="table-th">Trạng thái</th>
                            <th class="table-th">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="supplier in store.suppliers" :key="supplier.id" class="table-row">
                            <td class="table-td">
                                <div class="max-w-[250px] break-words font-semibold">
                                    {{ supplier.name }}
                                </div>
                                <div class="mt-1 font-mono text-xs text-text-light">
                                    {{ supplier.supplier_code }}
                                </div>
                            </td>

                            <td class="table-td">
                                <div>{{ supplier.contact_name || "—" }}</div>
                                <div class="text-xs text-text-light">
                                    {{ supplier.phone || "Chưa có số điện thoại" }}
                                </div>
                                <div class="max-w-[220px] break-words text-xs text-text-light">
                                    {{ supplier.email || "Chưa có email" }}
                                </div>
                            </td>

                            <td class="table-td">
                                <div class="max-w-[260px] whitespace-pre-line break-words">
                                    {{ supplier.address || "—" }}
                                </div>
                                <div class="mt-1 text-xs text-text-light">
                                    MST: {{ supplier.tax_code || "—" }}
                                </div>
                            </td>

                            <td class="table-td font-mono">
                                {{ supplier.products_count ?? "—" }}
                            </td>

                            <td class="table-td">
                                <span :class="supplier.is_active ? 'badge-active' : 'badge-inactive'">
                                    {{ supplier.is_active ? "Đang hoạt động" : "Ngừng hoạt động" }}
                                </span>
                            </td>

                            <td class="table-td">
                                <div class="flex gap-2">
                                    <button type="button" class="btn-outline-icon" title="Xem chi tiết"
                                        aria-label="Xem chi tiết nhà cung cấp" :disabled="store.busy"
                                        @click="openDetail(supplier)">
                                        <Icon icon="solar:eye-bold" />
                                    </button>

                                    <button v-if="canUpdate" type="button" class="btn-outline-icon"
                                        title="Sửa nhà cung cấp" aria-label="Sửa nhà cung cấp" :disabled="store.busy"
                                        @click="openDetail(supplier, 'edit')">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button v-if="canUpdate" type="button" class="btn-danger-icon"
                                        title="Xóa nhà cung cấp" aria-label="Xóa nhà cung cấp" :disabled="store.busy"
                                        @click="handleDelete(supplier)">
                                        <Icon :icon="store.deletingId === supplier.id
                                            ? 'solar:refresh-bold'
                                            : 'solar:trash-bin-trash-bold'"
                                            :class="{ 'animate-spin': store.deletingId === supplier.id }" />
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <tr v-if="!store.suppliers.length">
                            <td colspan="6" class="empty-cell">
                                Chưa có nhà cung cấp phù hợp.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span class="text-sm text-text-light">
                    Hiển thị {{ store.suppliers.length }} / {{ store.meta.total }}
                    nhà cung cấp
                </span>

                <div class="flex gap-2">
                    <button type="button" class="page-btn" aria-label="Trang trước"
                        :disabled="store.loading || store.meta.current_page <= 1"
                        @click="handlePageChange(store.meta.current_page - 1)">
                        ‹
                    </button>

                    <button v-for="page in visiblePages" :key="page" type="button" class="page-btn"
                        :class="{ active: page === store.meta.current_page }"
                        :aria-current="page === store.meta.current_page ? 'page' : undefined" :disabled="store.loading"
                        @click="handlePageChange(page)">
                        {{ page }}
                    </button>

                    <button type="button" class="page-btn" aria-label="Trang sau"
                        :disabled="store.loading || store.meta.current_page >= store.meta.last_page"
                        @click="handlePageChange(store.meta.current_page + 1)">
                        ›
                    </button>
                </div>
            </div>
        </section>

        <!-- Giữ modal trong cây layout để kế thừa biến màu và dark mode. -->
        <div v-if="store.dialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            @click.self="closeModal">
            <section role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title"
                class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface"
                @keydown.esc.stop="closeModal">
                <header
                    class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-5">
                    <h2 id="supplier-modal-title" class="text-xl font-bold">
                        {{ modalTitle }}
                    </h2>

                    <button type="button" class="btn-outline-icon" aria-label="Đóng" :disabled="store.saving"
                        @click="closeModal">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </header>

                <div class="p-5">
                    <div v-if="store.dialogError" class="notice-error mb-4" role="alert">
                        <p>{{ store.dialogError }}</p>

                        <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
                            <li v-for="(error, key) in store.errors" :key="key">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="store.loadingDetail" class="empty-cell">
                        Đang tải thông tin...
                    </div>

                    <form v-else-if="store.detailReady" @submit.prevent="handleSave">
                        <fieldset :disabled="store.saving || store.readOnly" class="space-y-4">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <label v-for="field in fields" :key="field.key" class="field">
                                    <span>
                                        {{ field.label }}
                                        <span v-if="field.required" class="text-danger">*</span>
                                    </span>

                                    <input v-model="store.form[field.key]" :type="field.type"
                                        :maxlength="field.maxlength" :required="field.required" class="form-control"
                                        :aria-invalid="Boolean(store.fieldError(field.key))" />

                                    <small v-if="store.fieldError(field.key)" class="text-danger">
                                        {{ store.fieldError(field.key) }}
                                    </small>
                                </label>
                            </div>

                            <label class="field">
                                <span>Địa chỉ</span>
                                <textarea v-model="store.form.address" rows="2" maxlength="10000"
                                    class="form-control"></textarea>
                            </label>

                            <label class="field">
                                <span>Ghi chú</span>
                                <textarea v-model="store.form.note" rows="3" maxlength="10000"
                                    class="form-control"></textarea>
                            </label>

                            <label class="flex items-center gap-2 text-sm">
                                <input v-model="store.form.is_active" type="checkbox" class="size-4 accent-green-700" />
                                Đang hoạt động
                            </label>

                            <p class="text-xs text-text-light">
                                Ngừng hoạt động để không chọn nhà cung cấp này cho lần nhập mới.
                                Lịch sử nhập hàng vẫn được giữ lại.
                            </p>
                        </fieldset>

                        <section class="mt-5 space-y-3 border-t border-border pt-5">
                            <h3 class="font-bold">
                                Sản phẩm có thể cung ứng
                                <span v-if="store.productsLoaded">
                                    ({{ store.selectedProducts.length }}/500)
                                </span>
                            </h3>

                            <p class="text-xs text-text-light">
                                Đây là danh sách sản phẩm nhà cung cấp có thể cung ứng.
                                Nguồn hàng thực tế của từng lần nhập được lưu ở phiếu nhập và lô.
                            </p>

                            <p v-if="!store.productsLoaded" class="text-sm text-warning">
                                API chưa trả danh sách sản phẩm liên kết.
                                Bạn vẫn có thể sửa thông tin nhà cung cấp; liên kết được giữ nguyên.
                            </p>

                            <template v-else>
                                <div class="flex flex-wrap gap-2">
                                    <div v-for="product in store.selectedProducts" :key="product.id"
                                        class="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                                        <span>{{ product.product_name }}</span>

                                        <button v-if="canManageProducts" type="button" class="text-danger"
                                            :disabled="store.saving" :aria-label="`Bỏ liên kết ${product.product_name}`"
                                            @click="store.removeProduct(product.id)">
                                            <Icon icon="solar:close-circle-bold" />
                                        </button>
                                    </div>
                                </div>

                                <p v-if="!store.selectedProducts.length" class="text-sm text-text-light">
                                    Chưa liên kết sản phẩm.
                                </p>
                            </template>

                            <p v-if="!store.readOnly && !canViewProducts" class="text-xs text-text-light">
                                Tài khoản chưa có quyền xem sản phẩm để thay đổi danh sách cung ứng.
                                Bạn vẫn có thể lưu thông tin nhà cung cấp.
                            </p>

                            <template v-if="canManageProducts">
                                <div class="flex gap-2">
                                    <input v-model="store.productSearch" type="search" maxlength="255"
                                        class="form-control min-w-0 flex-1" placeholder="Tìm sản phẩm để liên kết..."
                                        aria-label="Tìm sản phẩm cung ứng" :disabled="store.saving"
                                        @input="handleProductSearch" @keydown.enter.prevent="loadProducts(1)" />

                                    <button type="button" class="btn-outline-sm"
                                        :disabled="store.saving || store.productLoading" @click="loadProducts(1)">
                                        Tìm
                                    </button>
                                </div>

                                <p v-if="store.productError" class="text-sm text-danger">
                                    {{ store.productError }}
                                </p>

                                <p v-if="store.productLoading" class="text-sm text-text-light">
                                    Đang tìm sản phẩm...
                                </p>

                                <div v-else-if="store.productResults.length" class="rounded-xl border border-border">
                                    <div v-for="product in store.productResults" :key="product.id"
                                        class="flex items-center justify-between gap-3 border-b border-border p-3 last:border-b-0">
                                        <div class="min-w-0 text-sm">
                                            <div class="break-words">{{ product.product_name }}</div>
                                            <div class="text-xs text-text-light">
                                                ID: {{ product.id }}
                                                <span v-if="product.first_sku">
                                                    · {{ product.first_sku }}
                                                </span>
                                            </div>
                                        </div>

                                        <button type="button" class="btn-outline-sm shrink-0" :disabled="store.saving ||
                                            store.isProductSelected(product.id) ||
                                            store.selectedProducts.length >= 500
                                            " @click="store.addProduct(product)">
                                            {{ store.isProductSelected(product.id) ? "Đã chọn" : "Chọn" }}
                                        </button>
                                    </div>

                                    <div class="flex items-center justify-end gap-3 p-3">
                                        <span class="text-xs text-text-light">
                                            {{ store.productMeta.current_page }}
                                            / {{ store.productMeta.last_page }}
                                        </span>

                                        <button type="button" class="page-btn" aria-label="Trang sản phẩm trước"
                                            :disabled="store.saving || store.productMeta.current_page <= 1"
                                            @click="loadProducts(store.productMeta.current_page - 1)">
                                            ‹
                                        </button>

                                        <button type="button" class="page-btn" aria-label="Trang sản phẩm sau"
                                            :disabled="store.saving || store.productMeta.current_page >= store.productMeta.last_page"
                                            @click="loadProducts(store.productMeta.current_page + 1)">
                                            ›
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </section>

                        <footer class="mt-5 flex justify-end gap-3 border-t border-border pt-4">
                            <button type="button" class="btn-outline" :disabled="store.saving" @click="closeModal">
                                {{ store.readOnly ? "Đóng" : "Hủy" }}
                            </button>

                            <button v-if="!store.readOnly && canSave" type="submit" class="btn-primary"
                                :disabled="!store.canSubmit">
                                <Icon :icon="store.saving
                                    ? 'solar:refresh-bold'
                                    : 'solar:diskette-bold-duotone'" :class="{ 'animate-spin': store.saving }" />
                                {{ store.saving ? "Đang lưu..." : "Lưu nhà cung cấp" }}
                            </button>
                        </footer>
                    </form>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
@reference "../style.css";

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
    @apply p-3 align-middle text-sm;
}

.table-row {
    @apply border-b border-border transition hover:bg-primary/5;
}

.empty-cell {
    @apply p-8 text-center text-sm text-text-light;
}

.field {
    @apply flex flex-col gap-2 text-sm;
}

.notice-error {
    @apply rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700;
}

.notice-success {
    @apply rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700;
}

button:disabled {
    @apply cursor-not-allowed opacity-50;
}
</style>