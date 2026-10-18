<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import FinanceDialog from "@/components/admin/finance/FinanceDialog.vue";
import service from "@/services/admin/inventory-report.service";
import { dateText, errorText, lotStatus, money, quantity } from "@/composables/useInventoryReport";
import {
    adjustmentChange, adjustmentPayload, adjustmentProblems, estimatedAdjustmentCost,
    forgetAdjustment, getPendingAdjustment, rememberAdjustment, sameAdjustment,
} from "@/composables/useInventoryAdjustment";

const props = defineProps({ target: { type: Object, required: true } });
const emit = defineEmits(["close", "saved", "pending-change"]);
const auth = useAuthStore();
const actor = Number(auth.user?.id);
const pending = ref(getPendingAdjustment(actor));
const context = ref(null);
const loading = ref(false);
const saving = ref(false);
const checking = ref(false);
const error = ref("");
const status = ref("");
const fieldErrors = ref({});
const form = reactive({ direction: "decrease", quantity: "", category: "", note: "" });
const permitted = computed(() => auth.isAuthenticated && Number(auth.user?.id) === actor
    && auth.hasPermission("inventory.view") && auth.hasPermission("report.inventory.view")
    && auth.hasPermission("inventory.create"));
const busy = computed(() => loading.value || saving.value || checking.value);
const change = computed(() => adjustmentChange(form));
const problems = computed(() => adjustmentProblems(context.value, form));
const cost = computed(() => estimatedAdjustmentCost(context.value?.lot.unit_cost, Math.abs(change.value || 0)));
const canSave = computed(() => permitted.value && !busy.value && context.value && problems.value.length === 0);
let controller;
let generation = 0;
let alive = true;

if (pending.value) {
    const p = pending.value.payload;
    Object.assign(form, {
        direction: p.quantity_change < 0 ? "decrease" : "increase",
        quantity: Math.abs(p.quantity_change), category: p.expense_category_id || "", note: p.note
    });
}

function current(version = generation) {
    return alive && permitted.value && version === generation;
}

async function loadContext() {
    if (!permitted.value || saving.value) return;
    const version = ++generation;
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    context.value = null;
    error.value = "";
    const packageId = pending.value?.payload.package_id || props.target.package_id;
    const lotId = pending.value?.payload.lot_id || props.target.lot_id;
    try {
        const response = await service.adjustmentContext(packageId, lotId, controller.signal);
        if (!current(version)) return;
        const data = response.data?.data;
        if (Number(data?.package?.id) !== Number(packageId) || Number(data?.lot?.id) !== Number(lotId)
            || Number(data?.lot?.package_id) !== Number(packageId) || !Array.isArray(data.categories)
            || typeof data?.stock?.consistent !== "boolean") throw new Error("Dữ liệu lô chưa hợp lệ. Vui lòng tải lại.");
        context.value = data;
    } catch (cause) {
        if (current(version) && cause?.code !== "ERR_CANCELED" && cause?.name !== "AbortError") {
            error.value = await errorText(cause);
        }
    } finally {
        if (current(version)) loading.value = false;
    }
}

function complete(task, record) {
    forgetAdjustment(actor, task.payload.event_key);
    if (!current()) return;
    pending.value = null;
    emit("pending-change");
    emit("saved", record);
}

async function checkRecorded({ silent = false } = {}) {
    const task = pending.value;
    if (!task || !permitted.value || checking.value) return false;
    checking.value = true;
    const version = generation;
    try {
        const response = await service.adjustmentEvent(task.payload.event_key);
        if (!current(version)) return false;
        const record = response.data?.data;
        if (record) {
            if (!sameAdjustment(task, record)) {
                error.value = "Mã thao tác đã có chứng từ nhưng nội dung không khớp. Cần kiểm tra nhật ký kho.";
                return false;
            }
            complete(task, record);
            return true;
        }
        if (!silent) status.value = "Chưa tìm thấy phiếu đã ghi cho mã này. Có thể gửi lại đúng thao tác đang lưu.";
        return false;
    } catch (cause) {
        if (current(version) && !silent) error.value = await errorText(cause);
        return false;
    } finally {
        if (current(version)) checking.value = false;
    }
}

