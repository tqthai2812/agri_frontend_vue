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
</script>
<template>
    <section class="rounded-2xl border border-border bg-surface shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <h2 class="font-bold text-text">Tệp đã xuất</h2>
            <button v-if="canView" type="button" @click="load(meta.current_page)" :disabled="loading"
                class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-sec disabled:opacity-40">
                <Icon icon="mdi:refresh" />Làm mới
            </button>
        </header>
        <div v-if="!canView" class="p-8 text-center text-text-light">
            Bạn không có quyền xem tệp đã xuất.
        </div>
        <template v-else>
            <form @submit.prevent="applyFilters" class="flex flex-wrap items-center gap-3 border-b border-border p-5">
                <select v-model="filters.report_type" aria-label="Loại báo cáo"
                    class="max-w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                    <option value="">Tất cả báo cáo</option>
                    <option v-for="item in types" :key="item.type" :value="item.type">
                        {{ item.label }}
                    </option>
                </select>
                <select v-model="filters.status" aria-label="Trạng thái xuất file"
                    class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                    <option value="">Tất cả trạng thái</option>
                    <option v-for="(item, key) in status" :key="key" :value="key">
                        {{ item.label }}
                    </option>
                </select>
                <input v-model="filters.search" type="search" maxlength="150" placeholder="Tìm tên file"
                    aria-label="Tìm tên file"
                    class="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" />
                <button type="submit" class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">
                    Lọc
                </button>
            </form>
            <p v-if="error" role="alert" class="mx-5 mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {{ error }}
            </p>
            <p v-if="loading && !rows.length" role="status" class="p-10 text-center text-sm text-text-light">
                Đang tải...
            </p>
            <p v-else-if="!rows.length" class="p-10 text-center text-sm text-text-light">
                Chưa có tệp xuất.
            </p>
            <div v-else class="space-y-6 p-5" :aria-busy="loading">
                <section v-for="group in groups" :key="group.label">
                    <h3 class="mb-3 text-sm font-semibold text-text-sec">
                        {{ group.label }}
                    </h3>
                    <div class="space-y-3">
                        <article v-for="row in group.items" :key="row.id"
                            class="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border px-4 py-4 sm:flex sm:flex-wrap sm:gap-4">
                            <span
                                class="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Icon icon="mdi:file-excel-outline" class="text-2xl" />
                            </span>
                            <div class="min-w-0 flex-1">
                                <p class="break-words text-sm font-semibold text-text">
                                    {{ row.file_name || label(row) }}
                                </p>
                                <p class="mt-1 text-xs text-text-light">
                                    <template v-if="row.filters.date_from && row.filters.date_to">{{
                                        date(row.filters.date_from) }} –
                                        {{ date(row.filters.date_to) }} ·
                                    </template>
                                    {{ time(row.created_at)
                                    }}<template v-if="row.row_count != null">
                                        · {{ row.row_count.toLocaleString("vi-VN") }} dòng ·
                                        {{ size(row.file_size) }}</template>
                                </p>
                                <p v-if="row.status === 'failed'" class="mt-1 text-xs text-red-500">
                                    {{ row.error_message }}
                                </p>
                            </div>
                            <span
                                class="col-start-2 inline-flex items-center justify-self-start gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                                :class="(status[row.status] || status.pending).class">
                                <Icon :icon="(status[row.status] || status.pending).icon"
                                    :class="{ 'animate-spin': row.status === 'processing' }" />{{ (status[row.status] ||
                                status.pending).label }}
                            </span>
                            <button v-if="row.can_download" type="button" :disabled="busyIds.has(row.id)"
                                @click="action(row)"
                                class="col-start-2 inline-flex items-center justify-self-start gap-2 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/5 disabled:opacity-40">
                                <Icon icon="mdi:download-outline" />{{
                                    busyIds.has(row.id) ? "Đang tải..." : "Tải xuống"
                                }}
                            </button>
                            <button v-else-if="row.can_retry && auth.hasPermission('export.create')" type="button"
                                :disabled="busyIds.has(row.id)" @click="action(row, true)"
                                class="col-start-2 justify-self-start rounded-lg border border-border px-4 py-2 text-sm text-text disabled:opacity-40">
                                {{ busyIds.has(row.id) ? "Đang gửi..." : "Thử lại" }}
                            </button>
                        </article>
                    </div>
                </section>
            </div>
            <footer
                class="flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-text-light">
                <span>{{ Number(meta.total).toLocaleString("vi-VN") }} tệp</span>
                <div class="flex items-center gap-3">
                    <button type="button" :disabled="loading || meta.current_page <= 1"
                        @click="load(meta.current_page - 1)"
                        class="rounded-lg border border-border px-3 py-2 disabled:opacity-30">
                        Trước
                    </button>
                    <span>{{ meta.current_page }} / {{ meta.last_page }}</span>
                    <button type="button" :disabled="loading || meta.current_page >= meta.last_page"
                        @click="load(meta.current_page + 1)"
                        class="rounded-lg border border-border px-3 py-2 disabled:opacity-30">
                        Sau
                    </button>
                </div>
            </footer>
        </template>
    </section>
</template>