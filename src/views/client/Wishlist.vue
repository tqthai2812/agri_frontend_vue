<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from "vue";

import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

import ConfirmModal from "@/components/common/ConfirmModal.vue";
import WishlistProductCard from "@/components/client/wishlist/WishlistProductCard.vue";
import WishlistToolbar from "@/components/client/wishlist/WishlistToolbar.vue";

import WishlistService from "@/services/client/wishlist.service";
import { useCartStore } from "@/stores/client/cartStore";

const router = useRouter();
const cartStore = useCartStore();

const search = ref("");
const selectedCategory = ref("all");
const sortBy = ref("newest");
const viewMode = ref("grid");

const selectedIds = ref(new Set());
const removeIds = ref([]);
const showRemoveModal = ref(false);

const loading = ref(false);
const removing = ref(false);
const actionLoading = ref(false);

const error = ref("");
const toast = ref(null);

let toastTimer = null;

const wishlistItems = ref([]);

const categories = computed(() => {
    const categoryMap = new Map();

    wishlistItems.value.forEach((item) => {
        const category = item.product?.category;

        if (!category?.id) {
            return;
        }

        const current = categoryMap.get(category.id);

        categoryMap.set(category.id, {
            id: category.id,
            name: category.name || category.category_name,
            count: Number(current?.count || 0) + 1,
        });
    });

    return [...categoryMap.values()];
});

const filteredItems = computed(() => {
    const keyword = search.value.trim().toLocaleLowerCase("vi");

    const result = wishlistItems.value.filter((item) => {
        const product = item.product || {};

        const productName = product.product_name || product.name || "";
        const brand = product.brand || product.origin?.name || "";
        const categoryName =
            product.category?.name ||
            product.category?.category_name ||
            "";

        const matchesSearch =
            !keyword ||
            productName.toLocaleLowerCase("vi").includes(keyword) ||
            brand.toLocaleLowerCase("vi").includes(keyword) ||
            categoryName.toLocaleLowerCase("vi").includes(keyword);

        const matchesCategory =
            selectedCategory.value === "all" ||
            String(product.category?.id) === String(selectedCategory.value);

        return matchesSearch && matchesCategory;
    });

    if (sortBy.value === "price-asc") {
        return [...result].sort((a, b) => {
            return Number(a.product?.min_price || 0) - Number(b.product?.min_price || 0);
        });
    }

    if (sortBy.value === "price-desc") {
        return [...result].sort((a, b) => {
            return Number(b.product?.min_price || 0) - Number(a.product?.min_price || 0);
        });
    }

    if (sortBy.value === "name") {
        return [...result].sort((a, b) => {
            const nameA = a.product?.product_name || a.product?.name || "";
            const nameB = b.product?.product_name || b.product?.name || "";

            return nameA.localeCompare(nameB, "vi");
        });
    }

    return [...result].sort((a, b) => {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
});

const selectedItems = computed(() => {
    return wishlistItems.value.filter((item) => {
        return selectedIds.value.has(Number(item.id));
    });
});

const allVisibleSelected = computed(() => {
    return (
        filteredItems.value.length > 0 &&
        filteredItems.value.every((item) => {
            return selectedIds.value.has(Number(item.id));
        })
    );
});

const removeMessage = computed(() => {
    if (removeIds.value.length > 1) {
        return `Bạn có chắc muốn xóa ${removeIds.value.length} sản phẩm đã chọn khỏi danh sách yêu thích?`;
    }

    const item = wishlistItems.value.find((wishlistItem) => {
        return Number(wishlistItem.id) === Number(removeIds.value[0]);
    });

    return `Bạn có chắc muốn xóa “${item?.product?.product_name || item?.product?.name || "sản phẩm này"}” khỏi danh sách yêu thích?`;
});

function extractList(response) {
    return response.data?.data || [];
}

function packagesOf(item) {
    return (item.product?.variants || [])
        .flatMap((variant) => {
            return variant.packages || [];
        })
        .filter((pkg) => {
            return Number(pkg.quantity_available || 0) > 0;
        });
}

function showToast(message, type = "success") {
    toast.value = {
        message,
        type,
    };

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.value = null;
    }, 3000);
}

function syncSelectedAfterFetch() {
    const validIds = new Set(
        wishlistItems.value.map((item) => {
            return Number(item.id);
        }),
    );

    selectedIds.value = new Set(
        [...selectedIds.value]
            .map(Number)
            .filter((id) => {
                return validIds.has(id);
            }),
    );
}

async function fetchWishlist() {
    loading.value = true;
    error.value = "";

    try {
        const response = await WishlistService.getWishlist();

        wishlistItems.value = extractList(response);

        syncSelectedAfterFetch();
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            "Không tải được danh sách yêu thích.";
    } finally {
        loading.value = false;
    }
}

function toggleSelect(id) {
    const itemId = Number(id);
    const nextIds = new Set(selectedIds.value);

    if (nextIds.has(itemId)) {
        nextIds.delete(itemId);
    } else {
        nextIds.add(itemId);
    }

    selectedIds.value = nextIds;
}

