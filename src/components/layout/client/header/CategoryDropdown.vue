<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from "vue";
import {
    useRoute,
    useRouter,
} from "vue-router";
import { Icon } from "@iconify/vue";

defineProps({
    categories: {
        type: Array,
        default: () => [],
    },
});

const route = useRoute();
const router = useRouter();

const rootRef = ref(null);
const open = ref(false);

const active = computed(() => {
    return (
        route.path.startsWith("/products") ||
        Boolean(route.query.category)
    );
});

const productsLink = computed(() => {
    if (router.hasRoute("client-products")) {
        return {
            name: "client-products",
        };
    }

    return {
        name: "home",
    };
});

function categoryLink(category) {
    return {
        name: router.hasRoute("client-products")
            ? "client-products"
            : "home",

        query: {
            category:
                category.slug || category.id,
        },
    };
}

function handleOutsideClick(event) {
    if (
        !rootRef.value?.contains(event.target)
    ) {
        open.value = false;
    }
}

watch(
    () => route.fullPath,
    () => {
        open.value = false;
    },
);

onMounted(() => {
    document.addEventListener(
        "pointerdown",
        handleOutsideClick,
    );
});

onBeforeUnmount(() => {
    document.removeEventListener(
        "pointerdown",
        handleOutsideClick,
    );
});
</script>

<template>
    <div ref="rootRef" class="relative">
        <button type="button" class="flex items-center gap-1 py-6 transition hover:text-[#d6a900]"
            :class="active ? 'text-[#d6a900]' : ''" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
            Danh mục

            <Icon icon="mdi:chevron-down" class="transition-transform duration-200" :class="open ? 'rotate-180' : ''" />
        </button>

        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-y-0 opacity-100" leave-to-class="-translate-y-2 opacity-0">
            <div v-if="open"
                class="absolute left-0 top-full w-64 overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-[0_15px_40px_rgba(6,75,38,0.16)]"
                role="menu">
                <RouterLink :to="productsLink"
                    class="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs text-slate-700 transition hover:bg-[#edf5f0] hover:text-[#07532b]"
                    role="menuitem">
                    Tất cả sản phẩm

                    <Icon icon="mdi:arrow-right" class="text-base" />
                </RouterLink>

                <RouterLink v-for="category in categories" :key="category.id ?? category.slug"
                    :to="categoryLink(category)"
                    class="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs text-slate-700 transition hover:bg-[#edf5f0] hover:text-[#07532b]"
                    role="menuitem">
                    <span class="truncate">
                        {{
                            category.name ||
                            category.category_name
                        }}
                    </span>

                    <Icon icon="mdi:chevron-right" class="shrink-0 text-base text-slate-400" />
                </RouterLink>
            </div>
        </Transition>
    </div>
</template>