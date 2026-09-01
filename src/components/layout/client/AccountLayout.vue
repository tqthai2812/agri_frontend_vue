<script setup>
import { Icon } from '@iconify/vue'
import AccountSidebar from '@/components/client/account/AccountSidebar.vue'
</script>

<template>
    <div class="min-h-[70vh] bg-[#f6f8f6] font-sans text-slate-800">
        <div class="border-b border-slate-100 bg-white">
            <div class="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
                <nav class="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <RouterLink to="/" class="transition hover:text-[#07532b]">
                        Trang chủ
                    </RouterLink>

                    <Icon icon="mdi:chevron-right" />

                    <span class="font-medium text-[#174e31]">
                        Tài khoản của tôi
                    </span>
                </nav>
            </div>
        </div>

        <main class="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            <div class="grid items-start gap-6 lg:grid-cols-[265px_minmax(0,1fr)]">
                <AccountSidebar />

                <div class="min-w-0">
                    <RouterView />
                </div>
            </div>
        </main>
    </div>
</template>