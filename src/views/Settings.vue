<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Pengaturan</h1>
      <p class="text-text-light text-sm">Kelola konfigurasi sistem EVDesign</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-border mb-6">
      <button v-for="tab in settingsTabs" :key="tab.key"
        class="px-5 py-2 text-sm font-semibold transition border-b-2"
        :class="store.settingsTab === tab.key ? 'text-primary border-primary' : 'text-text-light border-transparent hover:text-primary'"
        @click="store.settingsTab = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <!-- Profile Tab -->
    <div v-if="store.settingsTab === 'profile'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-surface rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-4">Informasi Admin</h3>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-white text-2xl font-bold">EV</div>
          <div>
            <button class="btn-outline-sm"><Icon icon="solar:cloud-upload-bold" /> Ganti Foto</button>
            <p class="text-xs text-text-light mt-1">JPG, PNG maks 2MB</p>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input class="form-control" value="Admin EVDesign" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" value="admin@evdesign.id" type="email" />
        </div>
        <div class="form-group">
          <label class="form-label">Telepon</label>
          <input class="form-control" value="+62 812 3456 7890" />
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <input class="form-control" value="Super Admin" disabled />
        </div>
        <button class="btn-primary"><Icon icon="solar:check-circle-bold" /> Simpan Perubahan</button>
      </div>

      <div class="bg-surface rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-4">Ubah Password</h3>
        <div class="form-group">
          <label class="form-label">Password Lama</label>
          <input type="password" class="form-control" placeholder="••••••••" />
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru</label>
          <input type="password" class="form-control" placeholder="••••••••" />
        </div>
        <div class="form-group">
          <label class="form-label">Konfirmasi Password</label>
          <input type="password" class="form-control" placeholder="••••••••" />
        </div>
        <button class="btn-secondary"><Icon icon="solar:lock-bold" /> Update Password</button>

        <div class="mt-8 pt-6 border-t border-border">
          <h4 class="font-semibold mb-4">Preferensi Tampilan</h4>
          <div class="flex justify-between items-center mb-3">
            <span>Mode Gelap</span>
            <label class="toggle"><input type="checkbox" :checked="store.darkMode" @change="store.toggleDarkMode" /><span class="toggle-slider"></span></label>
          </div>
          <div class="flex justify-between items-center mb-3">
            <span>Compact Sidebar</span>
            <label class="toggle"><input type="checkbox" :checked="store.sidebarCollapsed" @change="store.sidebarCollapsed = !store.sidebarCollapsed" /><span class="toggle-slider"></span></label>
          </div>
          <div class="flex justify-between items-center">
            <span>Notifikasi Browser</span>
            <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Tab -->
    <div v-if="store.settingsTab === 'log'" class="bg-surface rounded-2xl p-6">
      <h3 class="font-bold text-lg mb-4">Log Aktivitas Sistem</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-bg">
            <tr>
              <th class="p-3 text-left text-xs">Waktu</th>
              <th class="p-3 text-left">Admin</th>
              <th class="p-3 text-left">Aksi</th>
              <th class="p-3 text-left">Detail</th>
              <th class="p-3 text-left">IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in activityLogs" :key="log.time" class="border-b border-border">
              <td class="p-3 font-mono text-xs">{{ log.time }}</td>
              <td class="p-3">Admin EVDesign</td>
              <td class="p-3"><span :class="log.actionClass">{{ log.action }}</span></td>
              <td class="p-3 text-sm">{{ log.detail }}</td>
              <td class="p-3 font-mono text-xs">{{ log.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Backup Tab -->
    <div v-if="store.settingsTab === 'backup'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-surface rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-2">Backup Database</h3>
        <p class="text-sm text-text-light mb-5">Download salinan lengkap data sistem EVDesign</p>
        <div class="flex flex-col gap-3">
          <button class="btn-primary justify-center"><Icon icon="solar:cloud-download-bold" /> Download Backup Lengkap</button>
          <button class="btn-secondary justify-center"><Icon icon="solar:bag-5-bold" /> Backup Produk & Pesanan</button>
          <button class="btn-outline justify-center"><Icon icon="solar:users-group-rounded-bold" /> Backup Data Perajin</button>
        </div>
        <div class="mt-5 p-3 bg-bg rounded-lg">
          <div class="text-xs text-text-light">Backup terakhir</div>
          <div class="text-sm font-semibold">15 Januari 2024, 03:00 WIB</div>
        </div>
      </div>
      <div class="bg-surface rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-2">Auto Backup</h3>
        <p class="text-sm text-text-light mb-5">Jadwalkan backup otomatis</p>
        <div class="form-group">
          <label class="form-label">Frekuensi Backup</label>
          <select class="form-control">
            <option>Setiap Hari (Otomatis)</option>
            <option>Setiap Minggu</option>
            <option>Setiap Bulan</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Waktu Backup</label>
          <input type="time" class="form-control" value="03:00" />
        </div>
        <div class="flex justify-between items-center mb-5">
          <span>Auto Backup Aktif</span>
          <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
        </div>
        <button class="btn-primary w-full justify-center"><Icon icon="solar:check-circle-bold" /> Simpan Pengaturan</button>
      </div>
    </div>

    <!-- Notification Tab -->
    <div v-if="store.settingsTab === 'notif'" class="bg-surface rounded-2xl p-6 max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Kirim Pengumuman ke Perajin</h3>
      <div class="form-group">
        <label class="form-label">Judul Pengumuman</label>
        <input class="form-control" placeholder="e.g. Jadwal Pertemuan Bulanan" />
      </div>
      <div class="form-group">
        <label class="form-label">Penerima</label>
        <select class="form-control">
          <option>Semua Perajin (40)</option>
          <option>Perajin Aktif (34)</option>
          <option>Wilayah Kota Gorontalo</option>
          <option>Wilayah Bone Bolango</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Pesan</label>
        <textarea class="form-control" rows="4" placeholder="Tulis pengumuman di sini..."></textarea>
      </div>
      <div class="flex gap-3">
        <button class="btn-outline">Simpan Draft</button>
        <button class="btn-primary"><Icon icon="solar:plain-2-bold" /> Kirim Sekarang</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()

const settingsTabs = [
  { key: 'profile', label: 'Profil Admin' },
  { key: 'notif', label: 'Pengumuman' },
  { key: 'log', label: 'Log Aktivitas' },
  { key: 'backup', label: 'Backup Data' }
]

const activityLogs = [
  { time: '2024-01-15 14:32:10', action: 'CREATE', actionClass: 'badge-active', detail: 'Menambahkan produk baru: Kemeja Karawo Premium', ip: '192.168.1.1' },
  { time: '2024-01-15 13:15:42', action: 'UPDATE', actionClass: 'badge-info-b', detail: 'Memperbarui status pesanan #INV-056', ip: '192.168.1.1' },
  { time: '2024-01-15 12:00:05', action: 'DELETE', actionClass: 'badge-inactive', detail: 'Menghapus foto galeri ID #48', ip: '192.168.1.1' },
  { time: '2024-01-15 09:45:22', action: 'CREATE', actionClass: 'badge-active', detail: 'Mendaftarkan perajin baru: Ibu Siti', ip: '192.168.1.1' },
  { time: '2024-01-14 17:20:11', action: 'UPDATE', actionClass: 'badge-info-b', detail: 'Memperbarui stok benang sutra merah: +50 gulungan', ip: '192.168.1.2' }
]
</script>