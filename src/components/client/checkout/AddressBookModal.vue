<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import LocationService from "@/services/client/location.service";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  addresses: { type: Array, default: () => [] },
  selectedAddressId: { type: [Number, String], default: null },
  editAddressId: { type: [Number, String], default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "confirm",
  "save-address",
]);

const tempSelectedId = ref(null);
const showForm = ref(false);
const editingId = ref(null);

const localError = ref("");
const locationError = ref("");
const legacyMessage = ref("");

const awaitingSave = ref(false);
const loadingProvinces = ref(false);
const loadingWards = ref(false);

const provinces = ref([]);
const wards = ref([]);

let wardVersion = 0;
let formVersion = 0;

const emptyForm = () => ({
  receiver_name: "",
  receiver_phone: "",
  province_id: "",
  ward_id: "",
  address_detail: "",
  address_type: "home",
  is_default: false,
});

const form = reactive(emptyForm());

const busy = computed(() => props.saving || awaitingSave.value);

const selectedProvince = computed(() =>
  provinces.value.find(
    (item) => String(item.id) === String(form.province_id),
  ),
);

const selectedWard = computed(() =>
  wards.value.find(
    (item) => String(item.id) === String(form.ward_id),
  ),
);

const canSave = computed(
  () =>
    !busy.value &&
    !loadingProvinces.value &&
    !loadingWards.value &&
    !locationError.value &&
    Boolean(selectedProvince.value) &&
    Boolean(selectedWard.value),
);

const validSelection = computed(() =>
  props.addresses.some(
    (item) => Number(item.id) === Number(tempSelectedId.value),
  ),
);

function isTrue(value) {
  return value === true || value === 1 || value === "1";
}

function addressText(address) {
  return [
    address.address_detail,
    address.ward,
    address.district,
    address.province,
  ].filter(Boolean).join(", ");
}

function errorText(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Không tải được danh sách địa phương."
  );
}

async function loadProvinces() {
  if (provinces.value.length) return true;

  loadingProvinces.value = true;
  locationError.value = "";

  try {
    const response = await LocationService.getProvinces();
    const data = response.data?.data;

    if (!Array.isArray(data) || !data.length) {
      throw new Error("Danh sách tỉnh/thành phố đang trống.");
    }

    provinces.value = data.map((item) => ({
      ...item,
      id: String(item.id),
    }));

    return true;
  } catch (error) {
    locationError.value = errorText(error);
    return false;
  } finally {
    loadingProvinces.value = false;
  }
}

async function loadWards(provinceId, selectedId = "") {
  const version = ++wardVersion;

  wards.value = [];
  form.ward_id = "";
  locationError.value = "";

  if (!provinceId) {
    loadingWards.value = false;
    return;
  }

  loadingWards.value = true;

  try {
    const response = await LocationService.getWards(provinceId);

    if (version !== wardVersion) return;

    const data = response.data?.data;

    if (!Array.isArray(data) || !data.length) {
      throw new Error("Chưa tải được phường/xã của tỉnh đã chọn.");
    }

    wards.value = data.map((item) => ({
      ...item,
      id: String(item.id),
      province_id: String(item.province_id),
    }));

    if (
      selectedId &&
      wards.value.some((item) => item.id === String(selectedId))
    ) {
      form.ward_id = String(selectedId);
    }
  } catch (error) {
    if (version === wardVersion) {
      locationError.value = errorText(error);
    }
  } finally {
    if (version === wardVersion) {
      loadingWards.value = false;
    }
  }
}

async function provinceChanged() {
  localError.value = "";
  await loadWards(form.province_id);
}

async function retryLocations() {
  const loaded = await loadProvinces();

  if (loaded && form.province_id) {
    await loadWards(form.province_id, form.ward_id);
  }
}

async function openCreateForm() {
  if (busy.value) return;

  formVersion++;
  wardVersion++;

  editingId.value = null;
  wards.value = [];
  loadingWards.value = false;

  Object.assign(form, emptyForm());
  form.is_default = props.addresses.length === 0;

  localError.value = "";
  legacyMessage.value = "";
  showForm.value = true;

  await loadProvinces();
}

