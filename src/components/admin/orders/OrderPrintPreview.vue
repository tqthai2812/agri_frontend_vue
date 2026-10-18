<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores/shared/authStore";
import { printOrderElement } from "@/utils/orderPrint";
import OrderPrintDocument from "./OrderPrintDocument.vue";

const props = defineProps({
    orderId: { type: Number, required: true },
    initialType: { type: String, default: "delivery" },
});
const emit = defineEmits(["close"]);
const auth = useAuthStore();
const type = ref(props.initialType);
const payload = ref(null);
const loading = ref(false);
const printing = ref(false);
const error = ref("");
const changed = ref("");
const panel = ref(null);
const paper = ref(null);
const canPick = computed(() => !!auth.hasPermission("inventory.view"));
const allowed = computed(() => !!auth.hasPermission("order.view")
    && (type.value !== "picking" || canPick.value));
const title = computed(() => type.value === "picking" ? "Phiếu soạn hàng" : "Phiếu giao hàng");
const canPrint = computed(() => allowed.value && payload.value?.can_print === true
    && !loading.value && !printing.value && !error.value);
let controller;
let version = 0;
let previousFocus;
let previousOverflow;
let lockedBody = false;
let disposed = false;

function signature(data) {
    return JSON.stringify({ ...data, generated_at: undefined });
}

async function load() {
    const request = ++version;
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = "";
    changed.value = "";
    try {
        const response = await apiClient.get(`/api/v1/orders/${props.orderId}/print`, {
            params: { type: type.value }, signal: controller.signal,
        });
        if (disposed || request !== version || !allowed.value) return null;
        const data = response.data?.data;
        if (Number(data?.id) !== props.orderId || data.type !== type.value
            || !Array.isArray(data.items) || !Array.isArray(data.issues)
            || typeof data.can_print !== "boolean") {
            throw new Error("Dữ liệu phiếu in không hợp lệ.");
        }
        payload.value = data;
        return data;
    } catch (cause) {
        if (disposed || request !== version || cause?.code === "ERR_CANCELED"
            || cause?.name === "AbortError" || cause?.name === "CanceledError") return null;
        payload.value = null;
        error.value = cause?.response?.data?.message || cause.message || "Không tải được phiếu in.";
        return null;
    } finally {
        if (!disposed && request === version) loading.value = false;
    }
}

async function print() {
    if (!canPrint.value) return;
    printing.value = true;
    const before = signature(payload.value);
    try {
        const fresh = await load();
        if (!fresh || disposed || !allowed.value || fresh.can_print !== true) return;
        if (signature(fresh) !== before) {
            changed.value = "Dữ liệu đơn vừa thay đổi. Kiểm tra lại phiếu rồi bấm In.";
            return;
        }
        await nextTick();
        const checkedVersion = version;
        await printOrderElement(paper.value, {
            title: `${title.value} ${fresh.code}`,
            allowed: () => !disposed && allowed.value && version === checkedVersion,
        });
    } catch (cause) {
        if (!disposed) error.value = cause.message || "Không mở được bản in.";
    } finally {
        if (!disposed) printing.value = false;
    }
}

function close() {
    if (!printing.value) emit("close");
}

function keys(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        return;
    }
    if (event.key !== "Tab" || !panel.value) return;
    event.stopImmediatePropagation();
    const list = [...panel.value.querySelectorAll(
        'button:not([disabled]),a[href],[tabindex="0"]',
    )].filter((element) => element.getClientRects().length);
    const first = list[0];
    const last = list.at(-1);
    if (!first) { event.preventDefault(); panel.value.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !panel.value.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.value.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
    }
}

watch(type, () => { payload.value = null; load(); }, { immediate: true });
watch([() => auth.user?.id, allowed, () => props.orderId], () => {
    controller?.abort();
    version++;
    payload.value = null;
    emit("close");
});

onMounted(async () => {
    previousFocus = document.activeElement;
    if (document.body.style.overflow !== "hidden") {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        lockedBody = true;
    }
    document.addEventListener("keydown", keys, true);
    await nextTick();
    panel.value?.focus();
});
onBeforeUnmount(() => {
    disposed = true;
    version++;
    controller?.abort();
    document.removeEventListener("keydown", keys, true);
    if (lockedBody) document.body.style.overflow = previousOverflow;
    if (previousFocus?.isConnected) previousFocus.focus();
});
</script>

