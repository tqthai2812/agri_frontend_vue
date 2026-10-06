<script setup>
defineProps({ meta: Object, loading: Boolean });
defineEmits(["page"]);
</script>
<template>
    <div v-if="meta" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>{{ meta.total }} dòng · Trang {{ meta.current_page }}/{{
            meta.last_page
            }}</span>
        <div class="flex gap-2">
            <button class="fin-btn" :disabled="loading || meta.current_page <= 1"
                @click="$emit('page', meta.current_page - 1)">
                Trước</button><button class="fin-btn" :disabled="loading || meta.current_page >= meta.last_page"
                @click="$emit('page', meta.current_page + 1)">
                Sau
            </button>
        </div>
    </div>
</template>