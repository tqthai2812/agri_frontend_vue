<script setup>
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
} from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import api, { exportError } from "@/services/admin/dataExport.service";
const props = defineProps({ initialReportType: { type: String, default: "" } });
const auth = useAuthStore();
const canView = computed(
    () => auth.isAuthenticated && auth.hasPermission("export.view"),
);
const rows = ref([]),
    types = ref([]),
    error = ref(""),
    loading = ref(false);
const filters = reactive({
    report_type: props.initialReportType,
    status: "",
    search: "",
});
let appliedFilters = { ...filters };
function applyFilters() {
    appliedFilters = { ...filters };
    load(1);
}
const meta = ref({ current_page: 1, last_page: 1, total: 0 });
const busyIds = ref(new Set());
let controller,
    timer,
    sequence = 0,
    alive = true,
    forbidden = false;
const operations = new Set();
const status = {
    pending: {
        label: "Đang chờ",
        class: "bg-amber-500/10 text-amber-600",
        icon: "mdi:clock-outline",
    },
    processing: {
        label: "Đang tạo file",
        class: "bg-blue-500/10 text-blue-600",
        icon: "mdi:loading",
    },
    completed: {
        label: "Hoàn tất",
        class: "bg-emerald-500/10 text-emerald-600",
        icon: "mdi:check-circle-outline",
    },
    failed: {
        label: "Thất bại",
        class: "bg-red-500/10 text-red-500",
        icon: "mdi:alert-circle-outline",
    },
    expired: {
        label: "Đã hết hạn",
        class: "bg-slate-500/10 text-slate-500",
        icon: "mdi:clock-alert-outline",
    },
};
const date = (value) =>
    String(value || "")
        .split("-")
        .reverse()
        .join("/");
function time(value, dateOnly = false) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
    }).format(new Date(value));
}
const groups = computed(() => {
    const result = [];
    for (const row of rows.value) {
        const label = time(row.created_at, true);
        if (result.at(-1)?.label !== label) result.push({ label, items: [] });
        result.at(-1).items.push(row);
    }
    return result;
});
function label(row) {
    return (
        types.value.find((t) => t.type === row.report_type)?.label ||
        row.report_type
    );
}
function size(bytes) {
    return bytes == null
        ? ""
        : bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(1)} KB`
            : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function stop() {
    clearTimeout(timer);
    sequence++;
    controller?.abort();
}
function schedule() {
    clearTimeout(timer);
    if (!alive || forbidden || !canView.value || document.hidden) return;
    timer = setTimeout(
        () => load(meta.value.current_page, true),
        rows.value.some((r) => ["pending", "processing"].includes(r.status))
            ? 3000
            : 15000,
    );
}
async function load(page = 1, silent = false) {
    stop();
    if (!canView.value || !alive) return;
    const version = sequence;
    controller = new AbortController();
    loading.value = !silent;
    error.value = "";
    try {
        const params = { page, per_page: 10 };
        for (const [key, value] of Object.entries(appliedFilters))
            if (value.trim()) params[key] = value.trim();
        const response = await api.list(params, controller.signal);
        if (!alive || version !== sequence) return;
        rows.value = response.data.data;
        meta.value = response.data.meta;
        types.value = response.data.report_types;
        forbidden = false;
    } catch (e) {
        const text = await exportError(e);
        if (!alive || version !== sequence) return;
        error.value = text;
        if ([401, 403].includes(e.response?.status)) {
            rows.value = [];
            types.value = [];
            forbidden = true;
        }
    } finally {
        if (alive && version === sequence) {
            loading.value = false;
            schedule();
        }
    }
}
function clear() {
    stop();
    for (const operation of operations) operation.abort();
    operations.clear();
    rows.value = [];
    types.value = [];
    error.value = "";
    loading.value = false;
    busyIds.value = new Set();
    meta.value = { current_page: 1, last_page: 1, total: 0 };
    forbidden = false;
}
watch(
    () => [auth.user?.id, canView.value],
    () => {
        clear();
        if (canView.value) load();
    },
);
watch(
    () => props.initialReportType,
    (value) => {
        filters.report_type = value;
        appliedFilters = { ...filters };
        load();
    },
);
function visibility() {
    if (document.hidden) stop();
    else if (canView.value && !forbidden) load(meta.value.current_page, true);
}
onMounted(() => {
    document.addEventListener("visibilitychange", visibility);
    load();
});
onBeforeUnmount(() => {
    alive = false;
    clear();
    document.removeEventListener("visibilitychange", visibility);
});
async function action(row, retry = false) {
    if (busyIds.value.has(row.id) || !canView.value) return;
    const owner = auth.user?.id;
    const operation = new AbortController();
    operations.add(operation);
    busyIds.value.add(row.id);
    error.value = "";
    try {
        if (retry) {
            await api.retry(row.id, operation.signal);
        } else {
            const response = await api.download(row.id, operation.signal);
            if (!alive || owner !== auth.user?.id || operation.signal.aborted) return;
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = row.file_name || `report_${row.id}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        if (alive && owner === auth.user?.id && !operation.signal.aborted)
            await load(meta.value.current_page, true);
    } catch (e) {
        const text = await exportError(e);
        if (alive && owner === auth.user?.id && !operation.signal.aborted)
            error.value = text;
    } finally {
        operations.delete(operation);
        if (!operation.signal.aborted) busyIds.value.delete(row.id);
    }
}

