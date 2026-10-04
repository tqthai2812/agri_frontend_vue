<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import ProductGallery from "@/components/client/product/ProductGallery.vue";
import ProductPurchasePanel from "@/components/client/product/ProductPurchasePanel.vue";
import ProductContentTabs from "@/components/client/product/ProductContentTabs.vue";

import ClientProductService from "@/services/client/clientProduct.service";
import WishlistService from "@/services/client/wishlist.service";

import { useCartStore } from "@/stores/client/cartStore";
import { useAuthStore } from "@/stores/shared/authStore";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();

const loading = ref(false);
const loadingRelated = ref(false);
const purchasing = ref(false);
const savingWishlist = ref(false);

const product = ref(null);
const relatedProducts = ref([]);
const wishlisted = ref(false);
const toastMessage = ref("");
const errorMessage = ref("");

let toastTimer;
let navigationTimer;
let loadVersion = 0;
let wishlistVersion = 0;
let disposed = false;

const breadcrumbName = computed(
    () => product.value?.product_name || "Chi tiết sản phẩm",
);

function isLoggedIn() {
    return Boolean(authStore.isAuthenticated);
}

function numberValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value) {
    return value === true || value === 1 || value === "1";
}

function showToast(message) {
    if (disposed) return;

    toastMessage.value = message;
    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toastMessage.value = "";
    }, 2600);
}

function redirectToLogin() {
    const redirect = route.fullPath;

    window.clearTimeout(navigationTimer);

    navigationTimer = window.setTimeout(() => {
        router.push({
            name: "login",
            query: { redirect },
        });
    }, 500);
}

function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberValue(value));
}

function normalizeProduct(data) {
    const variants = (Array.isArray(data.variants) ? data.variants : []).map(
        (variant) => ({
            ...variant,
            packages: (Array.isArray(variant.packages) ? variant.packages : []).map(
                (pkg) => ({
                    ...pkg,
                    price: numberValue(pkg.price),
                    quantity_available: numberValue(pkg.quantity_available),
                    // Giữ null để nhận biết API chưa cung cấp tồn khả dụng.
                    available_to_sell:
                        pkg.available_to_sell == null
                            ? null
                            : numberValue(pkg.available_to_sell),
                }),
            ),
        }),
    );

    return {
        ...data,
        product_name: data.product_name || data.name || "Sản phẩm",
        name: data.name || data.product_name || "Sản phẩm",
        images: Array.isArray(data.images) ? data.images : [],
        variants,
        is_show: booleanValue(data.is_show),
        average_rating: numberValue(data.average_rating),
        review_count: numberValue(data.review_count ?? data.reviews?.length),
    };
}

function getProductImage(item) {
    return (
        item.primary_image ||
        item.image ||
        item.images?.[0]?.image_url ||
        ""
    );
}

function getMinPrice(item) {
    if (item.min_price != null) {
        return numberValue(item.min_price);
    }

    const prices = (item.variants || [])
        .flatMap((variant) => variant.packages || [])
        .map((pkg) => Number(pkg.price))
        .filter((price) => Number.isFinite(price) && price >= 0);

    return prices.length ? Math.min(...prices) : 0;
}

function normalizeRelatedProduct(item) {
    return {
        id: item.id,
        product_name: item.product_name || item.name || "Sản phẩm",
        average_rating: numberValue(item.average_rating),
        min_price: getMinPrice(item),
        image: getProductImage(item),
    };
}

async function loadWishlistState(productId, version) {
    const requestId = ++wishlistVersion;
    wishlisted.value = false;

    if (!isLoggedIn()) return;

    try {
        const response = await WishlistService.getWishlist();

        if (
            disposed ||
            version !== loadVersion ||
            requestId !== wishlistVersion
        ) return;

        const items = response.data?.data || [];

        wishlisted.value = Array.isArray(items) && items.some(
            (item) => String(item.product_id) === String(productId),
        );
    } catch (error) {
        if (
            disposed ||
            version !== loadVersion ||
            requestId !== wishlistVersion
        ) return;

        wishlisted.value = false;

        if (error.response?.status !== 401) {
            console.error("Lỗi kiểm tra wishlist:", error);
        }
    }
}

