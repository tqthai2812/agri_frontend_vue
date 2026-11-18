<script setup>
import AiProductCard from "./AiProductCard.vue";
defineProps({
  message: { type: Object, required: true },
  optionsEnabled: Boolean,
});
defineEmits(["choose", "add"]);
const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2,
  }).format(Number(n));
const dose = (n) =>
  String(n)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "")
    .replace(".", ",");
const sourceLink = (s) => (/^https?:\/\//i.test(String(s || "")) ? s : null);
</script>

<template>
  <article
    :class="[
      'ai-message',
      message.role === 'user' ? 'ai-from-user' : 'ai-from-bot',
    ]"
  >
    <span
      v-if="message.role !== 'user'"
      class="ai-message-avatar"
      aria-hidden="true"
      >AI</span
    >
    <div class="ai-message-content">
      <div class="ai-bubble">{{ message.text }}</div>
      <small v-if="message.pending" class="ai-message-pending"
        >Đang chờ trả lời</small
      >
      <div v-if="message.cards?.length" class="ai-card-list">
        <AiProductCard
          v-for="card in message.cards"
          :key="card.package_id"
          :card="card"
          @add="$emit('add', $event)"
        />
      </div>
      <div v-if="message.comparison?.length" class="ai-block">
        <strong>So sánh các quy cách</strong>
        <div class="ai-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Quy cách</th>
                <th>Giá / Có thể bán</th>
                <th>Thông tin có nguồn</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in message.comparison" :key="item.package_id">
                <td>
                  <b>{{ item.name }}</b
                  ><br />{{ item.variant }}<br />{{ item.size }} {{ item.unit }}
                </td>
                <td>
                  {{ money(item.price) }}<br />{{ item.available_to_sell }}
                </td>
                <td>
                  {{ item.description || "Chưa có mô tả." }}<br /><small>{{
                    item.composition
                  }}</small>
                  <p v-for="g in item.guides" :key="g.id">
                    {{ g.crop }} · {{ g.purpose }} · {{ g.application_method
                    }}<br />Nguồn: {{ g.label_source }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <section
        v-for="(calc, index) in message.calculations || []"
        :key="index"
        class="ai-block ai-calculation"
      >
        <strong>{{
          calc.target === "one_tank"
            ? "Lượng pha cho một bình"
            : "Lượng dùng và lượng cần mua"
        }}</strong>
        <dl>
          <div>
            <dt>Lượng dùng theo nhãn</dt>
            <dd v-if="!calc.precision_limited">
              {{ dose(calc.amount_min)
              }}<template v-if="calc.amount_min !== calc.amount_max">
                – {{ dose(calc.amount_max) }}</template
              >
              {{ calc.dose_unit }}
            </dd>
            <dd v-else>
              Lượng quá nhỏ để hiển thị chính xác; hãy kiểm tra lại đơn vị.
            </dd>
          </div>
          <div>
            <dt>Số quy cách cần mua</dt>
            <dd>
              {{ calc.packages_min
              }}<template v-if="calc.packages_min !== calc.packages_max">
                – {{ calc.packages_max }}</template
              >
            </dd>
          </div>
          <div>
            <dt>Tiền hàng dự kiến</dt>
            <dd>
              {{ money(calc.goods_total_min)
              }}<template v-if="calc.goods_total_min !== calc.goods_total_max">
                – {{ money(calc.goods_total_max) }}</template
              >
            </dd>
          </div>
          <div>
            <dt>Thời gian cách ly</dt>
            <dd>
              {{
                calc.pre_harvest_days === null
                  ? "Chưa có dữ liệu"
                  : `${calc.pre_harvest_days} ngày`
              }}
            </dd>
          </div>
        </dl>
        <p>{{ calc.note }}</p>
        <p v-if="calc.status === 'stock_insufficient'" class="ai-error-text">
          Tồn hiện tại chưa đủ số lượng tối thiểu cần mua.
        </p>
      </section>
      <details
        v-for="guide in message.guides || []"
        :key="guide.id"
        class="ai-guide"
      >
        <summary>Hướng dẫn: {{ guide.crop }} · {{ guide.purpose }}</summary>
        <div>
          <p><b>Cách dùng:</b> {{ guide.application_method }}</p>
          <p class="ai-preserve-lines">{{ guide.instructions }}</p>
          <p v-if="guide.safety_warning">
            <b>Lưu ý:</b> {{ guide.safety_warning }}
          </p>
          <p>
            <b>Cách ly:</b>
            {{
              guide.pre_harvest_days === null
                ? "Chưa có dữ liệu"
                : `${guide.pre_harvest_days} ngày`
            }}
          </p>
          <p>
            <b>Nguồn:</b>
            <a
              v-if="sourceLink(guide.label_source)"
              :href="sourceLink(guide.label_source)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ guide.label_source }}</a
            ><span v-else>{{ guide.label_source }}</span>
          </p>
        </div>
      </details>
      <div v-if="message.options?.length" class="ai-options">
        <button
          v-for="option in message.options"
          :key="option.token"
          type="button"
          :disabled="!optionsEnabled"
          @click="$emit('choose', option)"
        >
          {{ option.name }}
        </button>
      </div>
    </div>
  </article>
</template>