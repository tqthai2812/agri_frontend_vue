<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)
const menuRef = ref(null)

const user = computed(() => {
    return authStore.user || {}
})

const avatar = computed(() => {
    return (
        user.value.avatar ||
        'https://i.pravatar.cc/160?img=12'
    )
})

const menuItems = [
    {
        name: 'profile',
        label: 'Hồ sơ của tôi',
        icon: 'mdi:account-outline',
    },
    {
        name: 'account-addresses',
        label: 'Địa chỉ nhận hàng',
        icon: 'mdi:map-marker-outline',
    },
    {
        name: 'my-orders',
        label: 'Đơn mua',
        icon: 'mdi:clipboard-text-outline',
    },
]

function handleOutside(event) {
    if (
        !menuRef.value?.contains(event.target)
    ) {
        menuOpen.value = false
    }
}

async function logout() {
    menuOpen.value = false
    await authStore.logout()
    await router.push({ name: 'login' })
}

onMounted(() => {
    document.addEventListener(
        'click',
        handleOutside,
    )
})

onBeforeUnmount(() => {
    document.removeEventListener(
        'click',
        handleOutside,
    )
})
</script>

<template>
    <div ref="menuRef" class="relative">
        <button type="button"
            class="flex items-center gap-2 rounded-full border border-[#aec2b4] bg-white p-1 text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
            :aria-expanded="menuOpen" @click.stop="
                menuOpen = !menuOpen
                ">
            <img :src="avatar" :alt="user.name || 'Tài khoản'" class="size-8 rounded-full object-cover" />

            <span class="hidden max-w-28 truncate pr-1 text-xs font-semibold xl:block">
                {{ user.name || 'Tài khoản' }}
            </span>

            <Icon icon="mdi:chevron-down" class="mr-1 hidden text-base xl:block" />
        </button>

        <Transition enter-active-class="transition duration-150" enter-from-class="translate-y-2 opacity-0"
            leave-active-class="transition duration-100" leave-to-class="translate-y-2 opacity-0">
            <div v-if="menuOpen"
                class="absolute right-0 top-[calc(100%+10px)] z-[90] w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_50px_rgba(6,75,38,0.16)]">
                <div class="border-b border-slate-100 bg-[#f5f9f6] px-4 py-4">
                    <strong class="block truncate text-sm text-[#123d27]">
                        {{ user.name || 'Người dùng' }}
                    </strong>

                    <span class="mt-1 block truncate text-[10px] text-slate-400">
                        {{ user.email }}
                    </span>
                </div>

                <nav class="p-2">
                    <RouterLink v-for="item in menuItems" :key="item.name" :to="{ name: item.name }"
                        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-[#edf5f0] hover:text-[#07532b]"
                        @click="menuOpen = false">
                        <Icon :icon="item.icon" class="text-xl" />

                        {{ item.label }}
                    </RouterLink>
                </nav>

                <div class="border-t border-slate-100 p-2">
                    <button type="button"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        @click="logout">
                        <Icon icon="mdi:logout" class="text-xl" />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>