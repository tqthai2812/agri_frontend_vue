<template>
  <div class="fixed inset-0 bg-bg flex items-center justify-center z-50">
    <div class="w-full max-w-md p-6">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon icon="solar:t-shirt-bold" class="text-3xl text-white" />
        </div>
        <h2 class="text-3xl font-bold text-text">EVDesign Admin</h2>
        <p class="text-text-light text-sm mt-1">Masuk ke panel administrasi</p>
      </div>
      <div class="bg-surface rounded-2xl p-6 shadow-sm">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" placeholder="admin@evdesign.id" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" placeholder="••••••••" />
        </div>
        <div class="flex justify-between items-center mb-5">
          <label class="flex items-center gap-2 text-sm text-text-sec">
            <input type="checkbox" class="accent-primary" /> Ingat saya
          </label>
          <a href="#" class="text-sm text-primary font-semibold">Lupa password?</a>
        </div>
        <button class="btn-primary w-full justify-center py-3" @click="store.setCurrentPage('dashboard')">
          <Icon icon="solar:login-2-bold" /> Masuk
        </button>
      </div>
      <p class="text-center text-xs text-text-light mt-5">© 2024 EVDesign · Pelestarian Wastra Gorontalo</p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()
</script>