<template>
    <Teleport to="body">
        <div class="order-print-backdrop" @click.self="close">
            <section ref="panel" role="dialog" aria-modal="true" :aria-label="`Xem trước ${title.toLowerCase()}`"
                tabindex="-1" class="order-print-panel bg-surface text-text">
                <header class="order-print-toolbar border-border">
                    <div>
                        <h2 class="text-lg font-bold">{{ title }} <span class="text-primary">{{ payload?.code }}</span>
                        </h2>
                        <p class="mt-1 text-xs text-text-light">Xem trước bản in A4</p>
                    </div>
                    <button type="button" class="btn-outline-icon" aria-label="Đóng phiếu in" :disabled="printing"
                        @click="close"><span aria-hidden="true">×</span></button>
                </header>
                <div class="flex flex-wrap gap-2 border-b border-border px-4 py-3 sm:px-5">
                    <button v-if="canPick" type="button" class="order-print-tab" :class="{ active: type === 'picking' }"
                        :aria-pressed="type === 'picking'" :disabled="printing" @click="type = 'picking'">Phiếu soạn
                        hàng</button>
                    <button type="button" class="order-print-tab" :class="{ active: type === 'delivery' }"
                        :aria-pressed="type === 'delivery'" :disabled="printing" @click="type = 'delivery'">Phiếu giao
                        hàng</button>
                </div>
                <div class="order-print-content bg-bg" :aria-busy="loading">
                    <p v-if="loading" role="status" class="p-4 text-center text-sm text-text-light">
                        {{ printing ? 'Đang kiểm tra dữ liệu trước khi in...' : 'Đang tải phiếu...' }}
                    </p>
                    <p v-if="error" role="alert" class="order-print-error">{{ error }}</p>
                    <p v-if="changed" role="status" class="order-print-warning">{{ changed }}</p>
                    <ul v-if="payload?.issues.length" role="alert" class="order-print-warning list-inside list-disc">
                        <li v-for="issue in payload.issues" :key="issue">{{ issue }}</li>
                    </ul>
                    <div v-if="payload" ref="paper" class="order-print-paper">
                        <OrderPrintDocument :data="payload" />
                    </div>
                </div>
                <footer class="order-print-toolbar border-border">
                    <button type="button" class="btn-outline-sm" :disabled="loading || printing" @click="load">Tải lại
                        phiếu</button>
                    <div class="flex gap-2">
                        <button type="button" class="btn-outline-sm" :disabled="printing" @click="close">Đóng</button>
                        <button type="button" class="btn-primary inline-flex items-center gap-2" :disabled="!canPrint"
                            @click="print">
                            <Icon icon="mdi:printer-outline" class="text-lg" />
                            {{ printing ? 'Đang mở bản in...' : 'In phiếu' }}
                        </button>
                    </div>
                </footer>
            </section>
        </div>
    </Teleport>
</template>

<style scoped>
.order-print-backdrop {
    position: fixed;
    inset: 0;
    z-index: 150;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: rgb(0 0 0 / 55%);
}

.order-print-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 960px;
    max-height: 94dvh;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgb(0 0 0 / 25%);
    outline: none;
}

.order-print-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    padding: 16px 20px;
    border-bottom-width: 1px;
}

footer.order-print-toolbar {
    border-top-width: 1px;
    border-bottom-width: 0;
}

.order-print-content {
    min-height: 120px;
    overflow: auto;
    padding: 16px;
}

.order-print-paper {
    width: max-content;
    margin: 0 auto;
    box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}

.order-print-tab {
    border-radius: 8px;
    border: 1px solid var(--color-border, #e2e8f0);
    padding: 8px 12px;
    font-size: 13px;
}

.order-print-tab.active {
    border-color: var(--color-primary, #dc2626);
    color: var(--color-primary, #dc2626);
    background: color-mix(in srgb, var(--color-primary, #dc2626) 8%, transparent);
    font-weight: 700;
}

.order-print-error,
.order-print-warning {
    margin-bottom: 12px;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.6;
}

.order-print-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
}

.order-print-warning {
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
}

button:disabled {
    cursor: not-allowed;
    opacity: .5;
}

@media (max-width: 640px) {
    .order-print-toolbar {
        padding: 12px;
    }

    .order-print-content {
        padding: 10px;
    }
}
</style>