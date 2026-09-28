<script setup>
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useProductStore } from "@/stores/admin/productStore";
import { useAuthStore } from "@/stores/shared/authStore";

const store = useProductStore();
const authStore = useAuthStore();

const emit = defineEmits(["close"]);

const dialog = ref(null);
const fileInput = ref(null);
const imagePreviews = ref([]);
const imageError = ref("");
const loadingSubcategories = ref(false);

let categoryRequest = 0;
let disposed = false;
let nextKey = 0;
const objectKeys = new WeakMap();

const canSave = computed(() =>
  authStore.hasPermission(
    store.selectedProduct ? "product.update" : "product.create",
  ),
);

const locked = computed(() => store.saving || !canSave.value);

const textFields = [
  { key: "description", label: "Mô tả", placeholder: "Mô tả sản phẩm..." },
  {
    key: "usage_instructions",
    label: "Hướng dẫn sử dụng",
    placeholder: "Hướng dẫn sử dụng sản phẩm...",
  },
  {
    key: "safety_warning",
    label: "Cảnh báo an toàn",
    placeholder: "Cảnh báo an toàn nếu có...",
  },
];

const packageFields = [
  { key: "sku", label: "SKU", type: "text", required: true, maxlength: 255 },
  {
    key: "size",
    label: "Kích thước",
    type: "number",
    required: true,
    min: 0,
    max: 999999.99,
    step: "0.01",
  },
  {
    key: "price",
    label: "Giá bán",
    type: "number",
    required: true,
    min: 0,
    max: 9999999999.99,
    step: "0.01",
  },
  {
    key: "reorder_level",
    label: "Ngưỡng cảnh báo tồn",
    type: "number",
    required: true,
    min: 0,
    max: 4294967295,
    step: "1",
  },
  { key: "barcode", label: "Barcode", type: "text", maxlength: 255 },
  { key: "box_barcode", label: "Barcode thùng/hộp", type: "text", maxlength: 255 },
];

function rowKey(object, type) {
  if (object.id != null) return `${type}-${object.id}`;

  if (!objectKeys.has(object)) {
    objectKeys.set(object, `${type}-new-${++nextKey}`);
  }

  return objectKeys.get(object);
}

function fieldError(key) {
  return store.errors[key] || "";
}

function requestClose() {
  if (store.saving) return;

  // Products.vue xử lý @close bằng store.closeModal().
  emit("close");
}

function releasePreviews() {
  imagePreviews.value.forEach((preview) => {
    URL.revokeObjectURL(preview.url);
  });

  imagePreviews.value = [];
}

function rebuildPreviews(files) {
  releasePreviews();

  imagePreviews.value = files.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  }));
}

watch(
  () => [...store.form.images],
  rebuildPreviews,
  { immediate: true },
);

function triggerFileInput() {
  if (!locked.value) fileInput.value?.click();
}

function handleImagesChange(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = "";

  if (!files.length || locked.value) return;

  imageError.value = "";

  if (files.length > 8) {
    imageError.value = "Chỉ được chọn tối đa 8 ảnh.";
    return;
  }

  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      imageError.value = `"${file.name}" không phải ảnh JPG, PNG hoặc WEBP hợp lệ.`;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      imageError.value = `"${file.name}" vượt quá 5MB.`;
      return;
    }
  }

  store.setImages(files);
}

function removeNewImage(index) {
  if (locked.value) return;

  const files = [...store.form.images];
  const previousPrimary = Number(store.form.primary_image_index);

  files.splice(index, 1);
  store.setImages(files);

  if (files.length && previousPrimary !== index) {
    store.form.primary_image_index =
      previousPrimary > index ? previousPrimary - 1 : previousPrimary;
  }

  imageError.value = "";
}

function clearNewImages() {
  if (locked.value) return;

  store.setImages([]);
  imageError.value = "";
}

async function handleCategoryChange() {
  const requestId = ++categoryRequest;

  store.form.subcategory_id = "";
  loadingSubcategories.value = true;

  try {
    await store.fetchSubcategories(store.form.category_id, "form");
  } catch {
    // Store hiển thị lỗi.
  } finally {
    if (!disposed && requestId === categoryRequest) {
      loadingSubcategories.value = false;
    }
  }
}

