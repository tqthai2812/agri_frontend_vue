<script setup>
import { Icon } from "@iconify/vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useFinance } from "@/composables/useFinance";
import Dialog from "@/components/admin/finance/FinanceDialog.vue";
import Pager from "@/components/admin/finance/FinancePagination.vue";
import "@/assets/finance.css";
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
const search = ref(""),
  active = ref(""),
  open = ref(false),
  selected = ref(null);
const form = reactive({ code: "", name: "", is_active: true });
let applied = {};
function fetchPage(page = 1, apply = false) {
  if (apply)
    applied = { search: search.value, is_active: active.value || undefined };
  return load("/expense-categories", { ...applied, page });
}
function edit(c = null) {
  selected.value = c;
  Object.assign(form, {
    code: c?.code ?? "",
    name: c?.name ?? "",
    is_active: c?.is_active ?? true,
  });
  error.value = "";
  open.value = true;
}
async function save() {
  const c = selected.value;
  const body = c
    ? {
        name: form.name,
        is_active: form.is_active,
        lock_version: c.lock_version,
      }
    : { ...form };
  const r = await write(
    c ? "put" : "post",
    c ? "/expense-categories/" + c.id : "/expense-categories",
    body,
    false,
  );
  if (r) {
    open.value = false;
    await fetchPage();
  }
}
async function retry() {
  const r = await retryPending();
  if (r) {
    open.value = false;
    await fetchPage();
  }
}
onMounted(() => fetchPage());
watch(allowed, (v) => {
  open.value = false;
  if (v) fetchPage();
});
</script>
<template>
  <section class="finance product-admin">
    <p v-if="!allowed" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      Bạn không có quyền xem danh mục chi phí.
    </p>
    <template v-else
      ><header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-2xl font-bold">Danh mục chi phí</h1>
          <p class="text-sm text-text-light">
            Phân loại phí vận chuyển, đóng gói, quảng cáo và vận hành.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :disabled="loading" @click="fetchPage(data?.meta?.current_page || 1)">
            <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" /> Tải lại
          </button>
        <button
          v-if="can('expense-category.manage')"
          class="btn-primary cursor-pointer disabled:cursor-not-allowed"
          :disabled="saving" @click="edit()"
        >
          <Icon icon="solar:add-circle-bold" /> Thêm danh mục
        </button>
        </div>
      </header>
<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
<div class="product-stat-card rounded-2xl border-l-4 border-l-info bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Theo bộ lọc</div><div class="font-mono text-2xl font-bold text-info">{{ loading ? "—" : (data?.meta?.total ?? 0) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-success bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Đang bật · trang này</div><div class="font-mono text-2xl font-bold text-success">{{ loading ? "—" : ((data?.data || []).filter(c => [true, 1, "1"].includes(c.is_active)).length) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-warning bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Đã tắt · trang này</div><div class="font-mono text-2xl font-bold text-warning">{{ loading ? "—" : ((data?.data || []).filter(c => ![true, 1, "1"].includes(c.is_active)).length) }}</div></div>
<div class="product-stat-card rounded-2xl border-l-4 border-l-danger bg-surface p-4 shadow-sm"><div class="text-xs font-medium text-text-light">Danh mục · trang này</div><div class="font-mono text-2xl font-bold text-danger">{{ loading ? "—" : (data?.data?.length ?? 0) }}</div></div>
</div>

      <p v-if="message" class="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{{ message }}</p>
      <p v-if="error && !open" role="alert" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>
      <div v-if="uncertain && !open" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
        <button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="saving" @click="retry" type="button">
          <Icon icon="solar:refresh-bold" class="shrink-0" aria-hidden="true" />
          Thử lại đúng thao tác trước
        </button>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <form class="mb-5 flex flex-wrap items-end gap-3 product-filters" @submit.prevent="fetchPage(1, true)">
          <label class="form-group product-search-filter"
            >
<Icon icon="solar:magnifer-bold" class="pointer-events-none absolute bottom-3 left-3 text-text-light" aria-hidden="true" /><span class="form-label">Tìm danh mục</span><input class="form-control"
              v-model.trim="search"
              placeholder="Mã hoặc tên" /></label
          ><label class="form-group"
            ><span class="form-label">Trạng thái</span><select class="filter-select cursor-pointer disabled:cursor-not-allowed" v-model="active">
              <option value="">Tất cả</option>
              <option value="1">Đang bật</option>
              <option value="0">Đã tắt</option>
            </select></label
          ><button class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed" :disabled="loading">
