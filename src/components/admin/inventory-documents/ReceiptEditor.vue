<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import api from "@/services/admin/inventory-document.service";
import {
    today,
    money,
    lineValue,
    totalValue,
    errorText,
} from "@/utils/inventoryDocument";
const props = defineProps({
    form: { type: Object, required: true },
    locked: Boolean,
    supplierName: String,
});
const suppliers = ref([]),
    supplierError = ref(""),
    supplierLoading = ref(false);
const search = ref(""),
    packages = ref([]),
    packageMeta = ref({ current_page: 1, last_page: 1 }),
    loading = ref(false),
    error = ref("");
let alive = true,
    version = 0;
async function loadSuppliers() {
    supplierLoading.value = true;
    supplierError.value = "";
    try {
        const all = [];
        for (let page = 1; ; page++) {
            const data = (await api.suppliers({ page, per_page: 100 })).data;
            if (!alive) return;
            all.push(
                ...data.data.filter((item) => [true, 1, "1"].includes(item.is_active)),
            );
            if (page >= (data.meta?.last_page || data.last_page || 1)) break;
            if (page >= 100)
                throw new Error(
                    "Chưa tải hết danh sách nhà cung cấp. Vui lòng liên hệ quản trị viên.",
                );
        }
        suppliers.value = all;
    } catch (e) {
        if (alive) supplierError.value = errorText(e);
    } finally {
        if (alive) supplierLoading.value = false;
    }
}
async function find(page = 1) {
    const current = ++version;
    loading.value = true;
    error.value = "";
    try {
        const data = (
            await api.packages({ search: search.value.trim(), page, per_page: 8 })
        ).data;
        if (!alive || current !== version) return;
        packages.value = data.data;
        packageMeta.value = data.meta;
    } catch (e) {
        if (alive && current === version) error.value = errorText(e);
    } finally {
        if (alive && current === version) loading.value = false;
    }
}
function add(item) {
    if (props.locked || props.form.items.length >= 100) return;
    props.form.items.push({
        package_id: item.id,
        product_name: item.product?.name,
        variant_name: item.variant?.name,
        sku: item.sku,
        size: item.size,
        unit: item.unit,
        quantity_change: 1,
        unit_cost: "",
        note: "",
    });
}
onMounted(loadSuppliers);
onBeforeUnmount(() => {
    alive = false;
    ++version;
});
</script>
<template>
    <div class="doc-stack">
        <fieldset :disabled="locked" class="doc-stack">
            <div class="doc-grid">
                <label>Nhà cung cấp *
                    <select v-model="form.supplier_id" :disabled="supplierLoading">
                        <option value="">Chọn nhà cung cấp</option>
                        <option v-if="
                            form.supplier_id &&
                            !suppliers.some(
                                (s) => Number(s.id) === Number(form.supplier_id),
                            )
                        " :value="form.supplier_id">
                            {{ supplierName || `Nhà cung cấp #${form.supplier_id}` }} — cần
                            kiểm tra hoạt động
                        </option>
                        <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                            {{ supplier.name }}
                        </option>
                    </select>
                </label>
                <label>Ngày chứng từ *<input v-model="form.document_date" type="date" :max="today()" required /></label>
            </div>
            <p v-if="supplierLoading" class="doc-muted">Đang tải nhà cung cấp…</p>
            <div v-if="supplierError" class="doc-error" role="alert">
                {{ supplierError }}
                <button class="doc-btn" type="button" @click="loadSuppliers">
                    Tải lại nhà cung cấp
                </button>
            </div>
            <label>Ghi chú phiếu<textarea v-model="form.note" rows="2" maxlength="10000"
                    placeholder="Số hóa đơn, thông tin giao nhận…" />
            </label>
            <section class="doc-picker">
                <h3>Thêm dòng hàng</h3>
                <div class="doc-toolbar">
                    <input v-model="search" aria-label="Tìm SKU hoặc tên sản phẩm"
                        placeholder="Tìm SKU hoặc tên sản phẩm" maxlength="255" @keydown.enter.prevent="find(1)" />
                    <button type="button" class="doc-btn" :disabled="loading" @click="find(1)">
                        Tìm sản phẩm
                    </button>
                </div>
                <p v-if="error" class="doc-error" role="alert">{{ error }}</p>
                <p v-if="loading" class="doc-muted">Đang tìm…</p>
                <ul v-else class="doc-picker-results">
                    <li v-for="item in packages" :key="item.id">
                        <div>
                            <strong>{{ item.product?.name }}</strong><small>{{ item.sku }} · {{ item.variant?.name }} ·
                                {{ item.size }}
                                {{ item.unit }}</small>
                        </div>
                        <button type="button" class="doc-btn" :disabled="form.items.length >= 100"
                            :aria-label="`Thêm ${item.sku}`" @click="add(item)">
                            Thêm
                        </button>
                    </li>
                </ul>
                <p v-if="!loading && packageMeta.total === 0" class="doc-muted">
                    Không tìm thấy SKU phù hợp.
                </p>
                <div v-if="packageMeta.last_page > 1" class="doc-pagination">
                    <button type="button" class="doc-btn" :disabled="loading || packageMeta.current_page <= 1"
                        @click="find(packageMeta.current_page - 1)">
                        SKU trước
                    </button>
                    <span>{{ packageMeta.current_page }} / {{ packageMeta.last_page }}</span>
                    <button type="button" class="doc-btn" :disabled="loading || packageMeta.current_page >= packageMeta.last_page
                        " @click="find(packageMeta.current_page + 1)">
                        SKU tiếp
                    </button>
                </div>
            </section>
            <div class="doc-section-title">
                <h3>Dòng hàng ({{ form.items.length }}/100)</h3>
                <span class="doc-muted">Một dòng cho mỗi lô nhập</span>
            </div>
            <p v-if="!form.items.length" class="doc-empty">
                Tìm sản phẩm phía trên và bấm Thêm.
            </p>
            <article v-for="(item, index) in form.items" :key="index" class="doc-line">
                <header>
                    <div>
                        <strong>{{ index + 1 }}. {{ item.product_name }}</strong><small>{{ item.sku }} · {{
                            item.variant_name }} · {{ item.size }}
                            {{ item.unit }}</small>
                    </div>
                    <button type="button" class="doc-btn doc-danger" :aria-label="`Bỏ dòng ${index + 1}`"
                        @click="form.items.splice(index, 1)">
                        Bỏ dòng
                    </button>
                </header>
                <div class="doc-grid doc-grid-three">
                    <label :for="`receipt-qty-${index}`">Số lượng nhập *<input :id="`receipt-qty-${index}`"
                            v-model="item.quantity_change" type="number" min="1" max="2147483647" step="1" /></label>
                    <label :for="`receipt-cost-${index}`">Giá vốn đơn vị (₫)<input :id="`receipt-cost-${index}`"
                            v-model="item.unit_cost" inputmode="decimal" maxlength="13"
                            placeholder="Để trống nếu chưa biết" /></label>
                    <div class="doc-line-value">
                        <span>Thành tiền</span><strong>{{ money(lineValue(item)) }}</strong>
                    </div>
                </div>
                <label :for="`receipt-note-${index}`">Ghi chú dòng<input :id="`receipt-note-${index}`"
                        v-model="item.note" maxlength="10000" /></label>
            </article>
        </fieldset>
        <div class="doc-total">
            <span>Tổng giá trị nhập</span><strong>{{ money(totalValue(form.items)) }}</strong>
        </div>
        <p class="doc-muted">
            Lưu nháp chưa thay đổi tồn kho. Dòng chưa có giá vốn sẽ hiển thị “—”.
        </p>
    </div>
</template>