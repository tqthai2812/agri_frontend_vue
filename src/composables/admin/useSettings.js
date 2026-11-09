import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import SettingsService from "@/services/admin/settings.service";

export function useSettings() {
  const auth = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const loading = ref(true);
  const loadError = ref("");
  const profileSaving = ref(false);
  const passwordSaving = ref(false);
  const profileError = ref("");
  const profileSuccess = ref("");
  const profileNotice = ref("");
  const passwordError = ref("");
  const passwordSuccess = ref("");
  const passwordNotice = ref("");
  const profileErrors = ref({});
  const passwordErrors = ref({});
  const avatarFile = ref(null);
  const avatarPreview = ref("");
  const profile = reactive({ name: "", phone_number: "" });
  const original = reactive({ name: "", phone_number: "" });
  const password = reactive({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  let disposed = false;

  const user = computed(() => auth.user);
  const email = computed(() => user.value?.email || "");
  const busy = computed(
    () => loading.value || profileSaving.value || passwordSaving.value,
  );
  const profileDirty = computed(
    () =>
      profile.name.trim() !== original.name ||
      profile.phone_number.trim() !== original.phone_number ||
      !!avatarFile.value,
  );
  const passwordDirty = computed(() => Object.values(password).some(Boolean));
  const hasChanges = computed(() => profileDirty.value || passwordDirty.value);

  function resetAvatar() {
    if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = "";
    avatarFile.value = null;
  }

  function hydrate(data) {
    profile.name = data.name || "";
    profile.phone_number = data.phone_number || "";
    original.name = profile.name.trim();
    original.phone_number = profile.phone_number.trim();
    resetAvatar();
  }

  function fieldsFrom(error) {
    return Object.fromEntries(
      Object.entries(error.response?.data?.errors || {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? String(value[0] || "") : String(value || ""),
      ]),
    );
  }

  function failureMessage(error, fallback) {
    const status = error.response?.status;
    if (status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 419)
      return "Phiên làm việc đã hết hạn. Vui lòng tải lại trang rồi thử lại.";
    if (status === 413)
      return "Ảnh tải lên vượt quá dung lượng máy chủ cho phép.";
    if (status === 429)
      return "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.";
    if (status >= 500) return "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.";
    return (
      Object.values(fieldsFrom(error))[0] ||
      error.response?.data?.message ||
      fallback
    );
  }

  function focusError(form, errors) {
    for (const key of Object.keys(errors)) {
      const field = form?.elements?.namedItem(key);
      if (field && typeof field.focus === "function") {
        field.focus();
        return;
      }
    }
  }

  async function returnToLogin() {
    if (!disposed)
      await router.replace({
        name: "login",
        query: { redirect: route.fullPath },
      });
  }

  async function loadProfile(force = false) {
    if (busy.value && !loading.value) return;
    if (
      force &&
      hasChanges.value &&
      !window.confirm("Tải lại sẽ bỏ các thay đổi chưa lưu. Tiếp tục?")
    )
      return;
    loading.value = true;
    loadError.value = "";
    try {
      // Shares the authoritative session snapshot and request deduplication from RBAC.
      const current = await auth.fetchUser({ force });
      if (disposed) return;
      if (!current) {
        await returnToLogin();
        return;
      }
      hydrate(current);
      if (force) {
        clearPasswords();
        passwordErrors.value = {};
        passwordError.value = "";
        passwordSuccess.value = "";
        passwordNotice.value = "";
      }
      profileSuccess.value = "";
      profileError.value = "";
      profileNotice.value = "";
      profileErrors.value = {};
    } catch (error) {
      if (!disposed)
        loadError.value = failureMessage(
          error,
          "Không tải được thông tin tài khoản. Vui lòng thử lại.",
        );
    } finally {
      if (!disposed) loading.value = false;
    }
  }

  function selectAvatar(file) {
    if (busy.value || loadError.value || !file) return;
    resetAvatar();
    delete profileErrors.value.avatar;
    profileError.value = "";
    profileSuccess.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      profileErrors.value.avatar = "Chọn ảnh JPG, PNG hoặc WEBP.";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      profileErrors.value.avatar = "Ảnh đại diện không được vượt quá 2 MB.";
      return;
    }
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  }

  function discardProfile() {
    if (busy.value) return;
    profile.name = original.name;
    profile.phone_number = original.phone_number;
    resetAvatar();
    profileErrors.value = {};
    profileError.value = "";
    profileSuccess.value = "";
    profileNotice.value = "";
  }

  async function saveProfile(form) {
    if (busy.value || loadError.value || !profileDirty.value || !user.value)
      return;
    profileErrors.value = {};
    profileError.value = "";
    profileSuccess.value = "";
    profileNotice.value = "";
    if (!profile.name.trim())
      profileErrors.value.name = "Vui lòng nhập họ tên.";
    if (profile.name.trim().length > 255)
      profileErrors.value.name = "Họ tên không được vượt quá 255 ký tự.";
    if (profile.phone_number.trim().length > 20)
      profileErrors.value.phone_number =
        "Số điện thoại không được vượt quá 20 ký tự.";
    if (
      profile.phone_number.trim() &&
      !/^[0-9+\-\s()]{8,20}$/.test(profile.phone_number.trim())
    )
      profileErrors.value.phone_number = "Số điện thoại không hợp lệ.";
    if (Object.keys(profileErrors.value).length) {
      focusError(form, profileErrors.value);
      return;
    }

    const submitted = {
      name: profile.name.trim(),
      phone_number: profile.phone_number.trim(),
      avatar: avatarFile.value,
    };
    profileSaving.value = true;
    try {
      const response = await SettingsService.updateProfile(submitted);
      if (disposed) return;
      if (!disposed) {
        original.name = submitted.name;
        original.phone_number = submitted.phone_number;
        profileSuccess.value = response.data?.message || "Đã cập nhật hồ sơ.";
      }
      // A failed follow-up read must not turn an acknowledged save into a failed save.
      try {
        const current = await auth.fetchUser();
        if (disposed) return;
        if (!current) {
          await returnToLogin();
          return;
        }
        hydrate(current);
      } catch {
        if (!disposed) {
          resetAvatar();
          profileNotice.value =
            "Hồ sơ đã lưu. Chưa tải lại được thông tin mới; hãy nhấn Tải lại thông tin.";
        }
      }
    } catch (error) {
      if (!disposed) {
        profileErrors.value = fieldsFrom(error);
        profileError.value = failureMessage(
          error,
          "Không cập nhật được hồ sơ. Vui lòng thử lại.",
        );
        focusError(form, profileErrors.value);
      }
    } finally {
      if (!disposed) profileSaving.value = false;
    }
  }

  function clearPasswords() {
    Object.keys(password).forEach((key) => {
      password[key] = "";
    });
  }

  async function savePassword(form) {
    if (busy.value || loadError.value || !user.value) return;
    passwordErrors.value = {};
    passwordError.value = "";
    passwordSuccess.value = "";
    passwordNotice.value = "";
    if (!password.current_password)
      passwordErrors.value.current_password =
        "Vui lòng nhập mật khẩu hiện tại.";
    if (password.password.length < 8)
      passwordErrors.value.password = "Mật khẩu mới phải có ít nhất 8 ký tự.";
    if (password.password && password.password === password.current_password)
      passwordErrors.value.password =
        "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (!password.password_confirmation)
      passwordErrors.value.password_confirmation =
        "Vui lòng xác nhận mật khẩu mới.";
    else if (password.password_confirmation !== password.password)
      passwordErrors.value.password_confirmation =
        "Xác nhận mật khẩu không khớp.";
    if (Object.keys(passwordErrors.value).length) {
      focusError(form, passwordErrors.value);
      return;
    }

    passwordSaving.value = true;
    try {
      const response = await SettingsService.changePassword({ ...password });
      if (disposed) return;
      if (!disposed) {
        clearPasswords();
        passwordSuccess.value =
          response.data?.message ||
          "Đã đổi mật khẩu. Sử dụng mật khẩu mới ở lần đăng nhập tiếp theo.";
      }
      try {
        const current = await auth.fetchUser();
        if (!current) await returnToLogin();
      } catch {
        if (!disposed)
          passwordNotice.value =
            "Mật khẩu đã đổi. Nếu phiên đăng nhập hết hạn, hãy đăng nhập lại bằng mật khẩu mới.";
      }
    } catch (error) {
      if (!disposed) {
        passwordErrors.value = fieldsFrom(error);
        passwordError.value = failureMessage(
          error,
          "Không đổi được mật khẩu. Vui lòng thử lại.",
        );
        focusError(form, passwordErrors.value);
      }
    } finally {
      if (!disposed) passwordSaving.value = false;
    }
  }

  function clearProfileError(field) {
    delete profileErrors.value[field];
    profileError.value = "";
    profileSuccess.value = "";
    profileNotice.value = "";
  }

  function updatePasswordField(field, value) {
    if (!Object.hasOwn(password, field)) return;
    password[field] = value;
    delete passwordErrors.value[field];
    passwordError.value = "";
    passwordSuccess.value = "";
    passwordNotice.value = "";
  }

  function beforeUnload(event) {
    if (hasChanges.value || profileSaving.value || passwordSaving.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  onBeforeRouteLeave((to) => {
    if (!auth.isLoggedIn || ["login", "forbidden"].includes(String(to.name)))
      return true;
    if (profileSaving.value || passwordSaving.value) return false;
    return (
      !hasChanges.value ||
      window.confirm("Bạn có thay đổi chưa lưu. Rời trang Cài đặt?")
    );
  });

  onMounted(() => {
    window.addEventListener("beforeunload", beforeUnload);
    void loadProfile();
  });
  onBeforeUnmount(() => {
    disposed = true;
    window.removeEventListener("beforeunload", beforeUnload);
    resetAvatar();
    clearPasswords();
  });

  return {
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
  };
}