<Icon icon="solar:filter-bold" aria-hidden="true" />Áp dụng</button>
        </form>
        <p class="py-10 text-center text-sm text-text-light" v-if="loading">
      <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" />Đang tải...</p>
        <template v-else-if="data"
          ><div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[700px] table-auto">
              <thead class="bg-bg">
                <tr>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Mã</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Tên danh mục</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Trạng thái</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap">Số khoản chi</th>
                  <th class="p-3 text-xs font-bold uppercase tracking-wide text-text-light text-left whitespace-nowrap w-px product-table-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-primary/5" v-for="c in data.data" :key="c.id">
                  <td class="p-3 text-sm text-left">{{ c.code }}</td>
                  <td class="p-3 text-sm text-left">{{ c.name }}</td>
                  <td class="p-3 text-sm text-left">{{ c.is_active ? "Đang bật" : "Đã tắt" }}</td>
                  <td class="p-3 text-sm text-left">{{ c.expenses_count }}</td>
                  <td class="p-3 text-sm text-left w-px whitespace-nowrap product-table-actions">
                    <button
                      v-if="can('expense-category.manage')"
                      class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed text-left shrink-0" title="Cập nhật danh mục" aria-label="Cập nhật danh mục"
                      @click="edit(c)"
                    >
                      <Icon icon="solar:pen-bold" />
                    </button>
                  </td>
                </tr>
                <tr class="border-b border-border hover:bg-primary/5" v-if="!data.data.length">
                  <td class="text-sm p-8 text-text-light text-left" colspan="5">
                    Chưa có danh mục phù hợp. Thêm danh mục trước khi nhập khoản
                    chi.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pager :count="data.data.length" :loading="loading" :meta="data.meta" @page="fetchPage($event)"
        /></template>
      </div>
      <Dialog
        v-if="open"
        :title="selected ? 'Cập nhật danh mục' : 'Thêm danh mục'"
        :busy="saving"
        @close="open = false"
        ><form @submit.prevent="save">
          <p v-if="error" class="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{{ error }}</p>
          <button
            v-if="uncertain"
            type="button"
            class="mb-4 btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
            :disabled="saving"
            @click="retry"
          >
            Thử lại đúng thao tác trước
          </button>
          <fieldset :disabled="saving" class="grid min-w-0 gap-4 sm:grid-cols-2">
            <label class="form-group"
              ><span class="form-label">Mã *</span><input class="form-control"
                v-model.trim="form.code"
                :disabled="!!selected"
                required
                maxlength="50"
                pattern="[A-Za-z0-9_]+"
                placeholder="Ví dụ: SHIPPING" /></label
            ><label class="form-group"
              ><span class="form-label">Tên *</span><input class="form-control"
                v-model.trim="form.name"
                required
                maxlength="255"
                placeholder="Ví dụ: Cước giao hàng" /></label
            ><label class="!flex items-center gap-2 cursor-pointer text-sm"
              ><input class="size-4 cursor-pointer accent-[#07532b] disabled:cursor-not-allowed" v-model="form.is_active" type="checkbox" />Cho phép dùng
              khi tạo / ghi sổ chi phí</label
            >
            <p class="text-xs leading-5 text-text-light sm:col-span-2">
              Mã được giữ cố định. Tắt danh mục để ngừng sử dụng; lịch sử khoản
              chi vẫn còn.
            </p>
          </fieldset>
          <div class="mt-5 flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row product-form-actions sticky bottom-0 bg-surface">
            <button
              type="button"
              class="btn-outline cursor-pointer disabled:cursor-not-allowed"
              :disabled="saving"
              @click="open = false"
            >
              Quay lại</button
            ><button class="btn-primary cursor-pointer disabled:cursor-not-allowed" :disabled="saving">
              {{ saving ? "Đang lưu..." : "Lưu danh mục" }}
            </button>
          </div>
        </form></Dialog
      ></template
    >
  </section>
</template>