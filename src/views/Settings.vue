<script setup>
import { Icon } from "@iconify/vue";
import { useSettings } from "@/composables/admin/useSettings";
import SettingsProfileCard from "@/components/admin/settings/SettingsProfileCard.vue";
import SettingsPasswordCard from "@/components/admin/settings/SettingsPasswordCard.vue";
import SettingsAppearanceCard from "@/components/admin/settings/SettingsAppearanceCard.vue";
import "@/assets/settings.css";

const {
  user,
  email,
  loading,
  loadError,
  busy,
  profile,
  profileDirty,
  profileSaving,
  profileError,
  profileSuccess,
  profileNotice,
  profileErrors,
  avatarFile,
  avatarPreview,
  password,
  passwordDirty,
  passwordSaving,
  passwordError,
  passwordSuccess,
  passwordNotice,
  passwordErrors,
  loadProfile,
  selectAvatar,
  resetAvatar,
  discardProfile,
  saveProfile,
  savePassword,
  clearProfileError,
  updatePasswordField,
} = useSettings();
</script>

<template>
  <div class="settings-page space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Cài đặt</h1>
        <p class="mt-2 text-sm text-text-light">
          Quản lý hồ sơ, bảo mật tài khoản và giao diện quản trị NFarmHouse.
        </p>
      </div>
      <button
        type="button"
        class="settings-btn"
        :disabled="busy"
        @click="loadProfile(true)"
      >
        <Icon
          icon="solar:refresh-bold"
          :class="{ 'animate-spin': loading }"
        />Tải lại thông tin
      </button>
    </div>

    <div
      v-if="loadError"
      role="alert"
      class="settings-alert settings-alert-error"
    >
      <Icon icon="solar:danger-circle-bold-duotone" class="shrink-0 text-xl" />
      <div>
        <p>{{ loadError }}</p>
        <button
          type="button"
          class="mt-2 underline font-semibold cursor-pointer"
          :disabled="busy"
          @click="loadProfile(true)"
        >
          Thử lại
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 items-start"
    >
      <SettingsProfileCard
        v-model:name="profile.name"
        v-model:phone-number="profile.phone_number"
        :user="user"
        :loading="loading"
        :busy="busy"
        :load-error="loadError"
        :profile-saving="profileSaving"
        :profile-dirty="profileDirty"
        :profile-error="profileError"
        :profile-success="profileSuccess"
        :profile-notice="profileNotice"
        :profile-errors="profileErrors"
        :avatar-file="avatarFile"
        :avatar-preview="avatarPreview"
        @save="saveProfile"
        @discard="discardProfile"
        @select-avatar="selectAvatar"
        @discard-avatar="resetAvatar"
        @clear-error="clearProfileError"
      />
      <div class="space-y-6 min-w-0">
        <SettingsPasswordCard
          :user="user"
          :email="email"
          :busy="busy"
          :load-error="loadError"
          :password="password"
          :password-saving="passwordSaving"
          :password-dirty="passwordDirty"
          :password-error="passwordError"
          :password-success="passwordSuccess"
          :password-notice="passwordNotice"
          :password-errors="passwordErrors"
          @save="savePassword"
          @update-field="updatePasswordField"
        />
        <SettingsAppearanceCard />
      </div>
    </div>
  </div>
</template>