<template>
  <div class="bg-surface rounded-2xl p-5 border-l-4 transition-all hover:-translate-y-1" :class="borderClass">
    <div class="flex justify-between items-start">
      <div>
        <div class="text-text-light text-xs font-medium">{{ stat.label }}</div>
        <div class="text-3xl font-bold font-mono" :class="valueClass">{{ stat.value }}</div>
      </div>
      <div class="w-11 h-11 rounded-xl flex items-center justify-center" :class="iconBgClass">
        <Icon :icon="stat.icon" class="text-2xl" :class="iconColorClass" />
      </div>
    </div>
    <div class="flex items-center gap-1 text-xs font-semibold mt-2" :class="trendClass">
      <Icon :icon="stat.trendUp ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'" />
      <span>{{ stat.trend }}</span>
      <span v-if="stat.trendUp && stat.label !== 'Stok Menipis'">dari bulan lalu</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps(['stat'])
const borderClass = computed(() => {
  if (props.stat.success) return 'border-l-success'
  if (props.stat.warning) return 'border-l-warning'
  if (props.stat.info) return 'border-l-info'
  return 'border-l-primary'
})
const valueClass = computed(() => {
  if (props.stat.success) return 'text-success'
  if (props.stat.warning) return 'text-warning'
  if (props.stat.info) return 'text-info'
  return 'text-primary'
})
const iconBgClass = computed(() => {
  if (props.stat.success) return 'bg-success/10'
  if (props.stat.warning) return 'bg-warning/10'
  if (props.stat.info) return 'bg-info/10'
  return 'bg-primary/10'
})
const iconColorClass = computed(() => {
  if (props.stat.success) return 'text-success'
  if (props.stat.warning) return 'text-warning'
  if (props.stat.info) return 'text-info'
  return 'text-primary'
})
const trendClass = computed(() => {
  if (props.stat.warning && !props.stat.trendUp) return 'text-warning'
  return props.stat.trendUp ? 'text-success' : 'text-danger'
})
</script>