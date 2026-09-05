<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/authStore";
import CategoryDropdown from "./CategoryDropdown.vue";

defineProps({
    categories: {
        type: Array,
        default: () => [],
    },
    cartCount: {
        type: Number,
        default: 0,
    },
    wishlistCount: {
        type: Number,
        default: 0,
    },
    searchOpen: {
        type: Boolean,
        default: false,
    },
    mobileMenuOpen: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["toggle-search", "toggle-mobile"]);

const authStore = useAuthStore();

const navItems = [
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
];

const currentUser = computed(() => authStore.user || {});

const userInitials = computed(() => {
    const name = currentUser.value.name || currentUser.value.email || "U";

    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
});

const avatarUrl = computed(() => {
    const avatar = currentUser.value.avatar;

    if (!avatar) {
        return "";
    }

    if (/^(https?:|data:|blob:)/i.test(avatar)) {
        return avatar;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    const backendUrl = apiUrl
        .replace(/\/api\/?$/, "")
        .replace(/\/$/, "");

    const avatarPath = String(avatar).replace(/^\/+/, "");

    return avatarPath.startsWith("storage/")
        ? `${backendUrl}/${avatarPath}`
        : `${backendUrl}/storage/${avatarPath}`;
});
</script>

<template>
    <header class="border-b border-slate-100 bg-white shadow-sm">
        <div class="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-4 sm:px-6">
            <RouterLink to="/" class="flex shrink-0 items-center gap-2" aria-label="NFarmHouse - Trang chủ">
                <span class="text-4xl font-light leading-none text-[#e6b51b]">
                    N
                </span>

                <span>
                    <strong class="block text-[17px] leading-none text-slate-900">
                        NFarmHouse
                    </strong>

                    <small class="mt-1 block text-[7px] uppercase tracking-[0.18em] text-slate-400">
                        Agricultural professor
                    </small>
                </span>
            </RouterLink>

            <nav class="hidden items-center gap-9 text-[13px] font-semibold text-[#174e31] lg:flex">
                <RouterLink to="/" class="transition hover:text-[#d6a900]" exact-active-class="text-[#d6a900]">
                    Trang chủ
                </RouterLink>

                <CategoryDropdown :categories="categories" />

                <RouterLink v-for="item in navItems" :key="item.label" :to="item.to"
                    class="transition hover:text-[#d6a900]" active-class="text-[#d6a900]">
                    {{ item.label }}
                </RouterLink>

                <RouterLink to="/diagnosis" class="flex items-center gap-2 transition hover:text-[#d6a900]"
                    active-class="text-[#d6a900]">
                    <span class="rounded-md bg-[#ff4056] px-2 py-1 text-[9px] font-bold uppercase text-white">
                        New
                    </span>

                    <span>Chẩn đoán bệnh lúa</span>
                </RouterLink>
            </nav>

            <div class="hidden items-center gap-2 lg:flex">
                <button type="button" class="header-action" :class="searchOpen ? 'border-[#07532b] bg-[#edf5f0]' : ''"
                    :aria-expanded="searchOpen" aria-label="Mở thanh tìm kiếm" @click="$emit('toggle-search')">
                    <Icon :icon="searchOpen ? 'mdi:close' : 'mdi:magnify'" class="text-xl" />
                </button>

                <template v-if="authStore.isAuthenticated">
                    <RouterLink to="/cart" class="header-action relative" aria-label="Giỏ hàng">
                        <Icon icon="mdi:cart-outline" class="text-xl" />

                        <span v-if="cartCount" class="header-badge">
                            {{ cartCount > 99 ? "99+" : cartCount }}
                        </span>
                    </RouterLink>

                    <RouterLink to="/wishlist" class="header-action relative" aria-label="Danh sách yêu thích">
                        <Icon icon="mdi:heart-outline" class="text-xl" />

                        <span v-if="wishlistCount" class="header-badge">
                            {{ wishlistCount > 99 ? "99+" : wishlistCount }}
                        </span>
                    </RouterLink>

                    <RouterLink to="/profile" class="header-action overflow-hidden text-xs font-bold"
                        :title="currentUser.name || 'Tài khoản'" aria-label="Tài khoản">
                        <img v-if="avatarUrl" :src="avatarUrl" :alt="currentUser.name || 'Ảnh đại diện'"
                            class="size-full object-cover" />

                        <span v-else>
                            {{ userInitials }}
                        </span>
                    </RouterLink>
                </template>

                <template v-else>
                    <RouterLink :to="{ name: 'login' }"
                        class="group flex h-10 items-center rounded-full bg-[#07532b] py-1 pl-5 pr-1 text-xs font-bold text-white transition hover:bg-[#064522]">
                        <span class="whitespace-nowrap">
                            Đăng Nhập
                        </span>

                        <span
                            class="ml-3 grid size-8 place-items-center rounded-full bg-[#ffc928] text-[#07532b] transition group-hover:translate-x-0.5">
                            <Icon icon="mdi:chevron-right" class="text-xl" />
                        </span>
                    </RouterLink>

                    <RouterLink :to="{ name: 'register' }"
                        class="flex h-10 items-center rounded-full border border-[#8da99a] px-5 text-xs font-bold text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]">
                        Đăng Ký
                    </RouterLink>
                </template>
            </div>

            <button type="button" class="grid size-10 place-items-center rounded-full bg-[#07532b] text-white lg:hidden"
                :aria-expanded="mobileMenuOpen" aria-label="Mở menu" @click="$emit('toggle-mobile')">
                <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="text-2xl" />
            </button>
        </div>
    </header>
</template>

<style scoped>
@reference "../../../../style.css";

.header-action {
    @apply grid size-10 place-items-center rounded-full border border-[#aec2b4] text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0];
}

.header-badge {
    @apply absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ffd326] text-[10px] font-bold text-[#07532b];
}
</style>