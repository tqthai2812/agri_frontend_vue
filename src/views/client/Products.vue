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

import ClientProductService from "@/services/clientProduct.service";
import WishlistService from "@/services/client/wishlist.service";

import { useCartStore } from "@/stores/client/cartStore";
import { useAuthStore } from "@/stores/shared/authStore";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();

const perPage = 9;

const viewMode = ref("grid");
const sortBy = ref("default");
const selectedCategory = ref("all");
const selectedOrigins = ref([]);

const favoriteIds = ref(new Set());
const toastMessage = ref("");

const loading = ref(false);
const filterLoading = ref(false);
const errorMessage = ref("");

const products = ref([]);
const categories = ref([]);
const origins = ref([]);

const currentPage = ref(1);

const meta = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
});

const filterMaxPrice = ref(1000000);
const maxPrice = ref(1000000);
const totalProducts = ref(0);

const ready = ref(false);

let toastTimer = null;
let fetchTimer = null;
let queryTimer = null;

const fallbackProductImage =
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80";

const totalPages = computed(() => {
    return Number(meta.value.last_page || 1);
});

const pageNumbers = computed(() => {
    const total = totalPages.value;
    const current = Number(meta.value.current_page || currentPage.value || 1);

    const pages = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
        start = Math.max(1, end - 4);
    }

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return pages;
});

const activeSearch = computed(() => {
    return typeof route.query.search === "string"
        ? route.query.search.trim()
        : "";
});

function isLoggedIn() {
    return Boolean(
        authStore.user ||
        authStore.isAuthenticated ||
        authStore.isLoggedIn ||
        localStorage.getItem("auth_user"),
    );
}

function redirectToLogin() {
    window.setTimeout(() => {
        router.push({
            name: "login",
            query: {
                redirect: route.fullPath,
            },
        });
    }, 500);
}

function parseOriginIds(value) {
    if (Array.isArray(value)) {
        return value.map(Number).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map(Number)
            .filter(Boolean);
    }

    return [];
}

function cleanParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            if (value === undefined || value === null || value === "") {
                return false;
            }

            if (Array.isArray(value) && !value.length) {
                return false;
            }

            return true;
        }),
    );
}

function sameQuery(first, second) {
    return JSON.stringify(cleanParams(first)) === JSON.stringify(cleanParams(second));
}

function replaceProductsQuery(extraQuery = {}) {
    const query = cleanParams({
        ...route.query,
        ...extraQuery,
    });

    if (sameQuery(query, route.query)) {
        return;
    }

    router.replace({
        name: "client-products",
        query,
    });
}

function syncStateFromRoute() {
    selectedCategory.value =
        typeof route.query.category === "string"
            ? route.query.category
            : "all";

    sortBy.value =
        typeof route.query.sort === "string"
            ? route.query.sort
            : "default";

    selectedOrigins.value = parseOriginIds(route.query.origin_ids);

    const page = Number(route.query.page || 1);
    currentPage.value = Number.isFinite(page) && page > 0 ? page : 1;

    if (route.query.max_price !== undefined) {
        const routeMaxPrice = Number(route.query.max_price);

        maxPrice.value =
            Number.isFinite(routeMaxPrice) && routeMaxPrice >= 0
                ? Math.min(routeMaxPrice, filterMaxPrice.value)
                : filterMaxPrice.value;

        return;
    }

    maxPrice.value = filterMaxPrice.value;
}

function getProductPrice(product) {
    return Number(product.min_price || product.price || 0);
}

function normalizeProduct(product) {
    const price = getProductPrice(product);
    const stock = Number(product.total_stock || 0);

    return {
        id: Number(product.id),

        category:
            product.category?.slug ||
            product.category?.category_slug ||
            String(product.category?.id || ""),

        originId: product.origin?.id || null,

        brand:
            product.origin?.name ||
            product.origin?.origin_name ||
            "AgriShop",

        name:
            product.name ||
            product.product_name ||
            "Sản phẩm",

        price,

        oldPrice: price > 0 ? Math.round(price * 1.12) : 0,

        rating: Math.round(Number(product.average_rating || 0)),

        reviews: Number(product.review_count || 0),

        image:
            product.primary_image ||
            product.image ||
            product.images?.[0]?.image_url ||
            fallbackProductImage,

        stock,

        badge: stock <= 0 ? "Hết hàng" : "",

        firstPackageId:
            product.first_package_id ||
            product.variants?.[0]?.packages?.[0]?.id ||
            null,

        raw: product,
    };
}

function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(price || 0));
}