function removeVariant(index) {
  if (locked.value || store.form.variants.length <= 1) return;

  const variant = store.form.variants[index];

  if (
    variant.id &&
    !window.confirm("Bỏ biến thể này khỏi sản phẩm khi lưu? Backend sẽ kiểm tra các dữ liệu liên quan.")
  ) return;

  store.removeVariant(index);
}

function removePackage(variantIndex, packageIndex) {
  const variant = store.form.variants[variantIndex];

  if (locked.value || variant.packages.length <= 1) return;

  const pkg = variant.packages[packageIndex];

  if (
    pkg.id &&
    !window.confirm("Bỏ quy cách này khỏi sản phẩm khi lưu? Quy cách đã phát sinh dữ liệu có thể không được phép xóa.")
  ) return;

  store.removePackage(variantIndex, packageIndex);
}

async function handleSubmit() {
  if (locked.value || loadingSubcategories.value) return;

  imageError.value = "";

  try {
    await store.saveProduct();
  } catch {
    // Giữ nguyên form; lỗi chi tiết đã nằm trong store.errors.
  }
}

onMounted(() => {
  dialog.value?.showModal();
});

onBeforeUnmount(() => {
  disposed = true;
  categoryRequest++;
  releasePreviews();
  dialog.value?.close();
});
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" aria-labelledby="product-modal-title"
      class="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
      @cancel.prevent="requestClose">
      <div
        class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface p-5 sm:p-6">
        <div>
          <h2 id="product-modal-title" class="text-xl font-bold">
            {{ store.selectedProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới" }}
          </h2>
          <p class="mt-1 text-sm text-text-light">
            Thông tin sản phẩm, hình ảnh, biến thể và quy cách bán.
          </p>
        </div>

        <button type="button" class="btn-outline-icon" aria-label="Đóng" :disabled="store.saving" @click="requestClose">
          <Icon icon="solar:close-circle-bold" />
        </button>
      </div>

      <form class="space-y-6 p-5 sm:p-6" @submit.prevent="handleSubmit">
        <div v-if="store.errorMsg" role="alert"
          class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p class="font-semibold">{{ store.errorMsg }}</p>

          <ul v-if="Object.keys(store.errors).length" class="mt-2 list-disc space-y-1 pl-5">
            <li v-for="(error, key) in store.errors" :key="key">
              {{ error }}
              <span class="text-xs">({{ key }})</span>
            </li>
          </ul>
        </div>

        <fieldset :disabled="locked" class="min-w-0 space-y-6">
          <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 class="text-lg font-bold">Thông tin chung</h3>
                <p class="text-sm text-text-light">Thông tin chính của sản phẩm.</p>
              </div>

              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <input v-model="store.form.is_show" type="checkbox" class="size-4 accent-[#07532b]" />
                Hiển thị sản phẩm
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <label class="form-group md:col-span-2">
                <span class="form-label">Tên sản phẩm *</span>
                <input v-model.trim="store.form.product_name" required maxlength="255" class="form-control"
                  placeholder="Ví dụ: Phân bón hữu cơ cao cấp" />
              </label>

              <label class="form-group">
                <span class="form-label">Thương hiệu</span>
                <input v-model.trim="store.form.brand" maxlength="255" class="form-control"
                  placeholder="Tên thương hiệu" />
              </label>

              <label class="form-group">
                <span class="form-label">Danh mục *</span>
                <select v-model="store.form.category_id" required class="form-control" @change="handleCategoryChange">
                  <option value="">Chọn danh mục</option>
                  <option v-for="item in store.categories" :key="item.id" :value="item.id">
                    {{ item.name || item.category_name }}
                  </option>
                </select>
              </label>

              <label class="form-group">
                <span class="form-label">Danh mục con *</span>
                <select v-model="store.form.subcategory_id" required class="form-control"
                  :disabled="!store.form.category_id || loadingSubcategories">
                  <option value="">
                    {{ loadingSubcategories ? "Đang tải..." : "Chọn danh mục con" }}
                  </option>
                  <option v-for="item in store.subcategories" :key="item.id" :value="item.id">
                    {{ item.name || item.subcategory_name }}
                  </option>
                </select>
              </label>

              <label class="form-group">
                <span class="form-label">Xuất xứ *</span>
                <select v-model="store.form.origin_id" required class="form-control">
                  <option value="">Chọn xuất xứ</option>
                  <option v-for="item in store.origins" :key="item.id" :value="item.id">
                    {{ item.origin_name || item.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="mt-4 grid gap-4">
              <label v-for="field in textFields" :key="field.key" class="form-group">
                <span class="form-label">{{ field.label }}</span>
                <textarea v-model="store.form[field.key]" class="form-control" rows="3"
                  :placeholder="field.placeholder"></textarea>
              </label>
            </div>
          </section>

          <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 class="text-lg font-bold">Hình ảnh sản phẩm</h3>
            <p class="mt-1 text-sm text-text-light">
              Tối đa 8 ảnh, mỗi ảnh 5MB. Ảnh đầu tiên mặc định là ảnh chính.
            </p>

            <button type="button"
              class="mt-4 w-full rounded-2xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary"
              @click="triggerFileInput">
              <Icon icon="solar:cloud-upload-bold" class="mx-auto mb-2 text-4xl text-primary" />
              <span class="block text-sm font-semibold">Chọn ảnh sản phẩm</span>
              <span class="mt-1 block text-xs text-text-light">PNG, JPG, JPEG, WEBP</span>
            </button>

            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple class="hidden"
              @change="handleImagesChange" />

            <p v-if="imageError" role="alert" class="mt-2 text-sm text-danger">
              {{ imageError }}
            </p>

            <div v-if="imagePreviews.length" class="mt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <strong class="text-sm">Ảnh mới: {{ imagePreviews.length }}</strong>
                <button type="button" class="text-sm text-danger underline" @click="clearNewImages">
                  Bỏ ảnh mới
                </button>
              </div>

              <p v-if="store.selectedProduct" class="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Khi lưu, các ảnh này sẽ thay toàn bộ ảnh hiện tại.
              </p>

              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="(image, index) in imagePreviews" :key="image.url"
                  class="overflow-hidden rounded-xl border border-border bg-bg">
                  <div class="relative">
                    <img :src="image.url" :alt="image.name" class="h-32 w-full object-contain" />
                    <button type="button"
                      class="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white text-red-600 shadow"
                      :aria-label="`Bỏ ảnh ${index + 1}`" @click="removeNewImage(index)">
                      <Icon icon="mdi:close" />
                    </button>
                  </div>

                  <label class="flex items-center gap-2 p-3 text-xs">
                    <input v-model.number="store.form.primary_image_index" type="radio" name="product-primary-image"
                      :value="index" />
                    Ảnh chính
                  </label>

                  <p v-if="fieldError(`images.${index}`)" class="px-3 pb-3 text-xs text-danger">
                    {{ fieldError(`images.${index}`) }}
                  </p>
                </div>
              </div>
            </div>

            <div v-else-if="store.selectedProduct?.images?.length" class="mt-4">
              <strong class="mb-3 block text-sm">Ảnh hiện tại</strong>

              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="image in store.selectedProduct.images" :key="image.id"
                  class="relative overflow-hidden rounded-xl border border-border bg-bg">
                  <img :src="image.image_url" :alt="store.form.product_name" class="h-32 w-full object-contain" />
                  <span v-if="image.is_primary === true || image.is_primary === 1 || image.is_primary === '1'"
                    class="absolute bottom-2 left-2 rounded-lg bg-primary px-2 py-1 text-xs text-white">
                    Ảnh chính
                  </span>
                </div>
              </div>

              <p class="mt-2 text-xs text-text-light">
                Không chọn ảnh mới thì giữ nguyên ảnh hiện tại.
              </p>
            </div>
          </section>

          <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 class="text-lg font-bold">Biến thể và quy cách bán</h3>
                <p class="text-sm text-text-light">
                  Tồn kho được cập nhật qua nhập/xuất kho.
                </p>
              </div>

              <button type="button" class="btn-outline-sm" @click="store.addVariant">
                <Icon icon="solar:add-circle-bold" />
                Thêm biến thể
              </button>
            </div>

            <div class="space-y-5">
              <div v-for="(variant, variantIndex) in store.form.variants" :key="rowKey(variant, 'variant')"
                class="rounded-2xl border border-border bg-bg/40 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <strong>Biến thể {{ variantIndex + 1 }}</strong>
                  <button type="button" class="btn-danger-icon disabled:opacity-40" aria-label="Bỏ biến thể"
                    :disabled="store.form.variants.length <= 1" @click="removeVariant(variantIndex)">
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>

                <label class="form-group mb-4">
                  <span class="form-label">Tên biến thể *</span>
                  <input v-model.trim="variant.variant_name" required maxlength="255" class="form-control"
                    placeholder="Tên biến thể" />
                </label>

                <div class="space-y-4">
                  <div v-for="(pkg, packageIndex) in variant.packages" :key="rowKey(pkg, 'package')"
                    class="rounded-2xl border border-border bg-surface p-4">
                    <div class="mb-4 flex items-center justify-between gap-3">
                      <strong class="text-sm">Quy cách {{ packageIndex + 1 }}</strong>
                      <button type="button" class="btn-danger-icon disabled:opacity-40" aria-label="Bỏ quy cách"
                        :disabled="variant.packages.length <= 1" @click="removePackage(variantIndex, packageIndex)">
                        <Icon icon="solar:trash-bin-trash-bold" />
                      </button>
                    </div>

                    <div class="grid gap-4 md:grid-cols-4">
                      <label v-for="field in packageFields" :key="field.key" class="form-group">
                        <span class="form-label">
                          {{ field.label }}{{ field.required ? " *" : "" }}
                        </span>

                        <input v-model="pkg[field.key]" :type="field.type" :required="field.required"
                          :maxlength="field.maxlength" :min="field.min" :max="field.max" :step="field.step"
                          class="form-control" />

                        <span v-if="fieldError(`variants.${variantIndex}.packages.${packageIndex}.${field.key}`)"
                          class="mt-1 block text-sm text-danger">
                          {{ fieldError(`variants.${variantIndex}.packages.${packageIndex}.${field.key}`) }}
                        </span>
                      </label>

                      <label class="form-group">
                        <span class="form-label">Đơn vị *</span>
                        <select v-model="pkg.unit" required class="form-control">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="l">Lít</option>
                          <option value="piece">Cái</option>
                        </select>
                      </label>

                      <label class="form-group">
                        <span class="form-label">Tồn vật lý</span>
                        <input :value="pkg.quantity_available ?? 0" readonly
                          class="form-control cursor-default bg-bg" />
                        <span class="mt-1 block text-xs text-text-light">
                          {{ pkg.id ? "Cập nhật qua nghiệp vụ kho." : "Quy cách mới có tồn ban đầu bằng 0." }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <button type="button" class="btn-outline-sm mt-4" @click="store.addPackage(variantIndex)">
                  <Icon icon="solar:add-circle-bold" />
                  Thêm quy cách
                </button>
              </div>
            </div>
          </section>
        </fieldset>

        <div
          class="sticky bottom-0 flex flex-col justify-end gap-3 border-t border-border bg-surface pb-1 pt-4 sm:flex-row">
          <button type="button" class="btn-outline" :disabled="store.saving" @click="requestClose">
            Hủy
          </button>

          <button type="submit" class="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="locked || loadingSubcategories">
            <Icon :icon="store.saving ? 'solar:refresh-bold' : 'solar:diskette-bold-duotone'"
              :class="{ 'animate-spin': store.saving }" />
            {{
              store.saving
                ? "Đang lưu..."
                : store.selectedProduct
                  ? "Cập nhật sản phẩm"
                  : "Lưu sản phẩm"
            }}
          </button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>