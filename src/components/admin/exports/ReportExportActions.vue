<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/shared/authStore";
import exportsApi, {
    exportError,
    requestKey,
} from "@/services/admin/dataExport.service";
const props = defineProps({
    reportType: { type: String, required: true },
    filters: { type: Object, required: true },
    disabled: Boolean,
    requiredPermission: { type: String, default: "" },
    buttonLabel: { type: String, default: "Xuất dữ liệu" },
});
const auth = useAuthStore();
const router = useRouter();
const canView = computed(
    () => auth.isAuthenticated && auth.hasPermission("export.view"),
);
const canCreate = computed(
    () =>
        canView.value &&
        auth.hasPermission("export.create") &&
        (!props.requiredPermission || auth.hasPermission(props.requiredPermission)),
);
const busy = ref(false),
    error = ref("");
let controller,
    sequence = 0,
    intent = null;
function clear() {
    sequence++;
    controller?.abort();
    intent = null;
    busy.value = false;
    error.value = "";
}
watch(
    () => [
        auth.user?.id,
        canView.value,
        canCreate.value,
        props.reportType,
        JSON.stringify(props.filters),
    ],
    clear,
);
onBeforeUnmount(clear);
async function create() {
    if (busy.value || props.disabled || !canCreate.value) return;
    const version = ++sequence;
    controller = new AbortController();
    busy.value = true;
    error.value = "";
    try {
        // Giữ cùng mã khi lỗi mạng: gửi lại không tạo thêm file trùng.
        intent ||= {
            report_type: props.reportType,
            filters: { ...props.filters },
            request_key: requestKey(),
        };
        await exportsApi.create(intent, controller.signal);
        if (version !== sequence) return;
        intent = null;
        await router.push({
            name: "admin-data-exports",
            query: { report_type: props.reportType },
        });
    } catch (e) {
        const text = await exportError(e);
        if (version !== sequence) return;
        error.value = text;
        if (e.response && e.response.status < 500) intent = null;
    } finally {
        if (version === sequence) busy.value = false;
    }
}
</script>
<template>
    <div v-if="canView" class="flex flex-col items-start gap-2 sm:items-end">
        <div class="flex flex-wrap items-center gap-3">
            <RouterLink :to="{ name: 'admin-data-exports', query: { report_type: reportType } }"
                class="text-sm font-medium text-text-sec hover:text-red-500">Tệp đã xuất</RouterLink>
            <button v-if="canCreate" type="button" :disabled="disabled || busy" @click="create"
                class="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                <Icon :icon="busy ? 'mdi:loading' : 'mdi:download-outline'" :class="{ 'animate-spin': busy }"
                    class="text-lg" />
                {{ busy ? "Đang gửi..." : buttonLabel }}
            </button>
        </div>
        <p v-if="error" role="alert" class="text-xs text-red-500">{{ error }}</p>
    </div>
</template>