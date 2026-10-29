<script setup>
import VoucherList from "@/components/client/vouchers/VoucherList.vue";
</script>
<template>
    <section class="mx-auto w-full max-w-[1100px] p-4 sm:p-6">
        <header class="mb-6">
            <p class="mb-2 text-xs font-bold uppercase tracking-widest text-[#0a7a3d]">Ưu đãi NFarmHouse</p>
            <h1 class="text-2xl font-bold text-[#123d27]">Kho voucher</h1>
            <p class="mt-2 text-sm leading-6 text-slate-500">Chọn ưu đãi cho lần mua sắm tiếp theo. Sao chép mã hoặc
                chọn trực tiếp tại bước thanh toán.</p>
        </header>
        <VoucherList />
    </section>
</template>