function showToast(message) {
    toastMessage.value = message;

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toastMessage.value = "";
    }, 2200);
}

async function loadWishlistIds() {
    if (!isLoggedIn()) {
        favoriteIds.value = new Set();
        return;
    }

    try {
        const response = await WishlistService.getWishlist();

        favoriteIds.value = new Set(
            (response.data?.data || []).map((item) => Number(item.product_id)),
        );
    } catch (error) {
        if (error.response?.status !== 401) {
            console.error("Lỗi tải wishlist:", error);
        }

        favoriteIds.value = new Set();
    }
}

async function fetchFilters() {
    filterLoading.value = true;

    try {
        const response = await ClientProductService.getProductFilters();
        const data = response.data?.data || {};

        categories.value = data.categories || [];
        origins.value = data.origins || [];

        filterMaxPrice.value = Number(data.max_price || 1000000);
        totalProducts.value = Number(data.total_products || 0);
    } catch (error) {
        console.error("Lỗi tải bộ lọc sản phẩm:", error);

        categories.value = [];
        origins.value = [];
        filterMaxPrice.value = 1000000;
        totalProducts.value = 0;
    } finally {
        filterLoading.value = false;
    }
}

async function fetchProducts() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const shouldApplyMaxPrice =
            Number(maxPrice.value) < Number(filterMaxPrice.value);

        const params = cleanParams({
            page: currentPage.value,
            per_page: perPage,

            search: activeSearch.value || undefined,

            category:
                selectedCategory.value !== "all"
                    ? selectedCategory.value
                    : undefined,

            origin_ids: selectedOrigins.value.length
                ? selectedOrigins.value.join(",")
                : undefined,

            max_price: shouldApplyMaxPrice
                ? maxPrice.value
                : undefined,

            sort:
                sortBy.value && sortBy.value !== "default"
                    ? sortBy.value
                    : undefined,
        });

        const response = await ClientProductService.getProducts(params);

        products.value = (response.data?.data || []).map(normalizeProduct);

        meta.value = response.data?.meta || {
            current_page: 1,
            last_page: 1,
            total: products.value.length,
            from: products.value.length ? 1 : 0,
            to: products.value.length,
        };

        currentPage.value = Number(meta.value.current_page || currentPage.value || 1);
    } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);

        errorMessage.value =
            error.response?.data?.message ||
            "Không tải được danh sách sản phẩm. Vui lòng thử lại sau.";

        products.value = [];
        meta.value = {
            current_page: 1,
            last_page: 1,
            total: 0,
            from: 0,
            to: 0,
        };
    } finally {
        loading.value = false;
    }
}

function scheduleFetch() {
    if (!ready.value) {
        return;
    }

    window.clearTimeout(fetchTimer);

    fetchTimer = window.setTimeout(() => {
        fetchProducts();
    }, 250);
}

function selectCategory(categorySlug) {
    selectedCategory.value = categorySlug;
    currentPage.value = 1;

    replaceProductsQuery({
        category: categorySlug !== "all" ? categorySlug : undefined,
        page: undefined,
    });
}

function toggleOrigin(originId) {
    const id = Number(originId);

    if (!id) {
        return;
    }

    if (selectedOrigins.value.includes(id)) {
        selectedOrigins.value = selectedOrigins.value.filter((item) => item !== id);
    } else {
        selectedOrigins.value = [...selectedOrigins.value, id];
    }

    currentPage.value = 1;

    replaceProductsQuery({
        origin_ids: selectedOrigins.value.length
            ? selectedOrigins.value.join(",")
            : undefined,
        page: undefined,
    });
}

function changePage(page) {
    if (page < 1 || page > totalPages.value || page === currentPage.value) {
        return;
    }

    currentPage.value = page;

    replaceProductsQuery({
        page: page > 1 ? page : undefined,
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}

async function addToCart(product) {
    if (!product.firstPackageId) {
        showToast("Sản phẩm này chưa có quy cách bán.");
        return;
    }

    if (Number(product.stock || 0) <= 0) {
        showToast("Sản phẩm đã hết hàng.");
        return;
    }

    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
        redirectToLogin();
        return;
    }

    try {
        await cartStore.addToCart({
            package_id: product.firstPackageId,
            quantity: 1,
        });

        showToast(`Đã thêm “${product.name}” vào giỏ hàng`);
    } catch (error) {
        console.error("Lỗi thêm vào giỏ:", error);

        if (error.response?.status === 401) {
            showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            redirectToLogin();
            return;
        }

        showToast(
            cartStore.errorMsg ||
            error.response?.data?.message ||
            "Không thêm được sản phẩm vào giỏ hàng.",
        );
    }
}

async function toggleFavorite(product) {
    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
        redirectToLogin();
        return;
    }

    try {
        const response = await WishlistService.toggle(product.id);

        const saved = Boolean(response.data?.data?.saved);
        const nextIds = new Set(favoriteIds.value);

        if (saved) {
            nextIds.add(Number(product.id));
            showToast("Đã thêm vào danh sách yêu thích");
        } else {
            nextIds.delete(Number(product.id));
            showToast("Đã bỏ khỏi danh sách yêu thích");
        }

        favoriteIds.value = nextIds;
    } catch (error) {
        console.error("Lỗi cập nhật wishlist:", error);

        if (error.response?.status === 401) {
            showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
            redirectToLogin();
            return;
        }

        showToast(
            error.response?.data?.message ||
            "Không cập nhật được danh sách yêu thích.",
        );
    }
}

