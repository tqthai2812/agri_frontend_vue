<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'

defineProps({
  cartCount: {
    type: Number,
    default: 0,
  },
  wishlistCount: {
    type: Number,
    default: 2,
  },
})

const route = useRoute()
const mobileMenuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Danh mục', to: '/products', dropdown: true },
  { label: 'Tin tức', to: '/news' },
  { label: 'Liên hệ', to: '/contact' },
]
</script>

<template>
  <div class="relative z-50 font-sans">
    <div class="hidden bg-[#064b26] text-white lg:block">
      <div class="mx-auto flex h-10 max-w-[1440px] items-center justify-between px-6 text-[11px]">
        <span class="rounded-full bg-white/10 px-4 py-1.5">Chào mừng đến với NFarmHouse</span>

        <div class="flex items-center gap-7">
          <a href="tel:+84334745378" class="flex items-center gap-2 transition hover:text-[#ffd326]">
            <span class="grid size-5 place-items-center rounded-full bg-[#ffd326] text-[#064b26]">
              <Icon icon="mdi:phone" class="text-sm" />
            </span>
            +84 334 745 378
          </a>

          <a
            href="mailto:nfarmhouse@gmail.com"
            class="flex items-center gap-2 transition hover:text-[#ffd326]"
          >
            <span class="grid size-5 place-items-center rounded-full bg-[#ffd326] text-[#064b26]">
              <Icon icon="mdi:email" class="text-sm" />
            </span>
            nfarmhouse@gmail.com
          </a>

          <span class="flex items-center gap-2">
            <span class="grid size-5 place-items-center rounded-full bg-[#ffd326] text-[#064b26]">
              <Icon icon="mdi:map-marker" class="text-sm" />
            </span>
            30/4, phường Hưng Lợi, quận Ninh Kiều, Cần Thơ
          </span>
        </div>

        <div class="flex items-center gap-3 text-white/65">
          <a href="#" aria-label="Facebook" class="transition hover:text-[#ffd326]">
            <Icon icon="mdi:facebook" />
          </a>
          <a href="#" aria-label="Instagram" class="transition hover:text-[#ffd326]">
            <Icon icon="mdi:instagram" />
          </a>
          <a href="#" aria-label="Youtube" class="transition hover:text-[#ffd326]">
            <Icon icon="mdi:youtube" />
          </a>
        </div>
      </div>
    </div>

    <header class="relative border-b border-slate-100 bg-white shadow-sm">
      <div class="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2" aria-label="NFarmHouse - Trang chủ">
          <span class="text-4xl font-light leading-none text-[#e6b51b]">N</span>
          <span>
            <strong class="block text-[17px] leading-none text-slate-900">NFarmHouse</strong>
            <small class="mt-1 block text-[7px] uppercase tracking-[0.18em] text-slate-400">
              Agricultural professor
            </small>
          </span>
        </RouterLink>

        <nav class="hidden items-center gap-9 text-[13px] font-semibold text-[#174e31] lg:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-1 transition hover:text-[#d6a900]"
            active-class="text-[#d6a900]"
          >
            {{ item.label }}
            <Icon v-if="item.dropdown" icon="mdi:chevron-down" />
          </RouterLink>
        </nav>

        <div class="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            class="grid size-10 place-items-center rounded-full border border-[#aec2b4] text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
            aria-label="Tìm kiếm"
          >
            <Icon icon="mdi:magnify" class="text-xl" />
          </button>

          <RouterLink
            to="/cart"
            class="relative grid size-10 place-items-center rounded-full border border-[#aec2b4] text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
            aria-label="Giỏ hàng"
          >
            <Icon icon="mdi:cart-outline" class="text-xl" />
            <span
              v-if="cartCount"
              class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ffd326] text-[10px] font-bold text-[#07532b]"
            >
              {{ cartCount }}
            </span>
          </RouterLink>

          <RouterLink
            to="/wishlist"
            class="relative grid size-10 place-items-center rounded-full border border-[#aec2b4] text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
            aria-label="Danh sách yêu thích"
          >
            <Icon icon="mdi:heart-outline" class="text-xl" />
            <span
              v-if="wishlistCount"
              class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ffd326] text-[10px] font-bold text-[#07532b]"
            >
              {{ wishlistCount }}
            </span>
          </RouterLink>

          <button
            type="button"
            class="grid size-10 place-items-center rounded-full border border-[#aec2b4] text-[#174e31] transition hover:border-[#07532b] hover:bg-[#edf5f0]"
            aria-label="Đổi giao diện"
          >
            <Icon icon="mdi:white-balance-sunny" class="text-xl text-[#e3b316]" />
          </button>
        </div>

        <button
          type="button"
          class="grid size-10 place-items-center rounded-full bg-[#07532b] text-white lg:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="Mở menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Icon :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="text-2xl" />
        </button>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <nav
          v-if="mobileMenuOpen"
          class="absolute inset-x-0 top-full border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden"
        >
          <div class="mx-auto flex max-w-[1440px] flex-col gap-1 text-sm font-semibold text-[#174e31]">
            <RouterLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to"
              class="rounded-lg px-3 py-2.5 hover:bg-[#edf5f0]"
            >
              {{ item.label }}
            </RouterLink>

            <div class="mt-3 flex items-center gap-2 border-t border-slate-100 pt-4">
              <RouterLink to="/cart" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#07532b] px-4 py-2.5 text-white">
                <Icon icon="mdi:cart-outline" class="text-lg" />
                Giỏ hàng
              </RouterLink>
              <RouterLink to="/wishlist" class="grid size-10 place-items-center rounded-full border border-[#07532b]">
                <Icon icon="mdi:heart-outline" class="text-lg" />
              </RouterLink>
              <RouterLink to="/login" class="grid size-10 place-items-center rounded-full border border-[#07532b]">
                <Icon icon="mdi:account-outline" class="text-lg" />
              </RouterLink>
            </div>
          </div>
        </nav>
      </Transition>
    </header>
  </div>
</template>
