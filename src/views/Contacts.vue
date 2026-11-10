<script setup>
import ContactStats from "@/components/admin/contacts/ContactStats.vue";
import ContactFilters from "@/components/admin/contacts/ContactFilters.vue";
import ContactTable from "@/components/admin/contacts/ContactTable.vue";
import ContactPagination from "@/components/admin/contacts/ContactPagination.vue";
import ContactModal from "@/components/admin/contacts/ContactModal.vue";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const authStore = useAuthStore(), store = useAdminContactStore();
const detailModal = ref(null);
const dialog = computed(() => detailModal.value?.element || null);
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
  <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div><h1 class="text-2xl font-bold">Quản lý liên hệ</h1><p class="text-sm text-text-light">Tiếp nhận yêu cầu, liên hệ khách hàng và ghi nhận kết quả xử lý.</p></div>
    <button type="button" :disabled="store.loading || !canView" @click="store.fetchContacts()" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"><Icon icon="solar:refresh-bold" :class="{ 'animate-spin': store.loading }" />Tải lại</button>
  </header>
  <p v-if="!canView" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">Bạn không có quyền xem liên hệ.</p>
  <template v-else>
    <ContactStats :stats="stats" />
    <div v-if="store.message" role="status" class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"><Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" /><span>{{ store.message }}</span></div>
    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <ContactFilters :status-names="statusNames" @apply="applyFilters" @reset="resetFilters" />
      <ContactTable :date="date" @open="open" />
      <ContactPagination @change="pageTo" />
    </section>
  </template>
  <ContactModal ref="detailModal" :can-update="canUpdate" :status-names="statusNames" :date="date" :phone-href="phoneHref" :email-href="emailHref" @close="close" @reload="reloadDetail" @save="save" />
</div>
</template>