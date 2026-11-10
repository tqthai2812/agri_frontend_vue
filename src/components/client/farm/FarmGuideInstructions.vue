<script setup>
import { computed } from "vue";
const props = defineProps({ guide: { type: Object, required: true } });
const sourceUrl = computed(() => {
  const text = String(props.guide.label_source || "").trim();
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
});
</script>
<template>
  <section class="rounded-2xl border border-[#dce8df] bg-white p-5 sm:p-6">
    <h3 class="text-lg font-bold text-[#153f29]">Hướng dẫn sử dụng</h3>
    <p class="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
      {{ guide.instructions }}
    </p>
    <div
      v-if="guide.safety_warning"
      class="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4"
    >
      <h4 class="text-sm font-bold text-amber-900">
        Lưu ý an toàn theo hướng dẫn
      </h4>
      <p class="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900/80">
        {{ guide.safety_warning }}
      </p>
    </div>
    <dl class="mt-5 space-y-3 border-t border-[#e3ece6] pt-4 text-xs leading-6">
      <div>
        <dt class="font-bold text-slate-700">Thời gian cách ly</dt>
        <dd class="text-slate-500">
          {{
            guide.pre_harvest_days == null
              ? "Chưa có thông tin trong hướng dẫn."
              : guide.pre_harvest_days + " ngày (theo hướng dẫn đã nhập)."
          }}
        </dd>
      </div>
      <div>
        <dt class="font-bold text-slate-700">Nguồn nhãn / tài liệu</dt>
        <dd class="break-words text-slate-500">
          <a
            v-if="sourceUrl"
            :href="sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#07532b] underline"
            >{{ guide.label_source }}</a
          ><span v-else>{{
            guide.label_source || "Chưa có thông tin nguồn."
          }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>