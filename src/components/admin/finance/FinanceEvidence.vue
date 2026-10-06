<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import api from "@/services/admin/finance.service";
import { money, dateTime, errorText } from "@/composables/useFinance";
import FinanceDialog from "./FinanceDialog.vue";
const props = defineProps({ kind: String, id: Number });
defineEmits(["close"]);
const data = ref(null),
    error = ref("");
const abort = new AbortController();
onMounted(async () => {
    try {
        const r = await api.get(
            `/finance/evidence/${props.kind}/${props.id}`,
            {},
            abort.signal,
        );
        data.value = r.data.data;
    } catch (e) {
        if (e.name !== "AbortError" && e.code !== "ERR_CANCELED")
            error.value = await errorText(e);
    }
});
onBeforeUnmount(() => abort.abort());
</script>
<template>
    <FinanceDialog title="Chứng từ đối chiếu" @close="$emit('close')">
        <p v-if="error" class="fin-error" role="alert">{{ error }}</p>
        <p v-else-if="!data">Đang tải chứng từ...</p>
        <template v-else>
            <h2>{{ data.code || data.document_number }}</h2>
            <p class="fin-note">
                {{ data.order_status || data.status }} ·
                {{
                    kind === "orders" ? dateTime(data.completed_at) : data.document_date
                }}
            </p>
            <p v-if="data.measure?.issues?.length" class="fin-warning mt-3">
                {{ data.measure.issues.join("; ") }}
            </p>
            <div class="fin-table-wrap mt-4">
                <table>
                    <thead>
                        <tr>
                            <th>SKU / Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>
                                {{ kind === "orders" ? "Đơn giá bán" : "Giá nhập dòng phiếu" }}
                            </th>
                            <th>
                                {{ kind === "orders" ? "Doanh thu sau giảm" : "Ghi chú" }}
                            </th>
                            <th v-if="kind === 'orders'">Giá vốn</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="i in data.items" :key="i.id">
                            <td>{{ i.sku }}<br />{{ i.product_name }}</td>
                            <td>{{ i.quantity ?? i.quantity_change }}</td>
                            <td class="fin-money">{{ money(i.price ?? i.unit_cost) }}</td>
                            <td>
                                {{ kind === "orders" ? money(i.net_sales_amount) : i.note }}
                            </td>
                            <td v-if="kind === 'orders'" class="fin-money">
                                {{ money(i.cost_total) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <template v-if="data.payments">
                <h2 class="mt-6">Các lần thanh toán</h2>
                <div class="fin-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã giao dịch</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Số tiền</th>
                                <th>Ngày thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in data.payments" :key="p.id">
                                <td>{{ p.transaction_id || "—" }}</td>
                                <td>{{ p.payment_method }}</td>
                                <td>{{ p.status }}</td>
                                <td class="fin-money">{{ money(p.amount) }}</td>
                                <td>{{ dateTime(p.paid_at) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
            <p v-if="data.note" class="mt-4 whitespace-pre-wrap text-sm">
                {{ data.note }}
            </p>
        </template>
    </FinanceDialog>
</template>