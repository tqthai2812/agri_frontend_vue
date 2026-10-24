<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useDeliveryMethodStore } from "@/stores/admin/deliveryMethodStore";

const store = useDeliveryMethodStore();

const emit = defineEmits(["save", "reload-regions"]);

const unknownFormRegion = computed(() => {
    const value = String(store.form.region ?? "").trim();

    return (
        store.regionsLoaded &&
        value !== "" &&
        !store.shippingRegions.some((region) => region.value === value)
    );
});
</script>

<template>
    <div v-if="store.showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="store.closeModal">
        <div role="dialog" aria-modal="true" aria-labelledby="delivery-modal-title"
            class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-6">
                <div>
                    <h2 id="delivery-modal-title" class="text-xl font-bold">
                        {{
                            store.selectedMethod
                                ? "Cập nhật phương thức giao hàng"
                                : "Thêm phương thức giao hàng"
                        }}
                    </h2>
                    <p class="text-sm text-text-light">
                        Cấu hình phí giao hàng và khu vực áp dụng.
                    </p>
                </div>

                <button type="button" class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Đóng" :disabled="store.busy" @click="store.closeModal">
                    <Icon icon="solar:close-circle-bold" />
                </button>
            </div>

            <form class="space-y-5 p-6" @submit.prevent="emit('save')">
                <div v-if="store.errorMsg" role="alert"
                    class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {{ store.errorMsg }}
                </div>

                <fieldset :disabled="store.saving" class="space-y-5">
                    <div class="form-group">
                        <label for="delivery-name" class="form-label">
                            Tên phương thức <span class="text-primary">*</span>
                        </label>

                        <input id="delivery-name" v-model.trim="store.form.name" required maxlength="255"
                            class="form-control" placeholder="Ví dụ: Giao hàng tiêu chuẩn" />

                        <p v-if="store.fieldError('name')" class="error-text">
                            {{ store.fieldError("name") }}
                        </p>
                    </div>

                    <div class="form-group">
                        <label for="delivery-description" class="form-label">
                            Mô tả
                        </label>

                        <textarea id="delivery-description" v-model.trim="store.form.description" class="form-control"
                            rows="3" maxlength="1000" placeholder="Mô tả ngắn về phương thức giao hàng..."></textarea>

                        <p v-if="store.fieldError('description')" class="error-text">
                            {{ store.fieldError("description") }}
                        </p>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="form-group">
                            <label for="delivery-price" class="form-label">
                                Phí giao hàng <span class="text-primary">*</span>
                            </label>

                            <input id="delivery-price" v-model.number="store.form.base_price" required type="number"
                                min="0" step="0.01" class="form-control" placeholder="30000" />

                            <p v-if="store.fieldError('base_price')" class="error-text">
                                {{ store.fieldError("base_price") }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label for="delivery-minimum" class="form-label">
                                Tiền hàng tối thiểu
                            </label>

                            <input id="delivery-minimum" v-model.number="store.form.min_order_amount" required
                                type="number" min="0" step="0.01" class="form-control" placeholder="0" />

                            <p class="mt-1 text-xs text-text-light">
                                Tính sau giảm giá. Đây là điều kiện áp dụng phương thức.
                            </p>

                            <p v-if="store.fieldError('min_order_amount')" class="error-text">
                                {{ store.fieldError("min_order_amount") }}
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="delivery-region" class="form-label">
                            Khu vực giao hàng
                        </label>

                        <select id="delivery-region" v-model="store.form.region" class="form-control"
                            :disabled="store.regionsLoading || !store.regionsLoaded">
                            <option value="">
                                {{
                                    store.regionsLoading
                                        ? "Đang tải khu vực..."
                                        : "Toàn quốc — không giới hạn tỉnh/thành"
                                }}
                            </option>

                            <option v-if="unknownFormRegion" :value="store.form.region" disabled>
                                Khu vực cũ: {{ store.form.region }} — hãy chọn lại
                            </option>

                            <option v-for="region in store.shippingRegions" :key="region.value" :value="region.value">
                                {{ region.label }}
                            </option>
                        </select>

                        <p v-if="unknownFormRegion" class="error-text">
                            Khu vực cũ không còn khớp danh sách. Vui lòng chọn lại trước
                            khi lưu.
                        </p>

                        <div v-if="store.regionsError" class="mt-2 text-sm text-danger">
                            {{ store.regionsError }}
                            <button type="button"
                                class="ml-2 font-semibold underline cursor-pointer disabled:cursor-not-allowed"
                                :disabled="store.regionsLoading" @click="emit('reload-regions')">
                                Tải lại khu vực
                            </button>
                        </div>

                        <p v-if="store.fieldError('region')" class="error-text">
                            {{ store.fieldError("region") }}
                        </p>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="switch-card">
                            <div>
                                <div class="text-sm font-semibold">Kích hoạt</div>
                                <div class="text-xs text-text-light">
                                    Cho phép dùng phương thức này.
                                </div>
                            </div>

                            <label class="toggle">
                                <input v-model="store.form.is_active" type="checkbox"
                                    aria-label="Kích hoạt phương thức" />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="switch-card">
                            <div>
                                <div class="text-sm font-semibold">Đặt mặc định</div>
                                <div class="text-xs text-text-light">
                                    Chỉ có một phương thức mặc định.
                                </div>
                            </div>

                            <label class="toggle">
                                <input v-model="store.form.is_default" type="checkbox"
                                    aria-label="Đặt phương thức mặc định" />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <p v-if="store.fieldError('is_active')" class="error-text">
                        {{ store.fieldError("is_active") }}
                    </p>
                    <p v-if="store.fieldError('is_default')" class="error-text">
                        {{ store.fieldError("is_default") }}
                    </p>
                </fieldset>

                <div class="flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row">
                    <button type="button" class="btn-outline cursor-pointer disabled:cursor-not-allowed"
                        :disabled="store.busy" @click="store.closeModal">
                        Hủy
                    </button>

                    <button type="submit"
                        class="btn-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer" :disabled="store.busy ||
                            store.regionsLoading ||
                            !store.formRegionValid
                            ">
                        <Icon :icon="store.saving
                            ? 'solar:refresh-bold'
                            : 'solar:diskette-bold-duotone'
                            " :class="{ 'animate-spin': store.saving }" />
                        {{ store.saving ? "Đang lưu..." : "Lưu phương thức" }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../style.css";

.error-text {
    @apply mt-1 text-sm text-danger;
}

.switch-card {
    @apply flex items-center justify-between gap-4 rounded-2xl border border-border p-4 transition hover:border-primary;
}
</style>