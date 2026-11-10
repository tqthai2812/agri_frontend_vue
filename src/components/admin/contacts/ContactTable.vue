<script setup>
import { Icon } from "@iconify/vue";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const store = useAdminContactStore();
defineProps({ date: Function });
const emit = defineEmits(["open"]);
function badge(status) { return { pending: "badge-pending", resolved: "badge-active", rejected: "badge-inactive" }[status] || "badge-gray"; }
</script>

<template>
<div v-if="store.loading" role="status" class="py-10 text-center text-text-light"><Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" /><p class="text-sm">Đang tải liên hệ...</p></div>
<div v-else-if="store.listError" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{ store.listError }}</div>
<div v-else class="overflow-x-auto">
  <table class="w-full min-w-[1000px]">
    <thead class="bg-bg"><tr><th v-for="title in ['Yêu cầu', 'Người gửi', 'Trạng thái', 'Ngày gửi', 'Thao tác']" :key="title" class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">{{ title }}</th></tr></thead>
    <tbody>
      <tr v-for="contact in store.contacts" :key="contact.id" class="border-b border-border transition hover:bg-primary/5">
        <td class="max-w-sm p-3"><strong class="font-mono text-sm text-primary">{{ contact.code }}</strong><p class="mt-1 break-words text-sm font-semibold">{{ contact.subject }}</p><p class="mt-1 line-clamp-2 break-words text-xs text-text-light">{{ contact.message }}</p></td>
        <td class="p-3 text-sm"><p>{{ contact.user?.name || 'Tài khoản không còn tồn tại' }}</p><p class="mt-1 text-xs text-text-light">{{ contact.user?.email }}</p><p class="mt-1 text-xs text-text-light">{{ contact.user?.phone_number }}</p></td>
        <td class="p-3"><span :class="badge(contact.status)">{{ contact.status_label }}</span></td>
        <td class="p-3 text-sm text-text-light">{{ date(contact.created_at) }}</td>
        <td class="p-3"><button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed" title="Xem / xử lý liên hệ" aria-label="Xem hoặc xử lý liên hệ" @click="emit('open', contact)"><Icon icon="solar:eye-bold" /></button></td>
      </tr>
      <tr v-if="!store.contacts.length"><td colspan="5" class="p-8 text-center text-sm text-text-light">Không có yêu cầu phù hợp.</td></tr>
    </tbody>
  </table>
</div>
</template>