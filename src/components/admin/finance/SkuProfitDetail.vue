<script setup>
import { ref, computed, watch } from "vue";
import { useFinance, money, dateTime } from "@/composables/useFinance";
import Dialog from "./FinanceDialog.vue";
import Pager from "./FinancePagination.vue";
import Evidence from "./FinanceEvidence.vue";
const props = defineProps({
    entry: { type: Object, required: true },
    period: { type: Object, required: true },
});
defineEmits(["close"]);
const { auth, allowed, can, data, loading, error, load } =
    useFinance("report.profit.view");
const result = computed(() => data.value?.data);
const expanded = ref(null),
    evidence = ref(null);
function cost4(value) {
    if (value === null || value === undefined) return "Chưa đủ dữ liệu";
    const text = String(value);
    if (!/^\d+(\.\d{1,4})?$/.test(text)) return "Không hợp lệ";
    const [whole, fraction = ""] = text.split(".");
    return (
        BigInt(whole).toLocaleString("vi-VN") + "," + fraction.padEnd(4, "0") + " ₫"
    );
}
async function fetchRows(page = 1) {
    expanded.value = null;
    evidence.value = null;
    await load(`/reports/profit/skus/${props.entry.key}`, {
        date_from: props.period.date_from,
        date_to: props.period.date_to,
        page,
    });
}
watch(
    () => [
        props.entry.key,
        props.period.date_from,
        props.period.date_to,
        auth.user?.id,
        allowed.value,
        can("inventory.view"),
    ],
    () => {
        if (allowed.value) fetchRows();
        else {
            evidence.value = null;
            expanded.value = null;
        }
    },
    { immediate: true },
);
</script>

<template>
    <Dialog :title="`Chi tiết SKU ${entry.sku || 'chưa xác định'}`" @close="$emit('close')">
        <p v-if="!allowed" class="fin-error" role="alert">
            Bạn không có quyền xem báo cáo.
        </p>
        <template v-else>
            <p class="fin-note">
                {{ entry.product_name || "Thiếu tên lưu lúc mua" }} ·
                {{ entry.variant_name || "—" }} · {{ entry.package_label }}
            </p>
            <p class="fin-note">{{ period.date_from }} → {{ period.date_to }}</p>
            <p v-if="error" class="fin-error" role="alert">{{ error }}</p>
            <p v-if="loading" class="py-8 text-center">
                Đang tải các dòng bán hàng...
            </p>
            <template v-else-if="result">
                <div class="my-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span>Doanh thu:
                        <strong>{{ money(result.summary.net_sales) }}</strong></span>
                    <span>Giá vốn:
                        <strong>{{ money(result.summary.cost_total) }}</strong></span>
                    <span>Lãi gộp:
                        <strong>{{ money(result.summary.gross_profit) }}</strong></span>
                </div>
                <div class="fin-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Đơn hàng / Dòng</th>
                                <th>Hoàn thành</th>
                                <th class="fin-money">Số lượng</th>
                                <th class="fin-money">Đơn giá lúc mua</th>
                                <th class="fin-money">Trước giảm</th>
                                <th class="fin-money">Giảm giá</th>
                                <th class="fin-money">Doanh thu</th>
                                <th class="fin-money">Giá vốn</th>
                                <th class="fin-money">Lãi gộp</th>
                                <th>Đối chiếu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="row in result.data" :key="row.id">
                                <tr>
                                    <td>
                                        <button v-if="can('order.view')" class="fin-link"
                                            @click="evidence = { kind: 'orders', id: row.order_id }">
                                            {{ row.code }}</button><span v-else>{{ row.code }}</span>
                                        <p class="fin-note">Dòng #{{ row.id }}</p>
                                    </td>
                                    <td class="whitespace-nowrap">
                                        {{ dateTime(row.completed_at) }}
                                    </td>
                                    <td class="fin-money">{{ row.quantity ?? "—" }}</td>
                                    <td class="fin-money">{{ money(row.price) }}</td>
                                    <td class="fin-money">{{ money(row.gross_sales) }}</td>
                                    <td class="fin-money">{{ money(row.discount) }}</td>
                                    <td class="fin-money">{{ money(row.net_sales) }}</td>
                                    <td class="fin-money">{{ money(row.cost_total) }}</td>
                                    <td class="fin-money" :class="row.gross_profit?.startsWith('-') ? 'text-red-500' : ''
                                        ">
                                        {{ money(row.gross_profit) }}
                                    </td>
                                    <td class="min-w-44">
                                        <span class="fin-badge">{{ row.status_label }}</span>
                                        <button v-if="result.can_view_lots && can('inventory.view')" type="button"
                                            class="fin-link mt-2 block" :aria-expanded="expanded === row.id"
                                            @click="expanded = expanded === row.id ? null : row.id">
                                            {{ expanded === row.id ? "Đóng lô xuất" : "Xem lô xuất" }}
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="
                                    expanded === row.id &&
                                    result.can_view_lots &&
                                    can('inventory.view')
                                ">
                                    <td colspan="10">
                                        <p class="mb-3 text-sm font-semibold" :class="row.allocation_status === 'Khớp giá vốn đã chốt'
                                            ? 'text-emerald-600'
                                            : 'text-amber-600'
                                            ">
                                            {{ row.allocation_status }}
                                        </p>
                                        <table v-if="row.allocations?.length">
                                            <thead>
                                                <tr>
                                                    <th>Lô xuất</th>
                                                    <th>Phiếu xuất</th>
                                                    <th class="fin-money">Số lượng</th>
                                                    <th class="fin-money">Đơn giá vốn lô</th>
                                                    <th class="fin-money">Thành tiền vốn</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="lot in row.allocations" :key="lot.id">
                                                    <td>{{ lot.lot_code || "—" }}</td>
                                                    <td>{{ lot.document_number || "—" }}</td>
                                                    <td class="fin-money">{{ lot.quantity }}</td>
                                                    <td class="fin-money">{{ cost4(lot.unit_cost) }}</td>
                                                    <td class="fin-money">
                                                        {{ money(lot.cost_amount) }}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </template>
                            <tr v-if="!result.data.length">
                                <td colspan="10">Không có dòng bán hàng ở trang này.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Pager :meta="result.meta" :loading="loading" @page="fetchRows($event)" />
            </template>
            <Evidence v-if="evidence && can('order.view')" v-bind="evidence" @close="evidence = null" />
        </template>
    </Dialog>
</template>