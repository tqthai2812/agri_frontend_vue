<script setup>
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

const name = defineModel("name", { type: String, default: "" });
const phoneNumber = defineModel("phoneNumber", { type: String, default: "" });
const props = defineProps({
  user: { type: Object, default: null },
  loading: Boolean,
  busy: Boolean,
  loadError: { type: String, default: "" },
  profileSaving: Boolean,
  profileDirty: Boolean,
  profileError: { type: String, default: "" },
  profileSuccess: { type: String, default: "" },
  profileNotice: { type: String, default: "" },
  profileErrors: { type: Object, default: () => ({}) },
  avatarFile: { type: Object, default: null },
  avatarPreview: { type: String, default: "" },
});
const emit = defineEmits([
  "save",
  "discard",
  "select-avatar",
  "discard-avatar",
  "clear-error",
]);
const avatarInput = ref(null);
const avatarFailed = ref(false);
const email = computed(() => props.user?.email || "");
const roles = computed(() => props.user?.roles || []);
const avatarUrl = computed(() => {
  const legacyUrl = props.user?.avatar;
  const storedUrl =
    typeof legacyUrl === "string" && /^https?:\/\//i.test(legacyUrl)
      ? legacyUrl
      : props.user?.avatar_url || "";
  return props.avatarPreview || storedUrl;
});
const initials = computed(() =>
  String(name.value || props.user?.name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase(),
);
watch(avatarUrl, () => {
  avatarFailed.value = false;
});

function chooseAvatar() {
  if (!props.busy && !props.loadError) avatarInput.value?.click();
}

function onAvatarChange(event) {
  const file = event.target.files?.[0];
  if (file) emit("select-avatar", file);
  event.target.value = "";
}
</script>

<template>
  <section
    class="settings-card"
    aria-labelledby="settings-profile-title"
    :aria-busy="loading || profileSaving"
  >
    <div class="settings-card-heading">
      <span class="settings-section-icon"
        ><Icon icon="solar:user-circle-bold-duotone"
      /></span>
      <div>
        <h2 id="settings-profile-title" class="text-lg font-bold">
          Thông tin tài khoản
        </h2>
        <p class="mt-1 text-sm text-text-light">
          Cập nhật thông tin và ảnh đại diện của bạn.
        </p>
      </div>
    </div>

    <div
      v-if="loading"
      class="space-y-5"
      role="status"
      aria-label="Đang tải hồ sơ"
    >
      <div class="h-20 w-20 rounded-2xl bg-bg animate-pulse" />
      <div
        v-for="n in 4"
        :key="n"
        class="h-12 rounded-xl bg-bg animate-pulse"
      />
    </div>
    <form
      v-else
      class="space-y-5"
      novalidate
      @submit.prevent="emit('save', $event.currentTarget)"
    >
      <p
        v-if="profileError"
        role="alert"
        class="settings-alert settings-alert-error"
      >
        {{ profileError }}
      </p>
      <p
        v-if="profileSuccess"
        role="status"
        class="settings-alert settings-alert-success"
      >
        <Icon
          icon="solar:check-circle-bold-duotone"
          class="shrink-0 text-xl"
        />{{ profileSuccess }}
      </p>
      <p
        v-if="profileNotice"
        role="status"
        class="settings-alert settings-alert-notice"
      >
        {{ profileNotice }}
      </p>
      <fieldset
        :disabled="busy || !!loadError || !user"
        class="border-0 p-0 min-w-0 space-y-5"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            class="size-20 rounded-2xl bg-primary/10 text-primary overflow-hidden flex items-center justify-center shrink-0"
          >
            <img
              v-if="avatarUrl && !avatarFailed"
              :src="avatarUrl"
              :alt="`Ảnh đại diện ${user?.name || ''}`"
              class="size-full object-cover"
              @error="avatarFailed = true"
            />
            <span v-else class="font-bold text-2xl">{{ initials }}</span>
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap gap-2">
              <button type="button" class="settings-btn" @click="chooseAvatar">
                <Icon icon="solar:cloud-upload-bold" />Chọn ảnh đại diện
              </button>
              <button
                v-if="avatarFile"
                type="button"
                class="settings-btn"
                @click="emit('discard-avatar')"
              >
                Bỏ ảnh vừa chọn
              </button>
            </div>
            <p class="mt-2 text-xs text-text-light">
              JPG, PNG hoặc WEBP · Tối đa 2 MB
            </p>
            <p v-if="avatarFile" class="mt-1 text-xs text-text-light break-all">
              {{ avatarFile.name }} · Ảnh sẽ được tải lên khi lưu hồ sơ.
            </p>
          </div>
          <input
            ref="avatarInput"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            aria-label="Chọn tệp ảnh đại diện"
            @change="onAvatarChange"
          />
        </div>
        <p
          v-if="profileErrors.avatar"
          id="settings-avatar-error"
          class="settings-field-error"
        >
          {{ profileErrors.avatar }}
        </p>
        <div>
          <label for="settings-name" class="settings-label"
            >Họ và tên <span class="text-primary">*</span></label
          >
          <input
            id="settings-name"
            v-model="name"
            name="name"
            type="text"
            required
            maxlength="255"
            autocomplete="name"
            class="settings-input"
            :aria-invalid="!!profileErrors.name"
            :aria-describedby="
              profileErrors.name ? 'settings-name-error' : undefined
            "
            @input="emit('clear-error', 'name')"
          />
          <p
            v-if="profileErrors.name"
            id="settings-name-error"
            class="settings-field-error"
          >
            {{ profileErrors.name }}
          </p>
        </div>
        <div>
          <label for="settings-email" class="settings-label"
            >Email đăng nhập</label
          >
          <input
            id="settings-email"
            :value="email"
            name="email"
            type="email"
            autocomplete="username"
            readonly
            class="settings-input bg-bg"
            aria-describedby="settings-email-help"
          />
          <p id="settings-email-help" class="mt-2 text-xs text-text-light">
            Email chỉ hiển thị tại đây để bảo vệ tài khoản đăng nhập.
          </p>
          <p v-if="profileErrors.email" class="settings-field-error">
            {{ profileErrors.email }}
          </p>
        </div>
        <div>
          <label for="settings-phone" class="settings-label"
            >Số điện thoại</label
          >
          <input
            id="settings-phone"
            v-model="phoneNumber"
            name="phone_number"
            type="tel"
            maxlength="20"
            autocomplete="tel"
            class="settings-input"
            placeholder="Nhập số điện thoại"
            :aria-invalid="!!profileErrors.phone_number"
            :aria-describedby="
              profileErrors.phone_number ? 'settings-phone-error' : undefined
            "
            @input="emit('clear-error', 'phone_number')"
          />
          <p
            v-if="profileErrors.phone_number"
            id="settings-phone-error"
            class="settings-field-error"
          >
            {{ profileErrors.phone_number }}
          </p>
        </div>
        <div>
          <span class="settings-label">Vai trò hiện tại</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="role in roles"
              :key="role"
              class="rounded-lg bg-primary/5 text-primary px-3 py-1.5 text-xs font-semibold"
              >{{ role }}</span
            ><span v-if="!roles.length" class="text-sm text-text-light"
              >Chưa có vai trò được gán.</span
            >
          </div>
          <p class="mt-2 text-xs text-text-light">
            Vai trò được quản lý tại mục Phân quyền.
          </p>
        </div>
      </fieldset>
      <div
        class="flex flex-wrap items-center gap-3 pt-5 border-t border-border"
      >
        <button
          type="submit"
          class="settings-btn settings-btn-primary"
          :disabled="busy || !!loadError || !user || !profileDirty"
        >
          <Icon
            :icon="
              profileSaving
                ? 'solar:refresh-bold'
                : 'solar:diskette-bold-duotone'
            "
            :class="{ 'animate-spin': profileSaving }"
          />{{ profileSaving ? "Đang lưu…" : "Lưu hồ sơ" }}
        </button>
        <button
          type="button"
          class="settings-btn"
          :disabled="busy || !profileDirty"
          @click="emit('discard')"
        >
          Hủy thay đổi
        </button>
        <span v-if="profileDirty" class="text-xs text-text-light"
          >Có thay đổi chưa lưu</span
        >
      </div>
    </form>
  </section>
</template>