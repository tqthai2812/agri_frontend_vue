<script setup>
import { computed, onMounted, ref, watch } from "vue";
import ClientTopBar from "./header/ClientTopBar.vue";
import ClientNavbar from "./header/ClientNavbar.vue";
import ClientMobileMenu from "./header/ClientMobileMenu.vue";
import SearchPanel from "./header/SearchPanel.vue";

import ClientProductService from "@/services/clientProduct.service";
import { useAuthStore } from "@/stores/shared/authStore";
import { useCartStore } from "@/stores/client/cartStore";

const authStore = useAuthStore();
const cartStore = useCartStore();

const searchOpen = ref(false);
const mobileMenuOpen = ref(false);
const categories = ref([]);

const fallbackCategories = [
  { id: 1, name: "Thuốc bảo vệ thực vật", slug: "thuoc-bao-ve-thuc-vat" },
  { id: 2, name: "Phân bón", slug: "phan-bon" },
  { id: 3, name: "Vật tư nông nghiệp", slug: "vat-tu-nong-nghiep" },
  { id: 4, name: "Hạt giống", slug: "hat-giong" },
];

const cartCount = computed(() => {
  const items =
    cartStore.cart?.items ||
    cartStore.cart?.cart_items ||
    cartStore.items ||
    [];

  return items.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
});

const wishlistCount = computed(() => {
  return 0;
});

function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name || category.category_name || "Danh mục",
    slug: category.slug || category.category_slug || String(category.id),
  };
}

async function fetchCategories() {
  try {
    const response = await ClientProductService.getCategories({
      per_page: 100,
    });

    const data = response.data?.data || [];

    categories.value = data.length
      ? data.map(normalizeCategory)
      : fallbackCategories;
  } catch (error) {
    console.error("Lỗi tải danh mục header:", error);
    categories.value = fallbackCategories;
  }
}

async function fetchCartCount() {
  if (!authStore.isAuthenticated) {
    return;
  }

  if (typeof cartStore.fetchCart === "function") {
    await cartStore.fetchCart();
    return;
  }

  if (typeof cartStore.getCart === "function") {
    await cartStore.getCart();
  }
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  mobileMenuOpen.value = false;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  searchOpen.value = false;
}

function openMobileSearch() {
  mobileMenuOpen.value = false;
  searchOpen.value = true;
}

onMounted(() => {
  fetchCategories();
  fetchCartCount();
});

watch(
  () => authStore.isAuthenticated,
  () => {
    fetchCartCount();
  },
);
</script>

<template>
  <div class="relative z-50 font-sans">
    <ClientTopBar />

    <div class="relative">
      <ClientNavbar :categories="categories" :cart-count="cartCount" :wishlist-count="wishlistCount"
        :search-open="searchOpen" :mobile-menu-open="mobileMenuOpen" @toggle-search="toggleSearch"
        @toggle-mobile="toggleMobileMenu" />

      <SearchPanel :open="searchOpen" @close="searchOpen = false" />

      <ClientMobileMenu :open="mobileMenuOpen" :categories="categories" :cart-count="cartCount"
        :wishlist-count="wishlistCount" @close="mobileMenuOpen = false" @search="openMobileSearch" />
    </div>
  </div>
</template>