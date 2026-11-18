import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useAuthStore } from "@/stores/shared/authStore";
import AiChatService from "@/services/client/aiChat.service";

const STORAGE_KEY = "nfarmhouse_ai_chat";

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  return [...bytes]
    .map(
      (n, i) =>
        ([4, 6, 8, 10].includes(i) ? "-" : "") +
        n.toString(16).padStart(2, "0"),
    )
    .join("");
}

export function useAiChat() {
  const auth = useAuthStore();
  const owner = computed(() =>
    auth.user?.id ? `user:${auth.user.id}` : "guest",
  );
  const chatId = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const restoring = ref(false);
  const error = ref("");
  const errorStatus = ref("");
  const pending = ref(null);
  let epoch = 0;
  let controller = null;
  let started = false;

  function persist() {
    try {
      if (chatId.value)
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ chat_id: chatId.value, owner: owner.value }),
        );
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Trình duyệt có thể chặn lưu trữ; chat vẫn dùng được trong trang hiện tại. */
    }
  }

  function reset() {
    epoch++;
    controller?.abort();
    controller = null;
    chatId.value = null;
    messages.value = [];
    loading.value = false;
    restoring.value = false;
    pending.value = null;
    error.value = "";
    errorStatus.value = "";
    persist();
  }

  async function restore() {
    if (started) return;
    started = true;
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      saved = null;
    }
    if (!saved?.chat_id || saved.owner !== owner.value) {
      persist();
      return;
    }
    const version = epoch;
    controller = new AbortController();
    restoring.value = true;
    try {
      const data = await AiChatService.read(saved.chat_id, controller.signal);
      if (version !== epoch) return;
      chatId.value = data.chat_id;
      messages.value = Array.isArray(data.messages) ? data.messages : [];
    } catch (e) {
      if (version !== epoch || e.code === "ERR_CANCELED") return;
      if (e.response?.status === 410) {
        chatId.value = null;
        errorStatus.value = "session_expired";
        error.value = e.response.data.message;
        persist();
      } else {
        error.value =
          "Chưa khôi phục được cuộc trò chuyện. Bạn có thể thử tải lại hoặc bắt đầu cuộc mới.";
        errorStatus.value = "restore_failed";
      }
    } finally {
      if (version === epoch) restoring.value = false;
    }
  }

  async function deliver() {
    if (loading.value || !pending.value) return;
    const payload = { ...pending.value, chat_id: chatId.value };
    const version = epoch;
    controller = new AbortController();
    loading.value = true;
    error.value = "";
    errorStatus.value = "";
    try {
      const data = await AiChatService.send(payload, controller.signal);
      if (
        version !== epoch ||
        pending.value?.client_message_id !== data.client_message_id
      )
        return;
      chatId.value = data.chat_id;
      const row = messages.value.find((m) => m.id === data.client_message_id);
      if (row) row.pending = false;
      if (!messages.value.some((m) => m.id === data.message.id))
        messages.value.push(data.message);
      pending.value = null;
      persist();
    } catch (e) {
      if (version !== epoch || e.code === "ERR_CANCELED") return;
      const data = e.response?.data;
      if (
        data?.chat_id &&
        (!data.client_message_id ||
          data.client_message_id === pending.value?.client_message_id)
      ) {
        chatId.value = data.chat_id;
        persist();
      }
      errorStatus.value =
        data?.status ||
        (e.response?.status === 419 ? "csrf_expired" : "network_error");
      error.value =
        data?.message ||
        "Chưa nhận được câu trả lời. Nhấn Thử lại để gửi tiếp cùng tin nhắn.";
    } finally {
      if (version === epoch) loading.value = false;
    }
  }

  async function send(text, option = null) {
    const value = String(text || "").trim();
    if (
      !value ||
      value.length > 1500 ||
      loading.value ||
      restoring.value ||
      pending.value ||
      errorStatus.value === "restore_failed"
    )
      return;
    const id = uuid();
    pending.value = {
      client_message_id: id,
      message: value,
      selected_option: option ? { token: option.token } : null,
    };
    messages.value.push({ id, role: "user", text: value, pending: true });
    await deliver();
  }

  async function newConversation() {
    const old = chatId.value;
    reset();
    // Không chặn cuộc mới khi lượt cũ còn xử lý. Phản hồi cũ bị bỏ bởi epoch; phiên cũ tự hết TTL.
    if (old) AiChatService.remove(old).catch(() => {});
  }

  watch(owner, () => {
    reset();
    started = true;
  });
  onBeforeUnmount(() => {
    epoch++;
    controller?.abort();
  });

  return {
    chatId,
    messages,
    loading,
    restoring,
    error,
    errorStatus,
    pending,
    restore,
    send,
    retry: deliver,
    newConversation,
  };
}