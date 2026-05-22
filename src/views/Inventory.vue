<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Inventaris Bahan</h1>
        <p class="text-text-light text-sm">Kelola stok bahan baku sulaman Karawo</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-outline-sm"><Icon icon="solar:add-square-bold" /> Tambah Stok</button>
        <button class="btn-primary"><Icon icon="solar:add-circle-bold" /> Tambah Bahan</button>
      </div>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm">
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 w-64">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />
          <input type="text" placeholder="Cari bahan..." class="bg-transparent outline-none text-sm w-full" />
        </div>
        <select class="filter-select">
          <option>Semua Kategori</option>
          <option>Benang</option>
          <option>Kain</option>
          <option>Aksesoris</option>
        </select>
        <select class="filter-select">
          <option>Semua Status</option>
          <option>Aman</option>
          <option>Menipis</option>
          <option>Habis</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs font-semibold uppercase">Nama Bahan</th>
              <th class="p-3 text-left">Kategori</th>
              <th class="p-3 text-left">Stok</th>
              <th class="p-3 text-left">Satuan</th>
              <th class="p-3 text-left">Min. Stok</th>
              <th class="p-3 text-left">Status Stok</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.inventory" :key="item.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3 font-semibold text-sm">{{ item.name }}</td>
              <td class="p-3"><span class="badge-gray">{{ item.category }}</span></td>
              <td class="p-3 font-mono font-bold">{{ item.stock }}</td>
              <td class="p-3">{{ item.unit }}</td>
              <td class="p-3 font-mono">{{ item.minStock }}</td>
              <td class="p-3">
                <span :class="{
                  'badge-active': item.status === 'Aman',
                  'badge-pending': item.status === 'Menipis',
                  'badge-inactive': item.status === 'Habis'
                }">{{ item.status }}</span>
              </td>
              <td class="p-3">
                <div class="flex gap-2">
                  <button class="btn-outline-icon text-success"><Icon icon="solar:add-square-bold" /></button>
                  <button class="btn-outline-icon"><Icon icon="solar:pen-bold" /></button>
                  <button class="btn-outline-icon"><Icon icon="solar:history-bold" /></button>
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