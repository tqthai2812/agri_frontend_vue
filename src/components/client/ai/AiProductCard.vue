<script setup>
import { Icon } from "@iconify/vue";
defineProps({ card: { type: Object, required: true } });
defineEmits(["add"]);
const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2,
  }).format(Number(n));
</script>

<template>
  <article class="ai-product">
    <RouterLink
      :to="{ name: 'client-product-detail', params: { id: card.product_id } }"
      class="ai-product-main"
    >
      <img
        v-if="card.image"
        :src="card.image"
        :alt="card.name"
        loading="lazy"
        @error="$event.target.style.display = 'none'"
      />
      <span v-else class="ai-product-placeholder"
        ><Icon icon="solar:leaf-bold-duotone"
      /></span>
      <span class="ai-product-copy"
        ><strong>{{ card.name }}</strong
        ><span>{{ card.variant }} · {{ card.size }} {{ card.unit }}</span
        ><small>{{ card.sku }}</small
        ><b>{{ money(card.price) }}</b></span
      >
    </RouterLink>
    <p class="ai-product-reason">{{ card.reason }}</p>
    <details
      v-if="card.description || card.usage_instructions || card.safety_warning"
      class="ai-product-details"
    >
      <summary>Thông tin sản phẩm</summary>
      <p v-if="card.description">{{ card.description }}</p>
      <p v-if="card.usage_instructions">
        <b>Nội dung sử dụng chung:</b> {{ card.usage_instructions }}
      </p>
      <p v-if="card.safety_warning"><b>Lưu ý:</b> {{ card.safety_warning }}</p>
      <small
        >Định mức theo cây và điều kiện cụ thể nằm trong hướng dẫn bên dưới, khi
        có dữ liệu phù hợp.</small
      >
    </details>
    <div class="ai-product-actions">
      <span :class="card.available_to_sell > 0 ? 'ai-stock' : 'ai-stock-out'">{{
        card.available_to_sell > 0
          ? `Có thể bán: ${card.available_to_sell}`
          : "Tạm hết hàng"
      }}</span>
      <button
        type="button"
        :disabled="!(card.available_to_sell > 0)"
        @click="$emit('add', card)"
      >
        <Icon icon="solar:cart-plus-linear" /> Thêm giỏ
      </button>
    </div>
  </article>
</template>