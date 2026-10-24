<script setup>
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useCatalogStore } from "@/stores/admin/catalogStore";

const store = useCatalogStore();

const originFileInput = ref(null);

const modalTitle = computed(() => {
    const action = store.selectedItem ? "Cập nhật" : "Thêm";

    if (store.modalType === "category") {
        return `${action} danh mục`;
    }

    if (store.modalType === "subcategory") {
        return `${action} danh mục con`;
    }

    return `${action} xuất xứ`;
});

const modalDescription = computed(() => {
    if (store.modalType === "category") {
        return "Danh mục cha dùng để nhóm các sản phẩm.";
    }

    if (store.modalType === "subcategory") {
        return "Danh mục con thuộc một danh mục cha.";
    }

    return "Xuất xứ dùng để gắn thông tin nguồn gốc sản phẩm.";
});

function handleOriginImageChange(event) {
    const file = event.target.files?.[0] || null;

    store.setOriginImage(file);
}

async function handleSave() {
    try {
        await store.saveItem();
    } catch {
        // Store đã ghi lỗi để hiển thị trong form.
    }
}

function requestClose() {
    if (!store.saving) store.closeModal();
}
</script>

<template>
    <div v-if="store.showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="requestClose">
        <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
                <div>
                    <h2 class="text-xl font-bold">{{ modalTitle }}</h2>
                    <p class="text-sm text-text-light">{{ modalDescription }}</p>
                </div>

                <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Đóng" @click="requestClose" :disabled="store.saving">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </div>

            <form class="p-6 space-y-5" @submit.prevent="handleSave">
                <div v-if="store.errorMsg"
                    class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                    <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
                    <span>{{ store.errorMsg }}</span>
                </div>

                <!-- Category form -->
                <template v-if="store.modalType === 'category'">
                    <div class="form-group">
                        <label class="form-label">
                            Tên danh mục <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.categoryForm.category_name" class="form-control"
                            placeholder="Ví dụ: Phân bón" />

                        <p v-if="store.fieldError('category_name')" class="error-text">
                            {{ store.fieldError("category_name") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mô tả</label>

                        <textarea v-model.trim="store.categoryForm.category_description" class="form-control" rows="4"
                            placeholder="Mô tả ngắn về danh mục..."></textarea>

                        <p v-if="store.fieldError('category_description')" class="error-text">
                            {{ store.fieldError("category_description") }}
                        </p>
                    </div>
                </template>

                <!-- Subcategory form -->
                <template v-if="store.modalType === 'subcategory'">
                    <div class="form-group">
                        <label class="form-label">
                            Danh mục cha <span class="text-primary">*</span>
                        </label>

                        <select v-model="store.subcategoryForm.category_id" class="form-control">
                            <option value="">Chọn danh mục cha</option>
                            <option v-for="category in store.categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>

                        <p v-if="store.fieldError('category_id')" class="error-text">
                            {{ store.fieldError("category_id") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            Tên danh mục con <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.subcategoryForm.subcategory_name" class="form-control"
                            placeholder="Ví dụ: Phân hữu cơ" />

                        <p v-if="store.fieldError('subcategory_name')" class="error-text">
                            {{ store.fieldError("subcategory_name") }}
                        </p>
                    </div>
                </template>

                <!-- Origin form -->
                <template v-if="store.modalType === 'origin'">
                    <div class="form-group">
                        <label class="form-label">
                            Tên xuất xứ <span class="text-primary">*</span>
                        </label>

                        <input v-model.trim="store.originForm.origin_name" class="form-control"
                            placeholder="Ví dụ: Việt Nam" />

                        <p v-if="store.fieldError('origin_name')" class="error-text">
                            {{ store.fieldError("origin_name") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Hình ảnh xuất xứ</label>

                        <div class="upload-area cursor-pointer" @click="originFileInput?.click()">
                            <Icon icon="solar:cloud-upload-bold" class="text-4xl mx-auto mb-2" />
                            <p class="text-sm">
                                Bấm để <span class="text-primary font-semibold">chọn ảnh</span>
                            </p>
                            <p class="text-xs text-text-light mt-1">
                                JPG, JPEG, PNG, GIF. Tối đa 2MB.
                            </p>

                            <input ref="originFileInput" type="file" accept="image/jpeg,image/jpg,image/png,image/gif"
                                class="hidden" @change="handleOriginImageChange" />
                        </div>

                        <p v-if="store.fieldError('origin_image')" class="error-text">
                            {{ store.fieldError("origin_image") }}
                        </p>

                        <div v-if="store.originForm.preview"
                            class="mt-4 w-32 h-32 rounded-2xl overflow-hidden border border-border bg-bg">
                            <img :src="store.originForm.preview" class="w-full h-full object-cover"
                                alt="Origin preview" />
                        </div>
                    </div>
                </template>

                <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                    <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                        @click="requestClose" :disabled="store.saving">
                        Hủy
                    </button>

                    <button type="submit"
                        class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        :disabled="store.saving">
                        <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
                            :class="store.saving ? 'animate-spin' : ''" />

                        {{ store.saving ? "Đang lưu..." : "Lưu" }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.error-text {
    @apply text-danger text-sm mt-1;
}
</style>