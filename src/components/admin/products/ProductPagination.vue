<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useProductStore } from "@/stores/admin/productStore";

const store = useProductStore();

const emit = defineEmits(["change"]);

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
</script>

<template>
    <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">
            Hiển thị {{ store.products.length }} / {{ store.meta.total }} sản phẩm
        </span>

        <div class="flex flex-wrap justify-center gap-2">
            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang trước"
                :disabled="store.loading || store.meta.current_page <= 1"
                @click="emit('change', store.meta.current_page - 1)">
                <Icon icon="solar:arrow-left-bold" />
            </button>

            <button v-for="page in visiblePages" :key="page" type="button"
                class="page-btn cursor-pointer disabled:cursor-not-allowed"
                :class="{ active: page === store.meta.current_page }"
                :aria-current="page === store.meta.current_page ? 'page' : undefined" :disabled="store.loading"
                @click="emit('change', page)">
                {{ page }}
            </button>

            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sau"
                :disabled="store.loading || store.meta.current_page >= store.meta.last_page"
                @click="emit('change', store.meta.current_page + 1)">
                <Icon icon="solar:arrow-right-bold" />
            </button>
        </div>
    </div>
</template>