async function openEditForm(address) {
  if (busy.value) return;

  const version = ++formVersion;
  wardVersion++;

  editingId.value = address.id;
  wards.value = [];
  loadingWards.value = false;

  Object.assign(form, emptyForm(), {
    receiver_name: address.receiver_name || "",
    receiver_phone: address.receiver_phone || "",
    address_detail: address.address_detail || "",
    address_type: address.address_type || "home",
    is_default: isTrue(address.is_default),
  });

  localError.value = "";
  legacyMessage.value = "";
  showForm.value = true;

  const loaded = await loadProvinces();

  if (!loaded || version !== formVersion || !props.modelValue) return;

  const isLegacy =
    Boolean(String(address.district || "").trim()) ||
    Boolean(String(address.district_id || "").trim());

  if (isLegacy || !address.province_id || !address.ward_id) {
    legacyMessage.value =
      "Địa chỉ cũ: " + addressText(address) +
      ". Vui lòng chọn lại tỉnh/thành phố và phường/xã hiện tại.";

    return;
  }

  const provinceId = String(Number(address.province_id));
  const wardId = String(Number(address.ward_id));

  if (!provinces.value.some((item) => item.id === provinceId)) {
    legacyMessage.value =
      "Mã tỉnh cũ không còn trong danh sách. Vui lòng chọn lại địa phương.";
    return;
  }

  form.province_id = provinceId;

  await loadWards(provinceId, wardId);

  if (
    version === formVersion &&
    !locationError.value &&
    !form.ward_id
  ) {
    legacyMessage.value =
      "Phường/xã đã lưu không còn khớp danh sách. Vui lòng chọn lại.";
  }
}

function close() {
  if (busy.value) return;

  formVersion++;
  wardVersion++;
  loadingWards.value = false;

  emit("update:modelValue", false);
}

function backToList() {
  if (busy.value) return;

  formVersion++;
  wardVersion++;
  loadingWards.value = false;
  showForm.value = false;
}

function saveAddress() {
  if (!canSave.value) return;

  if (
    !form.receiver_name.trim() ||
    !form.receiver_phone.trim() ||
    !form.address_detail.trim()
  ) {
    localError.value = "Vui lòng nhập đầy đủ thông tin nhận hàng.";
    return;
  }

  localError.value = "";
  awaitingSave.value = true;

  emit(
    "save-address",
    {
      id: editingId.value,
      receiver_name: form.receiver_name.trim(),
      receiver_phone: form.receiver_phone.trim(),
      province_id: selectedProvince.value.id,
      province: selectedProvince.value.name,
      ward_id: selectedWard.value.id,
      ward: selectedWard.value.name,
      district: null,
      district_id: null,
      address_detail: form.address_detail.trim(),
      address_type: form.address_type,
      is_default: Boolean(form.is_default),
    },
    (result) => {
      awaitingSave.value = false;

      if (!result?.ok) {
        localError.value =
          result?.message || "Không lưu được địa chỉ.";
        return;
      }

      tempSelectedId.value =
        result.selectedId || props.selectedAddressId;

      editingId.value = null;
      localError.value = "";
      showForm.value = false;
    },
  );
}

function confirmSelection() {
  if (busy.value || !validSelection.value) return;

  emit("confirm", tempSelectedId.value);
  close();
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;

    tempSelectedId.value = props.selectedAddressId;
    localError.value = "";
    locationError.value = "";
    legacyMessage.value = "";

    const address = props.addresses.find(
      (item) => Number(item.id) === Number(props.editAddressId),
    );

    if (props.editAddressId && address) {
      await openEditForm(address);
    } else if (!props.addresses.length) {
      await openCreateForm();
    } else {
      showForm.value = false;
    }
  },
);

