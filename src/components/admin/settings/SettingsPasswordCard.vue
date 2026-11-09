<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  user: { type: Object, default: null },
  email: { type: String, default: "" },
  busy: Boolean,
  loadError: { type: String, default: "" },
  password: { type: Object, required: true },
  passwordSaving: Boolean,
  passwordDirty: Boolean,
  passwordError: { type: String, default: "" },
  passwordSuccess: { type: String, default: "" },
  passwordNotice: { type: String, default: "" },
  passwordErrors: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["save", "update-field"]);
const passwordForm = ref(null);
const editing = reactive({
  current_password: false,
  password: false,
  password_confirmation: false,
});
const reveal = reactive({
  current_password: false,
  password: false,
  password_confirmation: false,
});
watch(
  () => Object.values(props.password).some(Boolean),
  (hasInput) => {
    if (!hasInput)
      Object.keys(reveal).forEach((key) => {
        reveal[key] = false;
        if (
          document.activeElement !== passwordForm.value?.elements.namedItem(key)
        )
          editing[key] = false;
      });
  },
);
const passwordFields = [
  {
    key: "current_password",
    label: "Mật khẩu hiện tại",
    placeholder: "Tự nhập mật khẩu hiện tại",
  },
  { key: "password", label: "Mật khẩu mới", placeholder: "Nhập mật khẩu mới" },
  {
    key: "password_confirmation",
    label: "Xác nhận mật khẩu mới",
    placeholder: "Nhập lại mật khẩu mới",
  },
];

function startEditing(key, event) {
  if (props.busy || props.loadError || !props.user) return;
  editing[key] = true;
  event.currentTarget.readOnly = false;
}

function handleInput(key, event) {
  if (!editing[key]) {
    event.target.value = "";
    return;
  }
  emit("update-field", key, event.target.value);
}

function resetPasswordInputs(event) {
  if (event && !event.persisted) return;
  for (const field of passwordFields) {
    editing[field.key] = false;
    reveal[field.key] = false;
    const input = passwordForm.value?.elements.namedItem(field.key);
    if (input) {
      input.value = "";
      input.readOnly = true;
    }
    emit("update-field", field.key, "");
  }
}

onMounted(() => {
  resetPasswordInputs();
  window.addEventListener("pageshow", resetPasswordInputs);
});
onBeforeUnmount(() => {
  window.removeEventListener("pageshow", resetPasswordInputs);
});
</script>

<template>
  <section
    class="settings-card"
    aria-labelledby="settings-password-title"
    :aria-busy="passwordSaving"
  >
    <div class="settings-card-heading">
      <span class="settings-section-icon"
        ><Icon icon="solar:lock-keyhole-bold-duotone"
      /></span>
      <div>
        <h2 id="settings-password-title" class="text-lg font-bold">
          Đổi mật khẩu
        </h2>
        <p class="mt-1 text-sm text-text-light">
          Xác nhận mật khẩu hiện tại trước khi thay đổi.
        </p>
      </div>
    </div>
    <form
      ref="passwordForm"
      class="space-y-4"
      autocomplete="off"
      novalidate
      @submit.prevent="emit('save', $event.currentTarget)"
    >
      <p
        v-if="passwordError"
        role="alert"
        class="settings-alert settings-alert-error"
      >
        {{ passwordError }}
      </p>
      <p
        v-if="passwordSuccess"
        role="status"
        class="settings-alert settings-alert-success"
      >
        <Icon
          icon="solar:check-circle-bold-duotone"
          class="shrink-0 text-xl"
        />{{ passwordSuccess }}
      </p>
      <p
        v-if="passwordNotice"
        role="status"
        class="settings-alert settings-alert-notice"
      >
        {{ passwordNotice }}
      </p>
      <fieldset
        :disabled="busy || !!loadError || !user"
        class="border-0 p-0 min-w-0 space-y-4"
      >
        <div v-for="field in passwordFields" :key="field.key">
          <label :for="`settings-${field.key}`" class="settings-label"
            >{{ field.label }} <span class="text-primary">*</span></label
          >
          <div class="relative">
            <input
              :id="`settings-${field.key}`"
              :value="password[field.key]"
              :name="field.key"
              :type="reveal[field.key] ? 'text' : 'password'"
              required
              autocomplete="off"
              :readonly="!editing[field.key]"
              :placeholder="field.placeholder"
              spellcheck="false"
              autocapitalize="off"
              data-lpignore="true"
              data-1p-ignore
              class="settings-input pr-12"
              :aria-invalid="!!passwordErrors[field.key]"
              :aria-describedby="
                passwordErrors[field.key]
                  ? `settings-${field.key}-error`
                  : field.key === 'password'
                    ? 'settings-password-help'
                    : undefined
              "
              @focus="startEditing(field.key, $event)"
              @pointerdown="startEditing(field.key, $event)"
              @keydown="startEditing(field.key, $event)"
              @input="handleInput(field.key, $event)"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-lg text-text-light hover:bg-bg hover:text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!editing[field.key] || !password[field.key]"
              :aria-label="`${reveal[field.key] ? 'Ẩn' : 'Hiện'} ${field.label.toLowerCase()}`"
              :aria-pressed="reveal[field.key]"
              @click="reveal[field.key] = !reveal[field.key]"
            >
              <Icon
                :icon="
                  reveal[field.key] ? 'solar:eye-closed-bold' : 'solar:eye-bold'
                "
                class="text-xl"
              />
            </button>
          </div>
          <p
            v-if="passwordErrors[field.key]"
            :id="`settings-${field.key}-error`"
            class="settings-field-error"
          >
            {{ passwordErrors[field.key] }}
          </p>
          <p
            v-if="field.key === 'password'"
            id="settings-password-help"
            class="mt-2 text-xs text-text-light"
          >
            Tối thiểu 8 ký tự. Nên dùng mật khẩu riêng cho tài khoản này.
          </p>
        </div>
      </fieldset>
      <div class="pt-4">
        <button
          type="submit"
          class="settings-btn settings-btn-primary"
          :disabled="busy || !!loadError || !user || !passwordDirty"
        >
          <Icon
            :icon="
              passwordSaving
                ? 'solar:refresh-bold'
                : 'solar:lock-keyhole-bold-duotone'
            "
            :class="{ 'animate-spin': passwordSaving }"
          />{{ passwordSaving ? "Đang cập nhật…" : "Cập nhật mật khẩu" }}
        </button>
      </div>
    </form>
  </section>
</template>