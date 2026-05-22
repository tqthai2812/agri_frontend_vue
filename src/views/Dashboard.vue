<template>
  <div>
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-6">
      <StatCard v-for="stat in stats" :key="stat.label" :stat="stat" />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 bg-surface rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-bold text-text">Penjualan 12 Bulan</h3>
            <p class="text-xs text-text-light">Pendapatan kumulatif per bulan</p>
          </div>
          <select class="bg-surface border border-border rounded-md px-2 py-1 text-sm text-text-sec">
            <option>2024</option>
          </select>
        </div>
        <div class="h-64">
          <canvas ref="salesChartCanvas"></canvas>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-5 shadow-sm">
        <h3 class="font-bold mb-4">Produk per Kategori</h3>
        <div class="h-64">
          <canvas ref="categoryChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Timeline, Top Products, Stock Alert -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Activity Timeline -->
      <div class="bg-surface rounded-2xl p-5">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-bold">Aktivitas Terkini</h3>
            <p class="text-xs text-text-light">Real-time updates</p>
          </div>
          <button class="btn-outline-sm">Semua</button>
        </div>
        <div class="space-y-4">
          <div v-for="act in activities" :key="act.title" class="flex gap-3">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center', act.dotClass]">
              <Icon :icon="act.icon" class="text-sm" />
            </div>
            <div>
              <strong class="text-sm block text-text">{{ act.title }}</strong>
              <span class="text-xs text-text-light">{{ act.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="bg-surface rounded-2xl p-5">
        <h3 class="font-bold mb-4">Produk Terlaris</h3>
        <div class="space-y-2">
          <div v-for="(p, idx) in topProducts" :key="p.name" class="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5">
            <div :class="['w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold', idx===1?'bg-gray-500':'', idx===2?'bg-amber-700':'']">{{ idx+1 }}</div>
            <div class="flex-1">
              <div class="font-semibold text-sm">{{ p.name }}</div>
              <div class="text-xs text-text-light">{{ p.sold }} terjual · {{ formatRupiah(p.revenue) }}</div>
            </div>
            <div class="badge-active text-xs">{{ p.trend }}</div>
          </div>
        </div>
      </div>

      <!-- Stock Alert -->
      <div class="bg-surface rounded-2xl p-5">
        <h3 class="font-bold mb-4">Peringatan Stok</h3>
        <div class="space-y-3">
          <div v-for="item in stockAlerts" :key="item.name" class="flex items-center justify-between p-2 bg-warning/10 border border-warning/20 rounded-lg">
            <span class="text-sm font-semibold">{{ item.name }}</span>
            <div class="flex-1 mx-4 h-1.5 bg-border rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="item.percent<20?'bg-danger':'bg-warning'" :style="{ width: item.percent+'%' }"></div>
            </div>
            <span class="text-xs font-bold" :class="item.percent<20?'text-danger':'text-warning'">{{ item.stock }} {{ item.unit }}</span>
          </div>
        </div>
        <button class="btn-warning-sm w-full mt-4">Pesan Ulang Semua</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'
import { Icon } from '@iconify/vue'
import StatCard from '@/components/ui/StatCard.vue'

const stats = [
  { label: 'Total Produk', value: 124, icon: 'solar:bag-bold-duotone', trend: '+12', trendUp: true },
  { label: 'Total Perajin', value: 40, icon: 'solar:users-group-rounded-bold-duotone', trend: '+2', trendUp: true, success: true },
  { label: 'Pesanan Bulan Ini', value: 56, icon: 'solar:cart-large-2-bold-duotone', trend: '+23%', trendUp: true },
  { label: 'Pendapatan Bulan Ini', value: '45,8Jt', icon: 'solar:dollar-bold-duotone', trend: '+18%', trendUp: true },
  { label: 'Stok Menipis', value: 8, icon: 'solar:box-bold-duotone', trend: 'Perlu diisi', trendUp: false, warning: true },
  { label: 'Pengunjung Bulan Ini', value: '1,240', icon: 'solar:users-group-two-rounded-bold-duotone', trend: '+5%', trendUp: true, info: true }
]

const activities = [
  { title: 'Produk Kemeja Karawo ditambahkan', time: '5 menit lalu · Oleh Admin', icon: 'solar:bag-bold', dotClass: 'bg-primary/10 text-primary' },
  { title: 'Pesanan #INV-001 dikonfirmasi', time: '15 menit lalu', icon: 'solar:cart-check-bold', dotClass: 'bg-success/10 text-success' },
  { title: 'Stok benang sulaman menipis', time: '1 jam lalu · Perlu tindakan', icon: 'solar:box-bold', dotClass: 'bg-warning/10 text-warning' },
  { title: 'Perajin baru: Ibu Siti bergabung', time: '3 jam lalu · Wilayah Bone Bolango', icon: 'solar:user-plus-bold', dotClass: 'bg-info/10 text-info' },
  { title: 'Artikel "Karawo Warisan Gorontalo" dipublish', time: '5 jam lalu', icon: 'solar:notes-bold', dotClass: 'bg-primary/10 text-primary' }
]

const topProducts = [
  { name: 'Kemeja Karawo Premium', sold: 24, revenue: 8400000, trend: '+12%' },
  { name: 'Selendang Motif Padi', sold: 18, revenue: 5400000, trend: '+8%' },
  { name: 'Blouse Karawo Elegan', sold: 15, revenue: 6750000, trend: '+5%' },
  { name: 'Tas Tangan Karawo', sold: 12, revenue: 3600000, trend: '+2%' },
  { name: 'Sarung Karawo Tradisional', sold: 10, revenue: 4500000, trend: '-1%' }
]

const stockAlerts = [
  { name: 'Benang Sutra Merah', stock: 15, unit: 'gulungan', percent: 15 },
  { name: 'Kain Putih Halus', stock: 2, unit: 'meter', percent: 20 },
  { name: 'Benang Emas No.8', stock: 30, unit: 'gulung', percent: 30 },
  { name: 'Kain Sutra Kuning', stock: 1, unit: 'meter', percent: 10 },
  { name: 'Benang Perak No.12', stock: 25, unit: 'gulung', percent: 25 }
]

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const salesChartCanvas = ref(null)
const categoryChartCanvas = ref(null)
let salesChart, categoryChart

onMounted(() => {
  salesChart = new Chart(salesChartCanvas.value, {
    type: 'line',
    data: {
      labels: ['Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des','Jan'],
      datasets: [{
        label: 'Pendapatan (Juta Rp)',
        data: [18,22,19,28,25,32,29,35,31,38,42,45.8],
        borderColor: '#fc1919',
        backgroundColor: 'rgba(252,25,25,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fc1919',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })

  categoryChart = new Chart(categoryChartCanvas.value, {
    type: 'bar',
    data: {
      labels: ['Kemeja','Blouse','Selendang','Tas','Sarung','Aksesori'],
      datasets: [{
        data: [48,35,28,22,19,15],
        backgroundColor: ['#fc1919','#28A745','#17A2B8','#FFC107','#6C757D','#DC3545'],
        borderRadius: 6
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  })
})

onUnmounted(() => {
  salesChart?.destroy()
  categoryChart?.destroy()
})
</script>