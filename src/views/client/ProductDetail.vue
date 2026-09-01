<script setup>
import {
    computed,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue'

import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'

import ProductGallery from '@/components/client/product/ProductGallery.vue'
import ProductPurchasePanel from '@/components/client/product/ProductPurchasePanel.vue'
import ProductContentTabs from '@/components/client/product/ProductContentTabs.vue'

const route = useRoute()

const loading = ref(false)
const product = ref(null)
const reviews = ref([])
const wishlisted = ref(false)
const toastMessage = ref('')

let toastTimer = null

const demoProduct = {
    id: 1,
    category_id: 1,
    subcategory_id: 2,
    origin_id: 1,

    product_name:
        'Thuốc trừ bệnh đạo ôn Rice Guard',

    description:
        'Rice Guard là sản phẩm hỗ trợ phòng trừ bệnh đạo ôn trên cây lúa. Sản phẩm được thiết kế để sử dụng trong nhiều giai đoạn sinh trưởng, giúp bảo vệ lá và duy trì sức phát triển của cây.\n\nSản phẩm có nhiều quy cách bán khác nhau để phù hợp với diện tích canh tác và nhu cầu sử dụng thực tế.',

    usage_instructions:
        'Lắc kỹ trước khi sử dụng. Pha sản phẩm theo đúng liều lượng được ghi trên nhãn. Phun đều lên bề mặt lá vào sáng sớm hoặc chiều mát. Không phun khi trời sắp mưa hoặc có gió mạnh.',

    safety_warning:
        'Để xa tầm tay trẻ em. Mang găng tay, khẩu trang và đồ bảo hộ khi sử dụng. Không ăn uống hoặc hút thuốc trong quá trình pha và phun sản phẩm. Thu gom bao bì đúng nơi quy định.',

    average_rating: 4.7,
    review_count: 3,
    is_show: true,

    category: {
        id: 1,
        category_name:
            'Thuốc bảo vệ thực vật',
        category_slug:
            'thuoc-bao-ve-thuc-vat',
    },

    subcategory: {
        id: 2,
        subcategory_name:
            'Thuốc trừ bệnh',
        subcategory_slug:
            'thuoc-tru-benh',
    },

    origin: {
        id: 1,
        origin_name: 'Việt Nam',
        origin_image: '',
    },

    images: [
        {
            id: 1,
            image_url:
                'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=90',
            is_primary: true,
            sort_order: 1,
        },
        {
            id: 2,
            image_url:
                'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=90',
            is_primary: false,
            sort_order: 2,
        },
        {
            id: 3,
            image_url:
                'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=90',
            is_primary: false,
            sort_order: 3,
        },
    ],

    variants: [
        {
            id: 11,
            product_id: 1,
            variant_name: 'Chai',

            packages: [
                {
                    id: 111,
                    variant_id: 11,
                    sku: 'RG-250ML',
                    size: 250,
                    unit: 'ml',
                    price: 100000,
                    quantity_available: 36,
                    barcode: '8930000011111',
                    box_barcode: '8930000091111',
                },
                {
                    id: 112,
                    variant_id: 11,
                    sku: 'RG-500ML',
                    size: 500,
                    unit: 'ml',
                    price: 185000,
                    quantity_available: 18,
                    barcode: '8930000011128',
                    box_barcode: '8930000091128',
                },
                {
                    id: 113,
                    variant_id: 11,
                    sku: 'RG-1L',
                    size: 1,
                    unit: 'l',
                    price: 340000,
                    quantity_available: 0,
                    barcode: '8930000011135',
                    box_barcode: '8930000091135',
                },
            ],
        },

        {
            id: 12,
            product_id: 1,
            variant_name: 'Thùng nguyên kiện',

            packages: [
                {
                    id: 121,
                    variant_id: 12,
                    sku: 'RG-BOX-24',
                    size: 24,
                    unit: 'piece',
                    price: 2250000,
                    quantity_available: 5,
                    barcode: '8930000011210',
                    box_barcode: '8930000091210',
                },
            ],
        },
    ],

    tags: [
        {
            id: 1,
            tag_name: 'Đạo ôn',
        },
        {
            id: 2,
            tag_name: 'Cây lúa',
        },
        {
            id: 3,
            tag_name: 'Thuốc trừ bệnh',
        },
    ],
}

const demoReviews = [
    {
        id: 1,
        user_id: 3,
        product_id: 1,
        parent_id: null,
        content:
            'Sản phẩm đóng gói cẩn thận, hướng dẫn rõ ràng và giao hàng nhanh.',
        rating: 5,
        created_at:
            '2026-08-28T09:30:00Z',

        user: {
            id: 3,
            name: 'Quốc Thái',
            avatar: '',
        },

        replies: [
            {
                id: 4,
                parent_id: 1,
                content:
                    'NFarmHouse cảm ơn bạn đã tin tưởng sản phẩm.',
                rating: null,

                user: {
                    id: 2,
                    name: 'NFarmHouse',
                },
            },
        ],
    },

    {
        id: 2,
        user_id: 5,
        product_id: 1,
        parent_id: null,
        content:
            'Mình mua quy cách chai 500ml, sản phẩm đúng mô tả.',
        rating: 5,
        created_at:
            '2026-08-26T11:15:00Z',

        user: {
            id: 5,
            name: 'Nguyễn Minh',
            avatar: '',
        },

        replies: [],
    },

    {
        id: 3,
        user_id: 7,
        product_id: 1,
        parent_id: null,
        content:
            'Đóng gói tốt, cần thêm nhiều hướng dẫn sử dụng thực tế hơn.',
        rating: 4,
        created_at:
            '2026-08-22T15:20:00Z',

        user: {
            id: 7,
            name: 'Thanh Hằng',
            avatar: '',
        },

        replies: [],
    },
]

const relatedProducts = [
    {
        id: 2,
        product_name:
            'Phân bón NPK chuyên dùng cho lúa',
        average_rating: 4.8,
        min_price: 565000,
        image:
            'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 3,
        product_name:
            'Thuốc phòng trừ sâu cuốn lá',
        average_rating: 4.6,
        min_price: 268000,
        image:
            'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 4,
        product_name:
            'Hạt giống lúa thơm chất lượng cao',
        average_rating: 4.9,
        min_price: 320000,
        image:
            'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 6,
        product_name:
            'Phân hữu cơ vi sinh cải tạo đất',
        average_rating: 5,
        min_price: 185000,
        image:
            'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
    },
]

const breadcrumbName = computed(() => {
    return (
        product.value?.product_name ||
        'Chi tiết sản phẩm'
    )
})

function formatPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value || 0))
}