function resetFilters() {
    selectedCategory.value = "all";
    selectedOrigins.value = [];
    sortBy.value = "default";
    maxPrice.value = filterMaxPrice.value;
    currentPage.value = 1;

    router.replace({
        name: "client-products",
        query: {},
    });
}

watch(
    () => route.fullPath,
    () => {
        if (!ready.value) {
            return;
        }

        syncStateFromRoute();
        scheduleFetch();
    },
);

watch(
    sortBy,
    () => {
        if (!ready.value) {
            return;
        }

        currentPage.value = 1;

        replaceProductsQuery({
            sort: sortBy.value !== "default" ? sortBy.value : undefined,
            page: undefined,
        });
    },
);

watch(
    maxPrice,
    () => {
        if (!ready.value) {
            return;
        }

        window.clearTimeout(queryTimer);

        queryTimer = window.setTimeout(() => {
            currentPage.value = 1;

            const shouldApplyMaxPrice =
                Number(maxPrice.value) < Number(filterMaxPrice.value);

            replaceProductsQuery({
                max_price: shouldApplyMaxPrice ? maxPrice.value : undefined,
                page: undefined,
            });
        }, 350);
    },
);

onMounted(async () => {
    await fetchFilters();

    syncStateFromRoute();

    ready.value = true;

    await Promise.all([
        fetchProducts(),
        loadWishlistIds(),
    ]);
});

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
    window.clearTimeout(fetchTimer);
    window.clearTimeout(queryTimer);
});
</script>

