<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Galeri EVDesign</h1>
        <p class="text-text-light text-sm">Koleksi foto produk dan dokumentasi</p>
      </div>
      <button class="btn-primary"><Icon icon="solar:cloud-upload-bold" /> Upload Foto</button>
    </div>

    <!-- Dropzone -->
    <div class="bg-surface rounded-2xl p-6 mb-6 border-2 border-dashed border-border text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
      <Icon icon="solar:cloud-upload-bold" class="text-5xl text-text-light mx-auto mb-3" />
      <p class="font-semibold">Drag & Drop foto di sini</p>
      <p class="text-sm text-text-light mt-1">atau klik untuk memilih file (PNG, JPG, WEBP - maks 5MB)</p>
      <button class="btn-primary-sm mt-4"><Icon icon="solar:gallery-add-bold" /> Pilih File</button>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <select class="filter-select w-48">
          <option>Semua Kategori</option>
          <option>Produk</option>
          <option>Proses Pembuatan</option>
          <option>Event</option>
        </select>
        <button class="btn-danger-sm"><Icon icon="solar:trash-bin-trash-bold" /> Hapus Terpilih</button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="i in 12" :key="i" class="relative aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer group">
          <div class="w-full h-full flex items-center justify-center" :style="`background: hsl(${i*30}, 40%, ${80-(i%3)*10}%)`">
            <Icon icon="solar:t-shirt-bold-duotone" class="text-5xl opacity-40" />
          </div>
          <div class="absolute inset-0 bg-primary/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
            <button class="w-9 h-9 rounded-lg bg-white/90 text-gray-800 flex items-center justify-center"><Icon icon="solar:eye-bold" /></button>
            <button class="w-9 h-9 rounded-lg bg-white/90 text-gray-800 flex items-center justify-center"><Icon icon="solar:pen-bold" /></button>
            <button class="w-9 h-9 rounded-lg bg-danger/90 text-white flex items-center justify-center"><Icon icon="solar:trash-bin-trash-bold" /></button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-6">
        <div class="flex gap-2">
          <button class="page-btn" disabled><Icon icon="solar:arrow-left-bold" /></button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn"><Icon icon="solar:arrow-right-bold" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>