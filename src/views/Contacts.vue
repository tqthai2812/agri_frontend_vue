<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const authStore = useAuthStore(), store = useAdminContactStore();
const dialog = ref(null);
const canView = computed(() => authStore.isAuthenticated && authStore.hasPermission("contact.view"));
const canUpdate = computed(() => canView.value && authStore.hasPermission("contact.update"));
const statusNames = { pending: "Chờ xử lý", resolved: "Đã xử lý", rejected: "Từ chối" };
const stats = [{ key: "total", label: "Tổng theo bộ lọc" }, { key: "pending", label: "Chờ xử lý" }, { key: "resolved", label: "Đã xử lý" }, { key: "rejected", label: "Từ chối" }];
const phoneHref = computed(() => {
    const phone = String(store.selected?.user?.phone_number || "").replace(/[\s().-]/g, "");
    return /^\+?\d{6,15}$/.test(phone) ? `tel:${phone}` : null;
});
const emailHref = computed(() => {
    const email = String(store.selected?.user?.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const query = new URLSearchParams({
        view: "cm",
        fs: "1",
        to: email,
        su: `Phản hồi yêu cầu ${store.selected.code}`,
    });
    return `https://mail.google.com/mail/?${query.toString()}`;
});
function date(value) { const d = new Date(value); return value && !Number.isNaN(d.getTime()) ? d.toLocaleString("vi-VN") : "—"; }
function badge(status) { return { pending: "bg-amber-50 text-amber-700", resolved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-600" }[status] || "bg-slate-100 text-slate-600"; }
function discard() { return !store.dirty || window.confirm("Bỏ thay đổi trạng thái và ghi chú chưa lưu?"); }
function close() { if (!store.saving && discard()) store.closeDetail(); }
function reloadDetail() { if (!store.saving && discard()) store.fetchDetail(); }
function open(contact) { if (canView.value) store.openDetail(contact); }
function save() { if (canUpdate.value) store.save(); }
function applyFilters() { if (canView.value) store.fetchContacts(1); }
function resetFilters() { store.resetFilters(); applyFilters(); }
function pageTo(page) { if (!store.loading && page >= 1 && page <= store.meta.last_page) store.fetchContacts(page); }
let disposed = false, dialogVersion = 0;
watch([canView, () => authStore.user?.id], () => {
    store.dispose(); if (canView.value) store.fetchContacts(1);
}, { immediate: true, flush: "sync" });
watch(() => store.showDetail, async (open) => {
    const version = ++dialogVersion; await nextTick();
    if (disposed || version !== dialogVersion || !dialog.value) return;
    if (open && !dialog.value.open) dialog.value.showModal();
    else if (!open && dialog.value.open) dialog.value.close();
}, { flush: "post" });
onBeforeUnmount(() => { disposed = true; dialogVersion++; dialog.value?.close(); store.dispose(); });
</script>
<template>
    <div>
        <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold">Quản lý liên hệ</h1>
                <p class="mt-1 text-sm text-text-light">Tiếp nhận yêu cầu, liên hệ khách hàng và ghi nhận kết quả xử lý.
                </p>
            </div><button type="button" :disabled="store.loading || !canView" @click="store.fetchContacts()"
                class="btn-outline-sm disabled:opacity-50">
                <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />Tải lại
            </button>
        </header>
        <p v-if="!canView" class="rounded-2xl bg-red-50 p-5 text-sm text-red-600">Bạn không có quyền xem liên hệ.</p>
        <template v-else>
            <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div v-for="stat in stats" :key="stat.key"
                    class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <p class="text-xs text-text-light">{{ stat.label }}</p><strong class="mt-2 block text-2xl">{{
                        store.loading || store.listError ? '—' : store.summary[stat.key] }}</strong>
                </div>
            </div>
            <p v-if="store.message" role="status" class="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{{
                store.message }}</p>
            <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <form class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="applyFilters">
                    <label class="text-xs text-text-light sm:col-span-2 lg:col-span-2">Tìm kiếm<input
                            v-model.trim="store.filters.search" maxlength="255"
                            placeholder="Mã yêu cầu, chủ đề, tên, email, số điện thoại..."
                            class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" /></label>
                    <label class="text-xs text-text-light">Trạng thái<select v-model="store.filters.status"
                            class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                            <option value="">Tất cả</option>
                            <option v-for="(label, value) in statusNames" :key="value" :value="value">{{ label }}
                            </option>
                        </select></label>
                    <label class="text-xs text-text-light">Từ ngày<input v-model="store.filters.date_from" type="date"
                            class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" /></label>
                    <label class="text-xs text-text-light">Đến ngày<input v-model="store.filters.date_to" type="date"
                            :min="store.filters.date_from || undefined"
                            class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" /></label>
                    <div class="flex gap-2 sm:col-span-2 lg:col-span-5"><button type="submit" :disabled="store.loading"
                            class="btn-primary disabled:opacity-50">Áp dụng</button><button type="button"
                            :disabled="store.loading" @click="resetFilters"
                            class="btn-outline-sm disabled:opacity-50">Xóa lọc</button></div>
                </form>
                <p v-if="store.loading" role="status" class="py-12 text-center text-sm text-text-light">Đang tải liên
                    hệ...</p>
                <p v-else-if="store.listError" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-600">{{
                    store.listError }}</p>
                <div v-else class="overflow-x-auto">
                    <table class="w-full min-w-[800px] text-left text-sm">
                        <thead class="bg-bg text-xs text-text-light">
                            <tr>
                                <th class="p-3">Yêu cầu</th>
                                <th class="p-3">Người gửi</th>
                                <th class="p-3">Trạng thái</th>
                                <th class="p-3">Ngày gửi</th>
                                <th class="p-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="contact in store.contacts" :key="contact.id"
                                class="border-b border-border hover:bg-primary/5">
                                <td class="max-w-sm p-3"><strong class="text-primary">{{ contact.code }}</strong>
                                    <p class="mt-1 break-words font-semibold">{{ contact.subject }}</p>
                                    <p class="mt-1 line-clamp-2 break-words text-xs text-text-light">{{ contact.message
                                    }}</p>
                                </td>
                                <td class="p-3">
                                    <p>{{ contact.user?.name || 'Tài khoản không còn tồn tại' }}</p>
                                    <p class="mt-1 text-xs text-text-light">{{ contact.user?.email }}</p>
                                    <p class="mt-1 text-xs text-text-light">{{ contact.user?.phone_number }}</p>
                                </td>
                                <td class="p-3"><span class="whitespace-nowrap rounded-full px-3 py-1 text-xs"
                                        :class="badge(contact.status)">{{ contact.status_label }}</span></td>
                                <td class="p-3 text-xs text-text-light">{{ date(contact.created_at) }}</td>
                                <td class="p-3"><button type="button" @click="open(contact)"
                                        class="font-semibold text-primary hover:underline">Xem / xử lý</button></td>
                            </tr>
                            <tr v-if="!store.contacts.length">
                                <td colspan="5" class="p-10 text-center text-text-light">Không có yêu cầu phù hợp.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <nav v-if="!store.listError" aria-label="Phân trang liên hệ"
                    class="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-light"><span>{{
                        store.meta.total }} yêu cầu theo bộ lọc</span>
                    <div class="flex items-center gap-3"><button type="button"
                            :disabled="store.loading || store.meta.current_page <= 1"
                            @click="pageTo(store.meta.current_page - 1)" class="page-btn">Trước</button><span>{{
                                store.meta.current_page }} / {{ store.meta.last_page }}</span><button type="button"
                            :disabled="store.loading || store.meta.current_page >= store.meta.last_page"
                            @click="pageTo(store.meta.current_page + 1)" class="page-btn">Sau</button></div>
                </nav>
            </section>
        </template>
        <dialog ref="dialog" aria-label="Chi tiết liên hệ" @cancel.prevent="close"
            class="m-auto max-h-[92dvh] w-[92vw] max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50">
            <header
                class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface p-5">
                <h2 class="text-lg font-bold">{{ store.selected?.code || 'Chi tiết liên hệ' }}</h2><button type="button"
                    autofocus aria-label="Đóng chi tiết" :disabled="store.saving" @click="close"
                    class="btn-outline-icon disabled:opacity-50">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </header>
            <div class="space-y-5 p-5 sm:p-6">
                <p v-if="store.loadingDetail" role="status" class="py-8 text-center text-sm text-text-light">Đang tải
                    chi
                    tiết...</p>
                <div v-else-if="store.detailError" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-600">{{
                    store.detailError }}<button type="button" @click="reloadDetail" class="ml-2 font-bold underline">Thử
                        lại</button></div>
                <template v-else-if="store.selected">
                    <div class="rounded-xl bg-bg p-4"><strong>{{ store.selected.user?.name || 'Người gửi' }}</strong>
                        <p class="mt-1 break-all text-sm text-text-light">{{ store.selected.user?.email }}</p>
                        <p class="mt-1 text-sm text-text-light">
                            {{ store.selected.user?.phone_number || 'Chưa có số điện thoại' }}</p>
                        <div class="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-primary"><a v-if="emailHref"
                                :href="emailHref" target="_blank" rel="noopener noreferrer" class="underline">Soạn thư
                                trong Gmail</a><a v-if="phoneHref" :href="phoneHref" class="underline">Gọi điện</a>
                        </div>
                        <p v-if="emailHref" class="mt-2 text-xs text-text-light">Mở bản nháp Gmail; nhân viên cần tự
                            kiểm tra và bấm Gửi.</p>
                    </div>
                    <article>
                        <h3 class="break-words text-lg font-bold">{{ store.selected.subject }}</h3>
                        <p class="mt-1 text-xs text-text-light">Gửi lúc {{ date(store.selected.created_at) }}</p>
                        <p class="mt-4 whitespace-pre-line break-words text-sm leading-7">{{ store.selected.message }}
                        </p>
                    </article>
                    <p v-if="store.message" role="status" class="rounded-xl bg-green-50 p-3 text-sm text-green-700">{{
                        store.message }}</p>
                    <p v-if="store.actionError" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">{{
                        store.actionError }}</p>
                    <div v-if="store.needsReload" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Bạn có thể
                        sao chép ghi chú đang soạn, rồi tải lại chi tiết trước khi lưu tiếp.</div>
                    <form class="space-y-4 border-t border-border pt-5" @submit.prevent="save">
                        <label class="block text-sm font-semibold">Trạng thái<select v-model="store.form.status"
                                :disabled="!canUpdate || store.saving || store.needsReload"
                                class="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm disabled:opacity-60">
                                <option v-for="(label, value) in statusNames" :key="value" :value="value">{{ label }}
                                </option>
                            </select></label>
                        <label class="block text-sm font-semibold">Ghi chú nội bộ<textarea
                                v-model="store.form.admin_note" :readonly="!canUpdate" :disabled="store.saving"
                                :required="store.form.status === 'rejected'" maxlength="5000" rows="5"
                                placeholder="Ghi lại cách đã hỗ trợ, nội dung trao đổi hoặc lý do từ chối..."
                                class="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-sm font-normal disabled:opacity-60"></textarea></label>
                        <p class="text-xs leading-5 text-text-light">Ghi chú chỉ dành cho nhân viên, không hiển thị cho
                            khách. Nút Lưu không gửi email; hãy liên hệ khách qua email hoặc điện thoại nếu cần phản
                            hồi.</p>
                        <p v-if="store.selected.updater" class="text-xs text-text-light">Cập nhật bởi {{
                            store.selected.updater.name }} · {{ date(store.selected.updated_at) }}</p>
                        <p v-if="store.selected.processed_at" class="text-xs text-text-light">Kết thúc xử lý: {{
                            date(store.selected.processed_at) }}</p>
                        <div class="flex flex-wrap justify-end gap-3 border-t border-border pt-4"><button type="button"
                                :disabled="store.saving" @click="reloadDetail"
                                class="btn-outline-sm disabled:opacity-50">Tải lại chi tiết</button><button
                                v-if="canUpdate" type="submit" :disabled="store.saving || store.needsReload"
                                class="btn-primary disabled:opacity-50">
                                <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold'"
                                    :class="{ 'animate-spin': store.saving }" />
                                {{ store.saving ? 'Đang lưu...' : 'Lưu xử lý' }}
                            </button></div>
                    </form>
                </template>
            </div>
        </dialog>
    </div>
</template>