<script setup>
import { Icon } from '@iconify/vue'

defineProps({
    categories: {
        type: Array,
        default: () => [],
    },
    resultCount: {
        type: Number,
        default: 0,
    },
    selectedCount: {
        type: Number,
        default: 0,
    },
    allVisibleSelected: {
        type: Boolean,
        default: false,
    },
})

const search = defineModel('search', {
    type: String,
    default: '',
})

const category = defineModel('category', {
    type: [String, Number],
    default: 'all',
})

const sort = defineModel('sort', {
    type: String,
    default: 'newest',
})

const view = defineModel('view', {
    type: String,
    default: 'grid',
})

defineEmits([
    'toggle-all',
    'remove-selected',
    'add-selected',
])
</script>

<template>
    <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_210px_190px_auto]">
            <div class="relative">
                <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

                <input v-model.trim="search" type="search"
                    class="h-11 w-full rounded-full border border-slate-200 bg-[#fafcfb] pl-11 pr-10 text-xs outline-none transition focus:border-[#0a7139] focus:bg-white focus:ring-4 focus:ring-[#0a7139]/10"
                    placeholder="Tìm tên sản phẩm, thương hiệu..." />
            </div>

            <select v-model="category"
                class="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-600 outline-none focus:border-[#0a7139]">
                <option value="all">Tất cả danh mục</option>

                <option v-for="item in categories" :key="item.id" :value="item.id">
                    {{ item.name }} ({{ item.count }})
                </option>
            </select>

            <select v-model="sort"
                class="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-600 outline-none focus:border-[#0a7139]">
                <option value="newest">Lưu gần đây</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="name">Tên A–Z</option>
            </select>

            <div class="flex items-center rounded-full border border-slate-200 p-1">
                <button type="button" class="grid size-9 place-items-center rounded-full transition" :class="view === 'grid'
                    ? 'bg-[#07532b] text-white'
                    : 'text-slate-400 hover:text-[#07532b]'
                    " aria-label="Xem dạng lưới" @click="view = 'grid'">
                    <Icon icon="mdi:view-grid-outline" class="text-lg" />
                </button>

                <button type="button" class="grid size-9 place-items-center rounded-full transition" :class="view === 'list'
                    ? 'bg-[#07532b] text-white'
                    : 'text-slate-400 hover:text-[#07532b]'
                    " aria-label="Xem dạng danh sách" @click="view = 'list'">
                    <Icon icon="mdi:view-list-outline" class="text-lg" />
                </button>
            </div>
        </div>

        <div
            class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500">
                <input type="checkbox" class="size-4 accent-[#07532b]" :checked="allVisibleSelected"
                    @change="$emit('toggle-all')" />

                Chọn tất cả đang hiển thị

                <span class="font-normal text-slate-400">
                    ({{ resultCount }})
                </span>
            </label>

            <div class="flex flex-wrap gap-2">
                <button type="button"
                    class="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 px-4 text-[10px] font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!selectedCount" @click="$emit('remove-selected')">
                    <Icon icon="mdi:trash-can-outline" class="text-base" />

                    Xóa đã chọn
                </button>

                <button type="button"
                    class="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#07532b] px-4 text-[10px] font-bold text-white transition hover:bg-[#064522] disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!selectedCount" @click="$emit('add-selected')">
                    <Icon icon="mdi:cart-plus" class="text-base" />

                    Thêm đã chọn vào giỏ ({{ selectedCount }})
                </button>
            </div>
        </div>
    </div>
</template>