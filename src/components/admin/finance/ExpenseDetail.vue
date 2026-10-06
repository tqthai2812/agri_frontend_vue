<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import api from "@/services/admin/finance.service";
import {
    money,
    dateTime,
    statusLabel,
    sourceLabel,
    paymentLabel,
    errorText,
} from "@/composables/useFinance";
import Dialog from "./FinanceDialog.vue";
import Evidence from "./FinanceEvidence.vue";
const props = defineProps({ id: Number });
const emit = defineEmits(["close", "action", "open"]);
const auth = useAuthStore(),
    data = ref(null),
    events = ref([]),
    error = ref(""),
    evidence = ref(null);
const controller = new AbortController();
const fieldNames = {
    amount: "Số tiền",
    incurred_at: "Ngày phát sinh",
    paid_at: "Ngày trả tiền",
    description: "Nội dung",
    status: "Trạng thái",
    category_id: "Danh mục",
    order_id: "Đơn hàng",
    payment_id: "Khoản thanh toán",
    inventory_document_id: "Phiếu kho",
};
function changes(ev) {
    return Object.keys(fieldNames)
        .filter(
            (k) =>
                String(ev.changes?.before?.[k] ?? "") !==
                String(ev.changes?.after?.[k] ?? ""),
        )
        .map((k) => ({
            name: fieldNames[k],
            before: value(k, ev.changes?.before?.[k]),
            after: value(k, ev.changes?.after?.[k]),
        }));
}
function value(k, v) {
    if (v === null || v === undefined) return "—";
    if (k === "amount") return money(v);
    if (k.endsWith("_at")) return dateTime(v);
    if (k === "status")
        return { draft: "Nháp", posted: "Đã ghi sổ", cancelled: "Đã hủy" }[v] || v;
    if (k.endsWith("_id")) return "#" + v;
    return v;
}
const actions = {
    create: "Tạo nháp",
    update: "Sửa nháp",
    post: "Ghi sổ",
    cancel: "Hủy nháp",
    payment: "Cập nhật trả tiền",
    reverse: "Đảo chi phí",
};
onMounted(async () => {
    try {
        const r = await api.get("/expenses/" + props.id, {}, controller.signal);
        data.value = r.data.data;
        events.value = r.data.events || [];
    } catch (e) {
        if (e.name !== "AbortError" && e.code !== "ERR_CANCELED")
            error.value = await errorText(e);
    }
});
onBeforeUnmount(() => controller.abort());
</script>
<template>
    <Dialog title="Chi tiết khoản chi" @close="$emit('close')">
        <p v-if="error" class="fin-error" role="alert">{{ error }}</p>
        <p v-else-if="!data">Đang tải...</p>
        <template v-else>
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2>{{ data.code }} · {{ data.category?.name }}</h2>
                    <p class="fin-note mt-1">
                        {{ statusLabel(data) }} · {{ sourceLabel(data.source) }} ·
                        {{ paymentLabel(data.payment_state) }}
                    </p>
                </div>
                <strong class="text-2xl">{{ money(data.amount) }}</strong>
            </div>
            <p class="my-5 whitespace-pre-wrap text-sm">{{ data.description }}</p>
            <dl class="fin-grid text-sm">
                <div>
                    <dt class="fin-note">Ngày phát sinh</dt>
                    <dd>{{ dateTime(data.incurred_at) }}</dd>
                </div>
                <div>
                    <dt class="fin-note">Ngày đã trả tiền</dt>
                    <dd>{{ dateTime(data.paid_at) }}</dd>
                </div>
                <div>
                    <dt class="fin-note">Người tạo</dt>
                    <dd>{{ data.creator?.name || "—" }}</dd>
                </div>
            </dl>
            <div class="my-5 flex flex-wrap gap-3">
                <button v-if="data.order_id && auth.hasPermission('order.view')" class="fin-link"
                    @click="evidence = { kind: 'orders', id: data.order_id }">
                    {{ data.order_code }}</button><button v-if="
                        data.inventory_document_id && auth.hasPermission('inventory.view')
                    " class="fin-link" @click="
                        evidence = {
                            kind: 'inventory-documents',
                            id: data.inventory_document_id,
                        }
                        ">
                    {{ data.inventory_document_number }}</button><button v-if="data.reversal_id" class="fin-link"
                    @click="$emit('open', data.reversal_id)">
                    Xem dòng đảo</button><button v-if="data.reverses_expense_id" class="fin-link"
                    @click="$emit('open', data.reverses_expense_id)">
                    Xem khoản gốc
                </button>
            </div>
            <p v-if="data.source === 'inventory'" class="fin-warning">
                Khoản này được tạo khi ghi giảm tồn kho, không phải khoản tiền chờ chi.
                Việc sửa sai phải đối chiếu chứng từ kho; trang này không tự đảo giá trị
                hay phục hồi hàng.
            </p>
            <p v-if="data.is_reversed || data.reverses_expense_id" class="fin-note">
                Báo cáo cộng cả khoản gốc và dòng đảo theo ngày phát sinh riêng của từng
                dòng. Đảo chi phí không có nghĩa đã nhận lại tiền.
            </p>
            <h2 class="mt-6">Lịch sử thao tác</h2>
            <p v-if="!events.length" class="fin-note mt-2">
                Không có lịch sử thao tác từ module chi phí mới. Xem chứng từ nguồn nếu
                khoản chi phát sinh từ kho.
            </p>
            <ol class="mt-3 space-y-3">
                <li v-for="(ev, i) in events" :key="i" class="rounded-lg border border-border p-3 text-xs">
                    <strong>{{ actions[ev.action] || ev.action }}</strong> ·
                    {{ ev.actor_name || "Tài khoản đã xóa" }} ·
                    {{ dateTime(ev.created_at) }}
                    <p v-if="ev.changes?.reason" class="mt-1 whitespace-pre-wrap">
                        {{ ev.changes.reason }}
                    </p>
                    <details class="mt-2">
                        <summary class="cursor-pointer">Dữ liệu trước / sau</summary>
                        <div class="fin-table-wrap mt-2">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Thông tin</th>
                                        <th>Trước</th>
                                        <th>Sau</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in changes(ev)" :key="row.name">
                                        <td>{{ row.name }}</td>
                                        <td class="whitespace-pre-wrap">{{ row.before }}</td>
                                        <td class="whitespace-pre-wrap">{{ row.after }}</td>
                                    </tr>
                                    <tr v-if="!changes(ev).length">
                                        <td colspan="3">
                                            Giữ nguyên khoản gốc; xem chứng từ đảo liên kết.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </details>
                </li>
            </ol>
            <div class="fin-actions">
                <button v-if="data.can_edit" class="fin-btn" @click="$emit('action', 'edit', data)">
                    Sửa nháp</button><button v-if="data.can_cancel" class="fin-btn fin-danger"
                    @click="$emit('action', 'cancel', data)">
                    Hủy nháp</button><button v-if="data.can_post" class="fin-btn fin-primary"
                    @click="$emit('action', 'post', data)">
                    Ghi sổ</button><button v-if="data.can_pay" class="fin-btn"
                    @click="$emit('action', 'payment', data)">
                    Cập nhật trả tiền</button><button v-if="data.can_reverse" class="fin-btn fin-danger"
                    @click="$emit('action', 'reverse', data)">
                    Đảo chi phí
                </button>
            </div>
        </template>
    </Dialog>
    <Evidence v-if="evidence" v-bind="evidence" @close="evidence = null" />
</template>