<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/stores/shared/authStore";
import { accessError, useRoleStore } from "@/stores/roleStore";
import Service from "@/services/role.service";
import AccessDialog from "@/components/access/AccessDialog.vue";
import AccessFeedback from "@/components/access/AccessFeedback.vue";
import AccessPagination from "@/components/access/AccessPagination.vue";
import PermissionMatrix from "@/components/access/PermissionMatrix.vue";
const props = defineProps({
  role: Object,
  mode: { type: String, default: "view" },
});
const emit = defineEmits(["close", "saved"]);
const auth = useAuthStore(),
  store = useRoleStore();
const name = ref(""),
  selected = ref([]),
  original = ref(""),
  error = ref(""),
  saving = ref(false),
  loading = ref(true),
  impactConfirmed = ref(false);
const detail = ref(null),
  members = ref([]),
  membersMeta = ref({ current_page: 1, last_page: 1, total: 0 }),
  membersBusy = ref(false);
const creating = computed(
  () => props.mode === "create" || props.mode === "clone",
);
const readOnly = computed(
  () =>
    props.mode === "view" ||
    (!creating.value && detail.value?.name === "admin"),
);
const reserved = computed(
  () =>
    !creating.value &&
    ["admin", "staff", "customer"].includes(detail.value?.name),
);
const canAssign = computed(
  () => !readOnly.value && auth.hasPermission("role.assign-permission"),
);
const snapshot = () =>
  JSON.stringify([name.value.trim(), [...selected.value].sort()]);
