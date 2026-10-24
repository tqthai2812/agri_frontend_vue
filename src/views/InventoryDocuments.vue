<script setup>
import { computed } from "vue";
import { useInventoryDocuments } from "@/composables/useInventoryDocuments";
import { documentTypes, documentStatuses } from "@/utils/inventoryDocument";
import DocumentDialog from "@/components/admin/inventory-documents/DocumentDialog.vue";
import DocumentDetail from "@/components/admin/inventory-documents/DocumentDetail.vue";
import ReceiptEditor from "@/components/admin/inventory-documents/ReceiptEditor.vue";
import ReceiptPostForm from "@/components/admin/inventory-documents/ReceiptPostForm.vue";
import ReceiptPending from "@/components/admin/inventory-documents/ReceiptPending.vue";
import "@/components/admin/inventory-documents/documents.css";
const {
    canCreate,
    canUpdate,
    rows,
    meta,
    filters,
    loading,
    busy,
    locked,
    error,
    errors,
    message,
    mode,
    document,
    form,
    lots,
    pending,
    recovery,
    recoveredDocument,
    editable,
    load,
    create,
    open,
    close,
    save,
    post,
    cancel,
    recover,
    retry,
    acceptCurrent,
} = useInventoryDocuments();
const title = computed(() =>
    mode.value === "edit"
        ? document.value
            ? "Sửa phiếu nhập nháp"
            : "Lập phiếu nhập nhà cung cấp"
        : mode.value === "post"
            ? "Ghi sổ phiếu nhập"
            : document.value?.document_number || "Chi tiết phiếu",
);
const pendingProps = computed(() => ({
    pending: pending.value,
    recovery: recovery.value,
    busy: busy.value,
    canRetry:
        pending.value?.kind === "create" ? canCreate.value : canUpdate.value,
    recovered: !!recoveredDocument.value,
}));
function resetFilters() {
    Object.keys(filters).forEach((key) => (filters[key] = ""));
    load(1);
}
</script>
<template>
    <div class="stock-docs">
        <header class="doc-page-header">
            <div>
                <RouterLink class="doc-back" :to="{ name: 'admin-inventory' }">← Hàng tồn kho</RouterLink>
                <h1>Phiếu kho</h1>
                <p class="doc-muted">
                    Lập phiếu nhập, theo dõi chứng từ và xem các lần ghi sổ.
                </p>
            </div>
            <button v-if="canCreate" type="button" class="doc-btn doc-primary" :disabled="locked" @click="create">
                + Lập phiếu nhập
            </button>
        </header>
        <div v-if="message" class="doc-success" role="status">{{ message }}</div>
        <div v-if="error && !mode" class="doc-error" role="alert">
            {{ error }}
            <ul v-if="errors.length">
                <li v-for="item in errors" :key="item">{{ item }}</li>
            </ul>
        </div>
        <ReceiptPending v-if="!mode" v-bind="pendingProps" @recover="recover" @retry="retry" @accept="acceptCurrent" />
        <section class="doc-card">
            <form class="doc-filters" @submit.prevent="load(1)">
                <label class="doc-search">Tìm phiếu<input v-model="filters.search" maxlength="255"
                        placeholder="Mã phiếu, nhà cung cấp, ghi chú" /></label>
                <label>Loại phiếu<select v-model="filters.document_type" aria-label="Loại phiếu">
                        <option value="">Tất cả loại phiếu</option>
                        <option v-for="(label, key) in documentTypes" :key="key" :value="key">
                            {{ label }}
                        </option>
                    </select></label>
                <label>Trạng thái<select v-model="filters.status" aria-label="Trạng thái">
                        <option value="">Tất cả trạng thái</option>
                        <option v-for="(label, key) in documentStatuses" :key="key" :value="key">
                            {{ label }}
                        </option>
                    </select></label>
                <label>Từ ngày<input v-model="filters.date_from" type="date" /></label><label>Đến ngày<input
                        v-model="filters.date_to" type="date" /></label>
                <div class="doc-actions">
                    <button type="submit" class="doc-btn" :disabled="loading">
                        Lọc phiếu</button><button type="button" class="doc-btn" :disabled="loading"
                        @click="resetFilters">
                        Đặt lại
                    </button>
                </div>
            </form>
            <div class="doc-scroll" :aria-busy="loading">
                <table>
                    <thead>
                        <tr>
                            <th>Mã phiếu / ngày</th>
                            <th>Loại phiếu</th>
                            <th>Nhà cung cấp</th>
                            <th>Trạng thái</th>
                            <th class="doc-number">Số dòng</th>
                            <th>Người lập</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="7" class="doc-empty">Đang tải phiếu kho…</td>
                        </tr>
                        <template v-else>
                            <tr v-for="row in rows" :key="row.id">
                                <td>
                                    <button class="doc-link doc-code" type="button" :disabled="locked"
                                        @click="open(row.id)">
                                        {{ row.document_number }}</button><small>{{ row.document_date }}</small>
                                </td>
                                <td>
                                    {{ documentTypes[row.document_type] || row.document_type }}
                                </td>
                                <td>{{ row.supplier_name || "—" }}</td>
                                <td>
                                    <span class="doc-badge" :class="row.status">{{
                                        documentStatuses[row.status] || row.status
                                        }}</span>
                                </td>
                                <td class="doc-number">{{ row.items_count ?? "—" }}</td>
                                <td>{{ row.creator?.name || "—" }}</td>
                                <td>
                                    <div class="doc-actions">
                                        <button type="button" class="doc-btn" :disabled="locked" @click="open(row.id)">
                                            Chi tiết</button><button v-if="
                                                canUpdate &&
                                                row.document_type === 'supplier_receipt' &&
                                                row.status === 'draft'
                                            " type="button" class="doc-btn" :disabled="locked"
                                            @click="open(row.id, 'edit')">
                                            Sửa nháp
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!rows.length">
                                <td colspan="7" class="doc-empty">
                                    Chưa có phiếu phù hợp với bộ lọc.
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            <footer class="doc-pagination">
                <span>{{ meta.total }} phiếu · Trang {{ meta.current_page }} /
                    {{ meta.last_page }}</span>
                <div class="doc-actions">
                    <button class="doc-btn" type="button" :disabled="loading || meta.current_page <= 1"
                        @click="load(meta.current_page - 1)">
                        Trước</button><button class="doc-btn" type="button"
                        :disabled="loading || meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">
                        Sau
                    </button>
                </div>
            </footer>
        </section>
        <DocumentDialog v-if="mode" :title="title" :busy="busy" @close="close">
            <div v-if="document && mode !== 'detail'" class="doc-subtitle doc-code">
                {{ document.document_number }} · {{ document.supplier_name }}
            </div>
            <div v-if="error" class="doc-error" role="alert">
                {{ error }}
                <ul v-if="errors.length">
                    <li v-for="item in errors" :key="item">{{ item }}</li>
                </ul>
            </div>
            <ReceiptPending v-bind="pendingProps" @recover="recover" @retry="retry" @accept="acceptCurrent" />
            <ReceiptEditor v-if="mode === 'edit'" :key="document?.id || 'new'" :form="form" :locked="locked"
                :supplier-name="document?.supplier_name" />
            <ReceiptPostForm v-else-if="mode === 'post'" :document="document" :lots="lots" :locked="locked" />
            <DocumentDetail v-else-if="document" :document="document" />
            <template #footer>
                <span class="doc-muted">{{
                    busy
                        ? "Đang xử lý…"
                        : document
                            ? `Phiếu #${document.id}`
                            : "Phiếu nhập mới"
                }}</span>
                <div class="doc-actions">
                    <template v-if="mode === 'detail' && editable && canUpdate">
                        <button class="doc-btn doc-danger" type="button" :disabled="locked" @click="cancel">
                            Hủy nháp
                        </button>
                        <button class="doc-btn" type="button" :disabled="locked" @click="open(document.id, 'edit')">
                            Sửa nháp
                        </button>
                        <button class="doc-btn doc-primary" type="button" :disabled="locked"
                            @click="open(document.id, 'post')">
                            Nhập lô & ghi sổ
                        </button>
                    </template>
                    <button v-if="mode === 'edit'" class="doc-btn doc-primary" type="button"
                        :disabled="locked || (document ? !canUpdate : !canCreate)" @click="save">
                        Lưu nháp
                    </button>
                    <button v-if="mode === 'post'" class="doc-btn doc-primary" type="button"
                        :disabled="locked || !canUpdate" @click="post">
                        Xác nhận ghi sổ
                    </button>
                </div>
            </template>
        </DocumentDialog>
    </div>
</template>