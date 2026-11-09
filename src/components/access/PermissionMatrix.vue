<script setup>
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  groups: { type: Object, default: () => ({}) },
  readonly: Boolean,
  busy: Boolean,
});
const emit = defineEmits(["update:modelValue"]);
const search = ref("");
const collapsed = ref(new Set());
const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
const visible = computed(() =>
  Object.entries(props.groups)
    .map(([key, permissions]) => [
      key,
      permissions.filter((p) =>
        normalize(
          `${p.name} ${p.label} ${p.group_label} ${p.description}`,
        ).includes(normalize(search.value)),
      ),
    ])
    .filter(([, permissions]) => permissions.length),
);
const editable = (permissions) =>
  permissions.filter((p) => p.grantable !== false);
const selected = (permissions) =>
  permissions.filter((p) => props.modelValue.includes(p.name)).length;
const indeterminate = (permissions) =>
  selected(editable(permissions)) > 0 &&
  selected(editable(permissions)) < editable(permissions).length;
function toggle(names, checked) {
  if (props.readonly || props.busy) return;
  const next = new Set(props.modelValue);
  names.forEach((name) => (checked ? next.add(name) : next.delete(name)));
  emit("update:modelValue", [...next].sort());
}
function selectVisible(checked) {
  toggle(
    visible.value.flatMap(([, permissions]) =>
      editable(permissions).map((p) => p.name),
    ),
    checked,
  );
}
function collapse(key) {
  const next = new Set(collapsed.value);
  next.has(key) ? next.delete(key) : next.add(key);
  collapsed.value = next;
}
</script>
<template>
  <section class="space-y-3" aria-label="Ma trận phân quyền">
    <div class="flex flex-wrap items-center gap-2">
      <label class="grow min-w-44"
        ><span class="sr-only">Tìm quyền</span
        ><input
          v-model="search"
          class="ac-input"
          type="search"
          placeholder="Tìm mã quyền, tên hoặc nhóm…"
      /></label>
      <span class="ac-badge">{{ modelValue.length }} quyền đã chọn</span>
      <template v-if="!readonly">
        <button
          class="ac-btn"
          type="button"
          :disabled="busy"
          @click="selectVisible(true)"
        >
          Chọn kết quả
        </button>
        <button
          class="ac-btn"
          type="button"
          :disabled="busy"
          @click="selectVisible(false)"
        >
          Bỏ chọn kết quả
        </button>
      </template>
    </div>
    <p v-if="!readonly" class="text-xs text-text-light">
      Các nút chọn áp dụng cho kết quả đang hiển thị. Quyền có biểu tượng khóa
      chỉ Admin được cấp.
    </p>
    <div
      v-for="[key, permissions] in visible"
      :key="key"
      class="rounded-xl border border-border overflow-hidden"
    >
      <div class="flex items-center gap-3 bg-bg px-4 py-3">
        <input
          v-if="!readonly"
          type="checkbox"
          class="ac-check"
          :aria-label="`Chọn nhóm ${permissions[0].group_label || key}`"
          :checked="
            editable(permissions).length > 0 &&
            selected(editable(permissions)) === editable(permissions).length
          "
          :indeterminate="indeterminate(permissions)"
          :disabled="busy || !editable(permissions).length"
          @change="
            toggle(
              editable(permissions).map((p) => p.name),
              $event.target.checked,
            )
          "
        />
        <button
          type="button"
          class="flex grow items-center justify-between gap-3 text-left text-sm font-semibold cursor-pointer"
          :aria-expanded="!collapsed.has(key)"
          @click="collapse(key)"
        >
          <span
            >{{ permissions[0].group_label || key }}
            <span class="text-text-light font-normal"
              >{{ selected(permissions) }}/{{ permissions.length }}</span
            ></span
          >
          <Icon
            :icon="
              collapsed.has(key)
                ? 'solar:alt-arrow-down-linear'
                : 'solar:alt-arrow-up-linear'
            "
          />
        </button>
      </div>
      <div
        v-show="!collapsed.has(key)"
        class="grid sm:grid-cols-2 gap-px bg-border"
      >
        <label
          v-for="permission in permissions"
          :key="permission.name"
          class="flex gap-3 bg-surface p-4 cursor-pointer"
          :title="permission.description"
        >
          <input
            type="checkbox"
            class="ac-check mt-1"
            :checked="modelValue.includes(permission.name)"
            :disabled="readonly || busy || permission.grantable === false"
            :aria-label="permission.label || permission.name"
            @change="toggle([permission.name], $event.target.checked)"
          />
          <span class="min-w-0"
            ><span class="flex items-center gap-2 text-sm font-medium"
              >{{ permission.label || permission.name
              }}<Icon
                v-if="permission.grantable === false && !readonly"
                icon="solar:lock-keyhole-linear"
                class="shrink-0 text-text-light"
            /></span>
            <code class="block mt-1 text-xs break-all text-text-light">{{
              permission.name
            }}</code>
            <span class="block mt-1 text-xs text-text-light leading-relaxed">{{
              permission.description
            }}</span></span
          >
        </label>
      </div>
    </div>
    <p v-if="!visible.length" class="ac-empty">Không có quyền phù hợp.</p>
  </section>
</template>