function toggleAllVisible() {
    const nextIds = new Set(selectedIds.value);

    if (allVisibleSelected.value) {
        filteredItems.value.forEach((item) => {
            nextIds.delete(Number(item.id));
        });
    } else {
        filteredItems.value.forEach((item) => {
            nextIds.add(Number(item.id));
        });
    }

    selectedIds.value = nextIds;
}

function requestRemove(item) {
    removeIds.value = [Number(item.id)];
    showRemoveModal.value = true;
}

function requestRemoveSelected() {
    if (!selectedIds.value.size) {
        showToast("Hãy chọn ít nhất một sản phẩm.", "error");
        return;
    }

    removeIds.value = [...selectedIds.value].map(Number);
    showRemoveModal.value = true;
}

async function confirmRemove() {
    if (!removeIds.value.length) {
        return;
    }

    removing.value = true;
    error.value = "";

    try {
        if (removeIds.value.length === 1) {
            await WishlistService.removeItem(removeIds.value[0]);
        } else {
            await WishlistService.removeItems(removeIds.value);
        }

        const removedIdSet = new Set(removeIds.value.map(Number));

        wishlistItems.value = wishlistItems.value.filter((item) => {
            return !removedIdSet.has(Number(item.id));
        });

        selectedIds.value = new Set(
            [...selectedIds.value].filter((id) => {
                return !removedIdSet.has(Number(id));
            }),
        );

        showRemoveModal.value = false;

        showToast(
            removedIdSet.size > 1
                ? "Đã xóa các sản phẩm được chọn."
                : "Đã xóa khỏi danh sách yêu thích.",
        );

        removeIds.value = [];
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            "Không xóa được sản phẩm yêu thích.";
    } finally {
        removing.value = false;
    }
}

async function addToCart(item) {
    const packages = packagesOf(item);

    if (!packages.length) {
        showToast("Sản phẩm hiện đang hết hàng.", "error");
        return;
    }

    if (packages.length !== 1) {
        router.push({
            name: "client-product-detail",
            params: {
                id: item.product_id,
            },
            query: {
                from: "wishlist",
            },
        });

        return;
    }

    actionLoading.value = true;
    error.value = "";

    try {
        await cartStore.addToCart({
            package_id: packages[0].id,
            quantity: 1,
        });

        showToast(
            `Đã thêm “${item.product?.product_name || item.product?.name || "sản phẩm"}” vào giỏ hàng.`,
        );
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            cartStore.errorMsg ||
            "Không thêm được sản phẩm vào giỏ hàng.";
    } finally {
        actionLoading.value = false;
    }
}

async function addSelectedToCart() {
    if (!selectedItems.value.length) {
        showToast("Hãy chọn ít nhất một sản phẩm.", "error");
        return;
    }

    const directItems = selectedItems.value.filter((item) => {
        return packagesOf(item).length === 1;
    });

    const needOptions = selectedItems.value.length - directItems.length;

    if (!directItems.length) {
        showToast(
            "Các sản phẩm đã chọn cần chọn phân loại hoặc đang hết hàng.",
            "error",
        );

        return;
    }

    actionLoading.value = true;
    error.value = "";

    try {
        for (const item of directItems) {
            const pkg = packagesOf(item)[0];

            await cartStore.addToCart({
                package_id: pkg.id,
                quantity: 1,
            });
        }

        const suffix = needOptions
            ? ` ${needOptions} sản phẩm còn lại cần chọn phân loại hoặc đang hết hàng.`
            : "";

        showToast(
            `Đã thêm ${directItems.length} sản phẩm vào giỏ hàng.${suffix}`,
            needOptions ? "warning" : "success",
        );
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            cartStore.errorMsg ||
            "Không thêm được sản phẩm vào giỏ hàng.";
    } finally {
        actionLoading.value = false;
    }
}

