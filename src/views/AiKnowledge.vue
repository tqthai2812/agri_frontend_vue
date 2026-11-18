<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import AiKnowledgeService from "@/services/admin/aiKnowledge.service";
import FarmAdminNav from "@/components/admin/farm/FarmAdminNav.vue";

const auth = useAuthStore();
const search = ref(""),
  status = ref(""),
  rows = ref([]),
  counts = ref({});
const meta = ref({ current_page: 1, last_page: 1, total: 0 });
const loading = ref(false),
  saving = ref(null),
  error = ref(""),
  message = ref("");
const labels = {
  pending: "Chờ đồng bộ",
  indexing: "Đang đồng bộ",
  ready: "Sẵn sàng",
  failed: "Có lỗi",
};

const statClasses = {
  pending: { border: "border-l-warning", value: "text-warning" },
  indexing: { border: "border-l-info", value: "text-info" },
  ready: { border: "border-l-success", value: "text-success" },
  failed: { border: "border-l-danger", value: "text-danger" },
};
const visiblePages = computed(() => {
  const current = Number(meta.value.current_page) || 1;
  const last = Math.max(1, Number(meta.value.last_page) || 1);
  const pages = [];

  for (
    let page = Math.max(1, current - 2);
    page <= Math.min(last, current + 2);
    page++
  ) {
    pages.push(page);
  }

  return pages;
});

let abort,
  version = 0;
async function load(page = 1) {
  const current = ++version;
  abort?.abort();
  abort = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    const data = await AiKnowledgeService.list(
      { search: search.value.trim(), status: status.value || undefined, page },
      abort.signal,
    );
    if (current !== version) return;
    rows.value = data.data || [];
    meta.value = data.meta;
    counts.value = data.counts || {};
  } catch (e) {
    if (current === version && e.code !== "ERR_CANCELED")
      error.value =
        e.response?.data?.message || "Chưa tải được dữ liệu đồng bộ.";
  } finally {
    if (current === version) loading.value = false;
  }
}
async function reindex(row) {
  if (saving.value !== null) return;
  saving.value = row.id;
  error.value = "";
  message.value = "";
  try {
    const data = await AiKnowledgeService.reindex(
      row.product_id ? "product" : "guide",
      row.product_id || row.usage_guide_id,
    );
    message.value = data.message;
    await load(meta.value.current_page);
  } catch (e) {
    error.value =
      e.response?.data?.message || "Chưa đưa được nguồn vào hàng đợi.";
  } finally {
    saving.value = null;
  }
}
onMounted(() => load());
onBeforeUnmount(() => {
  version++;
  abort?.abort();
});
</script>

<template>
  <div class="ai-knowledge-page">
    <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Dữ liệu trợ lý AI</h1>
        <p class="text-sm text-text-light">
          {{ meta.total }} tài liệu phù hợp bộ lọc
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
          @click="load(meta.current_page)"
        >
          <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': loading }" />
          Tải lại
        </button>
      </div>
    </div>

    <FarmAdminNav />

    <div
      v-if="message"
      role="status"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      <Icon icon="solar:check-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" aria-hidden="true" />
      <span>{{ message }}</span>
    </div>
    <div
      v-if="error"
      role="alert"
      class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" aria-hidden="true" />
      <span>{{ error }}</span>
    </div>

    <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <form class="mb-5 flex flex-wrap gap-3" @submit.prevent="load(1)">
        <div class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" aria-hidden="true" />
          <input
            id="ai-knowledge-search"
            v-model="search"
            type="search"
            aria-label="Tìm sản phẩm"
            placeholder="Tìm theo tên sản phẩm…"
            class="min-w-0 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          id="ai-knowledge-status"
          v-model="status"
          aria-label="Trạng thái đồng bộ"
          class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option v-for="(label, key) in labels" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <button
          type="submit"
          class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <Icon icon="solar:filter-bold" aria-hidden="true" />
          Lọc
        </button>
      </form>

      <div v-if="loading" role="status" class="py-10 text-center text-text-light">
        <Icon icon="solar:refresh-bold" class="mx-auto mb-2 block animate-spin text-3xl" aria-hidden="true" />
        <p class="text-sm">Đang tải dữ liệu…</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px] table-auto text-sm">
          <thead class="bg-bg">
            <tr>
              <th class="whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Nguồn tài liệu</th>
              <th class="whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đoạn</th>
              <th class="whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Trạng thái</th>
              <th class="whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Đồng bộ gần nhất</th>
              <th class="whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Lỗi</th>
              <th class="w-px whitespace-nowrap p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-b border-border hover:bg-primary/5">
              <td class="p-3 text-left text-sm">
                <div class="font-semibold">
                  {{ row.product_name || row.guide_product_name || "Nguồn đã thay đổi" }}
                </div>
                <div class="mt-1 text-xs text-text-light">
                  {{
                    row.product_id
                      ? `Sản phẩm #${row.product_id}`
                      : `Hướng dẫn #${row.usage_guide_id} · ${row.variant_name || ""}`
                  }}
                </div>
              </td>
              <td class="whitespace-nowrap p-3 text-left text-sm">{{ row.chunk_index + 1 }}</td>
              <td class="whitespace-nowrap p-3 text-left text-sm">
                <span
                  class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    row.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : row.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{ labels[row.status] || row.status }}
                </span>
              </td>
              <td class="whitespace-nowrap p-3 text-left text-sm text-text-light">
                {{ row.indexed_at || "Chưa đồng bộ" }}
              </td>
              <td class="p-3 text-left text-sm">
                <p class="max-w-[320px] break-words text-xs text-red-600">{{ row.last_error || "—" }}</p>
              </td>
              <td class="w-px whitespace-nowrap p-3 text-left text-sm">
                <div class="flex gap-2">
                  <button
                    v-if="auth.hasPermission('ai-knowledge.reindex')"
                    type="button"
                    class="btn-outline-icon cursor-pointer disabled:cursor-not-allowed"
                    :disabled="saving !== null"
                    :title="saving === row.id ? 'Đang gửi yêu cầu đồng bộ' : 'Đồng bộ lại'"
                    :aria-label="saving === row.id ? 'Đang gửi yêu cầu đồng bộ' : 'Đồng bộ lại'"
                    @click="reindex(row)"
                  >
                    <Icon icon="solar:refresh-bold" :class="{ 'animate-spin': saving === row.id }" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="p-8 text-left text-text-light">
                Chưa có tài liệu khớp bộ lọc.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-text-light">
          Hiển thị {{ rows.length }} / {{ meta.total }} tài liệu
        </span>
        <nav class="flex flex-wrap justify-center gap-2" aria-label="Phân trang dữ liệu trợ lý AI">
          <button
            type="button"
            class="page-btn shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Trang trước"
            :disabled="loading || meta.current_page <= 1"
            @click="load(meta.current_page - 1)"
          >
            <Icon icon="solar:arrow-left-bold" />
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            class="page-btn shrink-0 cursor-pointer disabled:cursor-not-allowed"
            :class="{ active: page === Number(meta.current_page) }"
            :aria-current="page === Number(meta.current_page) ? 'page' : undefined"
            :disabled="loading"
            @click="load(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="page-btn shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Trang sau"
            :disabled="loading || meta.current_page >= meta.last_page"
            @click="load(meta.current_page + 1)"
          >
            <Icon icon="solar:arrow-right-bold" />
          </button>
        </nav>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-knowledge-page button,
.ai-knowledge-page button:hover,
.ai-knowledge-page button:disabled {
  opacity: 1;
}
.ai-knowledge-page button:disabled {
  cursor: not-allowed;
}
</style>