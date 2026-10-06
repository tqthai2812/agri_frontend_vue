<script setup>
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
    <section class="finance">
        <p v-if="!allowed" role="alert" class="fin-error">
            Bạn không có quyền xem danh mục chi phí.
        </p>
        <template v-else>
            <header class="mb-6 flex flex-wrap justify-between gap-4">
                <div>
                    <h1>Danh mục chi phí</h1>
                    <p class="fin-note">
                        Phân loại phí vận chuyển, đóng gói, quảng cáo và vận hành.
                    </p>
                </div>
                <button v-if="can('expense-category.manage')" class="fin-btn fin-primary" @click="edit()">
                    Thêm danh mục
                </button>
            </header>
            <p v-if="message" class="fin-ok">{{ message }}</p>
            <p v-if="error && !open" role="alert" class="fin-error">{{ error }}</p>
            <div v-if="uncertain && !open" class="fin-warning mb-4">
                <button class="fin-link" :disabled="saving" @click="retry">
                    Thử lại đúng thao tác trước
                </button>
            </div>
            <div class="fin-card">
                <form class="fin-toolbar" @submit.prevent="fetchPage(1, true)">
                    <label>Tìm danh mục<input v-model.trim="search" placeholder="Mã hoặc tên" /></label><label>Trạng
                        thái<select v-model="active">
                            <option value="">Tất cả</option>
                            <option value="1">Đang bật</option>
                            <option value="0">Đã tắt</option>
                        </select></label><button class="fin-btn" :disabled="loading">Áp dụng</button>
                </form>
                <p v-if="loading">Đang tải...</p>
                <template v-else-if="data">
                    <div class="fin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Tên danh mục</th>
                                    <th>Trạng thái</th>
                                    <th>Số khoản chi</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="c in data.data" :key="c.id">
                                    <td>{{ c.code }}</td>
                                    <td>{{ c.name }}</td>
                                    <td>{{ c.is_active ? "Đang bật" : "Đã tắt" }}</td>
                                    <td>{{ c.expenses_count }}</td>
                                    <td>
                                        <button v-if="can('expense-category.manage')" class="fin-link" @click="edit(c)">
                                            Cập nhật
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!data.data.length">
                                    <td colspan="5">
                                        Chưa có danh mục phù hợp. Thêm danh mục trước khi nhập khoản
                                        chi.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Pager :meta="data.meta" @page="fetchPage($event)" />
                </template>
            </div>
            <Dialog v-if="open" :title="selected ? 'Cập nhật danh mục' : 'Thêm danh mục'" :busy="saving"
                @close="open = false">
                <form @submit.prevent="save">
                    <p v-if="error" class="fin-error" role="alert">{{ error }}</p>
                    <button v-if="uncertain" type="button" class="fin-btn mb-4" :disabled="saving" @click="retry">
                        Thử lại đúng thao tác trước
                    </button>
                    <fieldset :disabled="saving" class="fin-grid">
                        <label>Mã *<input v-model.trim="form.code" :disabled="!!selected" required maxlength="50"
                                pattern="[A-Za-z0-9_]+" placeholder="Ví dụ: SHIPPING" /></label><label>Tên *<input
                                v-model.trim="form.name" required maxlength="255"
                                placeholder="Ví dụ: Cước giao hàng" /></label><label
                            class="!flex items-center gap-2"><input v-model="form.is_active" type="checkbox" />Cho phép
                            dùng
                            khi tạo / ghi sổ chi phí</label>
                        <p class="fin-note fin-span">
                            Mã được giữ cố định. Tắt danh mục để ngừng sử dụng; lịch sử khoản
                            chi vẫn còn.
                        </p>
                    </fieldset>
                    <div class="fin-actions">
                        <button type="button" class="fin-btn" :disabled="saving" @click="open = false">
                            Quay lại</button><button class="fin-btn fin-primary" :disabled="saving">
                            {{ saving ? "Đang lưu..." : "Lưu danh mục" }}
                        </button>
                    </div>
                </form>
            </Dialog>
        </template>
    </section>
</template>