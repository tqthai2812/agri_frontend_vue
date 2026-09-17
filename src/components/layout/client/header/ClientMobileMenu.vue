<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";

defineProps({
    open: {
        type: Boolean,
        default: false,
    },
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
});

const emit = defineEmits(["close", "search"]);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const categoryOpen = ref(false);

const navItems = [
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
];

function productsLink() {
    return router.hasRoute("client-products")
        ? { name: "client-products" }
        : { name: "home" };
}

function categoryLink(category) {
    return {
        name: router.hasRoute("client-products")
            ? "client-products"
            : "home",

        query: {
            category: category.slug || category.id,
        },
    };
}

function openSearch() {
    emit("close");
    emit("search");
}

watch(
    () => route.fullPath,
    () => {
        categoryOpen.value = false;
        emit("close");
    },
);
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="-translate-y-2 opacity-0">
        <nav v-if="open"
            class="absolute inset-x-0 top-full border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden">
            <div class="mx-auto flex max-w-[1440px] flex-col gap-1 text-sm font-semibold text-[#174e31]">
                <button type="button"
                    class="mb-2 flex w-full items-center gap-3 rounded-full border border-[#bdcec2] bg-[#f8fbf9] px-4 py-3 text-left text-sm font-normal text-slate-400"
                    @click="openSearch">
                    <Icon icon="mdi:magnify" class="text-xl text-[#07532b]" />
                    Tìm kiếm sản phẩm...
                </button>

                <RouterLink to="/" class="mobile-link">
                    Trang chủ
                </RouterLink>

                <button type="button" class="mobile-link flex w-full items-center justify-between text-left"
                    :aria-expanded="categoryOpen" @click="categoryOpen = !categoryOpen">
                    Danh mục

                    <Icon icon="mdi:chevron-down" class="transition-transform duration-200"
                        :class="categoryOpen ? 'rotate-180' : ''" />
                </button>

                <div v-if="categoryOpen" class="ml-3 space-y-1 border-l-2 border-[#dbe8df] pl-3">
                    <RouterLink :to="productsLink()" class="mobile-category-link">
                        Tất cả sản phẩm
                    </RouterLink>

                    <RouterLink v-for="category in categories" :key="category.id" :to="categoryLink(category)"
                        class="mobile-category-link">
                        {{ category.name || category.category_name }}
                    </RouterLink>
                </div>

                <RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="mobile-link">
                    {{ item.label }}
                </RouterLink>

                <RouterLink to="/diagnosis" class="mobile-link flex items-center gap-2">
                    <span class="rounded-md bg-[#ff4056] px-2 py-1 text-[9px] font-bold uppercase text-white">
                        New
                    </span>

                    Chẩn đoán bệnh lúa
                </RouterLink>

                <div class="mt-3 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <template v-if="authStore.isAuthenticated">
                        <RouterLink to="/cart"
                            class="relative flex flex-1 items-center justify-center gap-2 rounded-full bg-[#07532b] px-4 py-2.5 text-xs text-white">
                            <Icon icon="mdi:cart-outline" class="text-lg" />

                            Giỏ hàng

                            <span v-if="cartCount"
                                class="rounded-full bg-[#ffd326] px-1.5 py-0.5 text-[9px] font-bold text-[#07532b]">
                                {{ cartCount > 99 ? "99+" : cartCount }}
                            </span>
                        </RouterLink>

                        <RouterLink to="/wishlist" class="mobile-icon" aria-label="Yêu thích">
                            <Icon icon="mdi:heart-outline" class="text-lg" />

                            <span v-if="wishlistCount" class="sr-only">
                                {{ wishlistCount }}
                            </span>
                        </RouterLink>

                        <RouterLink to="/profile" class="mobile-icon" aria-label="Tài khoản">
                            <Icon icon="mdi:account-outline" class="text-lg" />
                        </RouterLink>
                    </template>

                    <template v-else>
                        <RouterLink :to="{ name: 'login' }"
                            class="flex flex-1 items-center justify-center rounded-full bg-[#07532b] px-4 py-2.5 text-xs font-bold text-white">
                            Đăng nhập
                        </RouterLink>

                        <RouterLink :to="{ name: 'register' }"
                            class="flex flex-1 items-center justify-center rounded-full border border-[#07532b] px-4 py-2.5 text-xs font-bold text-[#07532b]">
                            Đăng ký
                        </RouterLink>
                    </template>
                </div>
            </div>
        </nav>
    </Transition>
</template>

<style scoped>
@reference "../../../../style.css";

.mobile-link {
    @apply rounded-lg px-3 py-2.5 hover:bg-[#edf5f0];
}

.mobile-category-link {
    @apply block rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-[#edf5f0] hover:text-[#07532b];
}

.mobile-icon {
    @apply grid size-10 place-items-center rounded-full border border-[#07532b] bg-white text-[#07532b];
}
</style>