<script setup>
import { formatQuantity as f } from "@/utils/pesticideDilutionCalculator";
defineProps({ result: { type: Object, default: null } });
</script>

<template>
  <section
    class="dilution-card dilution-formulas"
    aria-labelledby="dilution-formula-title"
  >
    <div class="dilution-card-heading">
      <div>
        <span class="dilution-eyebrow">Hiểu cách tính</span>
        <h2 id="dilution-formula-title">Từ liều trên nhãn đến từng bình</h2>
      </div>
    </div>
    <div class="dilution-main-equation">
      <span>Thuốc cho một bình</span
      ><strong
        >V ×
        <span class="dilution-fraction"
          ><span>R</span><span>S</span></span
        ></strong
      >
    </div>
    <div class="dilution-symbols">
      <span><b>A</b> Diện tích cần phun</span
      ><span><b>R</b> Liều thuốc/đơn vị diện tích</span
      ><span><b>V</b> Dung tích bình (L)</span
      ><span><b>S</b> Dung dịch phun (L/đơn vị diện tích)</span>
    </div>
    <details class="dilution-steps">
      <summary>Xem công thức và các bước tính</summary>
      <ol>
        <li>
          <h3>Thuốc và dung dịch cho cả diện tích</h3>
          <p>Tổng thuốc = A × R. Tổng dung dịch = A × S.</p>
          <p v-if="result" class="dilution-step-value">
            {{ f(result.input.area) }} {{ result.areaLabel }} ×
            {{ f(result.rateBase) }} {{ result.unit }}/{{ result.areaLabel }} =
            {{ f(result.totalProduct) }} {{ result.unit }}. Tổng dung dịch:
            {{ f(result.totalSpray) }} L.
          </p>
        </li>
        <li>
          <h3>Chia thành bình đầy và bình lẻ</h3>
          <p>
            Số bình quy đổi = (A × S) ÷ V. Lấy phần nguyên làm số bình đầy;
            lượng dung dịch còn lại là bình lẻ. Thuốc bình lẻ = dung dịch bình
            lẻ × R ÷ S.
          </p>
          <p v-if="result" class="dilution-step-value">
            {{ f(result.totalSpray) }} ÷ {{ f(result.input.tank) }} =
            {{ f(result.tankEquivalents) }} bình quy đổi.
            {{
              result.hasPartial
                ? "Bình lẻ dùng " +
                  f(result.partialProduct) +
                  " " +
                  result.unit +
                  "."
                : "Không có bình lẻ."
            }}
          </p>
        </li>
        <li>
          <h3>Tỷ lệ và nồng độ</h3>
          <p>
            Với thuốc lỏng, quy R về mL: tỷ lệ thuốc : dung dịch = 1 : (1.000 ×
            S ÷ R). Nồng độ thành phẩm (% v/v) = R ÷ (1.000 × S) × 100.
          </p>
          <p v-if="result?.isLiquid" class="dilution-step-value">
            1 : {{ f(result.dilution) }}, tương ứng
            {{ f(result.concentration) }}% v/v.
          </p>
          <p>
            Với thuốc bột/hạt, dùng g/L = R (g) ÷ S (L); không diễn giải thành %
            v/v.
          </p>
        </li>
      </ol>
    </details>
    <div class="dilution-faq">
      <details>
        <summary>Có dùng sào, công hoặc acre được không?</summary>
        <p>
          Được, nếu diện tích, liều thuốc và lượng dung dịch đều theo cùng đơn
          vị. Công cụ không tự đổi sào/công vì cách tính diện tích có thể khác
          theo địa phương. Nếu nhãn ghi theo ha, hãy đổi số liệu về ha trước
          hoặc đổi cả hai định mức sang đơn vị bạn chọn.
        </p>
      </details>
      <details>
        <summary>Lượng dung dịch có phải lượng nước đổ vào không?</summary>
        <p>
          Đây là tổng thể tích sau pha, đã bao gồm thuốc. Với thuốc lỏng, nước
          ước tính bằng dung dịch trừ thể tích thuốc. Với thuốc bột/hạt, không
          suy ra thể tích từ khối lượng; châm đến vạch thể tích cần pha.
        </p>
      </details>
      <details>
        <summary>Nhãn ghi khoảng liều hoặc tỷ lệ pha thì sao?</summary>
        <p>
          Công cụ này nhận một liều thành phẩm theo diện tích và lượng dung dịch
          tương ứng. Không tự chọn đầu thấp/cao của khoảng hoặc đổi % hoạt chất
          thành liều dùng. Nhập số liệu đã xác định đúng từ nhãn; hướng dẫn theo
          sản phẩm có ở trang chi tiết sản phẩm.
        </p>
      </details>
    </div>
    <p class="dilution-source">
      Tham khảo phương pháp:
      <a
        href="https://pubs.nmsu.edu/_a/A614/"
        target="_blank"
        rel="noopener noreferrer"
        >NMSU Extension</a
      >
      ·
      <a
        href="https://calculatorlib.com/vi/pesticide-dilution-calculator"
        target="_blank"
        rel="noopener noreferrer"
        >CalculatorLib</a
      >
    </p>
  </section>
</template>