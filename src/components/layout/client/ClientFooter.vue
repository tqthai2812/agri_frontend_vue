<script setup>
import { Icon } from '@iconify/vue'

const posts = [
  {
    title: 'Sự kiện Việt Nam được vinh danh nông nghiệp và cộng đồng',
    date: '13/06/2025',
    image: 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=180&q=80',
  },
  {
    title: 'Chung tay tổ chức sự kiện tiến phong công nghệ - đồng hành cùng đổi mới',
    date: '13/06/2025',
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=180&q=80',
  },
  {
    title: 'Trồng sản xuất lúa hữu cơ ở Thái Bình',
    date: '09/07/2025',
    image: 'https://images.unsplash.com/photo-1536055401256-3551281467d8?auto=format&fit=crop&w=180&q=80',
  },
]

const socials = [
  { label: 'Facebook', icon: 'mdi:facebook', href: '#' },
  { label: 'Instagram', icon: 'mdi:instagram', href: '#' },
  { label: 'Messenger', icon: 'mdi:facebook-messenger', href: '#' },
  { label: 'Youtube', icon: 'mdi:youtube', href: '#' },
]
</script>

<template>
  <footer class="bg-[#064b26] font-sans text-white">
    <div class="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-16 lg:py-10">
      <div class="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2 text-white" aria-label="NFarmHouse - Trang chủ">
          <span class="text-4xl font-light leading-none text-[#e6b51b]">N</span>
          <span>
            <strong class="block text-[17px] leading-none">NFarmHouse</strong>
            <small class="mt-1 block text-[7px] uppercase tracking-[0.18em] text-white/55">
              Agricultural professor
            </small>
          </span>
        </RouterLink>

        <p class="text-xs font-bold uppercase tracking-[0.08em] text-white md:text-center">
          Trao niềm tin nhận tài lộc
        </p>

        <div class="flex items-center gap-3">
          <a
            v-for="social in socials"
            :key="social.label"
            :href="social.href"
            :aria-label="social.label"
            class="grid size-9 place-items-center rounded-full bg-[#ffc928] text-[#064b26] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Icon :icon="social.icon" class="text-xl" />
          </a>
        </div>
      </div>

      <div class="my-8 border-t border-dashed border-white/25"></div>

      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-[1fr_1.05fr_0.8fr] lg:gap-16">
        <section>
          <h2 class="mb-5 text-sm font-bold">Liên hệ với chúng tôi</h2>
          <ul class="space-y-4 text-[12px] leading-5 text-white/[0.82]">
            <li class="flex gap-3">
              <Icon icon="mdi:phone" class="mt-0.5 shrink-0 text-base text-[#ffc928]" />
              <a href="tel:+84334745378" class="transition hover:text-[#ffc928]">+84 334 745 378</a>
            </li>
            <li class="flex gap-3">
              <Icon icon="mdi:email" class="mt-0.5 shrink-0 text-base text-[#ffc928]" />
              <a href="mailto:nfarmhouse@gmail.com" class="transition hover:text-[#ffc928]">
                nfarmhouse@gmail.com
              </a>
            </li>
            <li class="flex gap-3">
              <Icon icon="mdi:map-marker" class="mt-0.5 shrink-0 text-base text-[#ffc928]" />
              <span>30/4, phường Hưng Lợi, quận Ninh Kiều, Cần Thơ</span>
            </li>
            <li class="flex gap-3">
              <Icon icon="mdi:clock-outline" class="mt-0.5 shrink-0 text-base text-[#ffc928]" />
              <span>Từ thứ hai - thứ sáu, 8:00 AM - 17:00 PM</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-5 text-sm font-bold">Bài đăng mới</h2>
          <ul class="space-y-3">
            <li v-for="post in posts" :key="post.title">
              <a href="#" class="group flex gap-3">
                <img
                  :src="post.image"
                  :alt="post.title"
                  class="size-12 shrink-0 rounded-md object-cover ring-1 ring-white/15"
                />
                <span class="min-w-0">
                  <strong class="line-clamp-2 block text-[10px] font-medium uppercase leading-4 text-white/85 transition group-hover:text-[#ffc928]">
                    {{ post.title }}
                  </strong>
                  <small class="mt-0.5 block text-[10px] text-[#ffc928]">{{ post.date }}</small>
                </span>
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-5 text-sm font-bold">Liên kết nhanh</h2>
          <nav class="flex flex-col items-start gap-4 text-[12px] text-white/[0.82]">
            <RouterLink to="/" class="transition hover:translate-x-1 hover:text-[#ffc928]">Trang chủ</RouterLink>
            <RouterLink to="/products" class="transition hover:translate-x-1 hover:text-[#ffc928]">Sản phẩm</RouterLink>
            <RouterLink to="/news" class="transition hover:translate-x-1 hover:text-[#ffc928]">Tin tức</RouterLink>
            <RouterLink to="/contact" class="transition hover:translate-x-1 hover:text-[#ffc928]">Liên hệ</RouterLink>
          </nav>
        </section>
      </div>

      <div class="mt-9 border-t border-dashed border-white/20 pt-5 text-center text-[10px] text-white/50 sm:text-left">
        © {{ new Date().getFullYear() }} NFarmHouse. All rights reserved.
      </div>
    </div>
  </footer>
</template>
