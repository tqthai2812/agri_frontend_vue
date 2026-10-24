<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
const props = defineProps({ title: String, busy: Boolean });
const emit = defineEmits(["close"]);
const element = ref(null);
let previous;
onMounted(() => {
    previous = document.activeElement;
    element.value.showModal();
});
onBeforeUnmount(() => {
    element.value?.close();
    previous?.focus?.();
});
</script>
<template>
    <dialog ref="element" class="stock-doc-dialog stock-docs" aria-labelledby="stock-document-title"
        @cancel.prevent="!props.busy && emit('close')">
        <header class="doc-dialog-header">
            <h2 id="stock-document-title">{{ title }}</h2>
            <button type="button" class="doc-btn" :disabled="busy" aria-label="Đóng cửa sổ phiếu kho"
                @click="emit('close')">
                Đóng
            </button>
        </header>
        <div class="doc-dialog-body">
            <slot />
        </div>
        <footer class="doc-dialog-footer">
            <slot name="footer" />
        </footer>
    </dialog>
</template>