<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    images: {
        type: Array,
        default: () => [],
    },

    productName: {
        type: String,
        default: 'Sản phẩm',
    },
})

const selectedImageId = ref(null)
const previewOpen = ref(false)

const sortedImages = computed(() => {
    return [...props.images].sort((a, b) => {
        if (a.is_primary !== b.is_primary) {
            return a.is_primary ? -1 : 1
        }

        return (
            Number(a.sort_order || 0) -
            Number(b.sort_order || 0)
        )
    })
})

const selectedImage = computed(() => {
    return (
        sortedImages.value.find(
            (image) =>
                image.id === selectedImageId.value,
        ) ||
        sortedImages.value[0] ||
        null
    )
})

watch(
    sortedImages,
    (images) => {
        const imageExists = images.some(
            (image) =>
                image.id === selectedImageId.value,
        )

        if (!imageExists) {
            selectedImageId.value =
                images[0]?.id ?? null
        }
    },
    {
        immediate: true,
    },
)
</script>

<template>
    <div>
        <div
            class="group relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(6,75,38,0.06)]">
            <img v-if="selectedImage" :src="selectedImage.image_url" :alt="productName"
                class="size-full object-contain transition duration-500 group-hover:scale-[1.03]" />

            <div v-else class="text-center text-slate-300">
                <Icon icon="mdi:image-off-outline" class="mx-auto text-6xl" />

                <p class="mt-3 text-sm">
                    Sản phẩm chưa có hình ảnh
                </p>
            </div>

            <button v-if="selectedImage" type="button"
                class="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-[#07532b] shadow-sm transition hover:bg-[#07532b] hover:text-white"
                aria-label="Xem ảnh lớn" @click="previewOpen = true">
                <Icon icon="mdi:magnify-plus-outline" class="text-xl" />
            </button>
        </div>

        <div v-if="sortedImages.length > 1" class="mt-4 grid grid-cols-5 gap-3">
            <button v-for="image in sortedImages" :key="image.id" type="button"
                class="aspect-square overflow-hidden rounded-xl border-2 bg-white p-1 transition" :class="selectedImage?.id === image.id
                    ? 'border-[#07532b] shadow-sm'
                    : 'border-slate-200 hover:border-[#9fc1aa]'
                    " @click="selectedImageId = image.id">
                <img :src="image.image_url" :alt="`${productName} - ảnh ${image.sort_order || 1}`" loading="lazy"
                    class="size-full rounded-lg object-cover" />
            </button>
        </div>

        <!-- Xem ảnh lớn -->
        <Teleport to="body">
            <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100"
                leave-to-class="opacity-0">
                <div v-if="previewOpen && selectedImage"
                    class="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-5"
                    @click.self="previewOpen = false">
                    <img :src="selectedImage.image_url" :alt="productName"
                        class="max-h-[88vh] max-w-[92vw] rounded-2xl bg-white object-contain" />

                    <button type="button"
                        class="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-slate-700"
                        aria-label="Đóng ảnh lớn" @click="previewOpen = false">
                        <Icon icon="mdi:close" class="text-2xl" />
                    </button>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>