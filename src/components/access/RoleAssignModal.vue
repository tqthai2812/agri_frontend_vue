<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { accessError, useRoleStore } from "@/stores/roleStore";
import Service from "@/services/role.service";
import AccessDialog from "./AccessDialog.vue";
import AccessFeedback from "./AccessFeedback.vue";
const props = defineProps({ user: { type: Object, required: true } });
const emit = defineEmits(["close", "saved"]);
const store = useRoleStore(),
  selected = ref([...props.user.roles]),
  saving = ref(false),
  error = ref("");
const signature = (value) => JSON.stringify([...value].sort());
const original = ref(signature(selected.value));
const dirty = computed(() => original.value !== signature(selected.value));
const confirmClose = () =>
  !dirty.value || window.confirm("Bỏ các vai trò đã chọn nhưng chưa lưu?");
function close() {
  if (!saving.value && confirmClose()) emit("close");
}
const beforeUnload = (event) => {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
};
window.addEventListener("beforeunload", beforeUnload);
onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));
onBeforeRouteLeave(() => !saving.value && confirmClose());
async function save() {
  if (saving.value || !dirty.value) return;
  saving.value = true;
  error.value = "";
  try {
    const response = await Service.assignRoles(props.user.id, selected.value);
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
  <AccessDialog title="Gán vai trò" :busy="saving" @close="close">
    <div class="space-y-4">
      <p class="text-sm">
        Tài khoản <strong>{{ user.name }}</strong
        ><span class="block text-text-light mt-1">{{ user.email }}</span>
      </p>
      <p class="text-xs text-text-light">
        Có thể gán nhiều vai trò. Bỏ chọn tất cả sẽ thu hồi vai trò; quyền trực
        tiếp vẫn được giữ.
      </p>
      <AccessFeedback
        :error="error || store.errors.options"
        @dismiss="
          error = '';
          store.errors.options = '';
        "
      />
      <div v-if="store.loading.options" class="ac-skeleton h-24" />
      <div v-else class="grid sm:grid-cols-2 gap-3">
        <label
          v-for="role in store.roleOptions"
          :key="role.id"
          class="flex items-center gap-3 rounded-xl border p-4 text-sm cursor-pointer"
          :class="
            selected.includes(role.name)
              ? 'border-primary bg-primary/5'
              : 'border-border'
          "
        >
          <input
            v-model="selected"
            type="checkbox"
            class="ac-check"
            :value="role.name"
            :disabled="saving || role.assignable === false"
          />
          <span class="break-all"
            >{{ role.name
            }}<small
              v-if="role.assignable === false"
              class="block text-xs text-text-light mt-1"
              >Chỉ Admin hoặc người đủ thẩm quyền được cấp</small
            ></span
          >
        </label>
      </div>
      <p v-if="!selected.length" role="status" class="text-sm text-amber-700">
        Tài khoản sẽ không còn vai trò nào sau khi lưu.
      </p>
    </div>
    <template #footer
      ><span v-if="dirty" class="mr-auto text-xs text-amber-700 self-center"
        >Có thay đổi chưa lưu</span
      ><button class="ac-btn" :disabled="saving" @click="close">Hủy</button
      ><button
        class="ac-btn ac-btn-primary"
        :disabled="
          saving || !dirty || store.loading.options || !!store.errors.options
        "
        @click="save"
      >
        {{ saving ? "Đang lưu…" : "Lưu vai trò" }}
      </button></template
    >
  </AccessDialog>
</template>