async function loadRelatedProducts(currentProduct, version) {
    if (!currentProduct.category?.id) return;

    loadingRelated.value = true;

    try {
        const response = await ClientProductService.getProducts({
            category_id: currentProduct.category.id,
            per_page: 5,
        });

        if (disposed || version !== loadVersion) return;

        relatedProducts.value = (response.data?.data || [])
            .filter((item) => String(item.id) !== String(currentProduct.id))
            .slice(0, 4)
            .map(normalizeRelatedProduct);
    } catch (error) {
        if (disposed || version !== loadVersion) return;

        relatedProducts.value = [];
        console.error("Lỗi tải sản phẩm liên quan:", error);
    } finally {
        if (!disposed && version === loadVersion) {
            loadingRelated.value = false;
        }
    }
}

async function loadProduct() {
    const version = ++loadVersion;
    const productId = route.params.id;

    window.clearTimeout(navigationTimer);
    window.clearTimeout(toastTimer);

    toastMessage.value = "";
    errorMessage.value = "";
    product.value = null;
    relatedProducts.value = [];
    wishlisted.value = false;
    loadingRelated.value = false;
    loading.value = true;

    try {
        const response = await ClientProductService.getProduct(productId);

        if (disposed || version !== loadVersion) return;

        const data = response.data?.data;

        if (!data?.id) {
            throw new Error("API chưa trả chi tiết sản phẩm hợp lệ.");
        }

        product.value = normalizeProduct(data);
        loading.value = false;

        await Promise.all([
            loadWishlistState(product.value.id, version),
            loadRelatedProducts(product.value, version),
        ]);
    } catch (error) {
        if (disposed || version !== loadVersion) return;

        errorMessage.value =
            error.response?.data?.message ||
            error.message ||
            "Không tải được chi tiết sản phẩm. Vui lòng thử lại.";

        product.value = null;
    } finally {
        if (!disposed && version === loadVersion) {
            loading.value = false;
        }
    }
}

function validatePurchase(payload) {
    if (!product.value?.is_show) {
        throw new Error("Sản phẩm hiện không thể mua.");
    }

    const packageItem = product.value.variants
        .flatMap((variant) => variant.packages)
        .find((pkg) => String(pkg.id) === String(payload?.package_id));

    if (!packageItem) {
        throw new Error("Vui lòng chọn quy cách sản phẩm.");
    }

    const quantity = Number(payload?.quantity);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error("Số lượng phải là số nguyên lớn hơn 0.");
    }

    if (packageItem.available_to_sell == null) {
        throw new Error(
            "Chưa lấy được tồn khả dụng. Vui lòng tải lại sản phẩm.",
        );
    }

    if (quantity > packageItem.available_to_sell) {
        throw new Error(
            packageItem.available_to_sell > 0
                ? `Quy cách này hiện còn ${packageItem.available_to_sell} sản phẩm có thể mua.`
                : "Quy cách này hiện hết hàng.",
        );
    }

    return {
        package_id: packageItem.id,
        quantity,
    };
}

async function purchase(payload, buyNow = false) {
    if (purchasing.value) return;

    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để mua sản phẩm.");
        redirectToLogin();
        return;
    }

    const version = loadVersion;
    purchasing.value = true;

    try {
        const data = validatePurchase(payload);

        await cartStore.addToCart(data);

        if (disposed || version !== loadVersion) return;

        if (buyNow) {
            showToast("Đã thêm vào giỏ hàng, chuyển đến thanh toán...");

            window.clearTimeout(navigationTimer);
            navigationTimer = window.setTimeout(() => {
                router.push("/checkout");
            }, 500);
        } else {
            showToast(`Đã thêm ${data.quantity} sản phẩm vào giỏ hàng.`);
        }
    } catch (error) {
        if (disposed || version !== loadVersion) return;

        if (error.response?.status === 401) {
            showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            redirectToLogin();
            return;
        }

        const validationErrors = error.response?.data?.errors || {};
        const firstError = Object.values(validationErrors)[0];

        showToast(
            (Array.isArray(firstError) ? firstError[0] : firstError) ||
            error.response?.data?.message ||
            error.message ||
            "Không thêm được sản phẩm vào giỏ hàng.",
        );
    } finally {
        purchasing.value = false;
    }
}

function handleAddCart(payload) {
    return purchase(payload);
}

function handleBuyNow(payload) {
    return purchase(payload, true);
}

