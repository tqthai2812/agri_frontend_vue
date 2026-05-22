<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-surface rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-xl font-bold">Tambah Produk Baru</h2>
        <button class="btn-outline-icon" @click="$emit('close')"><Icon icon="solar:close-circle-bold" /></button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label">Nama Produk <span class="text-primary">*</span></label>
          <input class="form-control" placeholder="e.g. Kemeja Karawo Premium" />
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-control">
            <option>Kemeja</option>
            <option>Blouse</option>
            <option>Selendang</option>
            <option>Tas</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Harga</label>
          <input type="number" class="form-control" placeholder="350000" />
        </div>
        <div class="form-group">
          <label class="form-label">Stok</label>
          <input type="number" class="form-control" placeholder="50" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea class="form-control" rows="3" placeholder="Deskripsi produk..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Foto Produk</label>
        <div class="upload-area">
          <Icon icon="solar:cloud-upload-bold" class="text-4xl mx-auto mb-2" />
          <p class="text-sm">Drag & drop atau <span class="text-primary font-semibold">pilih file</span></p>
          <p class="text-xs text-text-light mt-1">PNG, JPG hingga 5MB</p>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status Produk</label>
        <div class="flex items-center gap-3">
          <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          <span class="text-sm text-text-sec">Aktif (tampil di website)</span>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-4">
        <button class="btn-outline" @click="$emit('close')">Batal</button>
        <button class="btn-secondary">Preview</button>
        <button class="btn-primary">Simpan Produk</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
defineEmits(['close'])
</script>