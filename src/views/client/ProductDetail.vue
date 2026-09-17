<script setup>
import {
    computed,
    onBeforeUnmount,
    ref,
    watch,
} from "vue";

import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import ProductGallery from "@/components/client/product/ProductGallery.vue";
import ProductPurchasePanel from "@/components/client/product/ProductPurchasePanel.vue";
import ProductContentTabs from "@/components/client/product/ProductContentTabs.vue";

import ClientProductService from "@/services/clientProduct.service";
import WishlistService from "@/services/client/wishlist.service";

import { useCartStore } from "@/stores/client/cartStore";
import { useAuthStore } from "@/stores/shared/authStore";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();

const loading = ref(false);
const loadingRelated = ref(false);
const product = ref(null);
const reviews = ref([]);
const relatedProducts = ref([]);
const wishlisted = ref(false);
const toastMessage = ref("");
const errorMessage = ref("");

let toastTimer = null;

const breadcrumbName = computed(() => {
    return product.value?.product_name || product.value?.name || "Chi tiết sản phẩm";
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

function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function showToast(message) {
    toastMessage.value = message;

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toastMessage.value = "";
    }, 2200);
}

function normalizeProduct(data) {
    return {
        ...data,
        product_name: data.product_name || data.name || "Sản phẩm",
        name: data.name || data.product_name || "Sản phẩm",
        images: Array.isArray(data.images) ? data.images : [],
        variants: Array.isArray(data.variants) ? data.variants : [],
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        is_show: Boolean(data.is_show),
        average_rating: Number(data.average_rating || 0),
        review_count: Number(data.review_count || data.reviews?.length || 0),
    };
}

function getProductImage(item) {
    return (
        item.primary_image ||
        item.image ||
        item.images?.[0]?.image_url ||
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"
    );
}

function getMinPrice(item) {
    if (item.min_price !== undefined && item.min_price !== null) {
        return Number(item.min_price);
    }

    const prices = [];

    (item.variants || []).forEach((variant) => {
        (variant.packages || []).forEach((packageItem) => {
            prices.push(Number(packageItem.price || 0));
        });
    });

    return prices.length ? Math.min(...prices.filter((price) => price > 0)) : 0;
}

function normalizeRelatedProduct(item) {
    return {
        id: item.id,
        product_name: item.product_name || item.name || "Sản phẩm",
        average_rating: Number(item.average_rating || 0),
        min_price: getMinPrice(item),
        image: getProductImage(item),
    };
}

async function loadWishlistState(productId) {
    wishlisted.value = false;

    if (!isLoggedIn()) {
        return;
    }

    try {
        const response = await WishlistService.getWishlist();

        const items = response.data?.data || [];

        wishlisted.value = items.some((item) => {
            return Number(item.product_id) === Number(productId);
        });
    } catch (error) {
        if (error.response?.status !== 401) {
            console.error("Lỗi kiểm tra wishlist:", error);
        }

        wishlisted.value = false;
    }
}

async function loadRelatedProducts() {
    if (!product.value?.category?.id) {
        relatedProducts.value = [];
        return;
    }

    loadingRelated.value = true;

    try {
        const response = await ClientProductService.getProducts({
            category_id: product.value.category.id,
            per_page: 5,
        });

        const data = response.data?.data || [];

        relatedProducts.value = data
            .filter((item) => Number(item.id) !== Number(product.value.id))
            .slice(0, 4)
            .map(normalizeRelatedProduct);
    } catch (error) {
        console.error("Lỗi tải sản phẩm liên quan:", error);
        relatedProducts.value = [];
    } finally {
        loadingRelated.value = false;
    }
}

async function loadProduct() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const response = await ClientProductService.getProduct(route.params.id);
        const data = response.data?.data || response.data;

        product.value = normalizeProduct(data);
        reviews.value = product.value.reviews || [];

        await Promise.all([
            loadWishlistState(product.value.id),
            loadRelatedProducts(),
        ]);
    } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);

        errorMessage.value =
            error.response?.data?.message ||
            "Không tải được chi tiết sản phẩm. Vui lòng thử lại sau.";

        product.value = null;
        reviews.value = [];
        relatedProducts.value = [];
        wishlisted.value = false;
    } finally {
        loading.value = false;
    }
}

async function handleAddCart(payload) {
    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
        redirectToLogin();
        return;
    }

    try {
        await cartStore.addToCart({
            package_id: payload.package_id,
            quantity: payload.quantity,
        });

        showToast(`Đã thêm ${payload.quantity} sản phẩm vào giỏ hàng`);
    } catch (error) {
        console.error("Lỗi thêm giỏ hàng:", error);

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

async function handleBuyNow(payload) {
    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để mua sản phẩm.");
        redirectToLogin();
        return;
    }

    try {
        await cartStore.addToCart({
            package_id: payload.package_id,
            quantity: payload.quantity,
        });

        showToast("Đã thêm vào giỏ hàng, chuyển đến thanh toán...");

        setTimeout(() => {
            router.push("/checkout");
        }, 500);
    } catch (error) {
        console.error("Lỗi mua ngay:", error);

        if (error.response?.status === 401) {
            showToast("Vui lòng đăng nhập để mua sản phẩm.");
            redirectToLogin();
            return;
        }

        showToast(
            cartStore.errorMsg ||
            error.response?.data?.message ||
            "Không thể mua ngay sản phẩm này.",
        );
    }
}

