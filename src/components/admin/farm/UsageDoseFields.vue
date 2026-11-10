<script setup>
defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
});
const ranges = [
  { key: "dose_per_ha", label: "Lượng sản phẩm trên 1 ha", unit: "dose" },
  {
    key: "dose_per_liter",
    label: "Lượng sản phẩm trên 1 lít nước",
    unit: "dose",
  },
  { key: "water_l_per_ha", label: "Lượng nước trên 1 ha", unit: "water" },
];
</script>
<template>
  <section class="rounded-xl border border-border p-4">
    <h3 class="font-bold">Định mức sử dụng</h3>
    <p class="mt-1 text-xs leading-5 text-text-light">
      Nhập theo nhãn đã kiểm tra. Định mức cố định: nhập hai ô bằng nhau. Chưa
      có thông tin: để trống cả hai ô.
    </p>
    <label class="mt-4 block text-sm font-semibold"
      >Đơn vị lượng sản phẩm
      <select v-model="form.dose_unit" class="form-control mt-2 sm:!w-56">
        <option value="">Chưa có định mức</option>
        <option value="g">g (gam)</option>
        <option value="ml">ml (mililít)</option>
      </select>
      <small v-if="errors.dose_unit" class="text-red-600">{{
        errors.dose_unit[0]
      }}</small>
    </label>
    <div v-for="range in ranges" :key="range.key" class="mt-4">
      <p class="text-sm font-semibold">
        {{ range.label }}
        <span class="text-xs font-normal text-text-light"
          >({{
            range.unit === "water"
              ? "lít/ha"
              : (form.dose_unit || "g hoặc ml") +
                (range.key === "dose_per_ha" ? "/ha" : "/lít nước")
          }})</span
        >
      </p>
      <div class="mt-2 grid grid-cols-2 gap-3">
        <label
          v-for="bound in ['min', 'max']"
          :key="bound"
          class="text-xs text-text-light"
          >{{ bound === "min" ? "Tối thiểu" : "Tối đa" }}
          <input
            v-model="form[range.key + '_' + bound]"
            type="text"
            inputmode="decimal"
            maxlength="15"
            pattern="[0-9]{1,8}([.][0-9]{1,6})?"
            class="form-control mt-1"
            placeholder="Để trống nếu chưa có"
            :aria-label="
              range.label + (bound === 'min' ? ' tối thiểu' : ' tối đa')
            "
          />
          <small
            v-if="errors[range.key + '_' + bound]"
            class="block text-red-600"
            >{{ errors[range.key + "_" + bound][0] }}</small
          >
        </label>
      </div>
    </div>
    <p class="mt-4 text-xs leading-5 text-text-light">
      Dùng dấu chấm thập phân, tối đa 6 chữ số sau dấu chấm. Quy đổi kg → g, lít
      → ml trước khi nhập. Giữ tỷ lệ gốc và điều kiện pha trong nội dung hướng
      dẫn; không quy đổi giữa gam và mililít.
    </p>
  </section>
</template>