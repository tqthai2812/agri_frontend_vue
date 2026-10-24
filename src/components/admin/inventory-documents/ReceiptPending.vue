<script setup>
defineProps({
    pending: Object,
    recovery: String,
    busy: Boolean,
    canRetry: Boolean,
    recovered: Boolean,
});
defineEmits(["recover", "retry", "accept"]);
</script>
<template>
    <section v-if="pending" class="doc-warning doc-stack" aria-label="Thao tác chưa xác định kết quả">
        <strong>Có thao tác cần kiểm tra kết quả</strong>
        <p v-if="pending.id">Phiếu #{{ pending.id }}</p>
        <p v-else class="doc-code">Mã thao tác: {{ pending.payload.event_key }}</p>
        <div class="doc-actions">
            <button class="doc-btn" type="button" :disabled="busy" @click="$emit('recover')">
                {{ busy ? "Đang kiểm tra…" : "Kiểm tra kết quả" }}
            </button>
            <button v-if="recovery === 'retry' && canRetry" class="doc-btn" type="button" :disabled="busy"
                @click="$emit('retry')">
                Gửi lại yêu cầu đã lưu
            </button>
            <button v-if="recovered" class="doc-btn" type="button" :disabled="busy" @click="$emit('accept')">
                Xem phiên bản hiện tại
            </button>
        </div>
    </section>
</template>