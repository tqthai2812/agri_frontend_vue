<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const props = defineProps({
    open: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()

const inputRef = ref(null)

const query = ref(
    typeof route.query.search === 'string'
        ? route.query.search
        : '',
)

const popularKeywords = [
    'Phân bón',
    'Thuốc trừ sâu',
    'Hạt giống',
    'Dụng cụ nông nghiệp',
]

async function focusInput() {
    await nextTick()
    inputRef.value?.focus()
}

async function clearSearch() {
    query.value = ''
    await focusInput()
}

async function selectKeyword(keyword) {
    query.value = keyword
    await focusInput()
}

async function submitSearch() {
    const keyword = query.value.trim()

    if (!keyword) {
        await focusInput()
        return
    }

    query.value = keyword

    emit('close')

    await router.push({
        name: 'home',

        query: {
            ...route.query,
            search: keyword,
        },
    })
}

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            focusInput()
        }
    },
)

watch(
    () => route.query.search,
    (value) => {
        query.value =
            typeof value === 'string'
                ? value
                : ''
    },
)
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="-translate-y-2 opacity-0">
        <div v-if="open"
            class="absolute inset-x-0 top-full z-40 border-t border-slate-100 bg-white shadow-[0_15px_35px_rgba(6,75,38,0.14)]">
            <div class="mx-auto max-w-[1000px] px-4 py-5 sm:px-6">
                <form class="flex items-center gap-2" @submit.prevent="submitSearch">
                    <!-- Ô nhập -->
                    <div class="relative flex-1">
                        <Icon icon="mdi:magnify"
                            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#67806f]" />

                        <input ref="inputRef" v-model="query" type="text" placeholder="Tìm kiếm sản phẩm..."
                            autocomplete="off"
                            class="h-12 w-full rounded-full border border-[#bdcec2] bg-[#f8fbf9] pl-12 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#07532b] focus:bg-white focus:ring-4 focus:ring-[#07532b]/10" />

                        <!-- Xóa nội dung -->
                        <button v-if="query" type="button"
                            class="absolute right-4 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                            aria-label="Xóa từ khóa" @click="clearSearch">
                            <Icon icon="mdi:close" class="text-base" />
                        </button>
                    </div>

                    <!-- Submit -->
                    <button type="submit"
                        class="flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#07532b] px-6 text-sm font-bold text-white transition hover:bg-[#063f22]">
                        <Icon icon="mdi:magnify" class="text-lg" />

                        <span class="hidden sm:inline">
                            Tìm kiếm
                        </span>
                    </button>

                    <!-- Đóng thanh search -->
                    <button type="button"
                        class="grid size-11 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Đóng tìm kiếm" @click="emit('close')">
                        <Icon icon="mdi:close" class="text-xl" />
                    </button>
                </form>

                <!-- Từ khóa gợi ý -->
                <div class="mt-4 flex flex-wrap items-center gap-2">
                    <span class="mr-1 text-[11px] font-semibold text-slate-400">
                        Gợi ý:
                    </span>

                    <button v-for="keyword in popularKeywords" :key="keyword" type="button"
                        class="rounded-full border border-[#d6e1d9] bg-white px-3 py-1.5 text-[11px] text-[#466051] transition hover:border-[#07532b] hover:bg-[#edf5f0] hover:text-[#07532b]"
                        @click="selectKeyword(keyword)">
                        {{ keyword }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>