async function handleWishlist(productId = null) {
    const id = productId || product.value?.id;

    if (!id) {
        return;
    }

    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
        redirectToLogin();
        return;
    }

    try {
        const response = await WishlistService.toggle(id);

        wishlisted.value = Boolean(response.data?.data?.saved);

        showToast(
            wishlisted.value
                ? "Đã thêm vào yêu thích"
                : "Đã bỏ khỏi yêu thích",
        );
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

function handleSubmitReview() {
    showToast("Chức năng đánh giá sản phẩm sẽ được gắn ở bước Product Reviews.");
}

watch(
    () => route.params.id,
    () => {
        loadProduct();
    },
    {
        immediate: true,
    },
);

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
});
</script>

<template>
    <div class="min-h-screen bg-white text-slate-800">
        <div class="border-b border-slate-100 bg-[#fbfcfb]">
            <nav class="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-10"
                aria-label="Breadcrumb">
                <RouterLink to="/" class="transition hover:text-[#07532b]">
                    Trang chủ
                </RouterLink>

                <Icon icon="mdi:chevron-right" />

                <RouterLink :to="{ name: 'client-products' }" class="transition hover:text-[#07532b]">
                    Sản phẩm
                </RouterLink>

                <Icon icon="mdi:chevron-right" />

                <span class="max-w-[260px] truncate font-semibold text-slate-600">
                    {{ breadcrumbName }}
                </span>
            </nav>
        </div>

        <main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <div v-if="errorMessage"
                class="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {{ errorMessage }}
            </div>

            <div v-if="loading" class="grid animate-pulse gap-10 lg:grid-cols-2">
                <div class="aspect-square rounded-3xl bg-slate-100"></div>

                <div class="space-y-5 py-4">
                    <div class="h-5 w-32 rounded bg-slate-100"></div>
                    <div class="h-12 w-4/5 rounded bg-slate-100"></div>
                    <div class="h-24 rounded-2xl bg-slate-100"></div>
                    <div class="h-40 rounded-2xl bg-slate-100"></div>
                </div>
            </div>

            <template v-else-if="product">
                <div class="grid items-start gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
                    <ProductGallery :images="product.images" :product-name="product.product_name" />

                    <ProductPurchasePanel :product="product" :wishlisted="wishlisted" @add-cart="handleAddCart"
                        @buy-now="handleBuyNow" @toggle-wishlist="handleWishlist" />
                </div>

                <div class="mt-12 grid gap-4 rounded-2xl border border-[#dce8df] bg-[#f6faf7] p-5 sm:grid-cols-3">
                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:truck-fast-outline" class="text-3xl text-[#07532b]" />

                        <div>
                            <strong class="block text-sm">
                                Giao hàng thuận tiện
                            </strong>

                            <span class="text-xs text-slate-400">
                                Kiểm tra phí theo địa chỉ
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:shield-check-outline" class="text-3xl text-[#07532b]" />

                        <div>
                            <strong class="block text-sm">
                                Cam kết chính hãng
                            </strong>

                            <span class="text-xs text-slate-400">
                                Nguồn gốc rõ ràng
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:account-tie-voice-outline" class="text-3xl text-[#07532b]" />

                        <div>
                            <strong class="block text-sm">
                                Tư vấn kỹ thuật
                            </strong>

                            <span class="text-xs text-slate-400">
                                Hỗ trợ cách sử dụng
                            </span>
                        </div>
                    </div>
                </div>

                <div class="mt-12">
                    <ProductContentTabs :product="product" :reviews="reviews" @submit-review="handleSubmitReview" />
                </div>

                <section class="mt-14">
                    <div class="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                                Có thể bạn quan tâm
                            </p>

                            <h2 class="mt-2 text-2xl font-bold text-[#153f29]">
                                Sản phẩm liên quan
                            </h2>
                        </div>

                        <RouterLink :to="{ name: 'client-products' }"
                            class="text-sm font-bold text-[#07532b] hover:text-[#d2a900]">
                            Xem tất cả
                        </RouterLink>
                    </div>

                    <div v-if="loadingRelated" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div v-for="item in 4" :key="item" class="h-[300px] animate-pulse rounded-2xl bg-slate-100">
                        </div>
                    </div>

                    <div v-else-if="relatedProducts.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <RouterLink v-for="item in relatedProducts" :key="item.id" :to="{
                            name: 'client-product-detail',
                            params: { id: item.id },
                        }"
                            class="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-[#b8d1c0] hover:shadow-xl">
                            <div class="overflow-hidden rounded-xl bg-[#f3f7f4]">
                                <img :src="item.image" :alt="item.product_name" loading="lazy"
                                    class="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
                            </div>

                            <h3
                                class="mt-4 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 group-hover:text-[#07532b]">
                                {{ item.product_name }}
                            </h3>

                            <div class="mt-2 flex items-center gap-2">
                                <Icon icon="mdi:star" class="text-[#ffc400]" />

                                <span class="text-xs text-slate-500">
                                    {{ Number(item.average_rating || 0).toFixed(1) }}
                                </span>
                            </div>

                            <strong class="mt-2 block text-sm text-[#0a8b43]">
                                Từ {{ formatPrice(item.min_price) }}
                            </strong>
                        </RouterLink>
                    </div>

                    <div v-else
                        class="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Chưa có sản phẩm liên quan.
                    </div>
                </section>
            </template>
        </main>

        <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
            enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150"
            leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-3 opacity-0">
            <div v-if="toastMessage"
                class="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />
                {{ toastMessage }}
            </div>
        </Transition>
    </div>
</template>