async function save() {
    if (!canSave.value) return;
    const wasPending = !!pending.value;
    saving.value = true;
    error.value = "";
    status.value = "";
    fieldErrors.value = {};
    let task = pending.value;
    try {
        if (!task) {
            task = {
                user_id: actor, payload: adjustmentPayload(context.value, form),
                sku: context.value.package.sku, lot_code: context.value.lot.lot_code
            };
            rememberAdjustment(task);
            pending.value = task;
            emit("pending-change");
        } else if (await checkRecorded({ silent: true })) {
            return;
        }
        if (!current()) return;
        const response = await service.adjust(task.payload, () => current());
        const data = response.data?.data;
        if (Number(data?.id) > 0 && Number(data?.document_id) > 0
            && Number(data.package_id) === task.payload.package_id
            && Number(data.quantity_change) === task.payload.quantity_change) {
            complete(task, { ...data, transaction_id: Number(data.id) });
        } else if (!(await checkRecorded({ silent: true })) && current()) {
            error.value = "Máy chủ đã nhận yêu cầu nhưng chưa xác nhận được chứng từ. Bấm Kiểm tra kết quả; giữ nguyên mã thao tác.";
        }
    } catch (cause) {
        const message = await errorText(cause);
        if (!task || !pending.value) {
            if (current()) error.value = cause.message || message;
            return;
        }
        const statusCode = cause?.response?.status;
        const definitive = cause.inventoryPostStarted === false
            || [400, 401, 403, 404, 405, 419, 422].includes(statusCode);
        if (definitive && !wasPending) {
            forgetAdjustment(actor, task.payload.event_key);
            if (current()) {
                pending.value = null;
                fieldErrors.value = cause?.response?.data?.errors || {};
                error.value = message;
                emit("pending-change");
            }
        } else {
            const found = await checkRecorded({ silent: true });
            if (!found && current()) {
                error.value = `${message} Chưa xác định kết quả thao tác; kiểm tra hoặc gửi lại cùng mã đang lưu.`;
            }
        }
    } finally {
        if (current()) saving.value = false;
    }
}

function close() {
    if (!saving.value && !checking.value) emit("close");
}

onMounted(async () => {
    if (pending.value && await checkRecorded()) return;
    await loadContext();
});
onBeforeUnmount(() => {
    alive = false;
    generation++;
    controller?.abort();
});
</script>

