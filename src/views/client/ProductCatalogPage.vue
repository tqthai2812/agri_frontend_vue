<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

const viewMode = ref('grid')
const sortBy = ref('default')
const maxPrice = ref(1000000)
const selectedCategory = ref('all')
const selectedBrands = ref([])
const favoriteIds = ref(new Set())
const toastMessage = ref('')

const categories = [
  { id: 'plant-protection', name: 'Thuốc bảo vệ thực vật', count: 15 },
  { id: 'fertilizer', name: 'Phân bón', count: 8 },
  { id: 'tools', name: 'Vật tư nông nghiệp', count: 3 },
  { id: 'seed', name: 'Hạt giống', count: 6 },
]

const brands = ['Nông Việt', 'Bình Điền', 'Lộc Trời', 'Đầu Trâu']

// Dữ liệu demo để giao diện chạy ngay.
// Khi nối API, thay mảng này bằng productStore.products hoặc dữ liệu từ ProductService.
const products = [
  {
    id: 1,
    category: 'plant-protection',
    brand: 'Nông Việt',
    name: 'Thuốc trừ bệnh đạo ôn Rice Guard',
    price: 100000,
    oldPrice: 150000,
    rating: 5,
    reviews: 5,
    image:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    category: 'fertilizer',
    brand: 'Bình Điền',
    name: 'Phân bón NPK chuyên dùng cho lúa',
    price: 565000,
    oldPrice: 605000,
    rating: 3,
    reviews: 5,
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    category: 'plant-protection',
    brand: 'Lộc Trời',
    name: 'Thuốc phòng trừ sâu cuốn lá',
    price: 268000,
    oldPrice: 368000,
    rating: 1,
    reviews: 5,
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    category: 'seed',
    brand: 'Nông Việt',
    name: 'Hạt giống lúa thơm chất lượng cao',
    price: 320000,
    oldPrice: 380000,
    rating: 4,
    reviews: 12,
    image:
      'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    category: 'tools',
    brand: 'Đầu Trâu',
    name: 'Bình phun thuốc nông nghiệp 20L',
    price: 740000,
    oldPrice: 820000,
    rating: 4,
    reviews: 8,
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    category: 'fertilizer',
    brand: 'Bình Điền',
    name: 'Phân hữu cơ vi sinh cải tạo đất',
    price: 185000,
    oldPrice: 220000,
    rating: 5,
    reviews: 16,
    image:
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80',
  },
]

const filteredProducts = computed(() => {
  const result = products.filter((product) => {
    const categoryMatched =
      selectedCategory.value === 'all' || product.category === selectedCategory.value
    const brandMatched =
      selectedBrands.value.length === 0 || selectedBrands.value.includes(product.brand)

    return categoryMatched && brandMatched && product.price <= maxPrice.value
  })

  if (sortBy.value === 'price-asc') return [...result].sort((a, b) => a.price - b.price)
  if (sortBy.value === 'price-desc') return [...result].sort((a, b) => b.price - a.price)
  if (sortBy.value === 'rating') return [...result].sort((a, b) => b.rating - a.rating)

  return result
})

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)

