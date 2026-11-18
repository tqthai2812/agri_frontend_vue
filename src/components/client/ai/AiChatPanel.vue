<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import { useCartStore } from "@/stores/client/cartStore";
import { useAiChat } from "@/composables/useAiChat";
import AiChatMessage from "./AiChatMessage.vue";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close", "reply"]);
const auth = useAuthStore(),
  cart = useCartStore(),
  router = useRouter(),
  route = useRoute();
const chat = useAiChat();
const { messages, loading, restoring, error, errorStatus, pending } = chat;
const input = ref(""),
  inputEl = ref(null),
  scroller = ref(null),
  cartForm = ref(null);
const cartChoice = ref(null),
  quantity = ref(1),
  cartBusy = ref(false),
  cartError = ref(""),
  notice = ref("");
let noticeTimer;
let choiceEpoch = 0;
let previousCartFocus;
const blocked = computed(
  () =>
    loading.value ||
    restoring.value ||
    !!pending.value ||
    errorStatus.value === "restore_failed",
);
const lastAssistant = computed(
  () => [...messages.value].reverse().find((m) => m.role === "assistant")?.id,
);

function scrollEnd() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  });
}
function focus() {
  nextTick(() => {
    if (matchMedia("(min-width: 640px)").matches)
      inputEl.value?.focus({ preventScroll: true });
  });
}
async function send() {
  const value = input.value.trim();
  if (!value || blocked.value) return;
  input.value = "";
  await chat.send(value);
  if (!error.value) emit("reply");
  focus();
}
async function choose(option) {
  if (blocked.value) return;
  await chat.send(option.name, option);
  if (!error.value) emit("reply");
}
function openCart(card) {
  previousCartFocus = document.activeElement;
  choiceEpoch++;
  cartChoice.value = card;
  quantity.value = 1;
  cartError.value = "";
  nextTick(() => document.getElementById("ai-cart-quantity")?.focus());
}
function closeCart() {
  if (cartBusy.value) return;
  choiceEpoch++;
  cartChoice.value = null;
  cartError.value = "";
  nextTick(() => previousCartFocus?.focus({ preventScroll: true }));
}
async function addCart() {
  if (cartBusy.value || !cartChoice.value) return;
  cartBusy.value = true;
  cartError.value = "";
  const version = choiceEpoch;
  try {
    await auth.ensureSession();
    if (version !== choiceEpoch) return;
    if (!auth.isLoggedIn) {
      await router.push({ name: "login", query: { redirect: route.fullPath } });
      return;
    }
    const count = Number(quantity.value);
    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > Math.min(1_000_000, cartChoice.value.available_to_sell)
    )
      throw new Error("Số lượng chưa phù hợp với lượng hàng đang có.");
    await cart.addToCart({
      package_id: cartChoice.value.package_id,
      quantity: count,
    });
    if (version !== choiceEpoch) return;
    cartChoice.value = null;
    notice.value = "Đã thêm vào giỏ hàng.";
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      notice.value = "";
    }, 3500);
  } catch (e) {
    if (version === choiceEpoch)
      cartError.value =
        e.response?.data?.message ||
        e.message ||
        "Chưa thêm được. Bạn thử lại nhé.";
  } finally {
    cartBusy.value = false;
  }
}
async function fresh() {
  closeCart();
  await chat.newConversation();
  input.value = "";
  focus();
}
function keydown(e) {
  if (!props.open) return;
  if (e.key === "Tab" && cartChoice.value) {
    const fields = cartForm.value?.querySelectorAll(
      "button:not(:disabled), input:not(:disabled)",
    );
    if (!fields?.length) {
      e.preventDefault();
      return;
    }
    const first = fields[0],
      last = fields[fields.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  if (e.key !== "Escape") return;
  if (cartChoice.value) closeCart();
  else emit("close");
}
watch(() => [messages.value.length, loading.value, error.value], scrollEnd);
watch(lastAssistant, (id, old) => {
  if (id && id !== old) emit("reply");
});
watch(
  () => props.open,
  async (open) => {
    if (open) {
      await chat.restore();
      scrollEnd();
      focus();
    }
  },
  { immediate: true },
);
watch(
  () => auth.user?.id,
  () => {
    choiceEpoch++;
    cartChoice.value = null;
    notice.value = "";
    input.value = "";
  },
);
onMounted(() => window.addEventListener("keydown", keydown));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keydown);
  clearTimeout(noticeTimer);
});
</script>

