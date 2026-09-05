<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import HeroBanner from "@/components/client/home/HeroBanner.vue";
import HomeProductCard from "@/components/client/home/HomeProductCard.vue";
import ClientHomeService from "@/services/clientHome.service";

const favoriteIds = ref(new Set());
const toastMessage = ref("");
const loading = ref(false);
const errorMessage = ref("");

let toastTimer = null;

const categories = ref([]);
const featuredProducts = ref([]);
const saleProducts = ref([]);

const benefits = [
  {
    icon: "mdi:shield-check-outline",
    title: "Sản phẩm chính hãng",
    text: "Nguồn gốc minh bạch",
  },
  {
    icon: "mdi:truck-fast-outline",
    title: "Giao hàng nhanh",
    text: "Phục vụ nhiều khu vực",
  },
  {
    icon: "mdi:account-tie-voice-outline",
    title: "Tư vấn kỹ thuật",
    text: "Hỗ trợ đúng nhu cầu",
  },
  {
    icon: "mdi:cash-check",
    title: "Thanh toán an toàn",
    text: "Đơn giản và bảo mật",
  },
];

const posts = ref([]);

const categoryIconMap = {
  "thuoc-bao-ve-thuc-vat": "mdi:sprayer",
  "phan-bon": "mdi:leaf",
  "hat-giong": "mdi:seed",
  "dung-cu-nong-nghiep": "mdi:tools",
  "vat-tu-nong-nghiep": "mdi:tools",
};

const fallbackCategoryImages = [
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80",
];

const fallbackProductImage =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80";

const fallbackPostImage =
  "https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=900&q=80";

const homeProducts = computed(() => {
  return featuredProducts.value.length ? featuredProducts.value : [];
});

const discountProducts = computed(() => {
  return saleProducts.value.length ? saleProducts.value : homeProducts.value.slice(4, 8);
});

function normalizeCategory(category, index) {
  const slug = category.slug || category.category_slug || "";

  return {
    id: category.id,
    name: category.name || category.category_name || "Danh mục",
    description:
      category.description ||
      category.category_description ||
      "Sản phẩm phù hợp cho nhu cầu mùa vụ.",
    slug,
    icon: categoryIconMap[slug] || "mdi:leaf",
    image: fallbackCategoryImages[index % fallbackCategoryImages.length],
  };
}

function getProductPrice(product) {
  if (product.min_price !== undefined && product.min_price !== null) {
    return Number(product.min_price);
  }

  const firstVariant = product.variants?.[0];
  const firstPackage = firstVariant?.packages?.[0];

  return Number(firstPackage?.price || 0);
}

function getProductStock(product) {
  if (product.total_stock !== undefined && product.total_stock !== null) {
    return Number(product.total_stock);
  }

  return Number(
    product.variants?.reduce((variantTotal, variant) => {
      return (
        variantTotal +
        Number(
          variant.packages?.reduce((packageTotal, item) => {
            return packageTotal + Number(item.quantity_available || 0);
          }, 0) || 0,
        )
      );
    }, 0) || 0,
  );
}

function normalizeProduct(product, index) {
  const price = getProductPrice(product);
  const oldPrice = price > 0 ? Math.round(price * 1.12) : 0;
  const stock = getProductStock(product);

  return {
    id: product.id,
    brand: product.origin?.name || product.origin?.origin_name || product.brand || "AgriShop",
    name: product.name || product.product_name || "Sản phẩm",
    price,
    oldPrice,
    rating: Math.round(Number(product.average_rating || 5)),
    reviews: Number(product.review_count || 0),
    badge: stock <= 0 ? "Hết hàng" : index < 2 ? "Bán chạy" : "Nổi bật",
    image: product.primary_image || fallbackProductImage,

    raw: product,
    stock,
    firstPackageId:
      product.variants?.[0]?.packages?.[0]?.id ||
      product.packages?.[0]?.id ||
      null,
  };
}


function normalizePost(post) {
  return {
    id: post.id,
    title: post.title || "Bài viết",
    subtitle: post.subtitle || post.excerpt || "",
    slug: post.slug,
    date:
      post.published_date ||
      (post.published_at
        ? new Date(post.published_at).toLocaleDateString("vi-VN")
        : "—"),
    image: post.title_image_url || fallbackPostImage,
    raw: post,
  };
}

