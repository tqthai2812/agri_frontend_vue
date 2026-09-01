<script setup>
import { Icon } from "@iconify/vue";
</script>

<template>
    <div class="hidden bg-[#064b26] text-white lg:block">
        <div class="mx-auto flex h-10 max-w-[1440px] items-center justify-between px-6 text-[11px]">
            <span class="rounded-full bg-white/10 px-4 py-1.5">
                Chào mừng đến với NFarmHouse
            </span>

            <div class="flex items-center gap-7">
                <a href="tel:+84334745378" class="flex items-center gap-2 transition hover:text-[#ffd326]">
                    <span class="grid size-5 place-items-center rounded-full bg-[#ffd326] text-[#064b26]">
                        <Icon icon="mdi:phone" class="text-sm" />
                    </span>

                    +84 334 745 378
                </a>

                <a href="mailto:nfarmhouse@gmail.com" class="flex items-center gap-2 transition hover:text-[#ffd326]">
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

            <div
                class="flex h-8 items-center gap-4 rounded-full border border-white/5 bg-white/10 px-4 text-white/70 shadow-inner">
                <a href="#" aria-label="Facebook" title="Facebook"
                    class="grid size-5 place-items-center transition duration-200 hover:scale-110 hover:text-[#ffd326]">
                    <Icon icon="mdi:facebook" class="text-[18px]" />
                </a>

                <a href="#" aria-label="Instagram" title="Instagram"
                    class="grid size-5 place-items-center transition duration-200 hover:scale-110 hover:text-[#ffd326]">
                    <Icon icon="mdi:instagram" class="text-[18px]" />
                </a>

                <a href="#" aria-label="Youtube" title="Youtube"
                    class="grid size-5 place-items-center transition duration-200 hover:scale-110 hover:text-[#ffd326]">
                    <Icon icon="mdi:youtube" class="text-[19px]" />
                </a>
            </div>
        </div>
    </div>
</template>