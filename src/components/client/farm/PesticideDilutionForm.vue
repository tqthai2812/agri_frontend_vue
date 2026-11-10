<script setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { AREA_UNITS, DOSE_UNITS } from "@/utils/pesticideDilutionCalculator";

const props = defineProps({
  model: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update", "calculate", "reset", "example"]);
const areaLabel = computed(
  () =>
    AREA_UNITS.find((item) => item.value === props.model.areaUnit)?.label ||
    "ha",
);
const doseLabel = computed(
  () =>
    DOSE_UNITS.find((item) => item.value === props.model.doseUnit)?.label ||
    "mL",
);
const update = (field, event) => emit("update", field, event.target.value);
</script>

<template>
  <form
    class="dilution-card dilution-form"
    novalidate
    @submit.prevent="emit('calculate')"
  >
    <div class="dilution-card-heading">
      <div>
        <span class="dilution-eyebrow">Thông số từ nhãn thuốc</span>
        <h2>Nhập số liệu cần tính</h2>
      </div>
      <button type="button" class="dilution-example" @click="emit('example')">
        Nạp ví dụ minh họa <span aria-hidden="true">→</span>
      </button>
    </div>

    <div class="dilution-unit-grid">
      <div class="dilution-field">
        <label for="dilution-area-unit">Đơn vị diện tích</label>
        <select
          id="dilution-area-unit"
          :value="model.areaUnit"
          :aria-invalid="!!errors.areaUnit"
          @change="update('areaUnit', $event)"
        >
          <option
            v-for="unit in AREA_UNITS"
            :key="unit.value"
            :value="unit.value"
          >
            {{ unit.label }}
          </option>
        </select>
        <span v-if="errors.areaUnit" class="dilution-field-error">{{
          errors.areaUnit
        }}</span>
      </div>
      <div class="dilution-field">
        <label for="dilution-dose-unit">Đơn vị liều thuốc</label>
        <select
          id="dilution-dose-unit"
          :value="model.doseUnit"
          :aria-invalid="!!errors.doseUnit"
          @change="update('doseUnit', $event)"
        >
          <option
            v-for="unit in DOSE_UNITS"
            :key="unit.value"
            :value="unit.value"
          >
            {{ unit.label }}
          </option>
        </select>
        <span v-if="errors.doseUnit" class="dilution-field-error">{{
          errors.doseUnit
        }}</span>
      </div>
    </div>
    <p class="dilution-unit-hint">
      Diện tích, liều thuốc và lượng dung dịch phải cùng đơn vị diện tích. Đổi
      đơn vị sẽ xóa các số liên quan để bạn nhập lại.
    </p>

    <div class="dilution-field">
      <label for="dilution-area">Diện tích cần phun</label>
      <div class="dilution-input-wrap">
        <input
          id="dilution-area"
          :value="model.area"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          maxlength="16"
          placeholder="Nhập diện tích"
          :aria-invalid="!!errors.area"
          :aria-describedby="errors.area ? 'dilution-area-error' : undefined"
          @input="update('area', $event)"
        /><span aria-hidden="true">{{ areaLabel }}</span>
      </div>
      <span
        v-if="errors.area"
        id="dilution-area-error"
        class="dilution-field-error"
        >{{ errors.area }}</span
      >
    </div>
    <div class="dilution-dose-grid">
      <div class="dilution-field">
        <label for="dilution-rate">Liều thuốc trên nhãn</label>
        <div class="dilution-input-wrap">
          <input
            id="dilution-rate"
            :value="model.rate"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            maxlength="16"
            placeholder="Liều thành phẩm"
            :aria-invalid="!!errors.rate"
            :aria-describedby="errors.rate ? 'dilution-rate-error' : undefined"
            @input="update('rate', $event)"
          /><span aria-hidden="true">{{ doseLabel }}/{{ areaLabel }}</span>
        </div>
        <span
          v-if="errors.rate"
          id="dilution-rate-error"
          class="dilution-field-error"
          >{{ errors.rate }}</span
        >
      </div>
      <div class="dilution-field">
        <label for="dilution-spray-volume">Lượng dung dịch phun</label>
        <div class="dilution-input-wrap">
          <input
            id="dilution-spray-volume"
            :value="model.sprayVolume"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            maxlength="16"
            placeholder="Theo cùng diện tích"
            :aria-invalid="!!errors.sprayVolume"
            :aria-describedby="
              errors.sprayVolume
                ? 'dilution-spray-hint dilution-spray-error'
                : 'dilution-spray-hint'
            "
            @input="update('sprayVolume', $event)"
          /><span aria-hidden="true">L/{{ areaLabel }}</span>
        </div>
        <span id="dilution-spray-hint" class="dilution-field-hint"
          >Thể tích cuối sau khi đã pha thuốc.</span
        >
        <span
          v-if="errors.sprayVolume"
          id="dilution-spray-error"
          class="dilution-field-error"
          >{{ errors.sprayVolume }}</span
        >
      </div>
    </div>
    <div class="dilution-field">
      <label for="dilution-tank">Dung tích bình phun</label>
      <div class="dilution-input-wrap">
        <input
          id="dilution-tank"
          :value="model.tank"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          maxlength="16"
          placeholder="Nhập dung tích bình đang dùng"
          :aria-invalid="!!errors.tank"
          :aria-describedby="errors.tank ? 'dilution-tank-error' : undefined"
          @input="update('tank', $event)"
        /><span aria-hidden="true">L</span>
      </div>
      <span
        v-if="errors.tank"
        id="dilution-tank-error"
        class="dilution-field-error"
        >{{ errors.tank }}</span
      >
    </div>
    <p class="dilution-field-hint">
      Nhập liều của thành phẩm thương mại, không nhập phần trăm hoạt chất. Số
      thập phân dùng dấu phẩy hoặc dấu chấm, không dùng dấu phân cách hàng
      nghìn.
    </p>
    <p v-if="Object.keys(errors).length" role="alert" class="dilution-error">
      Kiểm tra các ô được đánh dấu trước khi tính.
    </p>
    <div class="dilution-actions">
      <button type="submit" class="dilution-button">
        <Icon icon="solar:calculator-linear" aria-hidden="true" />Tính toán
      </button>
      <button
        type="button"
        class="dilution-button dilution-button-secondary"
        @click="emit('reset')"
      >
        <Icon icon="solar:restart-linear" aria-hidden="true" />Làm mới
      </button>
    </div>
  </form>
</template>