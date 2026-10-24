<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useUserStore } from "@/stores/admin/userStore";

const store = useUserStore();

const emit = defineEmits(["change"]);

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
</script>

<template>
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">
            Hiển thị {{ store.users.length }} / {{ store.meta.total }} người dùng
        </span>

        <div class="flex flex-wrap justify-center gap-2">
            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed"
                :disabled="store.loading || store.meta.current_page <= 1" aria-label="Trang trước"
                @click="emit('change', store.meta.current_page - 1)">
                <Icon icon="solar:arrow-left-bold" />
            </button>

            <button type="button" v-for="page in visiblePages" :key="page"
                class="page-btn cursor-pointer disabled:cursor-not-allowed"
                :class="{ active: page === store.meta.current_page }"
                :aria-current="page === store.meta.current_page ? 'page' : undefined" :disabled="store.loading"
                @click="emit('change', page)">
                {{ page }}
            </button>

            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed"
                :disabled="store.loading || store.meta.current_page >= store.meta.last_page" aria-label="Trang sau"
                @click="emit('change', store.meta.current_page + 1)">
                <Icon icon="solar:arrow-right-bold" />
            </button>
        </div>
    </div>
</template>