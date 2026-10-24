<script setup>
import {
    documentTypes,
    documentStatuses,
    lotStatuses,
    money,
    totalValue,
    lineValue,
} from "@/utils/inventoryDocument";
defineProps({ document: { type: Object, required: true } });
</script>
<template>
    <div class="doc-stack">
        <dl class="doc-detail-grid">
            <div>
                <dt>Loại phiếu</dt>
                <dd>
                    {{ documentTypes[document.document_type] || document.document_type }}
                </dd>
            </div>
            <div>
                <dt>Trạng thái</dt>
                <dd>
                    <span class="doc-badge" :class="document.status">{{
                        documentStatuses[document.status] || document.status
                    }}</span>
                </dd>
            </div>
            <div>
                <dt>Ngày chứng từ</dt>
                <dd>{{ document.document_date }}</dd>
            </div>
            <div>
                <dt>Nhà cung cấp</dt>
                <dd>{{ document.supplier_name || "—" }}</dd>
            </div>
            <div>
                <dt>Người lập</dt>
                <dd>{{ document.creator?.name || "—" }}</dd>
            </div>
            <div>
                <dt>Người ghi sổ</dt>
                <dd>{{ document.poster?.name || "—" }}</dd>
            </div>
            <div>
                <dt>Thời điểm ghi sổ</dt>
                <dd>{{ document.posted_at || "—" }}</dd>
            </div>
            <div v-if="document.order_id">
                <dt>Đơn hàng liên quan</dt>
                <dd>#{{ document.order_id }}</dd>
            </div>
        </dl>
        <p v-if="document.note" class="doc-note">{{ document.note }}</p>
        <div class="doc-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Dòng</th>
                        <th>Sản phẩm / SKU</th>
                        <th>Quy cách</th>
                        <th class="doc-number">Biến động</th>
                        <th class="doc-number">Giá vốn đơn vị</th>
                        <th class="doc-number">Giá trị theo dòng</th>
                        <th>Lô nhập</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in document.items" :key="item.id">
                        <td>{{ item.line_number || index + 1 }}</td>
                        <td>
                            <strong>{{ item.product_name || "—" }}</strong><small>{{ item.sku }} · {{ item.variant_name
                            }}</small><small v-if="item.note" class="doc-note">{{ item.note }}</small>
                        </td>
                        <td>{{ item.size }} {{ item.unit }}</td>
                        <td class="doc-number">
                            {{ item.quantity_change > 0 ? "+" : ""
                            }}{{ item.quantity_change }}
                        </td>
                        <td class="doc-number">{{ money(item.unit_cost) }}</td>
                        <td class="doc-number">{{ money(lineValue(item)) }}</td>
                        <td v-if="item.received_lot">
                            <strong>{{ item.received_lot.lot_code }}</strong><small>{{
                                lotStatuses[item.received_lot.status] }}</small><small>NSX: {{
                                    item.received_lot.manufactured_on || "—" }}</small><small>HSD: {{
                                    item.received_lot.expires_on || "—" }}</small>
                        </td>
                        <td v-else>—</td>
                    </tr>
                    <tr v-if="!document.items?.length">
                        <td colspan="7" class="doc-empty">Phiếu không có dòng hàng.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="document.document_type === 'supplier_receipt'" class="doc-total">
            <span>Tổng giá trị nhập</span><strong>{{ money(totalValue(document.items)) }}</strong>
        </div>
        <p v-if="document.status === 'posted'" class="doc-muted">
            Phiếu đã ghi sổ. Sai lệch tồn kho được xử lý bằng thao tác điều chỉnh có
            lý do.
        </p>
        <p v-else-if="document.status === 'draft'" class="doc-muted">
            Phiếu nháp chưa làm thay đổi tồn kho.
        </p>
    </div>
</template>