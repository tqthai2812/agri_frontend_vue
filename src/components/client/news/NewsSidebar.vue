<script setup>
import { ref } from "vue";
import { Icon } from "@iconify/vue";

defineProps({
    popularArticles: {
        type: Array,
        default: () => [],
    },
    tags: {
        type: Array,
        default: () => [],
    },
    activeTag: {
        type: [String, Number],
        default: "all",
    },
});

const emit = defineEmits([
    "open",
    "select-tag",
    "subscribe",
]);

const email = ref("");

function submitSubscribe() {
    if (!email.value.trim()) {
        return;
    }

    emit("subscribe", email.value.trim());
    email.value = "";
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function displayDate(article) {
    if (article.published_date) {
        return article.published_date;
    }

    return formatDate(article.published_at || article.created_at);
}
</script>

<template>
    <aside class="space-y-5 lg:sticky lg:top-5">
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header class="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Icon icon="mdi:fire" class="text-xl text-[#e4ad00]" />

                <h2 class="text-sm font-bold text-[#123d27]">
                    Đọc nhiều nhất
                </h2>
            </header>

            <div v-if="popularArticles.length" class="divide-y divide-slate-100 px-5">
                <button v-for="(article, index) in popularArticles" :key="article.id" type="button"
                    class="group flex w-full gap-3 py-4 text-left" @click="$emit('open', article)">
                    <span class="text-2xl font-black leading-none text-slate-200 transition group-hover:text-[#ffd326]">
                        {{ String(index + 1).padStart(2, "0") }}
                    </span>

                    <span class="min-w-0">
                        <strong
                            class="line-clamp-2 block text-xs leading-5 text-slate-700 transition group-hover:text-[#07532b]">
                            {{ article.title }}
                        </strong>

                        <small class="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                            <Icon icon="mdi:calendar-blank-outline" />
                            {{ displayDate(article) }}
                        </small>
                    </span>
                </button>
            </div>

            <div v-else class="px-5 py-8 text-center text-xs text-slate-400">
                Chưa có bài viết nổi bật.
            </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2">
                <Icon icon="mdi:tag-multiple-outline" class="text-xl text-[#07532b]" />

                <h2 class="text-sm font-bold text-[#123d27]">
                    Chủ đề nổi bật
                </h2>
            </div>

            <div v-if="tags.length" class="mt-4 flex flex-wrap gap-2">
                <button v-for="tag in tags" :key="tag.id" type="button"
                    class="rounded-full border px-3 py-1.5 text-[9px] font-semibold transition"
                    :class="String(activeTag) === String(tag.id)
                        ? 'border-[#07532b] bg-[#07532b] text-white'
                        : 'border-slate-200 text-slate-500 hover:border-[#9dbba8] hover:bg-[#edf5f0] hover:text-[#07532b]'" @click="$emit('select-tag', tag.id)">
                    #{{ tag.tag_name }}
                    <span class="opacity-60">
                        {{ tag.count }}
                    </span>
                </button>
            </div>

            <div v-else class="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-400">
                Chưa có chủ đề.
            </div>
        </section>

        <section
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064b26] to-[#0a7139] p-5 text-white shadow-lg">
            <div class="absolute -right-8 -top-8 size-28 rounded-full bg-[#ffd326]/15"></div>

            <Icon icon="mdi:email-newsletter" class="relative text-3xl text-[#ffd326]" />

            <h2 class="relative mt-3 text-base font-bold">
                Nhận bản tin nhà nông
            </h2>

            <p class="relative mt-2 text-[10px] leading-5 text-white/65">
                Cập nhật kỹ thuật canh tác, sâu bệnh và ưu đãi vật tư mới nhất.
            </p>

            <form class="relative mt-4" @submit.prevent="submitSubscribe">
                <input v-model.trim="email" type="email" required
                    class="h-11 w-full rounded-full border border-white/15 bg-white/10 pl-4 pr-12 text-xs text-white outline-none placeholder:text-white/40 focus:border-[#ffd326]"
                    placeholder="Email của bạn" />

                <button type="submit"
                    class="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-[#ffd326] text-[#07532b] transition hover:bg-white"
                    aria-label="Đăng ký nhận bản tin">
                    <Icon icon="mdi:send" class="text-base" />
                </button>
            </form>
        </section>
    </aside>
</template>