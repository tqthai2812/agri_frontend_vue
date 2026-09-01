<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { Icon } from '@iconify/vue'
import HeroBanner from '@/components/client/home/HeroBanner.vue'
import HomeProductCard from '@/components/client/home/HomeProductCard.vue'

const favoriteIds = ref(new Set())
const toastMessage = ref('')
let toastTimer = null

const categories = [
  {
    id: 1,
    name: 'Thuốc bảo vệ thực vật',
    description: 'Giải pháp phòng trừ sâu bệnh an toàn và hiệu quả.',
    slug: 'thuoc-bao-ve-thuc-vat',
    icon: 'mdi:sprayer',
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Phân bón',
    description: 'Dinh dưỡng phù hợp cho từng giai đoạn cây trồng.',
    slug: 'phan-bon',
    icon: 'mdi:leaf',
    image:
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Hạt giống',
    description: 'Nguồn giống chất lượng, năng suất và sức sống cao.',
    slug: 'hat-giong',
    icon: 'mdi:seed',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'Vật tư nông nghiệp',
    description: 'Dụng cụ bền bỉ giúp công việc nhẹ nhàng hơn.',
    slug: 'vat-tu-nong-nghiep',
    icon: 'mdi:tools',
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
  },
]

const benefits = [
  {
    icon: 'mdi:shield-check-outline',
    title: 'Sản phẩm chính hãng',
    text: 'Nguồn gốc minh bạch',
  },
  {
    icon: 'mdi:truck-fast-outline',
    title: 'Giao hàng nhanh',
    text: 'Phục vụ nhiều khu vực',
  },
  {
    icon: 'mdi:account-tie-voice-outline',
    title: 'Tư vấn kỹ thuật',
    text: 'Hỗ trợ đúng nhu cầu',
  },
  {
    icon: 'mdi:cash-check',
    title: 'Thanh toán an toàn',
    text: 'Đơn giản và bảo mật',
  },
]

const products = [
  {
    id: 1,
    brand: 'Nông Việt',
    name: 'Thuốc trừ bệnh đạo ôn Rice Guard',
    price: 100000,
    oldPrice: 150000,
    rating: 5,
    reviews: 18,
    badge: 'Bán chạy',
    image:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    brand: 'Bình Điền',
    name: 'Phân bón NPK chuyên dùng cho lúa',
    price: 565000,
    oldPrice: 605000,
    rating: 5,
    reviews: 26,
    badge: 'Nổi bật',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    brand: 'Lộc Trời',
    name: 'Thuốc phòng trừ sâu cuốn lá',
    price: 268000,
    oldPrice: 368000,
    rating: 4,
    reviews: 15,
    badge: 'Khuyên dùng',
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    brand: 'Nông Việt',
    name: 'Hạt giống lúa thơm chất lượng cao',
    price: 320000,
    oldPrice: 380000,
    rating: 5,
    reviews: 32,
    badge: 'Mới',
    image:
      'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    brand: 'Đầu Trâu',
    name: 'Bình phun thuốc nông nghiệp 20L',
    price: 740000,
    oldPrice: 820000,
    rating: 4,
    reviews: 8,
    badge: 'Ưu đãi',
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    brand: 'Bình Điền',
    name: 'Phân hữu cơ vi sinh cải tạo đất',
    price: 185000,
    oldPrice: 220000,
    rating: 5,
    reviews: 21,
    badge: 'Ưu đãi',
    image:
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 7,
    brand: 'Lộc Trời',
    name: 'Dinh dưỡng lá giúp cây phục hồi nhanh',
    price: 145000,
    oldPrice: 190000,
    rating: 4,
    reviews: 11,
    badge: 'Giảm giá',
    image:
      'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 8,
    brand: 'Nông Việt',
    name: 'Bộ dụng cụ chăm sóc vườn tiện lợi',
    price: 410000,
    oldPrice: 520000,
    rating: 5,
    reviews: 17,
    badge: 'Giảm giá',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  },
]

const posts = [
  {
    id: 1,
    title: 'Cách lựa chọn phân bón phù hợp cho từng giai đoạn của cây lúa',
    date: '28/08/2026',
    image:
      'https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Nhận biết sớm các dấu hiệu sâu bệnh thường gặp trên đồng ruộng',
    date: '24/08/2026',
    image:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Quy trình canh tác xanh giúp tiết kiệm chi phí và tăng năng suất',
    date: '20/08/2026',
    image:
      'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80',
  },
]

