<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Manajemen Pesanan</h1>
        <p class="text-text-light text-sm">56 pesanan bulan ini</p>
      </div>
      <button class="btn-outline-sm"><Icon icon="solar:export-bold" /> Export Laporan</button>
    </div>

    <!-- Tabs - wrap on mobile -->
    <div class="flex flex-wrap border-b border-border mb-5">
      <button v-for="tab in orderTabs" :key="tab.label"
        class="px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px"
        :class="activeTab === tab.key ? 'text-primary border-primary' : 'text-text-light border-transparent hover:text-primary'"
        @click="activeTab = tab.key">
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <div class="bg-surface rounded-2xl p-5 shadow-sm overflow-x-auto">
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon icon="solar:magnifer-bold" class="text-text-light" />
          <input type="text" placeholder="Cari invoice..." class="bg-transparent outline-none text-sm w-full" />
        </div>
        <input type="date" class="filter-select w-36" />
        <input type="date" class="filter-select w-36" />
      </div>

      <table class="w-full min-w-[800px]">
        <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs font-semibold uppercase">No. Invoice</th>
              <th class="p-3 text-left">Tanggal</th>
              <th class="p-3 text-left">Pelanggan</th>
              <th class="p-3 text-left">Total</th>
              <th class="p-3 text-left">Pembayaran</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3 font-mono font-bold text-primary">{{ order.invoice }}</td>
              <td class="p-3">{{ order.date }}</td>
              <td class="p-3">
                <div class="font-semibold text-sm">{{ order.customer }}</div>
                <div class="text-xs text-text-light">{{ order.city }}</div>
              </td>
              <td class="p-3 font-mono font-bold">{{ formatRupiah(order.total) }}</td>
              <td class="p-3">{{ order.payment }}</td>
              <td class="p-3">
                <span :class="statusBadge(order.status)">{{ order.status }}</span>
              </td>
              <td class="p-3">
                <div class="flex gap-2">
                  <button class="btn-outline-icon"><Icon icon="solar:eye-bold" /></button>
                  <button class="btn-outline-icon text-success"><Icon icon="solar:refresh-bold" /></button>
                  <button class="btn-outline-icon"><Icon icon="solar:printer-bold" /></button>
                </div>
              </td>
            </tr>
          </tbody>
      </table>

      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-5">
        <span class="text-sm text-text-light">Menampilkan 1-10 dari {{ filteredOrders.length }} pesanan</span>
        <div class="flex flex-wrap justify-center gap-2">
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
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()
const activeTab = ref('all')

const orderTabs = [
  { key: 'all', label: 'Semua', count: store.orders.length },
  { key: 'Baru', label: 'Baru', count: store.orders.filter(o => o.status === 'Baru').length },
  { key: 'Diproses', label: 'Diproses', count: store.orders.filter(o => o.status === 'Diproses').length },
  { key: 'Dikirim', label: 'Dikirim', count: store.orders.filter(o => o.status === 'Dikirim').length },
  { key: 'Selesai', label: 'Selesai', count: store.orders.filter(o => o.status === 'Selesai').length },
  { key: 'Dibatalkan', label: 'Dibatalkan', count: store.orders.filter(o => o.status === 'Dibatalkan').length }
]

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return store.orders
  return store.orders.filter(o => o.status === activeTab.value)
})

const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val)

const statusBadge = (status) => {
  const map = {
    Baru: 'badge-info-b',
    Diproses: 'badge-pending',
    Dikirim: 'badge-gray',
    Selesai: 'badge-active',
    Dibatalkan: 'badge-inactive'
  }
  return map[status] || 'badge-gray'
}
</script>

<style scoped>
/* tambahan jika perlu, tapi global style sudah mencakup badge-* */
</style>