<script setup>
import { Icon } from "@iconify/vue";
import {
  formatQuantity as f,
  formatProduct,
  formatInteger,
} from "@/utils/pesticideDilutionCalculator";

defineProps({
  result: { type: Object, default: null },
  message: { type: String, default: "" },
  copyStatus: { type: String, default: "" },
  copyText: { type: String, default: "" },
});
defineEmits(["copy"]);
const p = (result, value) => formatProduct(value, result.unit);
</script>

<template>
  <section
    class="dilution-card dilution-results"
    aria-labelledby="dilution-result-title"
  >
    <div class="dilution-card-heading">
      <div>
        <span class="dilution-eyebrow">Kế hoạch cho một đợt phun</span>
        <h2 id="dilution-result-title" tabindex="-1">Kết quả tính toán</h2>
      </div>
      <span class="dilution-result-icon"
        ><Icon icon="solar:document-text-linear" aria-hidden="true"
      /></span>
    </div>
    <div v-if="!result" class="dilution-empty" role="status">
      <span class="dilution-empty-icon"
        ><Icon icon="solar:calculator-linear" aria-hidden="true"
      /></span>
      <h3>
        {{
          message
            ? "Tính lại với thông số mới"
            : "Sẵn sàng cho lần pha tiếp theo"
        }}
      </h3>
      <p>
        {{
          message ||
          "Nhập số liệu trên nhãn và nhấn Tính toán để xem lượng thuốc, lượng dung dịch và số bình cần pha."
        }}
      </p>
      <span class="dilution-empty-tag">Bình đầy · Bình lẻ · Tổng lượng</span>
    </div>
    <template v-else>
      <div class="dilution-hero-result">
        <span>Thuốc cho một bình đầy</span>
        <div>
          <strong data-full-tank-product>{{ f(result.fullTankProduct) }}</strong
          ><b>{{ result.unit }}</b>
        </div>
        <small>Trong {{ f(result.input.tank) }} L dung dịch sau pha</small>
      </div>
      <p v-if="result.fullTanks === 0n" class="dilution-notice">
        Diện tích đã nhập chỉ cần một bình lẻ. Pha theo lượng ở phần bình lẻ bên
        dưới.
      </p>
      <dl class="dilution-summary">
        <div>
          <dt>Tổng thuốc cần dùng</dt>
          <dd data-total-product>{{ p(result, result.totalProduct) }}</dd>
        </div>
        <div>
          <dt>Tổng dung dịch phun</dt>
          <dd data-total-spray>{{ f(result.totalSpray) }} L</dd>
        </div>
        <div>
          <dt>Thuốc trong 1 L dung dịch</dt>
          <dd>{{ f(result.perLiter) }} {{ result.unit }}/L</dd>
        </div>
        <template v-if="result.isLiquid">
          <div>
            <dt>Thuốc : dung dịch sau pha</dt>
            <dd data-dilution-ratio>1 : {{ f(result.dilution) }}</dd>
          </div>
          <div>
            <dt>Nồng độ thành phẩm</dt>
            <dd data-concentration>{{ f(result.concentration) }}% v/v</dd>
          </div>
          <div>
            <dt>Nước ước tính/bình đầy</dt>
            <dd data-full-tank-water>{{ f(result.fullTankWater) }} L</dd>
          </div>
        </template>
        <div>
          <dt>Số bình quy đổi</dt>
          <dd>{{ f(result.tankEquivalents) }} bình</dd>
        </div>
      </dl>
      <div class="dilution-plan" data-tank-plan>
        <div class="dilution-plan-heading">
          <h3>Chia lượng pha thực tế</h3>
          <span>{{ formatInteger(result.tankCount) }} lần pha</span>
        </div>
        <div v-if="result.fullTanks > 0n" class="dilution-plan-row">
          <span class="dilution-plan-number">01</span>
          <div>
            <h4>
              {{ formatInteger(result.fullTanks) }} bình đầy ×
              {{ f(result.input.tank) }} L
            </h4>
            <p>
              Mỗi bình: <strong>{{ p(result, result.fullTankProduct) }}</strong>
            </p>
          </div>
        </div>
        <div
          v-if="result.hasPartial"
          class="dilution-plan-row dilution-partial"
          data-partial-tank
        >
          <span class="dilution-plan-number">{{
            result.fullTanks > 0n ? "02" : "01"
          }}</span>
          <div>
            <h4>1 bình lẻ cuối: {{ f(result.partialSpray) }} L</h4>
            <p>
              Thuốc:
              <strong data-partial-product>{{
                p(result, result.partialProduct)
              }}</strong>
            </p>
            <p v-if="result.isLiquid">
              Nước ước tính: {{ f(result.partialWater) }} L
            </p>
          </div>
        </div>
        <p v-else class="dilution-no-partial">
          Vừa đủ các bình đầy, không cần bình lẻ.
        </p>
      </div>
      <p class="dilution-water-note">
        {{
          result.isLiquid
            ? "Lượng nước là ước tính sau khi trừ thể tích thuốc lỏng. Châm nước đến vạch dung dịch cần pha và làm theo nhãn."
            : "Thuốc bột/hạt: châm nước đến đủ thể tích dung dịch cần pha. Không quy đổi gam sang mililít hoặc trừ gam khỏi lít nước."
        }}
      </p>
      <p class="dilution-rounding">
        Số thập phân hiển thị tối đa 6 chữ số. Không tự tăng liều để làm tròn.
      </p>
      <button
        type="button"
        class="dilution-button dilution-button-secondary dilution-copy"
        @click="$emit('copy')"
      >
        <Icon icon="solar:copy-linear" aria-hidden="true" />Sao chép kết quả
      </button>
      <p v-if="copyStatus" role="status" class="dilution-copy-status">
        {{ copyStatus }}
      </p>
      <label v-if="copyText" class="dilution-manual-copy"
        >Chọn và sao chép thủ công<textarea
          readonly
          :value="copyText"
          rows="8"
          @focus="$event.target.select()"
        />
      </label>
    </template>
  </section>
</template>