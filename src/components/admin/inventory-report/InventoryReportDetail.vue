<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import FinanceDialog from "@/components/admin/finance/FinanceDialog.vue";
import FinancePagination from "@/components/admin/finance/FinancePagination.vue";
import service from "@/services/admin/inventory-report.service";
import {
    quantity,
    money,
    dateText,
    errorText,
    documentType,
} from "@/composables/useInventoryReport";
const props = defineProps({ target: { type: Object, required: true } });
defineEmits(["close"]);
const data = ref(null),
    busy = ref(false),
    error = ref(""),
    documentId = ref(null);
let controller,
    seq = 0;
async function load(page = 1) {
    const current = ++seq;
    controller?.abort();
    controller = new AbortController();
    busy.value = true;
    data.value = null;
    error.value = "";
    try {
        const response =
            props.target.kind === "document"
                ? await service.document(props.target.id, controller.signal)
                : await service.journal(
                    props.target.id,
                    { ...props.target.period, page },
                    controller.signal,
                );
        if (current === seq)
            data.value =
                props.target.kind === "document" ? response.data.data : response.data;
    } catch (e) {
        const message = await errorText(e);
        if (current === seq && !controller.signal.aborted) error.value = message;
    } finally {
        if (current === seq) busy.value = false;
    }
}
onMounted(() => load());
onBeforeUnmount(() => {
    seq++;
    controller?.abort();
});
</script>
<template>
    <FinanceDialog :title="target.kind === 'document' ? 'Chứng từ kho gốc' : `Nhật ký ${target.sku}`
        " @close="$emit('close')">
        <p v-if="target.kind === 'journal'" class="fin-note mb-4">
            {{ dateText(target.period.date_from) }} –
            {{ dateText(target.period.date_to) }} · Theo giờ Việt Nam. Lọc theo thời
            điểm biến động lô; mỗi giao dịch hiển thị đầy đủ các lô của nó. Nhật ký cũ
            chưa gắn lô dùng thời điểm giao dịch.
        </p>
        <p v-if="busy" role="status">Đang tải chứng từ…</p>
        <div v-else-if="error" role="alert" class="fin-error">
            {{ error }} <button class="fin-btn" @click="load()">Thử lại</button>
        </div>
        <template v-else-if="data && target.kind === 'document'">
            <dl class="fin-grid mb-5">
                <div>
                    <dt class="fin-note">Số phiếu</dt>
                    <dd class="font-bold break-all">{{ data.document_number }}</dd>
                </div>
                <div>
                    <dt class="fin-note">Loại / trạng thái</dt>
                    <dd>
                        {{ documentType[data.document_type] || data.document_type }} ·
                        {{
                            { posted: "Đã ghi sổ", draft: "Nháp", cancelled: "Đã hủy" }[
                            data.status
                            ] || data.status
                        }}
                    </dd>
                </div>
                <div>
                    <dt class="fin-note">Ngày chứng từ</dt>
                    <dd>{{ dateText(data.document_date) }}</dd>
                </div>
                <div>
                    <dt class="fin-note">Nhà cung cấp / đơn hàng</dt>
                    <dd>
                        {{ data.supplier_name || "—" }}
                        <span v-if="data.order_id"> · Đơn #{{ data.order_id }}</span>
                    </dd>
                </div>
            </dl>
            <p v-if="data.note" class="mb-4 whitespace-pre-wrap">{{ data.note }}</p>
            <div class="fin-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>SKU / sản phẩm</th>
                            <th class="fin-money">Thay đổi</th>
                            <th class="fin-money">Giá vốn dòng phiếu</th>
                            <th>Lô / phân bổ xuất</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in data.items || []" :key="item.id">
                            <td>
                                {{ item.sku }}
                                <p class="fin-note">
                                    {{ item.product_name }} · {{ item.variant_name }}
                                </p>
                            </td>
                            <td class="fin-money">{{ quantity(item.quantity_change) }}</td>
                            <td class="fin-money">{{ money(item.unit_cost) }}</td>
                            <td>
                                <span v-if="item.received_lot">{{
                                    item.received_lot.lot_code
                                }}</span>
                                <p v-for="allocation in item.issue_allocations || []" :key="allocation.id">
                                    Lô #{{ allocation.lot_id }}:
                                    {{ quantity(allocation.quantity) }} ·
                                    {{ money(allocation.cost_amount) }}
                                </p>
                                <span v-if="!item.received_lot && !item.issue_allocations?.length">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="fin-note mt-4">
                Giá vốn dòng phiếu có thể trống. Nhật ký theo lô và phân bổ xuất lưu giá
                trị chi tiết; trang này chỉ xem chứng từ.
            </p>
        </template>
        <template v-else-if="data">
            <p v-if="!data.data.length" class="fin-note py-8 text-center">
                Không có giao dịch trong khoảng ngày này.
            </p>
            <article v-for="entry in data.data" :key="entry.id" class="mb-4 rounded-xl border border-slate-200 p-4">
                <div class="flex flex-wrap justify-between gap-3">
                    <div>
                        <strong>{{ documentType[entry.document_type] || "Nhật ký cũ" }} · #{{
                            entry.id
                        }}</strong>
                        <p class="fin-note">{{ dateText(entry.occurred_at) }}</p>
                    </div>
                    <strong>{{ quantity(entry.quantity_change) }} đơn vị quy cách</strong>
                </div>
                <p v-if="entry.legacy" class="fin-warning mt-3">
                    Nhật ký cũ chưa gắn chứng từ/lô. Không cộng lại vào số dư đã chuyển
                    sang lô.
                </p>
                <button v-if="entry.document_id" class="fin-link mt-2 break-all text-left"
                    @click="documentId = entry.document_id">
                    {{ entry.document_number || `Phiếu #${entry.document_id}` }}
                </button>
                <p v-if="entry.note" class="fin-note mt-2 whitespace-pre-wrap">
                    {{ entry.note }}
                </p>
                <div v-if="entry.movements?.length" class="fin-table-wrap mt-3">
                    <table>
                        <thead>
                            <tr>
                                <th>Lô</th>
                                <th class="fin-money">Trước</th>
                                <th class="fin-money">Thay đổi</th>
                                <th class="fin-money">Sau</th>
                                <th class="fin-money">Biến động giá trị</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in entry.movements" :key="m.id">
                                <td>
                                    {{ m.lot_code }}
                                    <p class="fin-note">{{ dateText(m.occurred_at) }}</p>
                                </td>
                                <td class="fin-money">{{ quantity(m.quantity_before) }}</td>
                                <td class="fin-money">{{ quantity(m.quantity_change) }}</td>
                                <td class="fin-money">{{ quantity(m.quantity_after) }}</td>
                                <td class="fin-money">
                                    {{ m.value_change?.toString().startsWith("-") ? "- " : ""
                                    }}{{
                                        money(
                                            m.value_change === null
                                                ? null
                                                : String(m.value_change).replace(/^-/, ""),
                                        )
                                    }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </article>
            <FinancePagination :meta="data.meta" :loading="busy" @page="load" />
        </template>
    </FinanceDialog>
    <InventoryReportDetail v-if="documentId" :target="{ kind: 'document', id: documentId }"
        @close="documentId = null" />
</template>