const showToast = (message) => {
  toastMessage.value = message
  window.clearTimeout(showToast.timeout)
  showToast.timeout = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

const addToCart = (product) => {
  // TODO: cartStore.addItem(product) khi nối Pinia/API.
  showToast(`Đã thêm “${product.name}” vào giỏ hàng`)
}

const toggleFavorite = (product) => {
  const nextIds = new Set(favoriteIds.value)

  if (nextIds.has(product.id)) {
    nextIds.delete(product.id)
    showToast('Đã bỏ khỏi danh sách yêu thích')
  } else {
    nextIds.add(product.id)
    showToast('Đã thêm vào danh sách yêu thích')
  }

  favoriteIds.value = nextIds
}
</script>

<template>
  <div class="bg-white font-sans text-slate-800">
    <!-- Banner -->
    <section
      class="relative isolate flex min-h-[230px] items-center overflow-hidden bg-cover bg-center sm:min-h-[300px] lg:min-h-[310px]"
      style="background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=88')"
    >
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/20"></div>

      <div class="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-6 sm:px-8 lg:px-16">
        <h1
          class="max-w-[1180px] text-3xl font-medium uppercase leading-[1.35] tracking-[0.04em] text-white drop-shadow-lg sm:text-5xl lg:text-[58px]"
        >
          Canh tác thông minh chẳng lo lúa ốm
        </h1>
      </div>

      <button
        class="absolute bottom-6 right-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg sm:right-8"
      >
        <Icon icon="mdi:gesture-tap" class="text-lg" />
        Dùng hiệu ứng
      </button>

      <div
        class="absolute -bottom-px left-0 h-4 w-full bg-white [clip-path:polygon(0_55%,4%_32%,8%_60%,12%_42%,17%_66%,21%_38%,26%_58%,31%_33%,36%_62%,41%_39%,46%_66%,51%_35%,56%_58%,61%_31%,66%_62%,71%_36%,76%_60%,81%_30%,86%_55%,91%_33%,96%_62%,100%_45%,100%_100%,0_100%)]"
      ></div>
    </section>

    <!-- Nội dung danh sách sản phẩm -->
    <main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
      <div class="grid items-start gap-7 lg:grid-cols-[255px_minmax(0,1fr)] xl:gap-9">
        <!-- Sidebar -->
        <aside class="space-y-5 lg:sticky lg:top-5">
          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">Danh mục</h2>

            <button
              class="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-xs transition hover:bg-[#f3f8f5]"
              :class="selectedCategory === 'all' ? 'font-bold text-[#07532b]' : 'text-slate-700'"
              @click="selectedCategory = 'all'"
            >
              Tất cả sản phẩm
              <span class="text-slate-400">({{ products.length }})</span>
            </button>

            <button
              v-for="category in categories"
              :key="category.id"
              class="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-xs transition last:border-0 hover:bg-[#f3f8f5]"
              :class="selectedCategory === category.id ? 'font-bold text-[#07532b]' : 'text-slate-700'"
              @click="selectedCategory = category.id"
            >
              {{ category.name }}
              <span class="text-slate-400">({{ category.count }})</span>
            </button>
          </section>

          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">Lọc theo giá</h2>

            <div class="px-4 py-5">
              <input
                v-model.number="maxPrice"
                type="range"
                min="100000"
                max="1000000"
                step="50000"
                class="h-1.5 w-full cursor-pointer accent-[#07532b]"
              />

              <div class="mt-4 flex items-center justify-between text-[11px]">
                <span class="text-slate-500">0 ₫</span>
                <span class="rounded-full bg-[#edf5f0] px-3 py-1.5 font-bold text-[#07532b]">
                  {{ formatPrice(maxPrice) }}
                </span>
              </div>
            </div>
          </section>

          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 class="bg-[#07532b] px-4 py-3 text-sm font-bold text-white">Thương hiệu</h2>

            <div class="space-y-3 px-4 py-4">
              <label
                v-for="brand in brands"
                :key="brand"
                class="flex cursor-pointer items-center gap-3 text-xs text-slate-600"
              >
                <input
                  v-model="selectedBrands"
                  type="checkbox"
                  :value="brand"
                  class="size-4 rounded border-slate-300 text-[#07532b] accent-[#07532b]"
                />
                {{ brand }}
              </label>
            </div>
          </section>
        </aside>

        <!-- Product area -->
        <section class="min-w-0">
          <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <button
                class="grid size-9 place-items-center rounded-full transition"
                :class="viewMode === 'grid' ? 'bg-[#07532b] text-[#ffd326]' : 'bg-slate-100 text-slate-400'"
                aria-label="Xem dạng lưới"
                @click="viewMode = 'grid'"
              >
                <Icon icon="mdi:view-grid" class="text-lg" />
              </button>

              <button
                class="grid size-9 place-items-center rounded-full transition"
                :class="viewMode === 'list' ? 'bg-[#07532b] text-[#ffd326]' : 'bg-slate-100 text-slate-400'"
                aria-label="Xem dạng danh sách"
                @click="viewMode = 'list'"
              >
                <Icon icon="mdi:view-list" class="text-xl" />
              </button>

              <span class="ml-1 text-[11px] text-slate-400">
                Hiển thị {{ filteredProducts.length }} trên {{ products.length }} kết quả
              </span>
            </div>

            <label class="relative sm:min-w-[150px]">
              <select
                v-model="sortBy"
                class="h-10 w-full appearance-none rounded-full border border-[#e6ddbc] bg-white py-0 pl-4 pr-10 text-xs text-[#466051] outline-none transition focus:border-[#07532b]"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="rating">Đánh giá tốt nhất</option>
              </select>
              <Icon
                icon="mdi:chevron-down"
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#466051]"
              />
            </label>
          </div>

          <div
            v-if="filteredProducts.length"
            class="grid gap-5"
            :class="viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'"
          >
            <article
              v-for="product in filteredProducts"
              :key="product.id"
              class="group overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,75,39,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#c3d9ca] hover:shadow-[0_12px_30px_rgba(15,75,39,0.12)]"
              :class="viewMode === 'list' ? 'sm:flex sm:items-center sm:gap-6' : ''"
            >
              <RouterLink
                :to="`/products/${product.id}`"
                class="block overflow-hidden rounded-lg bg-[#f3f6f2]"
                :class="viewMode === 'list' ? 'sm:w-[250px] sm:shrink-0' : ''"
              >
                <img
                  :src="product.image"
                  :alt="product.name"
                  class="h-48 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-52"
                />
              </RouterLink>

              <div class="flex-1 pt-4" :class="viewMode === 'list' ? 'sm:py-2' : ''">
                <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7e9c88]">
                  {{ product.brand }}
                </p>

                <RouterLink
                  :to="`/products/${product.id}`"
                  class="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition hover:text-[#087239]"
                >
                  {{ product.name }}
                </RouterLink>

                <div class="mt-3 flex flex-wrap items-baseline gap-3">
                  <strong class="text-sm text-[#0b8b42]">{{ formatPrice(product.price) }}</strong>
                  <del class="text-[11px] text-slate-400">{{ formatPrice(product.oldPrice) }}</del>
                </div>

                <div class="mt-2 flex items-center gap-2">
                  <div class="flex">
                    <Icon
                      v-for="star in 5"
                      :key="star"
                      icon="mdi:star"
                      class="text-lg"
                      :class="star <= product.rating ? 'text-[#ffc400]' : 'text-slate-200'"
                    />
                  </div>
                  <span class="text-[10px] text-slate-400">({{ product.rating }}/5)</span>
                </div>

                <div class="mt-4 flex items-center gap-2">
                  <button
                    class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] text-[#07532b] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white"
                    aria-label="Thêm vào giỏ hàng"
                    @click="addToCart(product)"
                  >
                    <Icon icon="mdi:cart-outline" class="text-lg" />
                  </button>

                  <button
                    class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white"
                    :class="favoriteIds.has(product.id) ? 'bg-[#07532b] text-white' : 'text-[#07532b]'"
                    aria-label="Yêu thích"
                    @click="toggleFavorite(product)"
                  >
                    <Icon :icon="favoriteIds.has(product.id) ? 'mdi:heart' : 'mdi:heart-outline'" class="text-lg" />
                  </button>

                  <RouterLink
                    :to="`/products/${product.id}`"
                    class="grid size-9 place-items-center rounded-full border border-[#9fc1aa] text-[#07532b] transition hover:border-[#07532b] hover:bg-[#07532b] hover:text-white"
                    aria-label="Xem chi tiết"
                  >
                    <Icon icon="mdi:eye-outline" class="text-lg" />
                  </RouterLink>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300">
            <div class="text-center">
              <Icon icon="mdi:package-variant-closed-remove" class="mx-auto text-5xl text-slate-300" />
              <p class="mt-3 text-sm font-semibold text-slate-500">Không tìm thấy sản phẩm phù hợp</p>
              <button
                class="mt-4 rounded-full bg-[#07532b] px-5 py-2 text-xs font-bold text-white"
                @click="selectedCategory = 'all'; selectedBrands = []; maxPrice = 1000000"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Nút nổi giống ảnh tham khảo -->
    <button
      class="fixed bottom-5 right-5 z-40 grid size-11 place-items-center rounded-full border-4 border-white bg-[#e95c5c] text-white shadow-xl"
      aria-label="Thông báo"
    >
      <Icon icon="mdi:bell-outline" class="text-xl" />
      <span class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-rose-500 shadow">
        N
      </span>
    </button>

    <!-- Toast demo -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-3 opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl"
      >
        <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>
