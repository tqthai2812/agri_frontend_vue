<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import VnpayService from "@/services/client/vnpay.service";

const props = defineProps({ order: { type: Object, required: true }, disabled: Boolean });
const emit = defineEmits(["updated"]);
const busy = ref(false);
const error = ref("");
const notice = ref("");
const now = ref(Date.now());
const timer = window.setInterval(() => { now.value = Date.now(); }, 1000);
onBeforeUnmount(() => window.clearInterval(timer));
const remaining = computed(() => Math.max(0,
    Math.ceil((new Date(props.order.payment_expires_at).getTime() - now.value) / 1000) || 0));
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, "0")}`);
const label = computed(() => props.order.is_paid ? "Đã thanh toán"
    : props.order.payment?.status_label || "Chờ thanh toán");
function errorText(err) {
    const first = Object.values(err.response?.data?.errors || {})[0];
    return (Array.isArray(first) ? first[0] : first) || err.response?.data?.message || err.message || "Không xử lý được yêu cầu.";
}
async function run(action) {
    if (busy.value || props.disabled) return;
    busy.value = true; error.value = ""; notice.value = "";
    const id = props.order.id;
    try {
        if (action === "pay") {
            const response = await VnpayService.pay(id);
            VnpayService.redirect(response.data?.data?.payment_redirect_url);
        } else {
            const response = await VnpayService.check(id);
            if (Number(props.order.id) !== Number(id)) return;
            emit("updated", response.data?.data);
            notice.value = response.data?.message || "Đã cập nhật trạng thái.";
        }
    } catch (err) { error.value = errorText(err); }
    finally { busy.value = false; }
}
</script>

<template>
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-bold text-[#123d27]">{{ order.payment_method_label }}</h2>
            <strong :class="order.is_paid ? 'text-green-700' : 'text-amber-700'">{{ label }}</strong>
        </div>
        <p v-if="order.payment_review" role="alert" class="mt-3 text-sm text-red-600">
            Khoản thanh toán cần được cửa hàng kiểm tra. {{ order.payment_review }}
        </p>
        <template v-else-if="order.payment_method === 'VNPAY'">
            <p v-if="order.is_paid" class="mt-3 text-sm text-green-700">
                Hệ thống đã ghi nhận thanh toán. Trạng thái xử lý đơn hàng được theo dõi riêng bên dưới.
            </p>
            <template v-else-if="order.order_status === 'pending'">
                <p class="mt-3 text-sm text-slate-600" v-if="remaining > 0">
                    Thời gian thanh toán còn {{ clock }}. Thanh toán lại không gia hạn đơn.
                </p>
                <p v-else class="mt-3 text-sm text-amber-700">
                    Đã hết thời gian thanh toán. Hệ thống đang đối chiếu kết quả trước khi hủy đơn và trả lượng hàng
                    đang giữ.
                </p>
            </template>
            <div class="mt-4 flex flex-wrap gap-3">
                <button v-if="order.can_pay && remaining > 0" type="button"
                    class="rounded-full bg-[#07532b] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                    :disabled="busy || disabled" @click="run('pay')">Tiếp tục thanh toán VNPAY</button>
                <button v-if="!order.is_paid && order.order_status !== 'cancelled'" type="button"
                    class="rounded-full border border-[#07532b] px-5 py-2 text-sm text-[#07532b] disabled:opacity-50"
                    :disabled="busy || disabled" @click="run('check')">
                    {{ busy ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán' }}</button>
            </div>
        </template>
        <p v-if="notice" role="status" class="mt-3 text-sm text-slate-600">{{ notice }}</p>
        <p v-if="error" role="alert" class="mt-3 text-sm text-red-600">{{ error }}</p>
    </section>
</template>