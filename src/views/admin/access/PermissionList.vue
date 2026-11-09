<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoleStore } from "@/stores/roleStore";
import AccessShell from "@/components/access/AccessShell.vue";
import AccessFeedback from "@/components/access/AccessFeedback.vue";
const store = useRoleStore(),
  search = ref(""),
  module = ref("");
const normalize = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
const groups = computed(() =>
  Object.entries(store.permissionGroups)
    .filter(([key]) => !module.value || key === module.value)
    .map(([key, items]) => [
      key,
      items.filter((p) =>
        normalize(`${p.name} ${p.label} ${p.description}`).includes(
          normalize(search.value),
        ),
      ),
    ])
    .filter(([, items]) => items.length),
);
const total = computed(
  () => Object.values(store.permissionGroups).flat().length,
);
onMounted(() => store.fetchPermissions());
</script>
<template>
  <AccessShell
    title="Danh sách quyền"
    description="Tra cứu quyền do hệ thống định nghĩa. Mã quyền gắn với nghiệp vụ backend và không được tạo tùy ý từ giao diện."
  >
    <template #actions
      ><span class="ac-badge">{{ total }} quyền trong hệ thống</span></template
    >
    <AccessFeedback
      :error="store.errors.permissions"
      @dismiss="store.errors.permissions = ''"
    />
    <div class="flex flex-wrap gap-3">
      <label class="grow"
        ><span class="sr-only">Tìm quyền</span
        ><input
          v-model="search"
          class="ac-input"
          type="search"
          placeholder="Tìm mã hoặc tên quyền…"
      /></label>
      <select
        v-model="module"
        aria-label="Nhóm quyền"
        class="ac-input sm:max-w-60"
      >
        <option value="">Tất cả nhóm</option>
        <option
          v-for="(items, key) in store.permissionGroups"
          :key="key"
          :value="key"
        >
          {{ items[0]?.group_label || key }}
        </option>
      </select>
      <button
        class="ac-btn"
        :disabled="store.loading.permissions"
        @click="store.fetchPermissions"
      >
        Tải lại
      </button>
    </div>
    <div v-if="store.loading.permissions" aria-busy="true" class="space-y-3">
      <div v-for="n in 5" :key="n" class="ac-skeleton h-20" />
    </div>
    <section v-for="[key, items] in groups" v-else :key="key" class="ac-panel">
      <h2 class="font-bold mb-4">
        {{ items[0].group_label || key }}
        <span class="text-text-light text-sm font-normal"
          >{{ items.length }} quyền</span
        >
      </h2>
      <div class="divide-y divide-border">
        <article
          v-for="permission in items"
          :key="permission.id"
          class="grid gap-3 py-4 md:grid-cols-[1fr_1fr]"
        >
          <div>
            <h3 class="font-semibold text-sm">{{ permission.label }}</h3>
            <code class="mt-1 block text-xs text-primary break-all">{{
              permission.name
            }}</code>
            <p class="text-xs text-text-light leading-relaxed mt-2">
              {{ permission.description }}
            </p>
          </div>
          <div>
            <p class="text-xs text-text-light mb-2">Vai trò gán tường minh</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="role in permission.roles"
                :key="role.id"
                class="ac-badge"
                >{{ role.name }}</span
              ><span
                v-if="!permission.roles.length"
                class="text-sm text-text-light"
                >Chưa có vai trò sử dụng</span
              >
            </div>
          </div>
        </article>
      </div>
    </section>
    <p class="text-xs text-text-light">
      Admin có toàn quyền qua Gate, kể cả khi không nằm trong các nhãn gán tường
      minh ở trên.
    </p>
    <p
      v-if="!groups.length && !store.loading.permissions"
      class="ac-panel ac-empty"
    >
      Không có quyền phù hợp.
    </p>
  </AccessShell>
</template>