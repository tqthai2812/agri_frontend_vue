<script setup>
import { Icon } from "@iconify/vue";
import { useUserStore } from "@/stores/admin/userStore";

const store = useUserStore();

const emit = defineEmits(["search", "filter-change", "reset"]);
</script>

<template>
    <div class="flex flex-wrap gap-3 mb-5">
        <div class="search-box">
            <Icon icon="solar:magnifer-bold" class="text-text-light" />

            <input v-model.trim="store.filters.search" type="text" placeholder="Tìm tên, email, số điện thoại..."
                class="search-input" @input="emit('search')" />
        </div>

        <select v-model="store.filters.role" class="filter-select flex-1 sm:flex-none" @change="emit('filter-change')">
            <option value="">Tất cả vai trò</option>
            <option v-for="role in store.roles" :key="role.id" :value="role.name">
                {{ role.name }}
            </option>
        </select>

        <select v-model="store.filters.is_active" class="filter-select flex-1 sm:flex-none"
            @change="emit('filter-change')">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Đã khóa</option>
        </select>

        <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" @click="emit('reset')">
            <Icon icon="solar:restart-bold" />
            Xóa lọc
        </button>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.search-box {
    @apply flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[220px];
}

.search-input {
    @apply bg-transparent outline-none text-sm w-full;
}
</style>