onMounted(() => {
    fetchWishlist();
});

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer);
});
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

                    <span class="font-semibold text-[#174e31]">
                        Danh sách yêu thích
                    </span>
                </nav>
            </div>
        </div>

        <main class="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            <section
                class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064b26] via-[#075a2d] to-[#0a7139] px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,75,38,0.18)] sm:px-8 sm:py-9">
                <div class="absolute -right-16 -top-20 size-56 rounded-full bg-[#ffd326]/12"></div>

                <div class="absolute -bottom-20 right-32 size-44 rounded-full bg-white/5"></div>

                <Icon icon="mdi:leaf"
                    class="absolute right-8 top-1/2 hidden -translate-y-1/2 text-[120px] text-white/5 md:block" />

                <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-4">
                        <span
                            class="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/12 text-[#ffd326] ring-1 ring-white/15 sm:size-16">
                            <Icon icon="mdi:heart" class="text-3xl sm:text-4xl" />
                        </span>

                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffd326]">
                                Sản phẩm đã lưu
                            </p>

                            <h1 class="mt-1 text-2xl font-bold sm:text-3xl">
                                Danh sách yêu thích
                            </h1>

                            <p class="mt-2 max-w-xl text-xs leading-5 text-white/65">
                                Lưu lại sản phẩm quan tâm, theo dõi giá và thêm vào giỏ hàng khi bạn sẵn sàng.
                            </p>
                        </div>
                    </div>

                    <div class="flex w-fit items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                        <strong class="text-2xl text-[#ffd326]">
                            {{ wishlistItems.length }}
                        </strong>

                        <span class="text-[10px] leading-4 text-white/65">
                            sản phẩm<br />
                            đã lưu
                        </span>
                    </div>
                </div>
            </section>

            <Transition enter-active-class="transition duration-200" enter-from-class="-translate-y-2 opacity-0"
                leave-active-class="transition duration-150" leave-to-class="-translate-y-2 opacity-0">
                <div v-if="toast"
                    class="fixed right-4 top-24 z-[80] flex max-w-sm items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-xs font-semibold shadow-xl sm:right-6"
                    :class="{
                        'border-emerald-100 text-emerald-700': toast.type === 'success',
                        'border-amber-100 text-amber-700': toast.type === 'warning',
                        'border-red-100 text-red-600': toast.type === 'error',
                    }">
                    <Icon :icon="toast.type === 'error'
                        ? 'mdi:alert-circle-outline'
                        : toast.type === 'warning'
                            ? 'mdi:alert-outline'
                            : 'mdi:check-circle-outline'" class="shrink-0 text-xl" />

                    <span class="leading-5">
                        {{ toast.message }}
                    </span>

                    <button type="button" aria-label="Đóng thông báo" @click="toast = null">
                        <Icon icon="mdi:close" class="text-lg" />
                    </button>
                </div>
            </Transition>

            <div v-if="error"
                class="mt-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                <Icon icon="mdi:alert-circle-outline" class="text-xl" />

                {{ error }}
            </div>

            <section v-if="loading"
                class="mt-6 grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto text-5xl text-[#07532b] animate-spin" />

                    <p class="mt-3 text-xs font-semibold text-slate-400">
                        Đang tải danh sách yêu thích...
                    </p>
                </div>
            </section>

            <section v-else-if="wishlistItems.length" class="mt-6">
                <WishlistToolbar v-model:search="search" v-model:category="selectedCategory" v-model:sort="sortBy"
                    v-model:view="viewMode" :categories="categories" :result-count="filteredItems.length"
                    :selected-count="selectedIds.size" :all-visible-selected="allVisibleSelected"
                    @toggle-all="toggleAllVisible" @remove-selected="requestRemoveSelected"
                    @add-selected="addSelectedToCart" />

                <div v-if="filteredItems.length" class="mt-5" :class="viewMode === 'grid'
                    ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-4'">
                    <WishlistProductCard v-for="item in filteredItems" :key="item.id" :item="item"
                        :selected="selectedIds.has(Number(item.id))" :view-mode="viewMode"
                        :disabled="actionLoading || removing" @toggle-select="toggleSelect" @remove="requestRemove"
                        @add-cart="addToCart" />
                </div>

                <div v-else class="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
                    <span class="mx-auto grid size-20 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                        <Icon icon="mdi:magnify-close" class="text-4xl" />
                    </span>

                    <h2 class="mt-5 text-base font-bold text-[#123d27]">
                        Không tìm thấy sản phẩm phù hợp
                    </h2>

                    <p class="mt-1 text-xs text-slate-400">
                        Thử đổi từ khóa hoặc chọn lại danh mục.
                    </p>

                    <button type="button"
                        class="mt-5 rounded-full border border-[#07532b] px-5 py-2.5 text-xs font-bold text-[#07532b] transition hover:bg-[#edf5f0]"
                        @click="
                            search = '';
                        selectedCategory = 'all';
                        ">
                        Xóa bộ lọc
                    </button>
                </div>
            </section>

            <section v-else
                class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
                <div class="relative mx-auto grid size-24 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:heart-outline" class="text-5xl" />

                    <span
                        class="absolute -right-1 top-1 grid size-7 place-items-center rounded-full bg-[#ffd326] text-[#07532b] ring-4 ring-white">
                        <Icon icon="mdi:plus" class="text-lg" />
                    </span>
                </div>

                <h2 class="mt-6 text-xl font-bold text-[#123d27]">
                    Danh sách yêu thích đang trống
                </h2>

                <p class="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                    Nhấn biểu tượng trái tim trên sản phẩm để lưu lại và xem nhanh tại đây.
                </p>

                <RouterLink :to="{ name: 'client-products' }"
                    class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07532b] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#064522]">
                    Khám phá sản phẩm

                    <Icon icon="mdi:arrow-right" class="text-base" />
                </RouterLink>
            </section>
        </main>

        <ConfirmModal v-model="showRemoveModal" title="Xóa sản phẩm yêu thích" :message="removeMessage"
            confirm-text="Xóa sản phẩm" cancel-text="Giữ lại" loading-text="Đang xóa..." type="danger"
            icon="mdi:heart-remove-outline" :loading="removing" :close-on-overlay="false" @confirm="confirmRemove"
            @cancel="removeIds = []" />
    </div>
</template>