function showToast(message) {
  toastMessage.value = message

  window.clearTimeout(toastTimer)

  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

function addToCart(product) {
  showToast(`Đã thêm “${product.name}” vào giỏ hàng`)
}

function toggleFavorite(product) {
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

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <div class="bg-white text-slate-800">
    <HeroBanner />

    <main>
      <!-- Danh mục -->
      <section class="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
        <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
              Danh mục nổi bật
            </p>

            <h2 class="mt-2 text-2xl font-bold text-[#153f29] sm:text-3xl">
              Mọi nhu cầu cho mùa vụ
            </h2>
          </div>

          <RouterLink :to="{ name: 'client-products' }"
            class="flex items-center gap-1 text-sm font-bold text-[#07532b] hover:text-[#d2a900]">
            Xem tất cả
            <Icon icon="mdi:arrow-right" />
          </RouterLink>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink v-for="category in categories" :key="category.id" :to="{
            name: 'client-products',
            query: { category: category.slug },
          }" class="group relative min-h-[260px] overflow-hidden rounded-2xl bg-slate-900">
            <img :src="category.image" :alt="category.name" loading="lazy" decoding="async"
              class="absolute inset-0 size-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-55" />

            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

            <div class="absolute inset-x-0 bottom-0 p-5 text-white">
              <span class="mb-3 grid size-11 place-items-center rounded-full bg-[#ffd326] text-[#07532b]">
                <Icon :icon="category.icon" class="text-2xl" />
              </span>

              <h3 class="text-lg font-bold">
                {{ category.name }}
              </h3>

              <p class="mt-1 text-xs leading-5 text-white/75">
                {{ category.description }}
              </p>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- Cam kết -->
      <section class="border-y border-[#dce8df] bg-[#f3f8f5]">
        <div class="mx-auto grid max-w-[1440px] gap-6 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
          <div v-for="benefit in benefits" :key="benefit.title" class="flex items-center gap-4">
            <span class="grid size-12 shrink-0 place-items-center rounded-full bg-white text-[#07532b] shadow-sm">
              <Icon :icon="benefit.icon" class="text-2xl" />
            </span>

            <div>
              <h3 class="text-sm font-bold text-[#153f29]">
                {{ benefit.title }}
              </h3>

              <p class="mt-1 text-xs text-slate-500">
                {{ benefit.text }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Sản phẩm nổi bật -->
      <section class="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
              Được tin dùng
            </p>

            <h2 class="mt-2 text-2xl font-bold text-[#153f29] sm:text-3xl">
              Sản phẩm nổi bật
            </h2>
          </div>

          <RouterLink :to="{ name: 'client-products' }"
            class="hidden items-center gap-1 text-sm font-bold text-[#07532b] hover:text-[#d2a900] sm:flex">
            Xem tất cả
            <Icon icon="mdi:arrow-right" />
          </RouterLink>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <HomeProductCard v-for="product in products.slice(0, 4)" :key="product.id" :product="product"
            :favorite="favoriteIds.has(product.id)" @add-cart="addToCart" @toggle-favorite="toggleFavorite" />
        </div>
      </section>

      <!-- Banner chẩn đoán -->
      <section class="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6 lg:px-10">
        <div
          class="relative overflow-hidden rounded-3xl bg-[#064b26] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
          <div class="absolute -right-16 -top-20 size-64 rounded-full bg-[#ffd326]/10"></div>

          <div class="absolute -bottom-24 right-40 size-52 rounded-full border border-white/10"></div>

          <div class="relative max-w-2xl">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-[#ffd326]">
              <Icon icon="mdi:leaf-circle-outline" class="text-lg" />

              Công cụ hỗ trợ nhà nông
            </span>

            <h2 class="mt-5 text-2xl font-bold leading-tight sm:text-4xl">
              Phát hiện sớm vấn đề trên cây lúa
            </h2>

            <p class="mt-4 max-w-xl text-sm leading-6 text-white/70">
              Gửi hình ảnh biểu hiện của cây để nhận gợi ý
              nhận diện và hướng xử lý ban đầu nhanh chóng.
            </p>
          </div>

          <RouterLink to="/diagnosis"
            class="relative mt-7 inline-flex items-center gap-3 rounded-full bg-[#ffd326] px-6 py-3 text-sm font-bold text-[#064b26] transition hover:-translate-y-0.5 hover:bg-white lg:mt-0">
            Chẩn đoán bệnh lúa

            <Icon icon="mdi:arrow-right" class="text-lg" />
          </RouterLink>
        </div>
      </section>

      <!-- Ưu đãi -->
      <section class="bg-[#f7faf8] py-14">
        <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div class="mb-8 flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
                Tiết kiệm mùa vụ
              </p>

              <h2 class="mt-2 text-2xl font-bold text-[#153f29] sm:text-3xl">
                Ưu đãi hôm nay
              </h2>
            </div>

            <RouterLink :to="{
              name: 'client-products',
              query: { sort: 'sale' },
            }" class="hidden items-center gap-1 text-sm font-bold text-[#07532b] hover:text-[#d2a900] sm:flex">
              Xem ưu đãi
              <Icon icon="mdi:arrow-right" />
            </RouterLink>
          </div>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <HomeProductCard v-for="product in products.slice(4, 8)" :key="product.id" :product="product"
              :favorite="favoriteIds.has(product.id)" @add-cart="addToCart" @toggle-favorite="toggleFavorite" />
          </div>
        </div>
      </section>

      <!-- Bài viết -->
      <section class="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#d2a900]">
              Kiến thức nhà nông
            </p>

            <h2 class="mt-2 text-2xl font-bold text-[#153f29] sm:text-3xl">
              Bài viết mới nhất
            </h2>
          </div>

          <RouterLink to="/news"
            class="hidden items-center gap-1 text-sm font-bold text-[#07532b] hover:text-[#d2a900] sm:flex">
            Xem tất cả
            <Icon icon="mdi:arrow-right" />
          </RouterLink>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <RouterLink v-for="post in posts" :key="post.id" to="/news"
            class="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
            <div class="overflow-hidden">
              <img :src="post.image" :alt="post.title" loading="lazy" decoding="async"
                class="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>

            <div class="p-5">
              <p class="flex items-center gap-2 text-[11px] text-slate-400">
                <Icon icon="mdi:calendar-blank-outline" />
                {{ post.date }}
              </p>

              <h3
                class="mt-3 line-clamp-2 text-base font-bold leading-6 text-slate-800 transition group-hover:text-[#07532b]">
                {{ post.title }}
              </h3>

              <span class="mt-4 flex items-center gap-1 text-xs font-bold text-[#07532b]">
                Đọc bài viết
                <Icon icon="mdi:arrow-right" />
              </span>
            </div>
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- Toast -->
    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150"
      leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-3 opacity-0">
      <div v-if="toastMessage"
        class="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#063f22] px-5 py-3 text-xs font-semibold text-white shadow-2xl">
        <Icon icon="mdi:check-circle" class="text-lg text-[#ffd326]" />

        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>