<template>
    <FinanceDialog title="Điều chỉnh tồn lô" :busy="saving || checking" @close="close">
        <p v-if="loading" role="status" class="py-6 text-center fin-note">Đang lấy tồn lô hiện tại…</p>
        <p v-if="error" role="alert" class="fin-error mb-4">{{ error }}</p>
        <p v-if="status" role="status" class="fin-note mb-4">{{ status }}</p>
        <div v-if="pending" class="fin-warning mb-4">
            <strong>Đang kiểm tra một thao tác đã gửi</strong>
            <p class="mt-1">{{ pending.sku }} · Lô {{ pending.lot_code }} · Thay đổi {{
                quantity(pending.payload.quantity_change) }}</p>
            <p class="mt-1 break-all text-xs">Mã thao tác: {{ pending.payload.event_key }}</p>
            <p class="mt-2 text-xs">Giữ nguyên nội dung khi gửi lại. Thao tác được lưu trong phiên trình duyệt để tiếp
                tục kiểm tra khi tải lại trang.</p>
            <button type="button" class="fin-btn mt-3" :disabled="busy" @click="checkRecorded()">Kiểm tra kết
                quả</button>
        </div>
        <button v-if="!context && !loading" type="button" class="fin-btn mb-4" :disabled="busy" @click="loadContext">Tải
            lại dữ liệu lô</button>
        <form v-if="context" @submit.prevent="save">
            <div class="adjustment-heading mb-4">
                <strong>{{ context.package.product_name || 'Sản phẩm' }}</strong>
                <p class="fin-note">{{ context.package.sku }} · {{ context.package.variant_name }} · {{
                    context.package.size }} {{ context.package.unit }}</p>
                <p class="mt-2">Lô <strong>{{ context.lot.lot_code }}</strong> · {{ lotStatus[context.lot.status] ||
                    context.lot.status }} · HSD: {{ dateText(context.lot.expires_on) }}</p>
            </div>
            <div class="adjustment-grid mb-5">
                <article><span>Tồn lô hiện tại</span><strong>{{ quantity(context.lot.quantity_on_hand) }}</strong>
                </article>
                <article><span>Tồn vật lý SKU</span><strong>{{ quantity(context.stock.physical) }}</strong></article>
                <article><span>Hàng hợp lệ / đang giữ</span><strong>{{ quantity(context.stock.eligible) }} / {{
                    quantity(context.stock.reserved) }}</strong></article>
            </div>
            <p v-if="!context.lot.eligible" class="fin-note mb-4">Lô này không được tính vào hàng hợp lệ để bán do hạn
                dùng hoặc trạng thái lô.</p>
            <p v-if="!context.stock.consistent" class="fin-warning mb-4">Tồn vật lý chưa khớp tổng tồn lô. Cần đối chiếu
                trước khi điều chỉnh.</p>
            <div class="fin-grid">
                <label>Loại điều chỉnh
                    <select v-model="form.direction" class="fin-input" aria-label="Loại điều chỉnh"
                        :disabled="!!pending || busy">
                        <option value="decrease">Giảm tồn</option>
                        <option value="increase">Tăng tồn</option>
                    </select>
                </label>
                <label>Số lượng {{ form.direction === 'decrease' ? 'giảm' : 'tăng' }}
                    <input v-model="form.quantity" type="number" min="1" max="2147483647" step="1" inputmode="numeric"
                        :aria-label="`Số lượng ${form.direction === 'decrease' ? 'giảm' : 'tăng'}`" class="fin-input"
                        :disabled="!!pending || busy" required />
                </label>
            </div>
            <p v-if="fieldErrors.quantity_change" class="fin-error mt-3">{{ fieldErrors.quantity_change.join(' ') }}</p>
            <label v-if="form.direction === 'decrease'" class="mt-4 block">Nhóm chi phí hao hụt / điều chỉnh
                <select v-model="form.category" class="fin-input" aria-label="Nhóm chi phí hao hụt / điều chỉnh"
                    :disabled="!!pending || busy" required>
                    <option value="">Chọn nhóm chi phí</option>
                    <option v-for="category in context.categories" :key="category.id" :value="Number(category.id)">{{
                        category.name }} ({{ category.code }})</option>
                </select>
            </label>
            <p v-if="form.direction === 'decrease' && !context.categories.length" class="fin-warning mt-3">Chưa có nhóm
                chi phí đang hoạt động. Cần tạo hoặc bật nhóm phù hợp tại Danh mục chi phí.</p>
            <label class="mt-4 block">Lý do điều chỉnh
                <textarea v-model="form.note" rows="3" maxlength="1000" aria-label="Lý do điều chỉnh" class="fin-input"
                    :disabled="!!pending || busy" placeholder="Ví dụ: kiểm kê phát hiện thiếu 2 gói do bao bì rách"
                    required></textarea>
            </label>
            <div v-if="change !== null" class="adjustment-preview mt-5">
                <p><span>Thay đổi số lượng</span><strong>{{ change > 0 ? '+' : '' }}{{ quantity(change) }}</strong></p>
                <p><span>Tồn lô dự kiến sau điều chỉnh</span><strong>{{ quantity(context.lot.quantity_on_hand + change)
                        }}</strong></p>
                <p><span>Tồn vật lý SKU dự kiến</span><strong>{{ quantity(context.stock.physical + change) }}</strong>
                </p>
                <p v-if="change < 0"><span>Chi phí hao hụt dự kiến</span><strong>{{ money(cost) }}</strong></p>
                <p><span>Giá vốn / đơn vị của lô</span><strong>{{ money(context.lot.unit_cost, 4) }}</strong></p>
            </div>
            <p class="fin-note mt-3">Giảm tồn ghi nhận chi phí từ giá vốn lô. Số liệu dự kiến dựa trên lần tải này; máy
                chủ kiểm tra lại khi ghi sổ.</p>
            <ul v-if="problems.length && (form.quantity !== '' || form.note || !context.stock.consistent)"
                class="fin-warning mt-4 list-inside list-disc" aria-live="polite">
                <li v-for="problem in problems" :key="problem">{{ problem }}</li>
            </ul>
            <div class="mt-5 flex flex-wrap justify-between gap-3">
                <button type="button" class="fin-btn" :disabled="busy" @click="loadContext">Tải lại tồn lô</button>
                <div class="flex gap-2">
                    <button type="button" class="fin-btn" :disabled="saving || checking" @click="close">Đóng</button>
                    <button type="submit" class="fin-btn adjustment-submit" :disabled="!canSave">
                        {{ saving ? 'Đang ghi sổ…' : pending ? 'Gửi lại cùng thao tác' : 'Ghi sổ điều chỉnh' }}</button>
                </div>
            </div>
        </form>
    </FinanceDialog>
</template>

<style scoped>
.fin-btn.adjustment-submit {
    background: var(--color-primary, #c62828);
    border-color: var(--color-primary, #c62828);
    color: white;
}

.adjustment-heading {
    padding: 14px 16px;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 12px;
}

.adjustment-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.adjustment-grid article {
    padding: 12px;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 12px;
}

.adjustment-grid span {
    display: block;
    font-size: 12px;
    color: var(--color-text-light, #64748b);
}

.adjustment-grid strong {
    display: block;
    margin-top: 6px;
    font-size: 18px;
}

.adjustment-preview {
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 12px;
    padding: 8px 16px;
}

.adjustment-preview p {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 7px 0;
    font-size: 13px;
}

.adjustment-preview strong {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
    .adjustment-grid {
        grid-template-columns: 1fr;
    }
}
</style>