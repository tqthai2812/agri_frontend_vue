<script setup>
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { useAdminContactStore } from "@/stores/admin/contactStore";
const store = useAdminContactStore();
defineProps({ canUpdate: Boolean, statusNames: Object, date: Function, phoneHref: String, emailHref: String });
const emit = defineEmits(["close", "reload", "save"]);
const dialog = ref(null);
// Parent giữ nguyên watcher mở/đóng và kiểm tra quyền; chỉ chuyển phần HTML sang đây.
defineExpose({ element: dialog });
</script>

<template>
<dialog ref="dialog" aria-label="Chi tiết liên hệ" @cancel.prevent="emit('close')"
            class="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50">
            <header
                class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
                <h2 class="text-xl font-bold">{{ store.selected?.code || 'Chi tiết liên hệ' }}</h2><button type="button"
                    autofocus aria-label="Đóng chi tiết" :disabled="store.saving" @click="emit('close')"
                    class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </header>
            <div class="space-y-6 p-5 sm:p-6">
                <p v-if="store.loadingDetail" role="status" class="py-8 text-center text-sm text-text-light">Đang tải
                    chi
                    tiết...</p>
                <div v-else-if="store.detailError" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{
                    store.detailError }}<button type="button" @click="emit('reload')" class="btn-outline-sm ml-2 cursor-pointer disabled:cursor-not-allowed">Thử
                        lại</button></div>
                <template v-else-if="store.selected">
                    <div class="rounded-2xl border border-border bg-surface p-5 shadow-sm"><strong>{{ store.selected.user?.name || 'Người gửi' }}</strong>
                        <p class="mt-1 break-all text-sm text-text-light">{{ store.selected.user?.email }}</p>
                        <p class="mt-1 text-sm text-text-light">
                            {{ store.selected.user?.phone_number || 'Chưa có số điện thoại' }}</p>
                        <div class="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-primary"><a v-if="emailHref"
                                :href="emailHref" target="_blank" rel="noopener noreferrer" class="cursor-pointer underline">Soạn thư
                                trong Gmail</a><a v-if="phoneHref" :href="phoneHref" class="cursor-pointer underline">Gọi điện</a>
                        </div>
                        <p v-if="emailHref" class="mt-2 text-xs text-text-light">Mở bản nháp Gmail; nhân viên cần tự
                            kiểm tra và bấm Gửi.</p>
                    </div>
                    <article class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                        <h3 class="break-words text-lg font-bold">{{ store.selected.subject }}</h3>
                        <p class="mt-1 text-xs text-text-light">Gửi lúc {{ date(store.selected.created_at) }}</p>
                        <p class="mt-4 whitespace-pre-line break-words text-sm leading-7">{{ store.selected.message }}
                        </p>
                    </article>
                    <p v-if="store.message" role="status" class="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{{
                        store.message }}</p>
                    <p v-if="store.actionError" role="alert" class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{{
                        store.actionError }}</p>
                    <div v-if="store.needsReload" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bạn có thể
                        sao chép ghi chú đang soạn, rồi tải lại chi tiết trước khi lưu tiếp.</div>
                    <form class="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm" @submit.prevent="emit('save')">
                        <label class="form-group"><span class="form-label">Trạng thái</span><select v-model="store.form.status"
                                :disabled="!canUpdate || store.saving || store.needsReload"
                                class="form-control">
                                <option v-for="(label, value) in statusNames" :key="value" :value="value">{{ label }}
                                </option>
                            </select></label>
                        <label class="form-group"><span class="form-label">Ghi chú nội bộ</span><textarea
                                v-model="store.form.admin_note" :readonly="!canUpdate" :disabled="store.saving"
                                :required="store.form.status === 'rejected'" maxlength="5000" rows="5"
                                placeholder="Ghi lại cách đã hỗ trợ, nội dung trao đổi hoặc lý do từ chối..."
                                class="form-control"></textarea></label>
                        <p class="text-xs leading-5 text-text-light">Ghi chú chỉ dành cho nhân viên, không hiển thị cho
                            khách. Nút Lưu không gửi email; hãy liên hệ khách qua email hoặc điện thoại nếu cần phản
                            hồi.</p>
                        <p v-if="store.selected.updater" class="text-xs text-text-light">Cập nhật bởi {{
                            store.selected.updater.name }} · {{ date(store.selected.updated_at) }}</p>
                        <p v-if="store.selected.processed_at" class="text-xs text-text-light">Kết thúc xử lý: {{
                            date(store.selected.processed_at) }}</p>
                        <div class="flex flex-wrap justify-end gap-3 border-t border-border pt-4"><button type="button"
                                :disabled="store.saving" @click="emit('reload')"
                                class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed">Tải lại chi tiết</button><button
                                v-if="canUpdate" type="submit" :disabled="store.saving || store.needsReload"
                                class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                                <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold'"
                                    :class="{ 'animate-spin': store.saving }" />
                                {{ store.saving ? 'Đang lưu...' : 'Lưu xử lý' }}
                            </button></div>
                    </form>
                </template>
            </div>
        </dialog>
</template>