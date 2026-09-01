<script setup>
import { ref } from "vue";
import ClientTopBar from "./header/ClientTopBar.vue";
import ClientNavbar from "./header/ClientNavbar.vue";
import ClientMobileMenu from "./header/ClientMobileMenu.vue";
import SearchPanel from "./header/SearchPanel.vue";

defineProps({
  cartCount: {
    type: Number,
    default: 0,
  },
  wishlistCount: {
    type: Number,
    default: 0,
  },
});

const searchOpen = ref(false);
const mobileMenuOpen = ref(false);

function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  mobileMenuOpen.value = false;
}

function toggleMobileMenu() {
  mobileMenuOpen.value =
    !mobileMenuOpen.value;

  searchOpen.value = false;
}

function openMobileSearch() {
  mobileMenuOpen.value = false;
  searchOpen.value = true;
}
</script>

<template>
  <div class="relative z-50 font-sans">
    <ClientTopBar />

    <div class="relative">
      <ClientNavbar :cart-count="cartCount" :wishlist-count="wishlistCount" :search-open="searchOpen"
        :mobile-menu-open="mobileMenuOpen" @toggle-search="toggleSearch" @toggle-mobile="toggleMobileMenu" />

      <SearchPanel :open="searchOpen" @close="searchOpen = false" />

      <ClientMobileMenu :open="mobileMenuOpen" @close="mobileMenuOpen = false" @search="openMobileSearch" />
    </div>
  </div>
</template>