<script setup>
import { nextTick, reactive, ref } from "vue";
import { Icon } from "@iconify/vue";
import PesticideDilutionForm from "@/components/client/farm/PesticideDilutionForm.vue";
import PesticideDilutionResults from "@/components/client/farm/PesticideDilutionResults.vue";
import PesticideDilutionFormula from "@/components/client/farm/PesticideDilutionFormula.vue";
import {
  buildDilutionSummary,
  calculateDilution,
  emptyDilutionInputs,
} from "@/utils/pesticideDilutionCalculator";
import "@/assets/pesticide-dilution.css";

const inputs = reactive(emptyDilutionInputs());
const errors = ref({});
const result = ref(null);
const message = ref("");
const copyStatus = ref("");
const copyText = ref("");
const exampleLoaded = ref(false);
let copyGeneration = 0;

function clearResult() {
  copyGeneration++;
  result.value = null;
  errors.value = {};
  copyStatus.value = "";
  copyText.value = "";
}
function update(field, value) {
  if (inputs[field] === value) return;
  const hadResult = Boolean(result.value);
  clearResult();
  if (hadResult)
    message.value = "Thông số đã thay đổi. Nhấn Tính toán để cập nhật kết quả.";
  if (field === "areaUnit")
    Object.assign(inputs, { area: "", rate: "", sprayVolume: "" });
  if (field === "doseUnit") inputs.rate = "";
  inputs[field] = value;
  exampleLoaded.value = false;
}
async function calculate() {
  clearResult();
  const calculated = calculateDilution(inputs);
  if (!calculated.ok) {
    errors.value = calculated.errors;
    message.value = "Kiểm tra số liệu trong biểu mẫu rồi tính lại.";
    await nextTick();
    document.querySelector('.nf-dilution [aria-invalid="true"]')?.focus();
    return;
  }
  result.value = calculated;
  message.value = "";
  if (window.matchMedia("(max-width: 999px)").matches) {
    await nextTick();
    const title = document.getElementById("dilution-result-title");
    title?.focus({ preventScroll: true });
    title?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
}
function reset() {
  clearResult();
  Object.assign(inputs, emptyDilutionInputs());
  message.value = "";
  exampleLoaded.value = false;
}
function loadExample() {
  reset();
  Object.assign(inputs, {
    area: "10",
    rate: "250",
    sprayVolume: "200",
    tank: "600",
  });
  exampleLoaded.value = true;
}
async function copy() {
  const text = buildDilutionSummary(result.value);
  if (!text) return;
  const generation = ++copyGeneration;
  copyStatus.value = "";
  copyText.value = "";
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    if (generation === copyGeneration)
      copyStatus.value = "Đã sao chép kết quả.";
  } catch {
    if (generation === copyGeneration) {
      copyStatus.value =
        "Trình duyệt chưa cho phép sao chép. Bạn có thể sao chép nội dung bên dưới.";
      copyText.value = text;
    }
  }
}
</script>

<template>
  <div class="nf-dilution">
    <section class="dilution-banner">
      <div class="dilution-container">
        <nav class="dilution-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/">Trang chủ</RouterLink
          ><span aria-hidden="true">/</span><span>Tiện ích nhà nông</span>
        </nav>
        <div class="dilution-intro">
          <div>
            <span class="dilution-eyebrow">NFarmHouse · Tiện ích nhà nông</span>
            <h1>
              Máy tính pha thuốc<br class="dilution-desktop-break" />
              bảo vệ thực vật
            </h1>
            <p>
              Từ thông số trên nhãn đến lượng thuốc cho từng bình. Tính đủ cho
              diện tích cần phun, kể cả bình lẻ cuối cùng.
            </p>
          </div>
          <div class="dilution-banner-icon" aria-hidden="true">
            <Icon icon="solar:calculator-linear" /><span
              >Đúng số liệu<br />Dễ tính lượng</span
            >
          </div>
        </div>
      </div>
    </section>
    <main class="dilution-container dilution-main">
      <div class="dilution-label-note">
        <Icon icon="solar:info-circle-linear" aria-hidden="true" />
        <p>
          Dùng số liệu trên nhãn của sản phẩm bạn đang sử dụng. Công cụ quy đổi
          lượng pha cho một đợt phun; không tự chọn thuốc, liều dùng hoặc thời
          gian cách ly.
        </p>
      </div>
      <p v-if="exampleLoaded" class="dilution-example-notice" role="status">
        Đang dùng ví dụ minh họa 10 ha · 250 mL/ha · 200 L/ha · bình 600 L. Đây
        không phải liều khuyến cáo cho sản phẩm cụ thể.
      </p>
      <p v-if="result" role="status" class="dilution-sr-only">
        Đã tính xong. Xem lượng thuốc và cách chia bình trong phần Kết quả tính
        toán.
      </p>
      <div class="dilution-layout">
        <PesticideDilutionForm
          :model="inputs"
          :errors="errors"
          @update="update"
          @calculate="calculate"
          @reset="reset"
          @example="loadExample"
        />
        <PesticideDilutionResults
          :result="result"
          :message="message"
          :copy-status="copyStatus"
          :copy-text="copyText"
          @copy="copy"
        />
        <PesticideDilutionFormula :result="result" />
      </div>
      <div class="dilution-product-note">
        <Icon icon="solar:leaf-linear" aria-hidden="true" />
        <p>
          Cần hướng dẫn của một sản phẩm cụ thể? Mở trang sản phẩm và chọn
          <strong>Hướng dẫn & tính lượng sử dụng</strong> để xem thông tin theo
          biến thể và cây trồng.
        </p>
        <RouterLink :to="{ name: 'client-products' }"
          >Xem sản phẩm <span aria-hidden="true">→</span></RouterLink
        >
      </div>
    </main>
  </div>
</template>