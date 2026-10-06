<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    useFinance,
    money,
    dateTime,
    localInput,
    monthStart,
    today,
    statusLabel,
    sourceLabel,
    paymentLabel,
} from "@/composables/useFinance";
import Dialog from "@/components/admin/finance/FinanceDialog.vue";
import Pager from "@/components/admin/finance/FinancePagination.vue";
import Form from "@/components/admin/finance/ExpenseForm.vue";
import Detail from "@/components/admin/finance/ExpenseDetail.vue";
import Lookup from "@/components/admin/finance/FinanceLookup.vue";
import "@/assets/finance.css";
const route = useRoute(),
    router = useRouter();
const {
    allowed,
    can,
    data,
    loading,
    saving,
    error,
    message,
    load,
    write,
    uncertain,
    retryPending,
} = useFinance("expense.view");
const filters = reactive({
    date_from: monthStart(),
    date_to: today(),
    search: "",
    status: "",
    source: "",
    payment_state: "",
    category_id: null,
    page: 1,
});
const categoryLabel = ref(""),
    dialog = ref(""),
    selected = ref(null),
    detailId = ref(null);
const actionForm = reactive({
    incurred_at: localInput(),
    paid_at: "",
    reason: "",
});
if (
    /^\d{4}-\d{2}-\d{2}$/.test(String(route.query.date_from || "")) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(route.query.date_to || ""))
) {
    filters.date_from = route.query.date_from;
    filters.date_to = route.query.date_to;
}
if (
    Number.isSafeInteger(Number(route.query.category_id)) &&
    Number(route.query.category_id) > 0
)
    filters.category_id = Number(route.query.category_id);
if (["draft", "posted", "cancelled"].includes(route.query.status))
    filters.status = route.query.status;
