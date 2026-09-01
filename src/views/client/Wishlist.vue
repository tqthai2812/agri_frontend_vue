<script setup>
import {
    computed,
    onBeforeUnmount,
    ref,
} from 'vue'

import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

import ConfirmModal from '@/components/common/ConfirmModal.vue'
import WishlistProductCard from '@/components/client/wishlist/WishlistProductCard.vue'
import WishlistToolbar from '@/components/client/wishlist/WishlistToolbar.vue'
import { wishlistMockItems } from '@/data/wishlistMockData'

const router = useRouter()

const search = ref('')
const selectedCategory = ref('all')
const sortBy = ref('newest')
const viewMode = ref('grid')
const selectedIds = ref(new Set())
const removeIds = ref([])
const showRemoveModal = ref(false)
const removing = ref(false)
const toast = ref(null)

let toastTimer = null

const wishlistItems = ref(wishlistMockItems)

const categories = computed(() => {
    const categoryMap = new Map()

    wishlistItems.value.forEach((item) => {
        const category = item.product?.category

        if (!category?.id) return

        const current = categoryMap.get(category.id)

        categoryMap.set(category.id, {
            id: category.id,
            name: category.name,
            count: Number(current?.count || 0) + 1,
        })
    })

    return [...categoryMap.values()]
})

const filteredItems = computed(() => {
    const keyword = search.value
        .trim()
        .toLocaleLowerCase('vi')

    const result = wishlistItems.value.filter(
        (item) => {
            const product = item.product || {}

            const matchesSearch =
                !keyword ||
                product.product_name
                    ?.toLocaleLowerCase('vi')
                    .includes(keyword) ||
                product.brand
                    ?.toLocaleLowerCase('vi')
                    .includes(keyword)

            const matchesCategory =
                selectedCategory.value === 'all' ||
                String(product.category?.id) ===
                String(selectedCategory.value)

            return matchesSearch && matchesCategory
        },
    )

    if (sortBy.value === 'price-asc') {
        return [...result].sort(
            (a, b) =>
                Number(a.product?.min_price || 0) -
                Number(b.product?.min_price || 0),
        )
    }

    if (sortBy.value === 'price-desc') {
        return [...result].sort(
            (a, b) =>
                Number(b.product?.min_price || 0) -
                Number(a.product?.min_price || 0),
        )
    }

    if (sortBy.value === 'name') {
        return [...result].sort((a, b) =>
            a.product.product_name.localeCompare(
                b.product.product_name,
                'vi',
            ),
        )
    }

    return [...result].sort(
        (a, b) =>
            new Date(b.created_at) -
            new Date(a.created_at),
    )
})

const selectedItems = computed(() => {
    return wishlistItems.value.filter((item) =>
        selectedIds.value.has(item.id),
    )
})

const allVisibleSelected = computed(() => {
    return (
        filteredItems.value.length > 0 &&
        filteredItems.value.every((item) =>
            selectedIds.value.has(item.id),
        )
    )
})

const removeMessage = computed(() => {
    if (removeIds.value.length > 1) {
        return `Bạn có chắc muốn xóa ${removeIds.value.length} sản phẩm đã chọn khỏi danh sách yêu thích?`
    }

    const item = wishlistItems.value.find(
        (wishlistItem) =>
            wishlistItem.id === removeIds.value[0],
    )

    return `Bạn có chắc muốn xóa “${item?.product?.product_name || 'sản phẩm này'}” khỏi danh sách yêu thích?`
})

function packagesOf(item) {
    return (item.product?.variants || [])
        .flatMap(
            (variant) => variant.packages || [],
        )
        .filter(
            (pkg) =>
                Number(pkg.quantity_available || 0) > 0,
        )
}

function showToast(message, type = 'success') {
    toast.value = {
        message,
        type,
    }

    window.clearTimeout(toastTimer)

    toastTimer = window.setTimeout(() => {
        toast.value = null
    }, 3000)
}

function toggleSelect(id) {
    const nextIds = new Set(selectedIds.value)

    if (nextIds.has(id)) {
        nextIds.delete(id)
    } else {
        nextIds.add(id)
    }

    selectedIds.value = nextIds
}

function toggleAllVisible() {
    const nextIds = new Set(selectedIds.value)

    if (allVisibleSelected.value) {
        filteredItems.value.forEach((item) => {
            nextIds.delete(item.id)
        })
    } else {
        filteredItems.value.forEach((item) => {
            nextIds.add(item.id)
        })
    }

    selectedIds.value = nextIds
}

function requestRemove(item) {
    removeIds.value = [item.id]
    showRemoveModal.value = true
}

