<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Manajemen Perajin</h1>
        <p class="text-text-light text-sm">40 perajin binaan terdaftar</p>
      </div>
      <button class="btn-primary">
        <Icon icon="solar:user-plus-bold" /> Tambah Perajin
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="stat-card-success">
        <div class="stat-label">Aktif</div>
        <div class="stat-value text-success">34</div>
      </div>
      <div class="stat-card-warning">
        <div class="stat-label">Cuti</div>
        <div class="stat-value">4</div>
      </div>
      <div class="stat-card-danger">
        <div class="stat-label">Non-aktif</div>
        <div class="stat-value text-danger">2</div>
      </div>
      <div class="stat-card-info">
        <div class="stat-label">Total Binaan</div>
        <div class="stat-value text-info">40</div>
      </div>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm overflow-x-auto">
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />
          <input type="text" placeholder="Cari nama, kontak..." class="bg-transparent outline-none text-sm w-full" />
        </div>
        <select class="filter-select">
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Cuti</option>
          <option>Non-aktif</option>
        </select>
        <select class="filter-select">
          <option>Semua Wilayah</option>
          <option>Kota Gorontalo</option>
          <option>Bone Bolango</option>
          <option>Gorontalo Utara</option>
        </select>
      </div>

      <table class="w-full min-w-[800px]">
        <thead class="bg-bg">
          <tr>
            <th class="p-3 text-left text-xs">Perajin</th>
            <th class="p-3 text-left">Alamat</th>
            <th class="p-3 text-left">Kontak</th>
            <th class="p-3 text-left">Bergabung</th>
            <th class="p-3 text-left">Produk</th>
            <th class="p-3 text-left">Status</th>
            <th class="p-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in store.artisans" :key="a.id" class="border-b border-border hover:bg-primary/5">
            <td class="p-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  :style="{ background: a.color }">{{ a.initials }}</div>
                <div>
                  <div class="font-semibold text-sm">{{ a.name }}</div>
                  <div class="text-xs text-text-light">{{ a.group }}</div>
                </div>
              </div>
            </td>
            <td class="p-3 text-sm">{{ a.address }}</td>
            <td class="p-3"><a :href="'tel:' + a.phone" class="text-primary text-sm">{{ a.phone }}</a></td>
            <td class="p-3 text-sm">{{ a.joined }}</td>
            <td class="p-3 font-mono text-sm">{{ a.products }} produk</td>
            <td class="p-3">
              <span :class="{
                'badge-active': a.status === 'Aktif',
                'badge-pending': a.status === 'Cuti',
                'badge-inactive': a.status === 'Non-aktif'
              }">{{ a.status }}</span>
            </td>
            <td class="p-3">
              <div class="flex gap-2">
                <button class="btn-outline-icon">
                  <Icon icon="solar:eye-bold" />
                </button>
                <button class="btn-outline-icon">
                  <Icon icon="solar:pen-bold" />
                </button>
                <button class="btn-outline-icon text-info">
                  <Icon icon="solar:chat-round-bold" />
                </button>
                <button class="btn-danger-icon">
                  <Icon icon="solar:trash-bin-trash-bold" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">Menampilkan 1-10 dari 40 perajin</span>
        <div class="flex gap-2">
          <button class="page-btn" disabled>
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn">4</button>
          <button class="page-btn">
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { onMounted, onUnmounted } from 'vue';
import { useArtisanStore } from '@/stores/artisan'

const store = useArtisanStore()

onMounted(() => {
  store.loadArtisansData();
});

onUnmounted(() => {
  store.clearArtisansData();
});
</script>

<style scoped>
@reference "../style.css";

.stat-card-success,
.stat-card-warning,
.stat-card-danger,
.stat-card-info {
  @apply bg-surface rounded-2xl p-4 border-l-4 shadow-sm;
}

.stat-card-success {
  @apply border-l-success;
}

.stat-card-warning {
  @apply border-l-warning;
}

.stat-card-danger {
  @apply border-l-danger;
}

.stat-card-info {
  @apply border-l-info;
}

.stat-label {
  @apply text-text-light text-xs font-medium;
}

.stat-value {
  @apply text-2xl font-bold font-mono;
}
</style>