<script setup>
import { computed } from "vue";
import { formatPrintDate, formatPrintMoney } from "@/utils/orderPrint";
import "@/assets/order-print.css";

const props = defineProps({ data: { type: Object, required: true } });
const picking = computed(() => props.data.type === "picking");
const status = computed(() => ({ confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Đã giao hàng", cancelled: "Đã hủy", pending: "Chờ xác nhận" }[props.data.order_status] || "Chưa xác định"));
const paymentText = computed(() => ({
    paid: "Đã thanh toán",
    cod_collect: "Thu COD khi giao hàng",
    cod_confirmation: "Chờ xác nhận khoản COD đã thu",
    unpaid_online: "Chưa thanh toán VNPAY",
    review: "Cần đối chiếu thanh toán",
}[props.data.payment.state] || "Chưa xác định"));

function packageLabel(item) {
    const size = item.size === null || item.size === undefined ? "" : String(item.size).replace(/\.0+$/, "");
    const unit = ({ l: "lít", piece: "cái" })[item.unit] || item.unit || "";
    return [size, unit].filter(Boolean).join(" ");
}
</script>

<template>
    <article class="order-slip">
        <header class="order-slip-brand">
            <div>
                <strong class="order-slip-store">{{ data.store.name }}</strong>
                <p v-if="data.store.address">{{ data.store.address }}</p>
                <p v-if="data.store.phone">Điện thoại: {{ data.store.phone }}</p>
            </div>
            <div class="order-slip-id">
                <strong>{{ data.code }}</strong>
                <span>{{ status }}</span>
                <span v-if="data.order_status === 'completed'" class="order-slip-copy">Bản in lại</span>
            </div>
        </header>

        <h1>{{ picking ? 'PHIẾU SOẠN HÀNG' : 'PHIẾU GIAO HÀNG' }}</h1>
        <div class="order-slip-meta">
            <p><span>Ngày đặt:</span> {{ formatPrintDate(data.created_at) }}</p>
            <p><span>Ngày in:</span> {{ formatPrintDate(data.generated_at) }}</p>
        </div>

        <section class="order-slip-receiver">
            <div><span>Người nhận:</span><strong>{{ data.receiver.name || '—' }}</strong></div>
            <div><span>Điện thoại:</span><strong>{{ data.receiver.phone || '—' }}</strong></div>
            <div class="order-slip-address"><span>Địa chỉ:</span>
                <p>{{ data.receiver.address || '—' }}</p>
            </div>
            <div class="order-slip-address"><span>Giao hàng:</span>
                <p>{{ data.delivery_method || '—' }}</p>
            </div>
        </section>

        <div class="order-slip-payment" :class="{ 'order-slip-paid': data.payment.state === 'paid' }">
            <div><span>{{ data.payment.method }}</span><strong>{{ paymentText }}</strong></div>
            <div v-if="!picking" class="order-slip-collect">
                <span>Cần thu khi giao</span><strong>{{ formatPrintMoney(data.payment.collect_amount) }}</strong>
            </div>
        </div>

        <p v-for="note in data.notes" :key="note" class="order-slip-note">{{ note }}</p>

        <table v-if="picking" class="order-slip-table order-slip-picking">
            <thead>
                <tr>
                    <th class="order-slip-center order-slip-index">STT</th>
                    <th>Sản phẩm / Quy cách</th>
                    <th>SKU</th>
                    <th class="order-slip-center">SL</th>
                    <th>Lô xuất / Hạn dùng</th>
                    <th class="order-slip-center">Kiểm</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in data.items" :key="item.id">
                    <td class="order-slip-center">{{ index + 1 }}</td>
                    <td><strong>{{ item.product_name || 'Chưa lưu tên sản phẩm' }}</strong>
                        <small>{{ [item.variant_name, packageLabel(item)].filter(Boolean).join(' · ') }}</small>
                    </td>
                    <td class="order-slip-sku">{{ item.sku || '—' }}</td>
                    <td class="order-slip-center"><strong>{{ item.quantity }}</strong></td>
                    <td>
                        <div v-for="(lot, lotIndex) in item.lots"
                            :key="`${lot.document_number}:${lot.lot_code}:${lotIndex}`" class="order-slip-lot">
                            <strong>{{ lot.lot_code }} · SL {{ lot.quantity }}</strong>
                            <small>HSD: {{ lot.expires_on ? formatPrintDate(lot.expires_on, false) :
                                'Không ghi hạn dùng' }}</small>
                            <small>{{ lot.document_number }}</small>
                        </div>
                        <small v-if="!item.lots.length">{{ data.stock_state === 'not_issued' ? 'Chưa chốt lô xuất' :
                            'Chưa có dữ liệu lô xuất' }}</small>
                    </td>
                    <td class="order-slip-center"><span class="order-slip-check" /></td>
                </tr>
            </tbody>
        </table>

        <table v-else class="order-slip-table order-slip-delivery">
            <thead>
                <tr>
                    <th class="order-slip-center order-slip-index">STT</th>
                    <th>Sản phẩm / Quy cách / SKU</th>
                    <th class="order-slip-center">SL</th>
                    <th class="order-slip-right">Đơn giá</th>
                    <th class="order-slip-right">Tiền hàng</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in data.items" :key="item.id">
                    <td class="order-slip-center">{{ index + 1 }}</td>
                    <td><strong>{{ item.product_name || 'Chưa lưu tên sản phẩm' }}</strong>
                        <small>{{ [item.variant_name, packageLabel(item)].filter(Boolean).join(' · ') }}</small>
                        <small class="order-slip-sku">{{ item.sku || '—' }}</small>
                    </td>
                    <td class="order-slip-center">{{ item.quantity }}</td>
                    <td class="order-slip-right">{{ formatPrintMoney(item.price) }}</td>
                    <td class="order-slip-right"><strong>{{ formatPrintMoney(item.subtotal) }}</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="order-slip-summary">
            <p class="order-slip-quantity">Tổng số lượng: <strong>{{ data.total_quantity }}</strong></p>
            <dl v-if="!picking">
                <div>
                    <dt>Tiền hàng</dt>
                    <dd>{{ formatPrintMoney(data.totals.gross) }}</dd>
                </div>
                <div>
                    <dt>Giảm giá</dt>
                    <dd>{{ formatPrintMoney(data.totals.discount) }}</dd>
                </div>
                <div>
                    <dt>Phí giao hàng</dt>
                    <dd>{{ formatPrintMoney(data.totals.shipping) }}</dd>
                </div>
                <div class="order-slip-total">
                    <dt>Tổng đơn hàng</dt>
                    <dd>{{ formatPrintMoney(data.totals.total) }}</dd>
                </div>
            </dl>
        </div>

        <section v-if="data.note" class="order-slip-customer-note"><strong>Ghi chú giao hàng:</strong>
            <p>{{ data.note }}</p>
        </section>
        <footer class="order-slip-signatures">
            <div><strong>{{ picking ? 'Người soạn hàng' : 'Người giao hàng' }}</strong><small>Ký, ghi rõ họ tên</small>
            </div>
            <div><strong>{{ picking ? 'Người kiểm tra' : 'Người nhận hàng' }}</strong><small>Ký, ghi rõ họ tên</small>
            </div>
        </footer>
    </article>
</template>