<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import DataExportHistory from "@/components/admin/exports/DataExportHistory.vue";
const route = useRoute();
const reportType = computed(() =>
    typeof route.query.report_type === "string" ? route.query.report_type : "",
);
</script>
<template>
    <DataExportHistory :initial-report-type="reportType" />
</template>