function requestRemoveSelected() {
    if (!selectedIds.value.size) {
        showToast(
            'Hãy chọn ít nhất một sản phẩm.',
            'error',
        )

        return
    }

    removeIds.value = [...selectedIds.value]
    showRemoveModal.value = true
}

async function confirmRemove() {
    removing.value = true

    try {
        // Backend:
        // DELETE /api/wishlist/items
        // Body: { ids: removeIds.value }

        await new Promise((resolve) => {
            window.setTimeout(resolve, 450)
        })

        const ids = new Set(removeIds.value)

        wishlistItems.value =
            wishlistItems.value.filter(
                (item) => !ids.has(item.id),
            )

        const nextSelectedIds = new Set(
            selectedIds.value,
        )

        removeIds.value.forEach((id) => {
            nextSelectedIds.delete(id)
        })

        selectedIds.value = nextSelectedIds
        showRemoveModal.value = false

        showToast(
            ids.size > 1
                ? 'Đã xóa các sản phẩm được chọn.'
                : 'Đã xóa khỏi danh sách yêu thích.',
        )

        removeIds.value = []
    } finally {
        removing.value = false
    }
}

function addToCart(item) {
    const packages = packagesOf(item)

    if (!packages.length) {
        showToast(
            'Sản phẩm hiện đang hết hàng.',
            'error',
        )

        return
    }

    if (packages.length !== 1) {
        router.push({
            name: 'client-product-detail',
            params: {
                id: item.product_id,
            },
            query: {
                from: 'wishlist',
            },
        })

        return
    }

    const payload = {
        package_id: packages[0].id,
        quantity: 1,
    }

    console.log('Add cart payload:', payload)

    showToast(
        `Đã thêm “${item.product.product_name}” vào giỏ hàng.`,
    )

    // Backend:
    // POST /api/cart/items
}

function addSelectedToCart() {
    if (!selectedItems.value.length) {
        showToast(
            'Hãy chọn ít nhất một sản phẩm.',
            'error',
        )

        return
    }

    const directItems = selectedItems.value.filter(
        (item) => packagesOf(item).length === 1,
    )

    const needOptions =
        selectedItems.value.length -
        directItems.length

    const payload = directItems.map((item) => ({
        package_id: packagesOf(item)[0].id,
        quantity: 1,
    }))

    console.log(
        'Add selected cart payload:',
        payload,
    )

    if (!payload.length) {
        showToast(
            'Các sản phẩm đã chọn cần chọn phân loại hoặc đang hết hàng.',
            'error',
        )

        return
    }

    const suffix = needOptions
        ? ` ${needOptions} sản phẩm còn lại cần chọn phân loại hoặc đang hết hàng.`
        : ''

    showToast(
        `Đã thêm ${payload.length} sản phẩm vào giỏ hàng.${suffix}`,
        needOptions ? 'warning' : 'success',
    )

    // Backend:
    // POST /api/cart/items/bulk
}

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer)
})
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
                                Lưu lại sản phẩm quan tâm, theo dõi
                                giá và thêm vào giỏ hàng khi bạn sẵn
                                sàng.
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
                        'border-emerald-100 text-emerald-700':
                            toast.type === 'success',
                        'border-amber-100 text-amber-700':
                            toast.type === 'warning',
                        'border-red-100 text-red-600':
                            toast.type === 'error',
                    }">
                    <Icon :icon="toast.type === 'error'
                        ? 'mdi:alert-circle-outline'
                        : toast.type === 'warning'
                            ? 'mdi:alert-outline'
                            : 'mdi:check-circle-outline'
                        " class="shrink-0 text-xl" />

                    <span class="leading-5">
                        {{ toast.message }}
                    </span>

                    <button type="button" aria-label="Đóng thông báo" @click="toast = null">
                        <Icon icon="mdi:close" class="text-lg" />
                    </button>
                </div>
            </Transition>

            <section v-if="wishlistItems.length" class="mt-6">
                <WishlistToolbar v-model:search="search" v-model:category="selectedCategory" v-model:sort="sortBy"
                    v-model:view="viewMode" :categories="categories" :result-count="filteredItems.length"
                    :selected-count="selectedIds.size" :all-visible-selected="allVisibleSelected
                        " @toggle-all="toggleAllVisible" @remove-selected="
                            requestRemoveSelected
                        " @add-selected="addSelectedToCart" />

                <div v-if="filteredItems.length" class="mt-5" :class="viewMode === 'grid'
                    ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-4'
                    ">
                    <WishlistProductCard v-for="item in filteredItems" :key="item.id" :item="item" :selected="selectedIds.has(item.id)
                        " :view-mode="viewMode" @toggle-select="toggleSelect" @remove="requestRemove"
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
                    Nhấn biểu tượng trái tim trên sản phẩm để
                    lưu lại và xem nhanh tại đây.
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