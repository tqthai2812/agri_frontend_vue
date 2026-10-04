import { computed, onBeforeUnmount, ref, watch } from "vue";
import ReviewService from "@/services/admin/productReview.service";

// State riêng cho cửa sổ trên trang sản phẩm, không dùng chung store của trang admin.
export function useProductReviewModeration({
  productId,
  enabled,
  scopeKey,
  initialReviewId,
  canReply,
  canModerate,
  onSaved,
}) {
  const reviews = ref([]);
  const selected = ref(null);
  const selectedId = ref(null);
  const statusFilter = ref("");
  const meta = ref({ current_page: 1, last_page: 1, total: 0 });
  const loading = ref(false);
  const loadingDetail = ref(false);
  const saving = ref(false);
  const listError = ref("");
  const detailError = ref("");
  const actionError = ref("");
  const message = ref("");
  const denied = ref(false);
  const needsReload = ref(false);
  const draft = ref("");
  const originalReply = ref(null);
  let scope = 0;
  let listVersion = 0;
  let detailVersion = 0;
  let disposed = false;

  const dirty = computed(
    () => draft.value !== (originalReply.value?.content || ""),
  );
  const locked = computed(
    () =>
      saving.value ||
      loadingDetail.value ||
      needsReload.value ||
      denied.value ||
      !enabled.value,
  );
  const canSaveReply = computed(
    () =>
      !locked.value &&
      canReply.value &&
      Boolean(selected.value) &&
      Boolean(
        originalReply.value ||
        (!selected.value.has_shop_reply &&
          selected.value.status === "published"),
      ),
  );

  const alive = (ticket) => !disposed && enabled.value && ticket === scope;
  function errorText(error, fallback) {
    const first = Object.values(error.response?.data?.errors || {})[0];
    return (
      (Array.isArray(first) ? first[0] : first) ||
      error.response?.data?.message ||
      fallback
    );
  }
  function rejectAccess(error) {
    if (![401, 403].includes(error.response?.status)) return false;
    denied.value = true;
    reviews.value = [];
    selected.value = null;
    draft.value = "";
    originalReply.value = null;
    listVersion++;
    detailVersion++;
    loading.value = false;
    loadingDetail.value = false;
    actionError.value =
      "Phiên đăng nhập hoặc quyền quản lý đã thay đổi. Đóng cửa sổ và đăng nhập lại để kiểm tra.";
    return true;
  }
  function resetDraft(review) {
    originalReply.value = review?.shop_reply ? { ...review.shop_reply } : null;
    draft.value = originalReply.value?.content || "";
  }
  function belongsHere(review) {
    return review && String(review.product?.id) === String(productId.value);
  }

  async function fetchReviews(page = 1, correctPage = true) {
    if (!enabled.value || denied.value) return false;
    const ticket = scope;
    const request = ++listVersion;
    loading.value = true;
    listError.value = "";
    try {
      const response = await ReviewService.getReviews({
        product_id: productId.value,
        status: statusFilter.value || undefined,
        page,
        per_page: 8,
      });
      if (!alive(ticket) || request !== listVersion || denied.value)
        return false;
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      if (rows.some((review) => !belongsHere(review)))
        throw new Error("Unexpected product");
      const data = response.data?.meta || {};
      const last = Math.max(1, Number(data.last_page || 1));
      if (correctPage && page > last) return await fetchReviews(last, false);
      reviews.value = rows;
      meta.value = {
        current_page: Number(data.current_page || page),
        last_page: last,
        total: Number(data.total || 0),
      };
      return true;
    } catch (error) {
      if (!alive(ticket) || request !== listVersion) return false;
      if (!rejectAccess(error)) {
        reviews.value = [];
        listError.value = errorText(
          error,
          "Không tải được danh sách quản lý. Vui lòng thử lại.",
        );
      }
      return false;
    } finally {
      if (alive(ticket) && request === listVersion) loading.value = false;
    }
  }

  async function selectReview(id = selectedId.value) {
    if (!enabled.value || denied.value || saving.value || !id) return false;
    const ticket = scope;
    const request = ++detailVersion;
    selectedId.value = id;
    selected.value = null;
    resetDraft(null);
    loadingDetail.value = true;
    needsReload.value = false;
    detailError.value = "";
    actionError.value = "";
    try {
      const response = await ReviewService.getReview(id);
      if (!alive(ticket) || request !== detailVersion || denied.value)
        return false;
      const review = response.data?.data;
      if (!belongsHere(review) || String(review.id) !== String(id))
        throw new Error("Unexpected review");
      selected.value = review;
      resetDraft(review);
      return true;
    } catch (error) {
      if (!alive(ticket) || request !== detailVersion) return false;
      if (!rejectAccess(error))
        detailError.value = errorText(
          error,
          "Không tải được chi tiết đánh giá.",
        );
      return false;
    } finally {
      if (alive(ticket) && request === detailVersion)
        loadingDetail.value = false;
    }
  }

  async function mutate(send, type, fallback) {
    if (locked.value || !selected.value) return false;
    const ticket = scope;
    const id = selected.value.id;
    saving.value = true;
    actionError.value = "";
    message.value = "";
    let response;
    try {
      response = await send(id);
    } catch (error) {
      if (alive(ticket) && !rejectAccess(error)) {
        actionError.value = errorText(
          error,
          "Không lưu được thay đổi. Nội dung bạn nhập vẫn được giữ lại.",
        );
        needsReload.value = error.response?.status === 409;
      }
      if (alive(ticket)) saving.value = false;
      return false;
    }

    if (!alive(ticket)) return true;
    if (denied.value) {
      saving.value = false;
      return true;
    }
    // Từ đây API đã xác nhận ghi thành công: lỗi tải lại không được báo thành lỗi ghi.
    const updated = response.data?.data;
    message.value = response.data?.message || fallback;
    if (belongsHere(updated) && String(updated.id) === String(id)) {
      selected.value = updated;
      if (type === "reply") resetDraft(updated);
      else if (
        type === "reply-status" &&
        originalReply.value &&
        originalReply.value.id === updated.shop_reply?.id &&
        originalReply.value.content === updated.shop_reply?.content
      ) {
        originalReply.value = {
          ...originalReply.value,
          status: updated.shop_reply.status,
        };
      }
      // Thao tác ẩn/hiện không ghi đè bản nháp hay baseline nội dung đang soạn.
      if (
        type !== "reply" &&
        (String(originalReply.value?.id || "") !==
          String(updated.shop_reply?.id || "") ||
          (originalReply.value?.content || "") !==
            (updated.shop_reply?.content || ""))
      ) {
        needsReload.value = true;
        actionError.value =
          "Trạng thái đã được lưu. Phản hồi cũng vừa được người khác cập nhật; tải lại chi tiết trước khi sửa tiếp.";
      }
    } else {
      needsReload.value = true;
      actionError.value =
        "Đã lưu nhưng chưa nhận được chi tiết mới. Hãy tải lại chi tiết trước khi thao tác tiếp.";
    }
    onSaved({
      product_id: productId.value,
      review_id: id,
      message: message.value,
    });
    try {
      const refreshed = await fetchReviews(meta.value.current_page);
      if (alive(ticket) && !refreshed && !denied.value) {
        listError.value =
          "Đã lưu thành công nhưng chưa tải lại được danh sách. Bấm Thử lại.";
      }
    } finally {
      if (alive(ticket)) saving.value = false;
    }
    return true;
  }

  function setReviewStatus(status) {
    if (
      !canModerate.value ||
      !["published", "hidden"].includes(status) ||
      locked.value ||
      !selected.value
    )
      return false;
    const expected = selected.value.status;
    return mutate(
      (id) => ReviewService.moderate(id, { status, expected_status: expected }),
      "status",
      "Đã cập nhật trạng thái đánh giá.",
    );
  }
  function setReplyStatus(status) {
    if (
      !canReply.value ||
      !["published", "hidden"].includes(status) ||
      locked.value ||
      !selected.value?.shop_reply
    )
      return false;
    const expected = selected.value.shop_reply.status;
    return mutate(
      (id) =>
        ReviewService.moderateReply(id, { status, expected_status: expected }),
      "reply-status",
      "Đã cập nhật trạng thái phản hồi.",
    );
  }
  function saveReply() {
    if (!canSaveReply.value) return false;
    const content = draft.value.trim();
    if (!content || Array.from(content).length > 1000) {
      actionError.value = "Nhập phản hồi từ 1 đến 1000 ký tự.";
      return false;
    }
    const baseline = originalReply.value ? { ...originalReply.value } : null;
    return mutate(
      (id) =>
        baseline
          ? ReviewService.editReply(id, {
              content,
              expected_content: baseline.content,
              expected_status: baseline.status,
            })
          : ReviewService.createReply(id, { content }),
      "reply",
      "Đã lưu phản hồi của cửa hàng.",
    );
  }

  function reset() {
    scope++;
    listVersion++;
    detailVersion++;
    reviews.value = [];
    selected.value = null;
    selectedId.value = null;
    resetDraft(null);
    loading.value = false;
    loadingDetail.value = false;
    saving.value = false;
    denied.value = false;
    needsReload.value = false;
    listError.value =
      detailError.value =
      actionError.value =
      message.value =
        "";
    statusFilter.value = "";
    meta.value = { current_page: 1, last_page: 1, total: 0 };
  }
  watch(
    [enabled, scopeKey],
    () => {
      reset();
      if (enabled.value) {
        fetchReviews(1);
        if (initialReviewId.value) selectReview(initialReviewId.value);
      }
    },
    { immediate: true, flush: "sync" },
  );
  onBeforeUnmount(() => {
    disposed = true;
    reset();
  });

  return {
    reviews,
    selected,
    selectedId,
    statusFilter,
    meta,
    loading,
    loadingDetail,
    saving,
    listError,
    detailError,
    actionError,
    message,
    denied,
    needsReload,
    draft,
    originalReply,
    dirty,
    locked,
    canSaveReply,
    fetchReviews,
    selectReview,
    setReviewStatus,
    setReplyStatus,
    saveReply,
  };
}