// Chỉ tính các nút số trang hiển thị, dùng lại load() hiện có.
const visiblePages = computed(() => {
    const start = Math.max(1, meta.value.current_page - 2);
    const end = Math.min(meta.value.last_page, meta.value.current_page + 2);
    return Array.from(
        { length: Math.max(0, end - start + 1) },
        (_, index) => start + index,
    );
});
</script>
<template>
  <div>
    <header class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold">Tệp đã xuất</h1>
        <p class="text-sm text-text-light">
          {{ Number(meta.total).toLocaleString("vi-VN") }} tệp phù hợp bộ lọc
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button v-if="canView" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
          :disabled="loading" @click="load(meta.current_page)">
          <Icon icon="solar:refresh-bold" :class="loading ? 'animate-spin' : ''" />
          Tải lại
        </button>
      </div>
    </header>

    <div v-if="!canView" role="alert"
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      Bạn không có quyền xem tệp đã xuất.
    </div>
    <template v-else>
      <div v-if="error" role="alert"
        class="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        <Icon icon="solar:danger-circle-bold-duotone" class="mt-0.5 shrink-0 text-xl" />
        <span>{{ error }}</span>
      </div>

      <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <form @submit.prevent="applyFilters" class="mb-5 flex flex-wrap gap-3">
          <label class="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <span class="sr-only">Tìm tên file</span>
            <Icon icon="solar:magnifer-bold" class="shrink-0 text-text-light" />
            <input v-model="filters.search" type="search" maxlength="150" placeholder="Tìm tên file"
              aria-label="Tìm tên file" class="w-full bg-transparent text-sm outline-none" />
          </label>
          <select v-model="filters.report_type" aria-label="Loại báo cáo"
            class="filter-select min-w-0 max-w-full flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
            <option value="">Tất cả báo cáo</option>
            <option v-for="item in types" :key="item.type" :value="item.type">{{ item.label }}</option>
          </select>
          <select v-model="filters.status" aria-label="Trạng thái xuất file"
            class="filter-select flex-1 cursor-pointer disabled:cursor-not-allowed sm:flex-none">
            <option value="">Tất cả trạng thái</option>
            <option v-for="(item, key) in status" :key="key" :value="key">{{ item.label }}</option>
          </select>
          <button type="submit" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed">
            <Icon icon="solar:filter-bold" />
            Lọc
          </button>
        </form>

        <div v-if="loading && !rows.length" role="status" class="py-10 text-center text-text-light">
          <Icon icon="solar:refresh-bold" class="mx-auto mb-2 animate-spin text-3xl" />
          <p class="text-sm">Đang tải tệp đã xuất...</p>
        </div>
        <div v-else class="overflow-x-auto" :aria-busy="loading">
          <table class="w-full min-w-[1050px]">
            <thead class="bg-bg">
              <tr>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Tệp báo cáo</th>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Loại báo cáo</th>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Thời gian tạo</th>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Số dòng / Dung lượng</th>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Trạng thái</th>
                <th class="p-3 text-left text-xs font-bold uppercase tracking-wide text-text-light">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in groups" :key="group.label">
                <tr class="border-b border-border bg-bg/50">
                  <td colspan="6" class="p-3 text-xs font-medium text-text-light">{{ group.label }}</td>
                </tr>
                <tr v-for="row in group.items" :key="row.id" class="border-b border-border hover:bg-primary/5">
                  <td class="p-3 text-sm">
                    <div class="flex items-center gap-3">
                      <span class="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-bg text-success">
                        <Icon icon="mdi:file-excel-outline" class="text-2xl" />
                      </span>
                      <div class="min-w-0 max-w-[280px]">
                        <p class="break-words text-sm font-semibold">{{ row.file_name || label(row) }}</p>
                        <p class="mt-1 text-xs text-text-light">
                          <template v-if="row.filters.date_from && row.filters.date_to">
                            {{ date(row.filters.date_from) }} – {{ date(row.filters.date_to) }}
                          </template>
                        </p>
                        <p v-if="row.status === 'failed'" class="mt-1 break-words text-xs text-red-600">
                          {{ row.error_message }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="max-w-[220px] p-3 text-sm">{{ label(row) }}</td>
                  <td class="whitespace-nowrap p-3 text-sm text-text-light">{{ time(row.created_at) }}</td>
                  <td class="p-3 text-sm">
                    <template v-if="row.row_count != null">
                      <p class="font-mono">{{ row.row_count.toLocaleString("vi-VN") }} dòng</p>
                      <p class="mt-1 font-mono text-xs text-text-light">{{ size(row.file_size) }}</p>
                    </template>
                  </td>
                  <td class="p-3">
                    <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
                      :class="(status[row.status] || status.pending).class">
                      <Icon :icon="(status[row.status] || status.pending).icon"
                        :class="{ 'animate-spin': row.status === 'processing' }" />
                      {{ (status[row.status] || status.pending).label }}
                    </span>
                  </td>
                  <td class="p-3">
                    <div class="flex flex-wrap gap-2">
                      <button v-if="row.can_download" type="button" class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                        :disabled="busyIds.has(row.id)" @click="action(row)">
                        <Icon :icon="busyIds.has(row.id) ? 'solar:refresh-bold' : 'mdi:download-outline'"
                          :class="busyIds.has(row.id) ? 'animate-spin' : ''" />
                        {{ busyIds.has(row.id) ? "Đang tải..." : "Tải xuống" }}
                      </button>
                      <button v-else-if="row.can_retry && auth.hasPermission('export.create')" type="button"
                        class="btn-outline-sm cursor-pointer disabled:cursor-not-allowed"
                        :disabled="busyIds.has(row.id)" @click="action(row, true)">
                        <Icon icon="solar:refresh-bold" :class="busyIds.has(row.id) ? 'animate-spin' : ''" />
                        {{ busyIds.has(row.id) ? "Đang gửi..." : "Thử lại" }}
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="!rows.length">
                <td colspan="6" class="p-8 text-center text-sm text-text-light">Chưa có tệp xuất.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span class="text-sm text-text-light">
            Hiển thị {{ rows.length }} / {{ Number(meta.total).toLocaleString("vi-VN") }} tệp
          </span>
          <nav class="flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang tệp đã xuất">
            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang trước"
              :disabled="loading || meta.current_page <= 1" @click="load(meta.current_page - 1)">
              <Icon icon="solar:arrow-left-bold" />
            </button>
            <button v-for="page in visiblePages" :key="page" type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed"
              :class="{ active: page === meta.current_page }" :aria-current="page === meta.current_page ? 'page' : undefined"
              :disabled="loading" @click="load(page)">
              {{ page }}
            </button>
            <button type="button" class="page-btn cursor-pointer disabled:cursor-not-allowed" aria-label="Trang sau"
              :disabled="loading || meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">
              <Icon icon="solar:arrow-right-bold" />
            </button>
          </nav>
        </footer>
      </section>
    </template>
  </div>
</template>