function showToast(message) {
  toastMessage.value = message;

  window.clearTimeout(toastTimer);

  toastTimer = window.setTimeout(() => {
    toastMessage.value = "";
  }, 2200);
}

function addToCart(product) {
  showToast(`Đã chọn “${product.name}”. Phần thêm giỏ hàng sẽ gắn sau.`);
}

function toggleFavorite(product) {
  const nextIds = new Set(favoriteIds.value);

  if (nextIds.has(product.id)) {
    nextIds.delete(product.id);
    showToast("Đã bỏ khỏi danh sách yêu thích");
  } else {
    nextIds.add(product.id);
    showToast("Đã thêm vào danh sách yêu thích");
  }

  favoriteIds.value = nextIds;
}

async function fetchHomeData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [
      categoriesResponse,
      featuredResponse,
      saleResponse,
      newsResponse,
    ] = await Promise.all([
      ClientHomeService.getCategories({
        per_page: 4,
      }),
      ClientHomeService.getProducts({
        per_page: 4,
        is_show: 1,
      }),
      ClientHomeService.getProducts({
        per_page: 4,
        is_show: 1,
        sort: "sale",
      }),
      ClientHomeService.getNews({
        per_page: 3,
      }),
    ]);

    const categoryData = categoriesResponse.data?.data || [];
    const featuredData = featuredResponse.data?.data || [];
    const saleData = saleResponse.data?.data || [];
    const newsData = newsResponse.data?.data || [];

    categories.value = categoryData.slice(0, 4).map(normalizeCategory);
    featuredProducts.value = featuredData.map(normalizeProduct);
    saleProducts.value = saleData.map(normalizeProduct);
    posts.value = newsData.slice(0, 3).map(normalizePost);
  } catch (error) {
    console.error("Lỗi tải dữ liệu trang chủ:", error);
    errorMessage.value =
      error.response?.data?.message ||
      "Không tải được dữ liệu trang chủ. Vui lòng thử lại sau.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchHomeData();
});

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer);
});
</script>

<template>
  <div class="bg-white text-slate-800">
    <HeroBanner />

    <main>
      <div v-if="errorMessage" class="mx-auto mt-6 max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div class="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          {{ errorMessage }}
        </div>
      </div>

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

        <div v-if="loading && !categories.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="item in 4" :key="item" class="min-h-[260px] animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

          <div v-if="!categories.length"
            class="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có danh mục để hiển thị.
          </div>
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

        <div v-if="loading && !homeProducts.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="item in 4" :key="item" class="h-[360px] animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <HomeProductCard v-for="product in homeProducts" :key="product.id" :product="product"
            :favorite="favoriteIds.has(product.id)" @add-cart="addToCart" @toggle-favorite="toggleFavorite" />

          <div v-if="!homeProducts.length"
            class="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có sản phẩm nổi bật.
          </div>
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
              Gửi hình ảnh biểu hiện của cây để nhận gợi ý nhận diện và hướng xử lý ban đầu nhanh chóng.
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

          <div v-if="loading && !discountProducts.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="item in 4" :key="item" class="h-[360px] animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <HomeProductCard v-for="product in discountProducts" :key="product.id" :product="product"
              :favorite="favoriteIds.has(product.id)" @add-cart="addToCart" @toggle-favorite="toggleFavorite" />

            <div v-if="!discountProducts.length"
              class="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có sản phẩm ưu đãi.
            </div>
          </div>
        </div>
      </section>

      <!-- Bài viết -->
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

        <div v-if="loading && !posts.length" class="grid gap-6 md:grid-cols-3">
          <div v-for="item in 3" :key="item" class="h-[330px] animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div v-else class="grid gap-6 md:grid-cols-3">
          <RouterLink v-for="post in posts" :key="post.id" :to="post.slug ? `/news/${post.slug}` : '/news'"
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

              <p v-if="post.subtitle" class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {{ post.subtitle }}
              </p>

              <span class="mt-4 flex items-center gap-1 text-xs font-bold text-[#07532b]">
                Đọc bài viết
                <Icon icon="mdi:arrow-right" />
              </span>
            </div>
          </RouterLink>

          <div v-if="!posts.length"
            class="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có bài viết nào được xuất bản.
          </div>
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