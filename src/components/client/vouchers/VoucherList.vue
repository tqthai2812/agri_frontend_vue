<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import VoucherService from "@/services/client/voucher.service";
const props = defineProps({ selectable: Boolean, disabled: Boolean });
const emit = defineEmits(["select"]);
const rows = ref([]), loading = ref(false), error = ref(""), notice = ref("");
const scope = ref(""), page = ref(1), lastPage = ref(1), total = ref(0);
let version = 0, disposed = false;
function money(value) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0)); }
function date(value) { return String(value || "").split("-").reverse().join("/"); }
async function load(next = 1) {
    const request = ++version;
    loading.value = true; error.value = ""; rows.value = []; notice.value = "";
    try {
        const response = await VoucherService.list({ page: next, per_page: props.selectable ? 6 : 12, scope: scope.value || undefined });
        if (disposed || request !== version) return;
        rows.value = response.data.data || [];
        page.value = response.data.current_page || 1;
        lastPage.value = response.data.last_page || 1;
        total.value = response.data.total || 0;
    } catch (e) {
        if (!disposed && request === version) error.value = e.response?.data?.message || "Không tải được kho voucher. Vui lòng thử lại.";
    } finally { if (!disposed && request === version) loading.value = false; }
}
async function copy(code) {
    notice.value = "";
    try { await navigator.clipboard.writeText(code); if (!disposed) notice.value = `Đã sao chép ${code}. Dán mã tại bước thanh toán.`; }
    catch { if (!disposed) notice.value = `Không sao chép tự động được. Bạn có thể chọn và sao chép mã ${code}.`; }
}
onMounted(() => load());
onBeforeUnmount(() => { disposed = true; version++; });
</script>
<template>
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-2" aria-label="Loại voucher">
                <button
                    v-for="option in [{ value: '', label: 'Tất cả' }, { value: 'order', label: 'Toàn sàn' }, { value: 'lot', label: 'Xả kho' }]"
                    :key="option.value" type="button" :disabled="disabled" :aria-pressed="scope === option.value"
                    class="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-40"
                    :class="scope === option.value ? 'border-[#07532b] bg-[#07532b] text-white' : 'border-slate-200 bg-white text-slate-600'"
                    @click="scope = option.value; load()">{{ option.label }}</button>
            </div>
            <button type="button" :disabled="loading || disabled"
                class="text-xs font-semibold text-[#07532b] disabled:opacity-40" @click="load(page)">Tải lại</button>
        </div>
        <p v-if="notice" role="status" class="rounded-xl bg-[#edf5f0] p-3 text-sm text-[#07532b]">{{ notice }}</p>
        <p v-if="loading" role="status" class="py-8 text-center text-sm text-slate-500">Đang tải voucher...</p>
        <div v-else-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {{ error }} <button type="button" class="ml-2 underline" @click="load(page)">Thử lại</button>
        </div>
        <template v-else>
            <div v-if="!rows.length"
                class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                <Icon icon="mdi:ticket-percent-outline" class="mx-auto mb-3 text-4xl text-slate-300" />
                Hiện chưa có voucher phù hợp. Hãy quay lại sau nhé.
            </div>
            <div v-else class="grid gap-4" :class="selectable ? '' : 'xl:grid-cols-2'">
                <article v-for="voucher in rows" :key="voucher.id"
                    class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div
                        class="flex items-center justify-between gap-3 border-b border-dashed border-slate-200 bg-[#f2f8f4] px-5 py-3">
                        <span class="flex items-center gap-2 text-xs font-bold text-[#07532b]">
                            <Icon icon="mdi:ticket-percent-outline" class="text-xl" />{{ voucher.discount_scope ===
                                'lot' ? 'Ưu đãi xả kho' : 'Ưu đãi toàn sàn' }}
                        </span>
                        <strong class="text-2xl text-[#07532b]">−{{ voucher.discount_percent }}%</strong>
                    </div>
                    <div class="space-y-3 p-5">
                        <h3 class="text-sm font-bold leading-6 text-slate-800">{{ voucher.discount_description }}</h3>
                        <p class="text-xs leading-5 text-slate-500">Giảm tối đa {{ money(voucher.max_discount_amount) }}
                            · {{ voucher.discount_scope === 'lot' ? 'Tiền hàng từ lô áp dụng tối thiểu' :
                                'Tổng tiền hàng tối thiểu' }} {{ money(voucher.min_order_value) }}.</p>
                        <div v-if="voucher.lot" class="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                            <strong>{{ voucher.lot.product_name }} · {{ voucher.lot.sku }}</strong>
                            <p>Lô {{ voucher.lot.lot_code }} · Hạn dùng {{ date(voucher.lot.expires_on) }}</p>
                            <p>Chỉ giảm trên số lượng thực tế được lấy từ lô này. Mức giảm được kiểm tra khi thanh toán.
                            </p>
                            <RouterLink v-if="!selectable && voucher.lot.product_id"
                                :to="{ name: 'client-product-detail', params: { id: voucher.lot.product_id } }"
                                class="mt-1 inline-block font-bold underline">Xem sản phẩm</RouterLink>
                        </div>
                        <p class="text-xs text-slate-400">Dùng đến hết ngày {{ date(voucher.expire_date) }} · Mỗi đơn
                            dùng 1 mã.</p>
                        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <code class="break-all text-sm font-bold text-[#07532b]">{{ voucher.discount_code }}</code>
                            <button type="button" :disabled="disabled"
                                class="rounded-full bg-[#07532b] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                                @click="selectable ? emit('select', voucher.discount_code) : copy(voucher.discount_code)">{{
                                    selectable ? 'Chọn mã' : 'Sao chép mã' }}</button>
                        </div>
                    </div>
                </article>
            </div>
            <nav v-if="lastPage > 1" class="flex items-center justify-center gap-4 text-sm" aria-label="Trang voucher">
                <button type="button" :disabled="disabled || page <= 1"
                    class="rounded-lg border px-3 py-2 disabled:opacity-40" @click="load(page - 1)">Trước</button>
                <span>{{ page }} / {{ lastPage }} · {{ total }} mã</span>
                <button type="button" :disabled="disabled || page >= lastPage"
                    class="rounded-lg border px-3 py-2 disabled:opacity-40" @click="load(page + 1)">Sau</button>
            </nav>
        </template>
    </div>
</template>