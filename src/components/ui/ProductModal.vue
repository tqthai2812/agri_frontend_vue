<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="store.closeModal">
    <div class="bg-surface rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-surface z-10 flex justify-between items-center p-6 border-b border-border">
        <div>
          <h2 class="text-xl font-bold">
            {{ store.selectedProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới" }}
          </h2>
          <p class="text-sm text-text-light">
            Quản lý thông tin sản phẩm, hình ảnh, biến thể và quy cách bán.
          </p>
        </div>

        <button class="btn-outline-icon" @click="store.closeModal">
          <Icon icon="solar:close-circle-bold" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Error -->
        <div v-if="store.errorMsg"
          class="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
          <Icon icon="solar:danger-circle-bold-duotone" class="text-xl shrink-0 mt-0.5" />
          <span>{{ store.errorMsg }}</span>
        </div>

        <!-- Section: thông tin chung -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Thông tin chung</h3>
              <p class="section-desc">Thông tin chính của sản phẩm.</p>
            </div>

            <label class="flex items-center gap-3 cursor-pointer">
              <span class="text-sm text-text-sec">Hiển thị sản phẩm</span>
              <label class="toggle">
                <input v-model="store.form.is_show" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-group md:col-span-3">
              <label class="form-label">
                Tên sản phẩm <span class="text-primary">*</span>
              </label>

              <input v-model.trim="store.form.product_name" class="form-control"
                placeholder="Ví dụ: Phân bón hữu cơ cao cấp" />

              <p v-if="fieldError('product_name')" class="error-text">
                {{ fieldError("product_name") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Danh mục <span class="text-primary">*</span>
              </label>

              <select v-model="store.form.category_id" class="form-control" @change="handleCategoryChange">
                <option value="">Chọn danh mục</option>
                <option v-for="category in store.categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>

              <p v-if="fieldError('category_id')" class="error-text">
                {{ fieldError("category_id") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Danh mục con <span class="text-primary">*</span>
              </label>

              <select v-model="store.form.subcategory_id" class="form-control">
                <option value="">Chọn danh mục con</option>
                <option v-for="subcategory in store.subcategories" :key="subcategory.id" :value="subcategory.id">
                  {{ subcategory.name }}
                </option>
              </select>

              <p v-if="fieldError('subcategory_id')" class="error-text">
                {{ fieldError("subcategory_id") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Xuất xứ <span class="text-primary">*</span>
              </label>

              <select v-model="store.form.origin_id" class="form-control">
                <option value="">Chọn xuất xứ</option>
                <option v-for="origin in store.origins" :key="origin.id" :value="origin.id">
                  {{ origin.origin_name }}
                </option>
              </select>

              <p v-if="fieldError('origin_id')" class="error-text">
                {{ fieldError("origin_id") }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 mt-4">
            <div class="form-group">
              <label class="form-label">Mô tả</label>

              <textarea v-model.trim="store.form.description" class="form-control" rows="3"
                placeholder="Mô tả sản phẩm..."></textarea>

              <p v-if="fieldError('description')" class="error-text">
                {{ fieldError("description") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Hướng dẫn sử dụng</label>

              <textarea v-model.trim="store.form.usage_instructions" class="form-control" rows="3"
                placeholder="Hướng dẫn sử dụng sản phẩm..."></textarea>

              <p v-if="fieldError('usage_instructions')" class="error-text">
                {{ fieldError("usage_instructions") }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Cảnh báo an toàn</label>

              <textarea v-model.trim="store.form.safety_warning" class="form-control" rows="3"
                placeholder="Cảnh báo an toàn nếu có..."></textarea>

              <p v-if="fieldError('safety_warning')" class="error-text">
                {{ fieldError("safety_warning") }}
              </p>
            </div>
          </div>
        </div>

        <!-- Section: hình ảnh -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Hình ảnh sản phẩm</h3>
              <p class="section-desc">
                Có thể tải nhiều ảnh, ảnh đầu tiên mặc định là ảnh chính.
              </p>
            </div>
          </div>

          <div class="upload-area cursor-pointer" @click="triggerFileInput">
            <Icon icon="solar:cloud-upload-bold" class="text-4xl mx-auto mb-2" />
            <p class="text-sm">
              Bấm để <span class="text-primary font-semibold">chọn file</span>
            </p>
            <p class="text-xs text-text-light mt-1">
              PNG, JPG, JPEG, WEBP. Tối đa 8 ảnh, mỗi ảnh 5MB.
            </p>

            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple
              class="hidden" @change="handleImagesChange" />
          </div>

          <p v-if="fieldError('images')" class="error-text mt-2">
            {{ fieldError("images") }}
          </p>

          <div v-if="store.form.images.length" class="mt-4">
            <div class="text-sm font-semibold mb-3">
              Ảnh mới đã chọn: {{ store.form.images.length }}
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="(image, index) in imagePreviews" :key="index"
                class="relative rounded-2xl border border-border overflow-hidden bg-bg">
                <img :src="image.url" class="w-full h-32 object-cover" />

                <label
                  class="absolute left-2 bottom-2 bg-black/60 text-white rounded-lg px-2 py-1 text-xs cursor-pointer">
                  <input v-model.number="store.form.primary_image_index" type="radio" :value="index" class="mr-1" />
                  Ảnh chính
                </label>
              </div>
            </div>
          </div>

          <div v-if="store.selectedProduct?.images?.length && !store.form.images.length" class="mt-4">
            <div class="text-sm font-semibold mb-3">
              Ảnh hiện tại
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="image in store.selectedProduct.images" :key="image.id"
                class="rounded-2xl border border-border overflow-hidden bg-bg relative">
                <img :src="image.image_url" class="w-full h-32 object-cover" />

                <span v-if="image.is_primary"
                  class="absolute left-2 bottom-2 bg-primary text-white rounded-lg px-2 py-1 text-xs">
                  Ảnh chính
                </span>
              </div>
            </div>

            <p class="text-xs text-text-light mt-2">
              Chọn ảnh mới nếu bạn muốn thay toàn bộ ảnh hiện tại.
            </p>
          </div>
        </div>

        <!-- Section: biến thể -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Biến thể và quy cách bán</h3>
              <p class="section-desc">
                Giá, SKU và tồn kho nằm trong từng quy cách bán.
              </p>
            </div>

            <button type="button" class="btn-outline-sm" @click="store.addVariant">
              <Icon icon="solar:add-circle-bold" />
              Thêm biến thể
            </button>
          </div>

          <div class="space-y-5">
            <div v-for="(variant, variantIndex) in store.form.variants" :key="variantIndex"
              class="rounded-2xl border border-border p-4 bg-bg/40">
              <div class="flex items-center justify-between gap-3 mb-4">
                <div class="font-bold">
                  Biến thể {{ variantIndex + 1 }}
                </div>

                <button type="button" class="btn-danger-icon" :disabled="store.form.variants.length <= 1"
                  :class="store.form.variants.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
                  @click="store.removeVariant(variantIndex)">
                  <Icon icon="solar:trash-bin-trash-bold" />
                </button>
              </div>

              <div class="form-group mb-4">
                <label class="form-label">
                  Tên biến thể <span class="text-primary">*</span>
                </label>

                <input v-model.trim="variant.variant_name" class="form-control"
                  placeholder="Ví dụ: Chai 500ml, Túi 1kg, Gói nhỏ..." />

                <p v-if="fieldError(`variants.${variantIndex}.variant_name`)" class="error-text">
                  {{ fieldError(`variants.${variantIndex}.variant_name`) }}
                </p>
              </div>

              <div class="space-y-4">
                <div v-for="(pkg, packageIndex) in variant.packages" :key="packageIndex"
                  class="rounded-2xl border border-border p-4 bg-surface">
                  <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="font-semibold text-sm">
                      Quy cách {{ packageIndex + 1 }}
                    </div>

                    <div class="flex gap-2">
                      <button type="button" class="btn-outline-icon" @click="store.addPackage(variantIndex)">
                        <Icon icon="solar:add-circle-bold" />
                      </button>

                      <button type="button" class="btn-danger-icon" :disabled="variant.packages.length <= 1"
                        :class="variant.packages.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
                        @click="store.removePackage(variantIndex, packageIndex)">
                        <Icon icon="solar:trash-bin-trash-bold" />
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="form-group">
                      <label class="form-label">
                        SKU <span class="text-primary">*</span>
                      </label>

                      <input v-model.trim="pkg.sku" class="form-control" placeholder="SKU001" />

                      <p v-if="fieldError(`variants.${variantIndex}.packages.${packageIndex}.sku`)" class="error-text">
                        {{ fieldError(`variants.${variantIndex}.packages.${packageIndex}.sku`) }}
                      </p>
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        Kích thước <span class="text-primary">*</span>
                      </label>

                      <input v-model="pkg.size" type="number" min="0" step="0.01" class="form-control"
                        placeholder="1" />
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        Đơn vị <span class="text-primary">*</span>
                      </label>

                      <select v-model="pkg.unit" class="form-control">
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        Giá <span class="text-primary">*</span>
                      </label>

                      <input v-model="pkg.price" type="number" min="0" step="1000" class="form-control"
                        placeholder="120000" />
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        Tồn kho <span class="text-primary">*</span>
                      </label>

                      <input v-model="pkg.quantity_available" type="number" min="0" class="form-control"
                        placeholder="50" />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Barcode</label>

                      <input v-model.trim="pkg.barcode" class="form-control" placeholder="Barcode lẻ" />
                    </div>

                    <div class="form-group md:col-span-2">
                      <label class="form-label">Box barcode</label>

                      <input v-model.trim="pkg.box_barcode" class="form-control" placeholder="Barcode thùng/hộp" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="fieldError('variants')" class="error-text mt-2">
            {{ fieldError("variants") }}
          </p>
        </div>

        <!-- Footer -->
        <div
          class="sticky bottom-0 bg-surface border-t border-border pt-4 pb-1 flex flex-col sm:flex-row justify-end gap-3">
          <button type="button" class="btn-outline" @click="store.closeModal">
            Hủy
          </button>

          <button type="submit" class="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="store.saving || !canSave">
            <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
              :class="store.saving ? 'animate-spin' : ''" />

            {{ store.saving ? "Đang lưu..." : store.selectedProduct ? "Cập nhật sản phẩm" : "Lưu sản phẩm" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useAuthStore } from "@/stores/authStore";

const store = useProductStore();
const authStore = useAuthStore();

const fileInput = ref(null);
const imagePreviews = ref([]);

const canSave = computed(() => {
  if (store.selectedProduct) {
    return authStore.hasPermission("product.update");
  }

  return authStore.hasPermission("product.create");
});

function fieldError(key) {
  return store.errors[key] || "";
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleImagesChange(event) {
  const files = event.target.files || [];

  store.setImages(files);

  imagePreviews.value.forEach((preview) => {
    URL.revokeObjectURL(preview.url);
  });

  imagePreviews.value = Array.from(files).map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  }));

  store.form.primary_image_index = 0;
}

async function handleCategoryChange() {
  store.form.subcategory_id = "";
  await store.fetchSubcategories(store.form.category_id);
}

async function handleSubmit() {
  await store.saveProduct();
}

watch(
  () => store.showProductModal,
  (isOpen) => {
    if (!isOpen) {
      imagePreviews.value.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });

      imagePreviews.value = [];
    }
  },
);
</script>

<style scoped>
@reference "../../style.css";

.section-card {
  @apply rounded-2xl border border-border p-5 bg-surface shadow-sm;
}

.section-header {
  @apply flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5;
}

.section-title {
  @apply text-lg font-bold text-text;
}

.section-desc {
  @apply text-sm text-text-light;
}

.error-text {
  @apply text-danger text-sm mt-1;
}
</style>