async function handleWishlist() {
    if (savingWishlist.value || !product.value?.id) return;

    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
        redirectToLogin();
        return;
    }

    const version = loadVersion;
    const id = product.value.id;

    // Không để request kiểm tra wishlist cũ ghi đè thao tác mới.
    wishlistVersion++;
    savingWishlist.value = true;

    try {
        const response = await WishlistService.toggle(id);

        if (disposed || version !== loadVersion) return;

        wishlisted.value = booleanValue(response.data?.data?.saved);

        showToast(
            wishlisted.value ? "Đã thêm vào yêu thích." : "Đã bỏ khỏi yêu thích.",
        );
    } catch (error) {
        if (disposed || version !== loadVersion) return;

        if (error.response?.status === 401) {
            showToast("Vui lòng đăng nhập lại.");
            redirectToLogin();
            return;
        }

        showToast(
            error.response?.data?.message ||
            "Không cập nhật được danh sách yêu thích.",
        );
    } finally {
        savingWishlist.value = false;
    }
}

function updateReviewSummary(summary) {
    if (!product.value || Number(summary.product_id) !== Number(product.value.id)) return;
    product.value = {
        ...product.value,
        review_count: Number(summary.review_count || 0),
        average_rating: Number(summary.average_rating || 0),
    };
}

watch(() => route.params.id, loadProduct, { immediate: true });

watch(
    () => authStore.isAuthenticated,
    () => {
        if (product.value) {
            loadWishlistState(product.value.id, loadVersion);
        }
    },
);

onBeforeUnmount(() => {
    disposed = true;
    loadVersion++;
    wishlistVersion++;
    window.clearTimeout(toastTimer);
    window.clearTimeout(navigationTimer);
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
            <div v-if="errorMessage" role="alert"
                class="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                <p>{{ errorMessage }}</p>
                <button type="button" class="mt-3 font-semibold underline" @click="loadProduct">
                    Thử lại
                </button>
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

                    <div :aria-busy="purchasing || savingWishlist">
                        <ProductPurchasePanel :key="product.id" :product="product" :wishlisted="wishlisted"
                            :purchasing="purchasing" :saving-wishlist="savingWishlist" @add-cart="handleAddCart"
                            @buy-now="handleBuyNow" @toggle-wishlist="handleWishlist" />

                        <p v-if="purchasing" role="status" class="mt-3 flex items-center gap-2 text-sm text-[#07532b]">
                            <Icon icon="mdi:loading" class="animate-spin" />
                            Đang cập nhật giỏ hàng...
                        </p>
                    </div>
                </div>

                <div class="mt-12 grid gap-4 rounded-2xl border border-[#dce8df] bg-[#f6faf7] p-5 sm:grid-cols-3">
                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:truck-fast-outline" class="text-3xl text-[#07532b]" />
                        <div>
                            <strong class="block text-sm">Giao hàng thuận tiện</strong>
                            <span class="text-xs text-slate-400">Kiểm tra phí theo địa chỉ</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:shield-check-outline" class="text-3xl text-[#07532b]" />
                        <div>
                            <strong class="block text-sm">Cam kết chính hãng</strong>
                            <span class="text-xs text-slate-400">Nguồn gốc rõ ràng</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <Icon icon="mdi:account-tie-voice-outline" class="text-3xl text-[#07532b]" />
                        <div>
                            <strong class="block text-sm">Tư vấn kỹ thuật</strong>
                            <span class="text-xs text-slate-400">Hỗ trợ cách sử dụng</span>
                        </div>
                    </div>
                </div>

                <div class="mt-12">
                    <ProductContentTabs :key="product.id" :product="product" @review-summary="updateReviewSummary" />
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
                        <RouterLink v-for="item in relatedProducts" :key="item.id"
                            :to="{ name: 'client-product-detail', params: { id: item.id } }"
                            class="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-[#b8d1c0] hover:shadow-xl">
                            <div class="grid h-48 place-items-center overflow-hidden rounded-xl bg-[#f3f7f4]">
                                <img v-if="item.image" :src="item.image" :alt="item.product_name" loading="lazy"
                                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                <Icon v-else icon="mdi:image-outline" class="text-5xl text-[#b8d1c0]" />
                            </div>

                            <h3
                                class="mt-4 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 group-hover:text-[#07532b]">
                                {{ item.product_name }}
                            </h3>

                            <div class="mt-2 flex items-center gap-2">
                                <Icon icon="mdi:star" class="text-[#ffc400]" />
                                <span class="text-xs text-slate-500">
                                    {{ item.average_rating.toFixed(1) }}
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
            <div v-if="toastMessage" role="status" aria-live="polite"
                class="fixed bottom-5 left-1/2 z-[80] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
                <Icon icon="mdi:information-outline" class="shrink-0 text-lg text-[#ffd326]" />
                {{ toastMessage }}
            </div>
        </Transition>
    </div>
</template>