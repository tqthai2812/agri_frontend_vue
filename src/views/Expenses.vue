<script setup>
import { Icon } from "@iconify/vue";
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
const advancedFilters = ref(null);
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
  <section class="finance product-admin">
    <p v-if="!allowed" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      Bạn không có quyền xem chi phí.
    </p>
    <template v-else
      ><header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-2xl font-bold">Chi phí</h1>
          <p class="text-sm text-text-light">
            Theo dõi khoản chi, kiểm tra chứng từ và ghi nhận đúng kỳ.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :disabled="loading"
            @click="fetchPage(applied.page)"
          >
            <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" /> Tải lại</button
          ><button
            v-if="can('expense.create')"
            class="btn-primary cursor-pointer disabled:cursor-not-allowed"
            :disabled="saving"
            @click="create"
          >
            <Icon icon="solar:add-circle-bold" /> Thêm khoản chi
          </button>
        </div>
      </header>
<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
<div class="product-stat-card rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Theo bộ lọc</div><div class="font-mono text-2xl font-bold text-info">{{ loading ? "—" : (data?.meta?.total ?? 0) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Đã ghi sổ · trang này</div><div class="font-mono text-2xl font-bold text-success">{{ loading ? "—" : ((data?.data || []).filter(e => e.status === "posted").length) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Nháp · trang này</div><div class="font-mono text-2xl font-bold text-warning">{{ loading ? "—" : ((data?.data || []).filter(e => e.status === "draft").length) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Đã hủy · trang này</div><div class="font-mono text-2xl font-bold text-danger">{{ loading ? "—" : ((data?.data || []).filter(e => e.status === "cancelled").length) }}</div></div>
</div>

      <p v-if="message" role="status" class="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{{ message }}</p>
      <p v-if="error && !dialog" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
      <div v-if="uncertain && !dialog" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
        Lần lưu trước chưa rõ kết quả.
        <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="saving" @click="retry" type="button">
          <Icon icon="solar:refresh-bold" class="shrink-0" aria-hidden="true" />
          Thử lại đúng thao tác trước
        </button>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <form
          class="relative mb-5 flex flex-wrap gap-3"
          @submit.prevent="fetchPage(1, true)"
          @invalid.capture="advancedFilters?.setAttribute('open', '')"
        >
          <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" aria-hidden="true" />
            <input
              v-model.trim="filters.search"
              type="search"
              aria-label="Tìm chi phí"
              placeholder="Mã chi phí, nội dung..."
              class="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select v-model="filters.status" aria-label="Trạng thái chi phí"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="posted">Đã ghi sổ (gồm dòng đảo)</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select v-model="filters.source" aria-label="Nguồn chi phí"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
            <option value="">Tất cả nguồn</option>
            <option value="manual">Nhập tay</option>
            <option value="inventory">Từ kho</option>
            <option value="reversal">Dòng đảo</option>
          </select>
          <select v-model="filters.payment_state" aria-label="Tình trạng trả tiền"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
            <option value="">Tất cả thanh toán</option>
            <option value="paid">Đã trả tiền</option>
            <option value="unpaid">Chưa trả tiền</option>
          </select>

          <details ref="advancedFilters" class="shrink-0">
            <summary class="btn-outline-sm h-full list-none cursor-pointer gap-2 [&::-webkit-details-marker]:hidden">
              <Icon icon="solar:filter-bold" aria-hidden="true" />
              Lọc thêm
            </summary>
            <div class="absolute inset-x-0 top-full z-20 mt-3 rounded-2xl border border-border bg-surface p-5 shadow-xl">
              <div class="grid min-w-0 gap-4 md:grid-cols-[160px_160px_minmax(0,1fr)]">
                <label class="form-group min-w-0">
                  <span class="form-label">Từ ngày</span>
                  <input v-model="filters.date_from" type="date" required class="form-control w-full" />
                </label>
                <label class="form-group min-w-0">
                  <span class="form-label">Đến ngày</span>
                  <input v-model="filters.date_to" type="date" required class="form-control w-full" />
                </label>
                <Lookup
                  kind="expense-categories"
                  label="Danh mục"
                  v-model="filters.category_id"
                  :selected-label="categoryLabel"
                  @select="categoryLabel = $event?.label"
                />
              </div>
              <div class="mt-4 flex justify-end">
                <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                  @click="advancedFilters?.removeAttribute('open')">
                  Thu gọn
                </button>
              </div>
            </div>
          </details>
          <button type="submit" class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="loading">
            <Icon icon="solar:filter-bold" aria-hidden="true" />
            Áp dụng
          </button>
        </form>
        <p v-if="loading" class="py-10 text-center text-sm text-text-light">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />Đang tải chi phí...</p>
        <template v-else-if="data"
          ><div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[700px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Khoản chi</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Ngày phát sinh</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Danh mục / Nguồn</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số tiền</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trả tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="e in data.data" :key="e.id">
                  <td class="min-w-48 p-3 text-sm text-left">
                    <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed text-left" @click="detailId = e.id" type="button">
                      <Icon icon="solar:document-text-bold-duotone" class="shrink-0" aria-hidden="true" />
                      {{ e.code }}
                    </button>
                    <p class="mt-1 line-clamp-2 text-left">{{ e.description }}</p>
                    <p class="text-xs leading-5 text-text-light text-left">
                      {{ e.order_code || e.inventory_document_number }}
                    </p>
                  </td>
                  <td class="whitespace-nowrap p-3 text-sm text-left">
                    {{ dateTime(e.incurred_at) }}
                  </td>
                  <td class="p-3 text-sm text-left">
                    {{ e.category?.name }}<br /><span class="inline-block whitespace-nowrap rounded-lg bg-bg px-2 py-1 text-xs mt-1 text-left">{{
                      sourceLabel(e.source)
                    }}</span>
                  </td>
                  <td
                    class="whitespace-nowrap font-mono p-3 text-sm text-left"
                    :class="e.amount.startsWith('-') ? 'text-red-500' : ''"
                  >
                    {{ money(e.amount) }}
                  </td>
                  <td class="p-3 text-sm text-left">{{ statusLabel(e) }}</td>
                  <td class="p-3 text-sm text-left">{{ paymentLabel(e.payment_state) }}</td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!data.data.length">
                  <td colspan="6" class="text-sm p-8 text-text-light text-left">
                    Không có khoản chi phù hợp bộ lọc.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pager :count="data.data.length" :meta="data.meta" :loading="loading" @page="fetchPage($event)"
        /></template>
      </div>
      <Dialog
        v-if="dialog === 'form'"
        :title="selected ? 'Sửa khoản chi nháp' : 'Thêm khoản chi'"
        :busy="saving"
        @close="dialog = ''"
        ><p v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
        <button
          v-if="uncertain"
          class="mb-4 btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="saving"
          @click="retry"
        >
          Thử lại đúng thao tác trước</button
        ><Form
          :expense="selected"
          :busy="saving"
          @submit="submit"
          @cancel="dialog = ''"
      /></Dialog>
      <Dialog
        v-else-if="dialog"
        :title="
          {
            post: 'Ghi sổ chi phí',
            cancel: 'Hủy khoản chi nháp',
            payment: 'Cập nhật trả tiền',
            reverse: 'Đảo chi phí',
          }[dialog]
        "
        :busy="saving"
        @close="dialog = ''"
        ><form @submit.prevent="action">
          <p class="mb-4">
            <strong>{{ selected.code }} · {{ money(selected.amount) }}</strong
            ><br />{{ selected.description }}
          </p>
          <p v-if="error" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
          <button
            v-if="uncertain"
            type="button"
            class="mb-4 btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :disabled="saving"
            @click="retry"
          >
            Thử lại đúng thao tác trước
          </button>
          <p v-if="dialog === 'post'" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Ghi sổ đưa khoản này vào báo cáo theo ngày phát sinh. Nội dung và số
            tiền sẽ được khóa; nếu nhập sai phải tạo dòng đảo.
          </p>
          <template v-if="dialog === 'reverse'"
            ><p class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
              Tạo một dòng âm bằng toàn bộ khoản gốc. Không tự hoàn tiền và
              không điều chỉnh tồn kho.
            </p>
            <label class="form-group"
              ><span class="form-label">Ngày đảo (giờ Việt Nam)</span><input class="form-control"
                v-model="actionForm.incurred_at"
                type="datetime-local"
                required
                :max="localInput()"
                :disabled="saving" /></label></template
          ><template v-if="dialog === 'payment'"
            ><label class="form-group"
              ><span class="form-label">Ngày đã trả tiền (để trống nếu chưa trả)</span><input class="form-control"
                v-model="actionForm.paid_at"
                type="datetime-local"
                :max="localInput()"
                :disabled="saving"
            /></label>
            <p class="text-xs leading-5 text-text-light mt-2">
              Chỉ hỗ trợ ghi nhận trả đủ một lần; không quản lý thanh toán từng
              phần hoặc chuyển tiền thực tế.
            </p></template
          ><label v-if="dialog !== 'post'" class="mt-4 form-group"
            ><span class="form-label">Lý do / ghi chú *</span><textarea class="form-control resize-y"
              v-model="actionForm.reason"
              required
              maxlength="1000"
              :disabled="saving"
            ></textarea>
          </label>
          <div class="mt-5 flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row product-form-actions sticky bottom-0 bg-surface">
            <button
              type="button"
              class="btn-outline cursor-pointer disabled:cursor-not-allowed"
              :disabled="saving"
              @click="dialog = ''"
            >
              Quay lại</button
            ><button class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="saving">
              {{ saving ? "Đang lưu..." : "Xác nhận" }}
            </button>
          </div>
        </form></Dialog
      >
      <Detail
        v-if="detailId"
        :key="detailId"
        :id="detailId"
        @close="closeDetail"
        @action="act"
        @open="detailId = $event"
    /></template>
  </section>
</template>