let applied = { ...filters };
function params(f) {
    return Object.fromEntries(
        Object.entries(f).filter(([, v]) => v !== "" && v !== null),
    );
}
async function fetchPage(page = 1, apply = false) {
    if (apply) applied = { ...filters };
    applied.page = page;
    await load("/expenses", params(applied));
}
function create() {
    selected.value = null;
    error.value = "";
    dialog.value = "form";
}
function act(action, e) {
    detailId.value = null;
    selected.value = e;
    error.value = "";
    dialog.value = action === "edit" ? "form" : action;
    Object.assign(actionForm, {
        incurred_at: localInput(),
        paid_at: e.paid_at ? localInput(e.paid_at) : localInput(),
        reason: "",
    });
}
async function submit(body) {
    const e = selected.value;
    const r = await write(
        e ? "put" : "post",
        e ? "/expenses/" + e.id : "/expenses",
        body,
    );
    if (r) {
        dialog.value = "";
        await fetchPage(1);
        detailId.value = r.data.id;
    }
}
async function action() {
    const e = selected.value,
        a = dialog.value;
    let body = { lock_version: e.lock_version };
    if (a === "reverse")
        body = {
            ...body,
            incurred_at: actionForm.incurred_at,
            reason: actionForm.reason,
        };
    if (a === "cancel") body.reason = actionForm.reason;
    if (a === "payment")
        body = {
            ...body,
            paid_at: actionForm.paid_at || null,
            reason: actionForm.reason,
        };
    const r = await write("post", `/expenses/${e.id}/${a}`, body);
    if (r) {
        dialog.value = "";
        await fetchPage(data.value?.meta?.current_page || 1);
        detailId.value = r.data.id;
    }
}
function fromRoute() {
    const id = Number(route.query.expense);
    if (Number.isSafeInteger(id) && id > 0) detailId.value = id;
}
watch(() => route.query.expense, fromRoute);
watch(allowed, (v) => {
    dialog.value = "";
    detailId.value = null;
    if (v) fetchPage(1);
});
onMounted(() => {
    fetchPage();
    fromRoute();
});
async function retry() {
    const r = await retryPending();
    if (r) {
        dialog.value = "";
        await fetchPage(1);
        detailId.value = r.data.id;
    }
}
function closeDetail() {
    detailId.value = null;
    if (route.query.expense)
        router.replace({ query: { ...route.query, expense: undefined } });
}
</script>
<template>
    <section class="finance">
        <p v-if="!allowed" role="alert" class="fin-error">
            Bạn không có quyền xem chi phí.
        </p>
        <template v-else>
            <header class="mb-6 flex flex-wrap justify-between gap-4">
                <div>
                    <h1>Chi phí</h1>
                    <p class="fin-note">
                        Theo dõi khoản chi, kiểm tra chứng từ và ghi nhận đúng kỳ.
                    </p>
                </div>
                <div class="flex gap-2">
                    <button class="fin-btn" :disabled="loading" @click="fetchPage(applied.page)">
                        Tải lại</button><button v-if="can('expense.create')" class="fin-btn fin-primary"
                        @click="create">
                        Thêm khoản chi
                    </button>
                </div>
            </header>
            <p v-if="message" role="status" class="fin-ok">{{ message }}</p>
            <p v-if="error && !dialog" role="alert" class="fin-error">{{ error }}</p>
            <div v-if="uncertain && !dialog" class="fin-warning mb-4">
                Lần lưu trước chưa rõ kết quả.
                <button class="fin-link" :disabled="saving" @click="retry">
                    Thử lại đúng thao tác trước
                </button>
            </div>
            <div class="fin-card">
                <form class="fin-toolbar" @submit.prevent="fetchPage(1, true)">
                    <label>Từ ngày<input v-model="filters.date_from" type="date" required /></label><label>Đến
                        ngày<input v-model="filters.date_to" type="date" required /></label><label>Tìm kiếm<input
                            v-model.trim="filters.search" placeholder="Mã chi phí, nội dung..." /></label><label>Trạng
                        thái<select v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option value="draft">Nháp</option>
                            <option value="posted">Đã ghi sổ (gồm dòng đảo)</option>
                            <option value="cancelled">Đã hủy</option>
                        </select></label><label>Nguồn<select v-model="filters.source">
                            <option value="">Tất cả</option>
                            <option value="manual">Nhập tay</option>
                            <option value="inventory">Từ kho</option>
                            <option value="reversal">Dòng đảo</option>
                        </select></label><label>Trả tiền<select v-model="filters.payment_state">
                            <option value="">Tất cả</option>
                            <option value="paid">Đã trả tiền</option>
                            <option value="unpaid">Chưa trả tiền</option>
                        </select></label>
                    <Lookup kind="expense-categories" label="Danh mục" v-model="filters.category_id"
                        :selected-label="categoryLabel" @select="categoryLabel = $event?.label" /><button
                        class="fin-btn fin-primary" :disabled="loading">
                        Áp dụng
                    </button>
                </form>
                <p v-if="loading" class="py-12 text-center">Đang tải chi phí...</p>
                <template v-else-if="data">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Khoản chi</th>
                                    <th>Ngày phát sinh</th>
                                    <th>Danh mục / Nguồn</th>
                                    <th class="fin-money">Số tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Trả tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="e in data.data" :key="e.id">
                                    <td class="min-w-48 max-w-80">
                                        <button class="fin-link" @click="detailId = e.id">
                                            {{ e.code }}
                                        </button>
                                        <p class="mt-1 line-clamp-2">{{ e.description }}</p>
                                        <p class="fin-note">
                                            {{ e.order_code || e.inventory_document_number }}
                                        </p>
                                    </td>
                                    <td class="whitespace-nowrap">
                                        {{ dateTime(e.incurred_at) }}
                                    </td>
                                    <td>
                                        {{ e.category?.name }}<br /><span class="fin-badge mt-1">{{
                                            sourceLabel(e.source)
                                        }}</span>
                                    </td>
                                    <td class="fin-money" :class="e.amount.startsWith('-') ? 'text-red-500' : ''">
                                        {{ money(e.amount) }}
                                    </td>
                                    <td>{{ statusLabel(e) }}</td>
                                    <td>{{ paymentLabel(e.payment_state) }}</td>
                                </tr>
                                <tr v-if="!data.data.length">
                                    <td colspan="6" class="py-10 text-center">
                                        Không có khoản chi phù hợp bộ lọc.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Pager :meta="data.meta" :loading="loading" @page="fetchPage($event)" />
                </template>
            </div>
            <Dialog v-if="dialog === 'form'" :title="selected ? 'Sửa khoản chi nháp' : 'Thêm khoản chi'" :busy="saving"
                @close="dialog = ''">
                <p v-if="error" role="alert" class="fin-error">{{ error }}</p>
                <button v-if="uncertain" class="fin-btn mb-4" :disabled="saving" @click="retry">
                    Thử lại đúng thao tác trước</button>
                <Form :expense="selected" :busy="saving" @submit="submit" @cancel="dialog = ''" />
            </Dialog>
            <Dialog v-else-if="dialog" :title="{
                post: 'Ghi sổ chi phí',
                cancel: 'Hủy khoản chi nháp',
                payment: 'Cập nhật trả tiền',
                reverse: 'Đảo chi phí',
            }[dialog]
                " :busy="saving" @close="dialog = ''">
                <form @submit.prevent="action">
                    <p class="mb-4">
                        <strong>{{ selected.code }} · {{ money(selected.amount) }}</strong><br />{{ selected.description
                        }}
                    </p>
                    <p v-if="error" role="alert" class="fin-error">{{ error }}</p>
                    <button v-if="uncertain" type="button" class="fin-btn mb-4" :disabled="saving" @click="retry">
                        Thử lại đúng thao tác trước
                    </button>
                    <p v-if="dialog === 'post'" class="fin-warning">
                        Ghi sổ đưa khoản này vào báo cáo theo ngày phát sinh. Nội dung và số
                        tiền sẽ được khóa; nếu nhập sai phải tạo dòng đảo.
                    </p>
                    <template v-if="dialog === 'reverse'">
                        <p class="fin-warning mb-4">
                            Tạo một dòng âm bằng toàn bộ khoản gốc. Không tự hoàn tiền và
                            không điều chỉnh tồn kho.
                        </p>
                        <label>Ngày đảo (giờ Việt Nam)<input v-model="actionForm.incurred_at" type="datetime-local"
                                required :max="localInput()" :disabled="saving" /></label>
                    </template><template v-if="dialog === 'payment'"><label>Ngày đã trả tiền (để trống nếu chưa
                            trả)<input v-model="actionForm.paid_at" type="datetime-local" :max="localInput()"
                                :disabled="saving" /></label>
                        <p class="fin-note mt-2">
                            Chỉ hỗ trợ ghi nhận trả đủ một lần; không quản lý thanh toán từng
                            phần hoặc chuyển tiền thực tế.
                        </p>
                    </template><label v-if="dialog !== 'post'" class="mt-4">Lý do / ghi chú *<textarea
                            v-model="actionForm.reason" required maxlength="1000" :disabled="saving"></textarea>
                    </label>
                    <div class="fin-actions">
                        <button type="button" class="fin-btn" :disabled="saving" @click="dialog = ''">
                            Quay lại</button><button class="fin-btn fin-primary" :disabled="saving">
                            {{ saving ? "Đang lưu..." : "Xác nhận" }}
                        </button>
                    </div>
                </form>
            </Dialog>
            <Detail v-if="detailId" :key="detailId" :id="detailId" @close="closeDetail" @action="act"
                @open="detailId = $event" />
        </template>
    </section>
</template>