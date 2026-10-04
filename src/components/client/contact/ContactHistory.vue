<script setup>
import { useClientContactStore } from "@/stores/client/contactStore";
const store = useClientContactStore();
function date(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN"); }
function pageTo(page) { if (!store.loading && page >= 1 && page <= store.meta.last_page) store.fetchContacts(page); }
const badge = (status) => ({ pending: "bg-amber-50 text-amber-700", resolved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-600" }[status] || "bg-slate-100 text-slate-500");
</script>
<template>
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 class="text-lg font-bold text-[#123d27]">Lịch sử liên hệ</h2>
                <p class="mt-1 text-xs text-slate-500">Chỉ hiển thị yêu cầu do bạn gửi.</p>
            </div><button type="button" :disabled="store.loading || store.submitting" @click="store.fetchContacts()"
                class="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#07532b] disabled:opacity-50">Tải
                lại</button>
        </header>
        <label class="mt-5 block text-xs text-slate-500">Lọc trạng thái<select v-model="store.filters.status"
                :disabled="store.loading || store.submitting" @change="store.fetchContacts(1)"
                class="ml-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Tất cả</option>
                <option value="pending">Chờ xử lý</option>
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
            </select></label>
        <p v-if="store.loading" role="status" class="py-10 text-center text-sm text-slate-400">Đang tải lịch sử...</p>
        <p v-else-if="store.listError" role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">{{
            store.listError }}</p>
        <p v-else-if="!store.contacts.length" class="py-10 text-center text-sm text-slate-400">Chưa có yêu cầu phù hợp.
        </p>
        <div v-else class="mt-5 space-y-3">
            <details v-for="contact in store.contacts" :key="contact.id"
                class="rounded-2xl border border-slate-200 p-4">
                <summary class="cursor-pointer"><span class="ml-1 text-xs font-semibold text-[#07532b]">{{ contact.code
                }}</span><span class="ml-3 rounded-full px-2 py-1 text-[10px] font-bold"
                        :class="badge(contact.status)">{{ contact.status_label }}</span><strong
                        class="mt-3 block break-words text-sm text-slate-700">{{ contact.subject }}</strong><span
                        class="mt-1 block text-xs text-slate-400">Gửi lúc {{ date(contact.created_at) }}</span>
                </summary>
                <p
                    class="mt-4 whitespace-pre-line break-words border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                    {{ contact.message }}</p>
                <p v-if="contact.processed_at" class="mt-3 text-xs text-slate-400">Kết thúc xử lý: {{
                    date(contact.processed_at) }}</p>
                <p v-if="contact.status === 'rejected'" class="mt-3 text-xs text-slate-500">Nếu cần làm rõ kết quả, vui
                    lòng gọi cửa hàng và cung cấp mã yêu cầu.</p>
            </details>
        </div>
        <nav v-if="!store.listError && store.meta.last_page > 1" aria-label="Phân trang lịch sử liên hệ"
            class="mt-5 flex items-center justify-center gap-4 text-xs"><button type="button"
                :disabled="store.loading || store.meta.current_page <= 1" @click="pageTo(store.meta.current_page - 1)"
                class="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><span>{{ store.meta.current_page
                }} / {{ store.meta.last_page }}</span><button type="button"
                :disabled="store.loading || store.meta.current_page >= store.meta.last_page"
                @click="pageTo(store.meta.current_page + 1)"
                class="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></nav>
    </section>
</template>