function showToast(message) {
    toastMessage.value = message

    window.clearTimeout(toastTimer)

    toastTimer = window.setTimeout(() => {
        toastMessage.value = ''
    }, 2200)
}

async function loadProduct() {
    loading.value = true

    try {
        /*
        Khi nối backend:
    
        const response = await apiClient.get(
          `/api/products/${route.params.id}`
        )
    
        product.value =
          response.data.data || response.data
    
        reviews.value =
          product.value.reviews || []
        */

        product.value = {
            ...demoProduct,
            id: Number(
                route.params.id ||
                demoProduct.id,
            ),
        }

        reviews.value = demoReviews.map(
            (review) => ({
                ...review,
            }),
        )
    } finally {
        loading.value = false
    }
}

function handleAddCart(payload) {
    /*
    API giỏ hàng:
  
    await apiClient.post('/api/cart/items', {
      package_id: payload.package_id,
      quantity: payload.quantity,
    })
    */

    console.log('add-cart', payload)

    showToast(
        `Đã thêm ${payload.quantity} sản phẩm vào giỏ hàng`,
    )
}

function handleBuyNow(payload) {
    /*
    Sau này:
  
    await cartStore.buyNow(payload)
    router.push('/checkout')
    */

    console.log('buy-now', payload)

    showToast(
        'Đã chọn mua ngay, bước tiếp theo là thanh toán',
    )
}

function handleWishlist(productId) {
    /*
    API yêu thích:
  
    await apiClient.post('/api/wishlists', {
      product_id: productId,
    })
    */

    wishlisted.value = !wishlisted.value

    showToast(
        wishlisted.value
            ? 'Đã thêm vào yêu thích'
            : 'Đã bỏ khỏi yêu thích',
    )
}

function handleSubmitReview(payload) {
    /*
    API đánh giá:
  
    await apiClient.post(
      `/api/products/${product.value.id}/reviews`,
      payload,
    )
    */

    reviews.value.unshift({
        id: Date.now(),
        ...payload,
        created_at:
            new Date().toISOString(),

        user: {
            id: 3,
            name: 'Bạn',
            avatar: '',
        },

        replies: [],
    })

    product.value.review_count =
        reviews.value.length

    product.value.average_rating =
        reviews.value.reduce(
            (total, review) =>
                total +
                Number(review.rating || 0),
            0,
        ) / reviews.value.length

    showToast(
        'Đã gửi đánh giá sản phẩm',
    )
}

watch(
    () => route.params.id,
    () => {
        loadProduct()
    },
    {
        immediate: true,
    },
)

onBeforeUnmount(() => {
    window.clearTimeout(toastTimer)
})
</script>

<template>
    <div class="min-h-screen bg-white text-slate-800">
        <!-- Breadcrumb -->
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
            <!-- Skeleton -->
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
                <!-- Thông tin chính -->
                <div class="grid items-start gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
                    <ProductGallery :images="product.images" :product-name="product.product_name" />

                    <ProductPurchasePanel :product="product" :wishlisted="wishlisted" @add-cart="handleAddCart"
                        @buy-now="handleBuyNow" @toggle-wishlist="handleWishlist" />
                </div>

                <!-- Cam kết -->
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

                <!-- Tabs -->
                <div class="mt-12">
                    <ProductContentTabs :product="product" :reviews="reviews" @submit-review="handleSubmitReview" />
                </div>

                <!-- Liên quan -->
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

                    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                                    {{ item.average_rating }}
                                </span>
                            </div>

                            <strong class="mt-2 block text-sm text-[#0a8b43]">
                                Từ
                                {{ formatPrice(item.min_price) }}
                            </strong>
                        </RouterLink>
                    </div>
                </section>
            </template>
        </main>

        <!-- Toast -->
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