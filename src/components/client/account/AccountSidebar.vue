<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => {
    return authStore.user || {}
})

const avatar = computed(() => {
    return (
        user.value.avatar ||
        'https://i.pravatar.cc/200?img=12'
    )
})

const navItems = [
    {
        name: 'profile',
        label: 'Hồ sơ',
        description: 'Thông tin cá nhân',
        icon: 'mdi:account-outline',
    },
    {
        name: 'account-addresses',
        label: 'Địa chỉ',
        description: 'Địa chỉ nhận hàng',
        icon: 'mdi:map-marker-outline',
    },
    {
        name: 'account-password',
        label: 'Đổi mật khẩu',
        description: 'Bảo mật tài khoản',
        icon: 'mdi:lock-outline',
    },
    {
        name: 'my-orders',
        label: 'Đơn mua',
        description: 'Theo dõi đơn hàng',
        icon: 'mdi:clipboard-text-outline',
    },
]

const currentName = computed(() => {
    return String(route.name || '')
})

function isActive(item) {
    if (item.name === 'my-orders') {
        return ['my-orders', 'order-detail'].includes(
            currentName.value,
        )
    }

    return currentName.value === item.name
}
</script>

<template>
    <aside class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
        <div class="relative overflow-hidden bg-gradient-to-br from-[#064b26] to-[#0b6a38] px-5 pb-5 pt-6 text-white">
            <div class="absolute -right-8 -top-8 size-28 rounded-full bg-[#ffd326]/15"></div>

            <div class="absolute -bottom-10 -left-6 size-24 rounded-full bg-white/5"></div>

            <div class="relative flex items-center gap-3">
                <div class="relative shrink-0">
                    <img :src="avatar" :alt="user.name"
                        class="size-14 rounded-full border-2 border-white/80 object-cover shadow-lg" />

                    <span
                        class="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-[#ffd326] text-[#07532b] ring-2 ring-[#07532b]">
                        <Icon icon="mdi:check" class="text-xs" />
                    </span>
                </div>

                <div class="min-w-0">
                    <strong class="block truncate text-sm">
                        {{ user.name }}
                    </strong>

                    <span class="mt-1 block truncate text-[10px] text-white/65">
                        {{ user.email }}
                    </span>

                    <RouterLink :to="{ name: 'profile' }"
                        class="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#ffd326] hover:underline">
                        <Icon icon="mdi:pencil-outline" />
                        Sửa hồ sơ
                    </RouterLink>
                </div>
            </div>
        </div>

        <nav class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:block lg:space-y-1" aria-label="Điều hướng tài khoản">
            <RouterLink v-for="item in navItems" :key="item.name" :to="{ name: item.name }"
                class="group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition" :class="isActive(item)
                    ? 'bg-[#edf5f0] text-[#07532b]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#07532b]'
                    ">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl transition" :class="isActive(item)
                    ? 'bg-[#07532b] text-white shadow-[0_7px_18px_rgba(7,83,43,0.2)]'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-[#dfeee4] group-hover:text-[#07532b]'
                    ">
                    <Icon :icon="item.icon" class="text-xl" />
                </span>

                <span class="min-w-0">
                    <strong class="block truncate text-xs">
                        {{ item.label }}
                    </strong>

                    <small class="mt-0.5 hidden truncate text-[9px] font-normal text-slate-400 xl:block">
                        {{ item.description }}
                    </small>
                </span>

                <Icon v-if="isActive(item)" icon="mdi:chevron-right" class="ml-auto hidden text-lg lg:block" />
            </RouterLink>
        </nav>

        <div class="hidden border-t border-slate-100 p-4 lg:block">
            <div class="flex items-start gap-2 rounded-2xl bg-[#fff8dc] p-3 text-[10px] leading-4 text-[#745b12]">
                <Icon icon="mdi:shield-check-outline" class="mt-0.5 shrink-0 text-lg text-[#b28a08]" />

                Thông tin tài khoản của bạn luôn được
                NFarmHouse bảo mật.
            </div>
        </div>
    </aside>
</template>