<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { accessError, useRoleStore } from "@/stores/roleStore";
import Service from "@/services/role.service";
import AccessDialog from "./AccessDialog.vue";
import AccessFeedback from "./AccessFeedback.vue";
import PermissionMatrix from "./PermissionMatrix.vue";
const props = defineProps({ user: { type: Object, required: true } });
const emit = defineEmits(["close", "saved"]);
const store = useRoleStore(),
  selected = ref([...(props.user.direct_permissions || [])]),
  saving = ref(false),
  error = ref("");
const signature = (items) => JSON.stringify([...items].sort());
const original = ref(signature(selected.value));
const dirty = computed(() => original.value !== signature(selected.value));
const confirmClose = () =>
  !dirty.value || window.confirm("Bỏ thay đổi quyền trực tiếp chưa lưu?");
function close() {
  if (!saving.value && confirmClose()) emit("close");
}
const beforeUnload = (event) => {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
};
onMounted(() => {
  void store.fetchPermissions();
  window.addEventListener("beforeunload", beforeUnload);
});
onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));
onBeforeRouteLeave(() => !saving.value && confirmClose());
async function save() {
  if (saving.value || !dirty.value) return;
  saving.value = true;
  error.value = "";
  try {
    const response = await Service.assignPermissions(
      props.user.id,
      selected.value,
    );
    original.value = signature(selected.value);
    await store.refreshAuth();
    emit("saved", response.data.data.user);
  } catch (e) {
    error.value = accessError(e);
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <AccessDialog title="Quyền trực tiếp" wide :busy="saving" @close="close">
    <div class="space-y-4">
      <div>
        <h3 class="font-semibold">{{ user.name }}</h3>
        <p class="text-xs text-text-light mt-1">{{ user.email }}</p>
      </div>
      <p
        class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-800"
      >
        Ưu tiên cấp quyền qua vai trò. Quyền trực tiếp chỉ bổ sung; bỏ chọn ở
        đây không thu hồi quyền đang được kế thừa từ vai trò.
      </p>
      <p v-if="user.is_super_admin" class="text-sm text-amber-700">
        Tài khoản này là Admin và đã có toàn quyền qua Gate.
      </p>
      <AccessFeedback
        :error="error || store.errors.permissions"
        @dismiss="
          error = '';
          store.errors.permissions = '';
        "
      />
      <div v-if="store.loading.permissions" class="ac-skeleton h-40" />
      <PermissionMatrix
        v-else
        v-model="selected"
        :groups="store.permissionGroups"
        :busy="saving"
      />
      <details class="rounded-xl border border-border p-4">
        <summary class="text-sm font-semibold cursor-pointer">
          {{ user.inherited_permissions?.length || 0 }} quyền đang kế thừa
        </summary>
        <div class="flex flex-wrap gap-2 mt-3">
          <code
            v-for="name in user.inherited_permissions"
            :key="name"
            class="ac-badge break-all"
            >{{ name }}</code
          >
        </div>
      </details>
    </div>
    <template #footer
      ><span v-if="dirty" class="mr-auto text-xs text-amber-700 self-center"
        >Có thay đổi chưa lưu</span
      ><button class="ac-btn" :disabled="saving" @click="close">Hủy</button
      ><button
        class="ac-btn ac-btn-primary"
        :disabled="
          saving ||
          !dirty ||
          store.loading.permissions ||
          !!store.errors.permissions
        "
        @click="save"
      >
        {{ saving ? "Đang lưu…" : "Lưu quyền trực tiếp" }}
      </button></template
    >
  </AccessDialog>
</template>