watch(
  () => props.editAddressId,
  async (id) => {
    if (!props.modelValue || !id || busy.value) return;

    const address = props.addresses.find(
      (item) => Number(item.id) === Number(id),
    );

    if (address) await openEditForm(address);
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5"
      @click.self="close">
      <section role="dialog" aria-modal="true" aria-labelledby="address-title"
        class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white text-slate-800 shadow-2xl"
        @keydown.esc="close">
        <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="address-title" class="text-lg font-bold text-[#123d27]">
              {{
                showForm
                  ? editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"
                  : "Địa chỉ của tôi"
              }}
            </h2>
            <p class="mt-1 text-xs text-slate-400">
              Địa chỉ mới gồm tỉnh/thành phố và phường/xã.
            </p>
          </div>

          <button type="button"
            class="grid size-10 place-items-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            :disabled="busy" aria-label="Đóng" @click="close">
            <Icon icon="mdi:close" class="text-2xl" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-5">
          <template v-if="!showForm">
            <div class="space-y-3">
              <div v-for="address in addresses" :key="address.id" class="flex gap-3 rounded-2xl border p-4" :class="Number(tempSelectedId) === Number(address.id)
                ? 'border-[#0a7139] bg-[#f2f8f4]'
                : 'border-slate-200'">
                <label class="flex min-w-0 flex-1 cursor-pointer gap-3">
                  <input v-model="tempSelectedId" type="radio" :value="address.id" :disabled="busy"
                    class="mt-1 size-4 shrink-0 accent-[#07532b]" />

                  <div>
                    <p class="text-sm">
                      <strong>{{ address.receiver_name }}</strong>
                      · {{ address.receiver_phone }}
                    </p>

                    <p class="mt-2 text-xs leading-5 text-slate-500">
                      {{ addressText(address) }}
                    </p>

                    <span v-if="isTrue(address.is_default)"
                      class="mt-2 inline-block text-xs font-semibold text-[#07532b]">
                      Mặc định
                    </span>

                    <p v-if="address.district || address.district_id || !address.province_id || !address.ward_id"
                      class="mt-2 text-xs text-amber-700">
                      Cần cập nhật địa phương trước khi đặt hàng.
                    </p>
                  </div>
                </label>

                <button type="button" class="self-start text-xs font-semibold text-[#0a7139]" :disabled="busy"
                  @click="openEditForm(address)">
                  Cập nhật
                </button>
              </div>
            </div>

            <p v-if="!addresses.length" class="py-6 text-center text-sm text-slate-500">
              Chưa có địa chỉ nhận hàng.
            </p>

            <button type="button"
              class="mt-4 w-full rounded-2xl border border-dashed border-[#8fb49c] py-3 text-sm font-semibold text-[#07532b]"
              :disabled="busy" @click="openCreateForm">
              + Thêm địa chỉ mới
            </button>
          </template>

          <form v-else @submit.prevent="saveAddress">
            <p v-if="legacyMessage"
              class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {{ legacyMessage }}
            </p>

            <p v-if="localError" role="alert" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {{ localError }}
            </p>

            <div v-if="locationError" role="alert" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {{ locationError }}
              <button type="button" class="ml-2 font-semibold underline"
                :disabled="busy || loadingProvinces || loadingWards" @click="retryLocations">
                Tải lại
              </button>
            </div>

            <fieldset :disabled="busy" class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <label>
                  <span class="address-label">Tên người nhận *</span>
                  <input v-model.trim="form.receiver_name" class="address-input" maxlength="255" required />
                </label>

                <label>
                  <span class="address-label">Số điện thoại *</span>
                  <input v-model.trim="form.receiver_phone" type="tel" class="address-input" maxlength="20" required />
                </label>

                <label>
                  <span class="address-label">Tỉnh/Thành phố *</span>
                  <select v-model="form.province_id" class="address-input" :disabled="loadingProvinces" required
                    @change="provinceChanged">
                    <option value="">
                      {{ loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố" }}
                    </option>

                    <option v-for="province in provinces" :key="province.id" :value="province.id">
                      {{ province.name }}
                    </option>
                  </select>
                </label>

                <label>
                  <span class="address-label">Phường/Xã/Đặc khu *</span>
                  <select v-model="form.ward_id" class="address-input" :disabled="!form.province_id || loadingWards"
                    required>
                    <option value="">
                      {{ loadingWards ? "Đang tải..." : "Chọn phường/xã" }}
                    </option>

                    <option v-for="ward in wards" :key="ward.id" :value="ward.id">
                      {{ ward.name }}
                    </option>
                  </select>
                </label>
              </div>

              <label class="block">
                <span class="address-label">Địa chỉ chi tiết *</span>
                <textarea v-model.trim="form.address_detail" class="address-input" rows="3" maxlength="255"
                  placeholder="Số nhà, tên đường, tổ, ấp..." required></textarea>
              </label>

              <div class="flex gap-4 text-sm">
                <label class="flex items-center gap-2">
                  <input v-model="form.address_type" type="radio" value="home" class="accent-[#07532b]" />
                  Nhà riêng
                </label>

                <label class="flex items-center gap-2">
                  <input v-model="form.address_type" type="radio" value="office" class="accent-[#07532b]" />
                  Văn phòng
                </label>
              </div>

              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.is_default" type="checkbox" class="accent-[#07532b]" />
                Đặt làm địa chỉ mặc định
              </label>

              <div class="flex justify-end gap-3">
                <button type="button" class="rounded-full border border-slate-200 px-5 py-2.5 text-sm"
                  @click="backToList">
                  Trở lại
                </button>

                <button type="submit"
                  class="rounded-full bg-[#07532b] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  :disabled="!canSave">
                  {{ busy ? "Đang lưu..." : "Lưu địa chỉ" }}
                </button>
              </div>
            </fieldset>
          </form>
        </div>

        <footer v-if="!showForm" class="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button type="button" class="rounded-full border border-slate-200 px-5 py-2.5 text-sm" :disabled="busy"
            @click="close">
            Hủy
          </button>

          <button type="button"
            class="rounded-full bg-[#07532b] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            :disabled="busy || !validSelection" @click="confirmSelection">
            Xác nhận
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@reference "../../../style.css";

.address-label {
  @apply mb-1.5 block text-xs font-semibold text-slate-600;
}

.address-input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-[#0a7139] disabled:opacity-60;
}
</style>