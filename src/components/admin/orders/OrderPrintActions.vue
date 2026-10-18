<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import OrderPrintPreview from "./OrderPrintPreview.vue";

const props = defineProps({
    orderId: { type: Number, required: true },
    disabled: Boolean,
});
const auth = useAuthStore();
const opened = ref(null);
const canView = computed(() => !!auth.hasPermission("order.view"));
const canPick = computed(() => canView.value && !!auth.hasPermission("inventory.view"));

watch(
    [() => props.orderId, () => props.disabled, () => auth.user?.id, canView, canPick],
    () => { opened.value = null; },
);
</script>

<template>
    <div v-if="canView" class="flex flex-wrap items-center gap-2">
        <button v-if="canPick" type="button" class="btn-outline-sm inline-flex items-center gap-2"
            :disabled="disabled || !orderId" @click="opened = 'picking'">
            <Icon icon="mdi:clipboard-check-outline" class="text-base" />
            Phiếu soạn hàng
        </button>
        <button type="button" class="btn-outline-sm inline-flex items-center gap-2" :disabled="disabled || !orderId"
            @click="opened = 'delivery'">
            <Icon icon="mdi:truck-delivery-outline" class="text-base" />
            Phiếu giao hàng
        </button>
        <OrderPrintPreview v-if="opened" :key="`${orderId}:${opened}`" :order-id="orderId" :initial-type="opened"
            @close="opened = null" />
    </div>
</template>