<template>
    <div class="bg-white font-sans text-slate-800">
        <main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
            <div class="mb-8">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                    Cửa hàng NFarmHouse
                </p>

                <h1 class="mt-2 text-2xl font-bold text-[#153f29] sm:text-3xl">
                    Tất cả sản phẩm
                </h1>

                <p v-if="activeSearch" class="mt-2 text-sm text-slate-500">
                    Kết quả tìm kiếm cho “{{ activeSearch }}”
                </p>
            </div>

            <div v-if="errorMessage"
                class="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {{ errorMessage }}
            </div>

            <div class="grid items-start gap-7 lg:grid-cols-[255px_minmax(0,1fr)] xl:gap-9">
                <aside class="space-y-5 lg:sticky lg:top-5">
                    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">
                            Danh mục
                        </h2>

                        <div v-if="filterLoading" class="space-y-2 p-4">
                            <div v-for="item in 5" :key="item" class="h-8 animate-pulse rounded-lg bg-slate-100"></div>
                        </div>

                        <template v-else>
                            <button type="button"
                                class="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-xs transition hover:bg-[#f3f8f5]"
                                :class="selectedCategory === 'all'
                                    ? 'font-bold text-[#07532b]'
                                    : 'text-slate-700'" @click="selectCategory('all')">
                                Tất cả sản phẩm

                                <span class="text-slate-400">
                                    ({{ totalProducts }})
                                </span>
                            </button>

                            <button v-for="category in categories" :key="category.id" type="button"
                                class="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-xs transition last:border-0 hover:bg-[#f3f8f5]"
                                :class="selectedCategory === category.slug
                                    ? 'font-bold text-[#07532b]'
                                    : 'text-slate-700'" @click="selectCategory(category.slug)">
                                <span class="truncate">
                                    {{ category.name }}
                                </span>

                                <span class="text-slate-400">
                                    ({{ category.count }})
                                </span>
                            </button>
                        </template>
                    </section>

                    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">
                            Lọc theo giá
                        </h2>

                        <div class="px-4 py-5">
                            <input v-model.number="maxPrice" type="range" min="0" :max="filterMaxPrice" step="50000"
                                class="h-1.5 w-full cursor-pointer accent-[#07532b]" />

                            <div class="mt-4 flex items-center justify-between text-[11px]">
                                <span class="text-slate-500">
                                    0 ₫
                                </span>

                                <span class="rounded-full bg-[#edf5f0] px-3 py-1.5 font-bold text-[#07532b]">
                                    {{ formatPrice(maxPrice) }}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">
                            Nguồn gốc
                        </h2>

                        <div v-if="filterLoading" class="space-y-2 p-4">
                            <div v-for="item in 4" :key="item" class="h-7 animate-pulse rounded-lg bg-slate-100"></div>
                        </div>

                        <div v-else-if="origins.length" class="space-y-3 px-4 py-4">
                            <label v-for="origin in origins" :key="origin.id"
                                class="flex cursor-pointer items-center justify-between gap-3 text-xs text-slate-600">
                                <span class="flex items-center gap-3">
                                    <input type="checkbox" :checked="selectedOrigins.includes(Number(origin.id))"
                                        class="size-4 rounded border-slate-300 accent-[#07532b]"
                                        @change="toggleOrigin(origin.id)" />

                                    {{ origin.name }}
                                </span>

                                <span class="text-slate-400">
                                    {{ origin.count }}
                                </span>
                            </label>
                        </div>

                        <div v-else class="px-4 py-5 text-xs text-slate-400">
                            Chưa có dữ liệu nguồn gốc.
                        </div>
                    </section>
                </aside>

                <section class="min-w-0">
                    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex items-center gap-3">
                            <button type="button" class="grid size-9 place-items-center rounded-full transition" :class="viewMode === 'grid'
                                ? 'bg-[#07532b] text-[#ffd326]'
                                : 'bg-slate-100 text-slate-400'" aria-label="Xem dạng lưới" @click="viewMode = 'grid'">
                                <Icon icon="mdi:view-grid" class="text-lg" />
                            </button>

                            <button type="button" class="grid size-9 place-items-center rounded-full transition" :class="viewMode === 'list'
                                ? 'bg-[#07532b] text-[#ffd326]'
                                : 'bg-slate-100 text-slate-400'" aria-label="Xem dạng danh sách"
                                @click="viewMode = 'list'">
                                <Icon icon="mdi:view-list" class="text-xl" />
                            </button>

                            <span class="ml-1 text-[11px] text-slate-400">
                                Hiển thị
                                {{ meta.from || 0 }}-{{ meta.to || products.length }}
                                trên
                                {{ meta.total || 0 }}
                                kết quả
                            </span>
                        </div>

                        <label class="relative sm:min-w-[180px]">
                            <select v-model="sortBy"
                                class="h-10 w-full appearance-none rounded-full border border-[#e6ddbc] bg-white py-0 pl-4 pr-10 text-xs text-[#466051] outline-none transition focus:border-[#07532b]">
                                <option value="default">
                                    Mặc định
                                </option>

                                <option value="newest">
                                    Mới nhất
                                </option>

                                <option value="price-asc">
                                    Giá thấp đến cao
                                </option>

                                <option value="price-desc">
                                    Giá cao đến thấp
                                </option>

                                <option value="rating">
                                    Đánh giá tốt nhất
                                </option>

                                <option value="sale">
                                    Ưu đãi / bán chạy
                                </option>
                            </select>

                            <Icon icon="mdi:chevron-down"
                                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#466051]" />
                        </label>
                    </div>

                    <div v-if="loading" class="grid gap-5" :class="viewMode === 'grid'
                        ? 'sm:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'">
                        <div v-for="item in 6" :key="item" class="h-[360px] animate-pulse rounded-xl bg-slate-100">
                        </div>
                    </div>

                    <div v-else-if="products.length" class="grid gap-5" :class="viewMode === 'grid'
                        ? 'sm:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'">
                        <article v-for="product in products" :key="product.id"
                            class="group overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,75,39,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#c3d9ca] hover:shadow-[0_12px_30px_rgba(15,75,39,0.12)]"
                            :class="viewMode === 'list' ? 'sm:flex sm:items-center sm:gap-6' : ''">
                            <RouterLink :to="{ name: 'client-product-detail', params: { id: product.id } }"
                                class="relative block overflow-hidden rounded-lg bg-[#f3f6f2]"
                                :class="viewMode === 'list' ? 'sm:w-[250px] sm:shrink-0' : ''">
                                <img :src="product.image" :alt="product.name" loading="lazy" decoding="async"
                                    class="h-48 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-52" />

                                <span v-if="product.badge"
                                    class="absolute left-3 top-3 rounded-full bg-[#07532b] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                    {{ product.badge }}
                                </span>
                            </RouterLink>

                            <div class="flex-1 pt-4" :class="viewMode === 'list' ? 'sm:py-2' : ''">
                                <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7e9c88]">
                                    {{ product.brand }}
                                </p>

                                <RouterLink :to="{ name: 'client-product-detail', params: { id: product.id } }"
                                    class="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition hover:text-[#087239]">
                                    {{ product.name }}
                                </RouterLink>

                                <div class="mt-3 flex flex-wrap items-baseline gap-3">
                                    <strong class="text-sm text-[#0b8b42]">
                                        {{ formatPrice(product.price) }}
                                    </strong>

                                    <del v-if="product.oldPrice && product.oldPrice > product.price"
                                        class="text-[11px] text-slate-400">
                                        {{ formatPrice(product.oldPrice) }}
                                    </del>
                                </div>

                                <div class="mt-2 flex items-center gap-2">
                                    <div class="flex">
                                        <Icon v-for="star in 5" :key="star" icon="mdi:star" class="text-lg" :class="star <= product.rating
                                            ? 'text-[#ffc400]'
                                            : 'text-slate-200'" />
                                    </div>

                                    <span class="text-[10px] text-slate-400">
                                        ({{ product.rating }}/5)
                                    </span>
                                </div>

                                <div class="mt-2 text-[11px] text-slate-400">
                                    Tồn kho:
                                    <span :class="product.stock > 0
                                        ? 'font-semibold text-[#0b8b42]'
                                        : 'font-semibold text-rose-500'">
                                        {{ product.stock > 0 ? product.stock : "Hết hàng" }}
                                    </span>
                                </div>

                                <div class="mt-4 flex items-center gap-2">
                                    <button type="button"
                                        class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] text-[#07532b] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Thêm vào giỏ hàng" :disabled="product.stock <= 0"
                                        @click="addToCart(product)">
                                        <Icon icon="mdi:cart-outline" class="text-lg" />
                                    </button>

                                    <button type="button"
                                        class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white"
                                        :class="favoriteIds.has(Number(product.id))
                                            ? 'bg-[#07532b] text-white'
                                            : 'text-[#07532b]'" aria-label="Yêu thích"
                                        @click="toggleFavorite(product)">
                                        <Icon :icon="favoriteIds.has(Number(product.id))
                                            ? 'mdi:heart'
                                            : 'mdi:heart-outline'" class="text-lg" />
                                    </button>

                                    <RouterLink :to="{ name: 'client-product-detail', params: { id: product.id } }"
                                        class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] text-[#07532b] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white"
                                        aria-label="Xem chi tiết">
                                        <Icon icon="mdi:eye-outline" class="text-lg" />
                                    </RouterLink>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div v-else
                        class="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300">
                        <div class="text-center">
                            <Icon icon="mdi:package-variant-closed-remove" class="mx-auto text-5xl text-slate-300" />

                            <p class="mt-3 text-sm font-semibold text-slate-500">
                                Không tìm thấy sản phẩm phù hợp
                            </p>

                            <button type="button"
                                class="mt-4 rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white"
                                @click="resetFilters">
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>

                    <nav v-if="totalPages > 1" class="mt-8 flex flex-wrap justify-center gap-2"
                        aria-label="Phân trang sản phẩm">
                        <button type="button"
                            class="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#07532b] hover:text-[#07532b] disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="currentPage <= 1 || loading" @click="changePage(currentPage - 1)">
                            <Icon icon="mdi:chevron-left" />
                        </button>

                        <button v-for="page in pageNumbers" :key="page" type="button"
                            class="grid size-10 place-items-center rounded-full border text-xs font-bold transition"
                            :class="Number(meta.current_page || currentPage) === page
                                ? 'border-[#07532b] bg-[#07532b] text-white'
                                : 'border-slate-200 text-slate-500 hover:border-[#07532b] hover:text-[#07532b]'"
                            :disabled="loading" @click="changePage(page)">
                            {{ page }}
                        </button>

                        <button type="button"
                            class="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#07532b] hover:text-[#07532b] disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="currentPage >= totalPages || loading" @click="changePage(currentPage + 1)">
                            <Icon icon="mdi:chevron-right" />
                        </button>
                    </nav>
                </section>
            </div>
        </main>

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150"
            leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toastMessage"
                class="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />

                {{ toastMessage }}
            </div>
        </Transition>
    </div>
</template>