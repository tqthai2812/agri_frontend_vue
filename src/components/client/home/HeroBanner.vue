<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue'

import { Icon } from '@iconify/vue'

const FULL_TEXT =
    'Vật tư chính hãng – nền tảng của nền nông nghiệp xanh'

const characters = Array.from(FULL_TEXT)

const currentIndex = ref(0)
const isDeleting = ref(false)
const isPaused = ref(false)

let typingTimer = null

const displayedText = computed(() => {
    return characters
        .slice(0, currentIndex.value)
        .join('')
})

function clearTypingTimer() {
    if (typingTimer !== null) {
        window.clearTimeout(typingTimer)
        typingTimer = null
    }
}

function scheduleTyping(delay) {
    clearTypingTimer()

    if (!isPaused.value) {
        typingTimer = window.setTimeout(
            runTypingEffect,
            delay,
        )
    }
}

function runTypingEffect() {
    if (isPaused.value) return

    if (!isDeleting.value) {
        if (currentIndex.value < characters.length) {
            currentIndex.value += 1
            scheduleTyping(65)
            return
        }

        isDeleting.value = true
        scheduleTyping(2200)
        return
    }

    if (currentIndex.value > 0) {
        currentIndex.value -= 1
        scheduleTyping(30)
        return
    }

    isDeleting.value = false
    scheduleTyping(500)
}

function toggleTypingEffect() {
    isPaused.value = !isPaused.value

    if (isPaused.value) {
        clearTypingTimer()
        return
    }

    scheduleTyping(100)
}

onMounted(() => {
    scheduleTyping(450)
})

onBeforeUnmount(() => {
    clearTypingTimer()
})
</script>

<template>
    <section
        class="relative isolate flex min-h-[250px] items-center overflow-hidden bg-cover bg-center sm:min-h-[300px] lg:min-h-[330px]"
        style="background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=88')"
        aria-labelledby="hero-title">
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/20"></div>

        <div class="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-16">
            <h1 id="hero-title"
                class="min-h-[125px] max-w-[1180px] text-3xl font-medium uppercase leading-[1.35] tracking-[0.04em] text-white drop-shadow-lg sm:min-h-[130px] sm:text-5xl lg:min-h-[160px] lg:text-[58px]"
                :aria-label="FULL_TEXT">
                <span aria-hidden="true">
                    {{ displayedText }}
                </span>

                <span aria-hidden="true" class="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] bg-[#ffd326]"
                    :class="isPaused
                        ? 'opacity-50'
                        : 'animate-pulse'
                        "></span>
            </h1>
        </div>

        <button type="button"
            class="absolute bottom-7 right-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-[#fff9df] focus:outline-none focus:ring-4 focus:ring-white/40 sm:right-8"
            :aria-pressed="isPaused" :aria-label="isPaused
                ? 'Tiếp tục hiệu ứng đánh máy'
                : 'Dừng hiệu ứng đánh máy'
                " @click="toggleTypingEffect">
            <Icon :icon="isPaused ? 'mdi:play' : 'mdi:pause'" class="text-lg text-[#07532b]" />

            {{
                isPaused
                    ? 'Tiếp tục hiệu ứng'
                    : 'Dừng hiệu ứng'
            }}
        </button>

        <div
            class="absolute -bottom-px left-0 h-4 w-full bg-white [clip-path:polygon(0_55%,4%_32%,8%_60%,12%_42%,17%_66%,21%_38%,26%_58%,31%_33%,36%_62%,41%_39%,46%_66%,51%_35%,56%_58%,61%_31%,66%_62%,71%_36%,76%_60%,81%_30%,86%_55%,91%_33%,96%_62%,100%_45%,100%_100%,0_100%)]">
        </div>
    </section>
</template>