const dirty = computed(
  () =>
    !loading.value &&
    !readOnly.value &&
    (creating.value
      ? !!name.value.trim() || selected.value.length > 0
      : original.value !== snapshot()),
);
const permissionDirty = computed(
  () =>
    JSON.stringify([...selected.value].sort()) !==
    JSON.stringify((detail.value?.permissions || []).map((p) => p.name).sort()),
);
const groups = computed(() => {
  if (Object.keys(store.permissionGroups).length) return store.permissionGroups;
  return (detail.value?.permissions || []).reduce((out, p) => {
    const key = p.name.split(".")[0];
    (out[key] ||= []).push({ ...p, label: p.name, group_label: key });
    return out;
  }, {});
});
function close() {
  if (
    !saving.value &&
    (!dirty.value ||
      window.confirm("Bạn còn thay đổi chưa lưu. Bỏ các thay đổi này?"))
  )
    emit("close");
}
onBeforeRouteLeave(
  () =>
    !saving.value &&
    (!dirty.value || window.confirm("Bỏ thay đổi vai trò chưa lưu?")),
);
function beforeUnload(event) {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
async function fetchMembers(page = 1) {
  if (!auth.hasPermission("user.view") || !props.role) return;
  membersBusy.value = true;
  try {
    const response = await Service.getRole(props.role.id, {
      members: 1,
      members_page: page,
    });
    members.value = response.data.members || [];
    Object.assign(membersMeta.value, response.data.members_meta || {});
  } catch (e) {
    error.value = accessError(e);
  } finally {
    membersBusy.value = false;
  }
}
onMounted(async () => {
  window.addEventListener("beforeunload", beforeUnload);
  try {
    if (props.role) {
      const response = await Service.getRole(
        props.role.id,
        !creating.value && auth.hasPermission("user.view")
          ? { members: 1 }
          : {},
      );
      detail.value = response.data.data;
      members.value = response.data.members || [];
      Object.assign(membersMeta.value, response.data.members_meta || {});
    }
    name.value = creating.value
      ? props.mode === "clone"
        ? `${detail.value.name} - bản sao`
        : ""
      : detail.value.name;
    selected.value = (detail.value?.permissions || []).map((p) => p.name);
    original.value = snapshot();
    await store.fetchPermissions();
  } catch (e) {
    error.value = accessError(e);
  } finally {
    loading.value = false;
  }
});
onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));
async function save() {
  if (readOnly.value || saving.value || !name.value.trim() || !dirty.value)
    return;
  if (
    !creating.value &&
    permissionDirty.value &&
    detail.value.users_count > 0 &&
    !impactConfirmed.value
  ) {
    impactConfirmed.value = true;
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const payload = { name: name.value.trim() };
    if (canAssign.value && (creating.value || permissionDirty.value))
      payload.permissions = selected.value;
    const response = creating.value
      ? await Service.createRole(payload)
      : await Service.updateRole(detail.value.id, payload);
    original.value = snapshot();
    await store.refreshAuth();
    emit("saved", response.data.message);
  } catch (e) {
    error.value = accessError(e);
    impactConfirmed.value = false;
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <AccessDialog
    :title="
      mode === 'view'
        ? 'Chi tiết vai trò'
        : creating
          ? 'Tạo vai trò'
          : 'Chỉnh sửa vai trò'
    "
    wide
    :busy="saving"
    @close="close"
  >
    <div v-if="loading" aria-busy="true" class="space-y-4">
      <div v-for="n in 4" :key="n" class="ac-skeleton h-16" />
    </div>
    <form v-else id="role-form" class="space-y-5" @submit.prevent="save">
      <AccessFeedback :error="error" @dismiss="error = ''" />
      <div class="grid sm:grid-cols-[1fr_auto] gap-5 items-end">
        <label class="block"
          ><span class="ac-label"
            >Tên vai trò <span class="text-primary">*</span></span
          ><input
            v-model="name"
            class="ac-input"
            maxlength="100"
            required
            :readonly="readOnly || reserved"
            :disabled="saving"
            placeholder="Ví dụ: Nhân viên kho"
        /></label>
        <p v-if="!creating" class="text-sm text-text-light pb-3">
          {{ detail?.users_count || 0 }} tài khoản đang sử dụng
        </p>
      </div>
      <p v-if="reserved" class="text-xs text-text-light">
        Vai trò hệ thống: giữ nguyên tên để các nghiệp vụ đăng ký và kiểm tra
        Admin hoạt động đúng.
      </p>
      <p
        v-if="detail?.name === 'customer' && !creating"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        Vai trò customer tự động gán cho khách đăng ký mới. Quyền thêm ở đây áp
        dụng cho cả các khách hàng đăng ký sau này.
      </p>
      <p
        v-if="detail?.name === 'admin' && !creating"
        class="rounded-xl bg-primary/5 p-4 text-sm text-primary"
      >
        Admin có toàn quyền qua Gate. Danh sách dưới đây là các quyền gán tường
        minh; không giới hạn quyền thực tế của Admin.
      </p>
      <AccessFeedback
        v-if="store.errors.permissions"
        :error="store.errors.permissions"
        @dismiss="store.errors.permissions = ''"
      />
      <PermissionMatrix
        v-model="selected"
        :groups="groups"
        :readonly="!canAssign"
        :busy="saving"
      />
      <p v-if="!readOnly && !canAssign" class="text-sm text-text-light">
        Bạn có thể sửa tên. Cần quyền role.assign-permission để đổi các quyền
        của vai trò.
      </p>
      <section
        v-if="!creating && auth.hasPermission('user.view')"
        class="border-t border-border pt-4"
      >
        <h3 class="font-semibold text-sm mb-3">Tài khoản sử dụng vai trò</h3>
        <div v-if="membersBusy" class="ac-skeleton h-16" />
        <ul v-else class="divide-y divide-border">
          <li
            v-for="member in members"
            :key="member.id"
            class="flex flex-wrap justify-between gap-2 py-3 text-sm"
          >
            <span
              >{{ member.name }}
              <span class="text-text-light">· {{ member.email }}</span></span
            ><span class="ac-badge">{{
              member.is_active ? "Hoạt động" : "Đã khóa"
            }}</span>
          </li>
        </ul>
        <p
          v-if="!members.length && !membersBusy"
          class="text-sm text-text-light"
        >
          Chưa có tài khoản sử dụng.
        </p>
        <AccessPagination
          v-if="membersMeta.total"
          :meta="membersMeta"
          :busy="membersBusy"
          @change="fetchMembers"
        />
      </section>
      <p
        v-if="impactConfirmed"
        role="alert"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        Đổi quyền sẽ ảnh hưởng {{ detail.users_count }} tài khoản đang dùng vai
        trò này. Nhấn “Xác nhận cập nhật” để tiếp tục.
      </p>
    </form>
    <template #footer>
      <span v-if="dirty" class="mr-auto self-center text-xs text-amber-700"
        >Có thay đổi chưa lưu</span
      >
      <button class="ac-btn" type="button" :disabled="saving" @click="close">
        {{ readOnly ? "Đóng" : "Hủy" }}
      </button>
      <button
        v-if="!readOnly"
        class="ac-btn ac-btn-primary"
        type="submit"
        form="role-form"
        :disabled="saving || loading || !dirty || !name.trim()"
      >
        {{
          saving
            ? "Đang lưu…"
            : impactConfirmed
              ? "Xác nhận cập nhật"
              : "Lưu vai trò"
        }}
      </button>
    </template>
  </AccessDialog>
</template>