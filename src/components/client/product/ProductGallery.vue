<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
    images: {
        type: Array,
        default: () => [],
    },
    productName: {
        type: String,
        default: "Sản phẩm",
    },
});

const selectedKey = ref(null);
const failedUrls = ref(new Set());
const previewDialog = ref(null);

function isPrimary(value) {
    return value === true || value === 1 || value === "1";
}

const sortedImages = computed(() =>
    props.images
        .filter((image) => image?.image_url)
        .map((image, index) => ({
            ...image,
            key: `${image.id ?? index}:${image.image_url}`,
            primary: isPrimary(image.is_primary),
        }))
        .sort(
            (a, b) =>
                Number(b.primary) - Number(a.primary) ||
                Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
        ),
);

const selectedIndex = computed(() => {
    const index = sortedImages.value.findIndex(
        (image) => image.key === selectedKey.value,
    );

    return index >= 0 ? index : 0;
});

const selectedImage = computed(
    () => sortedImages.value[selectedIndex.value] || null,
);

const imageFailed = computed(
    () =>
        selectedImage.value &&
        failedUrls.value.has(selectedImage.value.image_url),
);

function markFailed(url) {
    failedUrls.value = new Set([...failedUrls.value, url]);
}

function selectImage(image) {
    selectedKey.value = image.key;
}

function changeImage(direction) {
    const length = sortedImages.value.length;
    if (length < 2) return;

    const index = (selectedIndex.value + direction + length) % length;
    selectedKey.value = sortedImages.value[index].key;
}

function openPreview() {
    if (!selectedImage.value || previewDialog.value?.open) return;
    previewDialog.value?.showModal();
}

function closePreview() {
    previewDialog.value?.close();
}

function handleKeydown(event) {
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeImage(-1);
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        changeImage(1);
    }
}

watch(
    sortedImages,
    (images) => {
        if (!images.some((image) => image.key === selectedKey.value)) {
            selectedKey.value = images[0]?.key ?? null;
            closePreview();
        }
    },
    { immediate: true },
);

onBeforeUnmount(closePreview);
</script>

<template>
    <div>
        <div
            class="group relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(6,75,38,0.06)]">
            <img v-if="selectedImage && !imageFailed" :key="selectedImage.image_url" :src="selectedImage.image_url"
                :alt="`${productName} - ảnh ${selectedIndex + 1}`"
                class="size-full object-contain transition duration-500 group-hover:scale-[1.03]"
                @error="markFailed(selectedImage.image_url)" />

            <div v-else class="text-center text-slate-400">
                <Icon icon="mdi:image-outline" class="mx-auto mb-3 text-6xl text-slate-300" />
                <p class="text-sm">
                    {{ selectedImage ? "Không tải được ảnh" : "Chưa có ảnh sản phẩm" }}
                </p>
            </div>

            <button v-if="selectedImage && !imageFailed" type="button"
                class="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-[#07532b] shadow-sm transition hover:bg-[#07532b] hover:text-white"
                aria-label="Xem ảnh lớn" @click="openPreview">
                <Icon icon="mdi:magnify-plus-outline" class="text-xl" />
            </button>

            <span v-if="sortedImages.length > 1"
                class="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs text-slate-500">
                {{ selectedIndex + 1 }} / {{ sortedImages.length }}
            </span>
        </div>

        <div v-if="sortedImages.length > 1" class="mt-4 grid grid-cols-5 gap-3">
            <button v-for="(image, index) in sortedImages" :key="image.key" type="button"
                :aria-label="`Xem ảnh ${index + 1}`" :aria-pressed="selectedImage?.key === image.key"
                class="grid aspect-square place-items-center overflow-hidden rounded-xl border-2 bg-white p-1 transition"
                :class="selectedImage?.key === image.key
                    ? 'border-[#07532b] shadow-sm'
                    : 'border-slate-200 hover:border-[#9fc1aa]'" @click="selectImage(image)">
                <img v-if="!failedUrls.has(image.image_url)" :src="image.image_url"
                    :alt="`${productName} - ảnh ${index + 1}`" loading="lazy"
                    class="size-full rounded-lg object-contain" @error="markFailed(image.image_url)" />
                <Icon v-else icon="mdi:image-off-outline" class="text-2xl text-slate-300" />
            </button>
        </div>

        <Teleport to="body">
            <dialog ref="previewDialog" aria-label="Ảnh lớn sản phẩm"
                class="fixed inset-0 m-auto h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-white backdrop:bg-black/85"
                @keydown="handleKeydown">
                <div class="relative flex h-full items-center justify-center p-5 sm:p-16" @click.self="closePreview">
                    <img v-if="selectedImage && !imageFailed" :key="selectedImage.image_url"
                        :src="selectedImage.image_url" :alt="productName"
                        class="max-h-[80dvh] max-w-[85vw] rounded-2xl bg-white object-contain"
                        @error="markFailed(selectedImage.image_url)" />

                    <div v-else class="text-center">
                        <Icon icon="mdi:image-off-outline" class="mx-auto mb-3 text-5xl" />
                        Không tải được ảnh
                    </div>

                    <button type="button" autofocus
                        class="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-slate-700"
                        aria-label="Đóng ảnh lớn" @click="closePreview">
                        <Icon icon="mdi:close" class="text-2xl" />
                    </button>

                    <template v-if="sortedImages.length > 1">
                        <button type="button"
                            class="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 sm:left-5"
                            aria-label="Ảnh trước" @click="changeImage(-1)">
                            <Icon icon="mdi:chevron-left" class="text-2xl" />
                        </button>

                        <button type="button"
                            class="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 sm:right-5"
                            aria-label="Ảnh tiếp theo" @click="changeImage(1)">
                            <Icon icon="mdi:chevron-right" class="text-2xl" />
                        </button>

                        <p class="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm" aria-live="polite">
                            {{ selectedIndex + 1 }} / {{ sortedImages.length }}
                        </p>
                    </template>
                </div>
            </dialog>
        </Teleport>
    </div>
</template>