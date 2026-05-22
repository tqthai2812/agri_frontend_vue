<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Manajemen Kategori</h1>
        <p class="text-text-light text-sm">6 kategori produk</p>
      </div>
      <button class="btn-primary"><Icon icon="solar:add-circle-bold" /> Tambah Kategori</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="cat in store.categories" :key="cat.id"
           class="bg-surface rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon :icon="cat.icon" class="text-2xl" />
        </div>
        <div class="flex-1">
          <div class="font-bold text-text">{{ cat.name }}</div>
          <div class="text-sm text-text-light">{{ cat.count }} produk</div>
        </div>
        <div class="flex gap-2">
          <button class="btn-outline-icon"><Icon icon="solar:pen-bold" /></button>
          <button class="btn-danger-icon"><Icon icon="solar:trash-bin-trash-bold" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()
</script>