<template>
  <section
    v-show="open"
    id="nfarmhouse-ai-panel"
    class="ai-chat-panel"
    role="dialog"
    aria-labelledby="nfarmhouse-ai-title"
  >
    <header class="ai-panel-header">
      <span class="ai-header-avatar"
        ><Icon icon="solar:stars-bold-duotone" /><small>AI</small></span
      >
      <div class="ai-header-copy">
        <h2 id="nfarmhouse-ai-title">Trợ lý NFarmHouse</h2>
        <p>Hỗ trợ chọn vật tư &amp; hướng dẫn sử dụng</p>
      </div>
      <button
        type="button"
        title="Cuộc trò chuyện mới"
        aria-label="Cuộc trò chuyện mới"
        @click="fresh"
      >
        <Icon icon="solar:pen-new-square-linear" />
      </button>
      <button
        type="button"
        title="Đóng"
        aria-label="Đóng chat"
        @click="emit('close')"
      >
        <Icon icon="solar:close-circle-linear" />
      </button>
    </header>
    <div
      ref="scroller"
      class="ai-transcript"
      tabindex="0"
      aria-label="Nội dung trò chuyện"
    >
      <div v-if="!messages.length && !restoring" class="ai-welcome">
        <span><Icon icon="solar:leaf-bold-duotone" /></span>
        <h3>Chào bạn, mình có thể giúp gì?</h3>
        <p>
          Bạn có thể tìm sản phẩm, so sánh quy cách hoặc hỏi cách dùng theo
          hướng dẫn của cửa hàng.
        </p>
        <div class="ai-options">
          <button
            type="button"
            :disabled="blocked"
            @click="chat.send('Tư vấn phân bón giúp tôi')"
          >
            Tư vấn phân bón</button
          ><button
            type="button"
            :disabled="blocked"
            @click="chat.send('Tôi muốn tìm một sản phẩm theo tên hoặc SKU')"
          >
            Tìm sản phẩm
          </button>
        </div>
      </div>
      <p v-if="restoring" class="ai-loading-line" role="status">
        Đang khôi phục cuộc trò chuyện…
      </p>
      <AiChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :options-enabled="!blocked && message.id === lastAssistant"
        @choose="choose"
        @add="openCart"
      />
      <div v-if="loading" class="ai-thinking" role="status">
        <span></span><span></span><span></span
        ><small>Trợ lý đang tìm thông tin…</small>
      </div>
      <div v-if="error" class="ai-error" role="alert">
        <p>{{ error }}</p>
        <button
          v-if="pending && errorStatus !== 'session_expired'"
          type="button"
          :disabled="loading"
          @click="chat.retry"
        >
          Thử lại</button
        ><button type="button" @click="fresh">Cuộc trò chuyện mới</button>
      </div>
      <p v-if="notice" class="ai-notice" role="status">
        {{ notice }}
        <RouterLink :to="{ name: 'cart' }">Xem giỏ hàng</RouterLink>
      </p>
    </div>
    <form class="ai-composer" @submit.prevent="send">
      <label for="nfarmhouse-ai-input" class="ai-sr-only"
        >Tin nhắn cho trợ lý</label
      >
      <textarea
        id="nfarmhouse-ai-input"
        ref="inputEl"
        v-model="input"
        rows="1"
        maxlength="1500"
        placeholder="Nhập câu hỏi của bạn…"
        :disabled="blocked"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button
        type="submit"
        aria-label="Gửi tin nhắn"
        :disabled="blocked || !input.trim()"
      >
        <Icon icon="solar:plain-2-bold" />
      </button>
    </form>
    <p class="ai-panel-footnote">
      Giá, tồn kho được kiểm tra khi tư vấn và thêm giỏ. Luôn đối chiếu nhãn
      trước khi sử dụng.
    </p>
    <div v-if="cartChoice" class="ai-cart-overlay">
      <form
        ref="cartForm"
        class="ai-cart-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-cart-title"
        @submit.prevent="addCart"
      >
        <h3 id="ai-cart-title">Xác nhận thêm giỏ</h3>
        <strong>{{ cartChoice.name }}</strong>
        <p>
          {{ cartChoice.variant }} · {{ cartChoice.size }} {{ cartChoice.unit }}
        </p>
        <small>{{ cartChoice.sku }}</small>
        <label for="ai-cart-quantity">Số lượng quy cách</label
        ><input
          id="ai-cart-quantity"
          v-model="quantity"
          type="number"
          min="1"
          :max="Math.min(1000000, cartChoice.available_to_sell)"
          step="1"
          required
          :disabled="cartBusy"
        />
        <p>
          Hệ thống kiểm tra lại giá và tồn khi thêm vào giỏ. Thêm giỏ chưa giữ
          hàng và chưa tạo đơn.
        </p>
        <p v-if="cartError" class="ai-error-text" role="alert">
          {{ cartError }}
        </p>
        <div>
          <button type="button" :disabled="cartBusy" @click="closeCart">
            Để sau</button
          ><button type="submit" :disabled="cartBusy">
            {{
              cartBusy
                ? "Đang thêm…"
                : auth.isLoggedIn
                  ? "Xác nhận thêm"
                  : "Đăng nhập để thêm"
            }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>