<script setup>
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";

const store = useSupplierStore();

defineProps({ canUpdate: Boolean });
const emit = defineEmits(["detail", "delete"]);
</script>

<template>
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
                                    <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" title="Xem chi tiết"
                                        aria-label="Xem chi tiết nhà cung cấp" :disabled="store.busy"
                                        @click="emit('detail', supplier)">
                                        <Icon icon="solar:eye-bold" />
                                    </button>

                                    <button v-if="canUpdate" type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                                        title="Sửa nhà cung cấp" aria-label="Sửa nhà cung cấp" :disabled="store.busy"
                                        @click="emit('detail', supplier, 'edit')">
                                        <Icon icon="solar:pen-bold" />
                                    </button>

                                    <button v-if="canUpdate" type="button" class="btn-danger-icon cursor-pointer disabled:cursor-not-allowed"
                                        title="Xóa nhà cung cấp" aria-label="Xóa nhà cung cấp" :disabled="store.busy"
                                        @click="emit('delete', supplier)">
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
</template>

<style scoped>
@reference "../../../style.css";

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
</style>