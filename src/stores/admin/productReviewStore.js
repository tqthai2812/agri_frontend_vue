import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import ReviewService from "@/services/admin/productReview.service";

export const useAdminProductReviewStore = defineStore(
  "adminProductReview",
  () => {
    const reviews = ref([]);
    const selectedReview = ref(null);
    const detailId = ref(null);
    const showDetail = ref(false);
    const loading = ref(false);
    const loadingDetail = ref(false);
    const saving = ref(false);
    const message = ref("");
    const listError = ref("");
    const detailError = ref("");
    const actionError = ref("");
    const errors = ref({});
    const needsReload = ref(false);
    const products = ref([]);
    const loadingProducts = ref(false);
    const productError = ref("");
    const filters = reactive({
      search: "",
      product_id: "",
      rating: "",
      status: "",
      reply_status: "",
      page: 1,
      per_page: 15,
    });
    const meta = reactive({
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 15,
    });
    const summary = reactive({
      total: 0,
      published: 0,
      hidden: 0,
      pending: 0,
      unanswered: 0,
    });
    let listVersion = 0;
    let detailVersion = 0;
    let productVersion = 0;
    let lifecycle = 0;

    function errorText(error, fallback) {
      const first = Object.values(error.response?.data?.errors || {})[0];
      return (
        (Array.isArray(first) ? first[0] : first) ||
        error.response?.data?.message ||
        fallback
      );
    }

    async function fetchReviews({
      keepMessage = false,
      correctPage = true,
    } = {}) {
      const version = ++listVersion;
      loading.value = true;
      listError.value = "";
      if (!keepMessage) message.value = "";
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
      );
      try {
        const response = await ReviewService.getReviews(params);
        if (version !== listVersion) return false;
        const data = response.data;
        reviews.value = Array.isArray(data?.data) ? data.data : [];
        const pageMeta = data?.meta || {};
        meta.current_page = Number(pageMeta.current_page ?? 1);
        meta.last_page = Math.max(1, Number(pageMeta.last_page ?? 1));
        meta.total = Number(pageMeta.total ?? 0);
        meta.per_page = Number(pageMeta.per_page ?? 15);
        for (const key of Object.keys(summary))
          summary[key] = Number(data?.summary?.[key] ?? 0);
        if (correctPage && meta.current_page > meta.last_page) {
          filters.page = meta.last_page;
          return await fetchReviews({ keepMessage: true, correctPage: false });
        }
        return true;
      } catch (error) {
        if (version !== listVersion) return false;
        listError.value = errorText(
          error,
          "Không tải được danh sách đánh giá.",
        );
        return false;
      } finally {
        if (version === listVersion) loading.value = false;
      }
    }

    async function fetchProducts(search = "") {
      const version = ++productVersion;
      loadingProducts.value = true;
      productError.value = "";
      try {
        const response = await ReviewService.getProducts(search);
        if (version === productVersion)
          products.value = response.data?.data || [];
      } catch (error) {
        if (version === productVersion)
          productError.value = errorText(
            error,
            "Không tải được bộ lọc sản phẩm.",
          );
      } finally {
        if (version === productVersion) loadingProducts.value = false;
      }
    }

    function clearAction() {
      actionError.value = "";
      errors.value = {};
      needsReload.value = false;
    }

    async function fetchDetail() {
      if (!detailId.value || saving.value) return false;
      const id = detailId.value;
      const version = ++detailVersion;
      loadingDetail.value = true;
      detailError.value = "";
      clearAction();
      selectedReview.value = null;
      try {
        const response = await ReviewService.getReview(id);
        if (version !== detailVersion || !showDetail.value) return false;
        selectedReview.value = response.data?.data || null;
        return true;
      } catch (error) {
        if (version === detailVersion)
          detailError.value = errorText(
            error,
            "Không tải được chi tiết đánh giá.",
          );
        return false;
      } finally {
        if (version === detailVersion) loadingDetail.value = false;
      }
    }

    async function openDetail(review) {
      if (saving.value) return false;
      message.value = "";
      detailId.value = review.id;
      selectedReview.value = null;
      showDetail.value = true;
      return fetchDetail();
    }

    function closeDetail() {
      if (saving.value) return false;
      detailVersion++;
      showDetail.value = false;
      loadingDetail.value = false;
      detailId.value = null;
      selectedReview.value = null;
      detailError.value = "";
      clearAction();
      return true;
    }

    async function mutate(send, fallback) {
      if (
        saving.value ||
        loadingDetail.value ||
        needsReload.value ||
        !selectedReview.value
      )
        return false;
      const id = selectedReview.value.id;
      const scope = lifecycle;
      saving.value = true;
      clearAction();
      message.value = "";
      let response;
      // Chỉ lỗi ghi dữ liệu được coi là lưu thất bại.
      try {
        response = await send(id);
      } catch (error) {
        if (scope === lifecycle) {
          errors.value = error.response?.data?.errors || {};
          actionError.value = errorText(
            error,
            "Chưa xác nhận được kết quả lưu. Giữ nội dung và tải lại để kiểm tra.",
          );
          needsReload.value = error.response?.status === 409;
        }
        saving.value = false;
        return false;
      }

      try {
        if (scope !== lifecycle) return true;
        detailVersion++;
        if (Number(detailId.value) === Number(id))
          selectedReview.value = response.data?.data || selectedReview.value;
        reviews.value = reviews.value.map((row) =>
          Number(row.id) === Number(id) ? response.data?.data || row : row,
        );
        message.value = response.data?.message || fallback;
        const refreshed = await fetchReviews({ keepMessage: true });
        if (!refreshed && scope === lifecycle && listError.value) {
          listError.value =
            "Đã lưu thành công nhưng chưa tải lại được danh sách. " +
            listError.value;
        }
        return true;
      } finally {
        saving.value = false;
      }
    }

    function setReviewStatus(status) {
      const expected_status = selectedReview.value?.status;
      return mutate(
        (id) => ReviewService.moderate(id, { status, expected_status }),
        "Đã cập nhật đánh giá.",
      );
    }

    function saveReply(
      content,
      originalReply = selectedReview.value?.shop_reply || null,
    ) {
      const text = String(content || "").trim();
      if (!text || [...text].length > 1000) {
        actionError.value = "Vui lòng nhập phản hồi từ 1 đến 1000 ký tự.";
        return Promise.resolve(false);
      }
      const reply = originalReply;
      const data = { content: text };
      if (reply) {
        data.expected_content = reply.content;
        data.expected_status = reply.status;
      }
      return mutate(
        (id) =>
          reply
            ? ReviewService.editReply(id, data)
            : ReviewService.createReply(id, data),
        "Đã lưu phản hồi.",
      );
    }

    function setReplyStatus(status) {
      const expected_status = selectedReview.value?.shop_reply?.status;
      return mutate(
        (id) => ReviewService.moderateReply(id, { status, expected_status }),
        "Đã cập nhật phản hồi.",
      );
    }

    function resetFilters() {
      Object.assign(filters, {
        search: "",
        product_id: "",
        rating: "",
        status: "",
        reply_status: "",
        page: 1,
      });
    }

    function disposeRequests() {
      lifecycle++;
      listVersion++;
      detailVersion++;
      productVersion++;
      loading.value = false;
      loadingDetail.value = false;
      loadingProducts.value = false;
      showDetail.value = false;
      selectedReview.value = null;
      detailId.value = null;
    }

    return {
      reviews,
      selectedReview,
      detailId,
      showDetail,
      loading,
      loadingDetail,
      saving,
      message,
      listError,
      detailError,
      actionError,
      errors,
      needsReload,
      products,
      loadingProducts,
      productError,
      filters,
      meta,
      summary,
      fetchReviews,
      fetchProducts,
      fetchDetail,
      openDetail,
      closeDetail,
      setReviewStatus,
      saveReply,
      setReplyStatus,
      resetFilters,
      disposeRequests,
    };
  },
);
