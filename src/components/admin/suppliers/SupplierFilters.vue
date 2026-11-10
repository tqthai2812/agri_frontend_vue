<script setup>
import { Icon } from "@iconify/vue";
import { useSupplierStore } from "@/stores/admin/supplierStore";

const store = useSupplierStore();

const emit = defineEmits(["search", "change", "reset"]);
</script>

<template>
<div class="mb-5 flex flex-wrap gap-3">
                <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                    <Icon icon="solar:magnifer-bold" class="text-text-light" />
                    <input v-model.trim="store.filters.search" type="search" maxlength="255" class="w-full bg-transparent text-sm outline-none"
                        placeholder="Tìm mã, tên, số điện thoại, email..." aria-label="Tìm nhà cung cấp"
                        @input="emit('search')" />
                </div>

                <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none" aria-label="Trạng thái nhà cung cấp"
                    @change="emit('change')">
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Đang hoạt động</option>
                    <option value="0">Ngừng hoạt động</option>
                </select>

                <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')">
                    <Icon icon="solar:restart-bold" />
                    Xóa lọc
                </button>
            </div>
</template>