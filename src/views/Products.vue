<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Daftar Produk</h1>
        <p class="text-text-light text-sm">124 produk terdaftar</p>
      </div>
      <button class="btn-primary" @click="store.showAddProduct = true">
        <Icon icon="solar:add-circle-bold" /> Tambah Produk
      </button>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm">
      <!-- Filter bar - wrap on mobile -->
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />
          <input type="text" placeholder="Cari produk..." class="bg-transparent outline-none text-sm w-full" />
        </div>
        <select class="filter-select flex-1 sm:flex-none">
          <option>Semua Kategori</option>
        </select>
        <select class="filter-select flex-1 sm:flex-none">
          <option>Semua Status</option>
        </select>
        <select class="filter-select flex-1 sm:flex-none">
          <option>Urutkan</option>
        </select>
        <button class="btn-outline-sm">
          <Icon icon="solar:export-bold" /> Export
        </button>
      </div>

      <!-- Table dengan overflow-x-auto -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs"><input type="checkbox" /></th>
              <th class="p-3 text-left">Produk</th>
              <th class="p-3 text-left">Kategori</th>
              <th class="p-3 text-left">Harga</th>
              <th class="p-3 text-left">Stok</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.products" :key="p.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3"><input type="checkbox" /></td>
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ background: p.color }">
                    <Icon icon="solar:t-shirt-bold" class="text-white" />
                  </div>
                  <div>
                    <div class="font-semibold text-sm">{{ p.name }}</div>
                    <div class="text-xs text-text-light">SKU: {{ p.sku }}</div>
                  </div>
                </div>
              </td>
              <td class="p-3"><span class="badge-gray">{{ p.category }}</span></td>
              <td class="p-3 font-mono">{{ formatRupiah(p.price) }}</td>
              <td class="p-3" :class="p.stock < 5 ? 'text-danger font-bold' : ''">{{ p.stock }} pcs</td>
              <td class="p-3"><span :class="p.status === 'Aktif' ? 'badge-active' : 'badge-inactive'">{{ p.status
                  }}</span></td>
              <td class="p-3">
                <div class="flex gap-2">
                  <button class="btn-outline-icon">
                    <Icon icon="solar:pen-bold" />
                  </button>
                  <button class="btn-outline-icon">
                    <Icon icon="solar:copy-bold" />
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

      <!-- Pagination responsive -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">Menampilkan 1-10 dari 124 produk</span>
        <div class="flex flex-wrap justify-center gap-2">
          <button class="page-btn" disabled>
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn">13</button>
          <button class="page-btn">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal tetap sama -->
    <ProductModal v-if="store.showAddProduct" @close="store.showAddProduct = false" />
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'
import ProductModal from '@/components/ui/ProductModal.vue'

const store = useAppStore()
const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val)
</script>