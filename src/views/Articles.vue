<template>
  <div>
    <!-- Header responsive -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Artikel & Berita</h1>
        <p class="text-text-light text-sm">Konten digital EVDesign</p>
      </div>
      <button class="btn-primary w-full sm:w-auto">
        <Icon icon="solar:pen-new-square-bold" /> Tulis Artikel
      </button>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm overflow-x-auto">
      <!-- Filter bar responsive -->
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Icon icon="solar:magnifer-bold" class="text-text-light shrink-0" />
          <input type="text" placeholder="Cari artikel..." class="bg-transparent outline-none text-sm w-full" />
        </div>
        <select class="filter-select flex-1 sm:flex-none">
          <option>Semua Status</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Archived</option>
        </select>
        <select class="filter-select flex-1 sm:flex-none">
          <option>Semua Kategori</option>
          <option>Karawo</option>
          <option>Budaya Gorontalo</option>
          <option>Tutorial</option>
          <option>Berita</option>
        </select>
      </div>

      <!-- Table dengan scroll horizontal -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs font-semibold uppercase">Judul Artikel</th>
              <th class="p-3 text-left">Kategori</th>
              <th class="p-3 text-left">Tanggal</th>
              <th class="p-3 text-left">Views</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="art in store.articles" :key="art.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3">
                <div class="font-semibold text-sm">{{ art.title }}</div>
                <div class="text-xs text-text-light">{{ art.excerpt }}</div>
              </td>
              <td class="p-3"><span class="badge-gray">{{ art.category }}</span></td>
              <td class="p-3 whitespace-nowrap">{{ art.date }}</td>
              <td class="p-3 font-mono">{{ art.views.toLocaleString() }}</td>
              <td class="p-3">
                <span :class="{
                  'badge-active': art.status === 'Published',
                  'badge-pending': art.status === 'Draft',
                  'badge-gray': art.status === 'Archived'
                }">{{ art.status }}</span>
              </td>
              <td class="p-3">
                <div class="flex gap-2">
                  <button class="btn-outline-icon">
                    <Icon icon="solar:eye-bold" />
                  </button>
                  <button class="btn-outline-icon">
                    <Icon icon="solar:pen-bold" />
                  </button>
                  <button class="btn-danger-icon">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()
</script>