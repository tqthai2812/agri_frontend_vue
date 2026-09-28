<script setup>
import { computed, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import AddressBookModal from "@/components/client/checkout/AddressBookModal.vue";
import ShippingAddressService from "@/services/client/shippingAddress.service";

const addresses = ref([]);
const modalOpen = ref(false);
const selectedAddressId = ref(null);
const editingAddressId = ref(null);

const loading = ref(false);
const saving = ref(false);
const message = ref("");
const error = ref("");

function isTrue(value) {
    return value === true || value === 1 || value === "1";
}

const sortedAddresses = computed(() =>
    [...addresses.value].sort(
        (a, b) => Number(isTrue(b.is_default)) - Number(isTrue(a.is_default)),
    ),
);

function addressText(address) {
    return [
        address.address_detail,
        address.ward,
        address.district,
        address.province,
    ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(", ");
}

function needsAddressUpdate(address) {
    return (
        String(address.district ?? "").trim() !== "" ||
        String(address.district_id ?? "").trim() !== "" ||
        String(address.province_id ?? "").trim() === "" ||
        String(address.ward_id ?? "").trim() === ""
    );
}

function extractList(response) {
    return response.data?.data || [];
}

function extractOne(response) {
    return response.data?.data || null;
}

function errorText(err, fallback) {
    const first = Object.values(err.response?.data?.errors || {})[0];

    return (
        (Array.isArray(first) ? first[0] : first) ||
        err.response?.data?.message ||
        err.message ||
        fallback
    );
}

function setFlash(text, type = "success") {
    message.value = type === "success" ? text : "";
    error.value = type === "error" ? text : "";
}

async function fetchAddresses() {
    loading.value = true;
    error.value = "";

    try {
        const response = await ShippingAddressService.getAddresses();
        addresses.value = extractList(response);

        const currentExists = addresses.value.some(
            (address) => Number(address.id) === Number(selectedAddressId.value),
        );

        if (!currentExists) {
            const defaultAddress =
                addresses.value.find((address) => isTrue(address.is_default)) ||
                addresses.value[0] ||
                null;

            selectedAddressId.value = defaultAddress?.id || null;
        }

        return true;
    } catch (err) {
        setFlash(
            errorText(err, "Không tải được danh sách địa chỉ."),
            "error",
        );

        return false;
    } finally {
        loading.value = false;
    }
}

async function saveAddress(payload, done) {
    if (saving.value) {
        done?.({
            ok: false,
            message: "Đang lưu địa chỉ. Vui lòng chờ.",
        });
        return;
    }

    saving.value = true;
    error.value = "";
    message.value = "";

    const { id, ...data } = payload;
    let response;

    try {
        response = id
            ? await ShippingAddressService.update(id, data)
            : await ShippingAddressService.create(data);
    } catch (err) {
        const errorMessage = errorText(err, "Không lưu được địa chỉ.");

        setFlash(errorMessage, "error");
        done?.({ ok: false, message: errorMessage });

        saving.value = false;
        return;
    }

    const savedAddress = extractOne(response);
    const savedId = savedAddress?.id ?? id ?? null;

    try {
        if (savedAddress?.id) {
            const nextAddresses = addresses.value.filter(
                (address) => Number(address.id) !== Number(savedAddress.id),
            );

            if (isTrue(savedAddress.is_default)) {
                nextAddresses.forEach((address) => {
                    address.is_default = false;
                });
            }

            addresses.value = [...nextAddresses, savedAddress];
        }

        const refreshed = await fetchAddresses();

        if (
            savedId !== null &&
            addresses.value.some(
                (address) => Number(address.id) === Number(savedId),
            )
        ) {
            selectedAddressId.value = savedId;
        }

        message.value =
            response.data?.message ||
            (id
                ? "Cập nhật địa chỉ thành công."
                : "Thêm địa chỉ mới thành công.");

        if (!refreshed) {
            error.value =
                "Địa chỉ đã được lưu nhưng chưa tải lại được danh sách. Vui lòng bấm Tải lại.";
        }

        done?.({
            ok: true,
            selectedId: selectedAddressId.value,
        });

        editingAddressId.value = null;
        modalOpen.value = false;
    } finally {
        saving.value = false;
    }
}

async function setDefault(addressId) {
    if (saving.value || loading.value) return;

    saving.value = true;
    error.value = "";
    message.value = "";

    try {
        await ShippingAddressService.setDefault(addressId);

        addresses.value.forEach((address) => {
            address.is_default = Number(address.id) === Number(addressId);
        });
        selectedAddressId.value = addressId;

        const refreshed = await fetchAddresses();

        message.value = "Đã đặt làm địa chỉ mặc định.";

        if (!refreshed) {
            error.value =
                "Đã đặt mặc định nhưng chưa tải lại được danh sách. Vui lòng bấm Tải lại.";
        }
    } catch (err) {
        setFlash(
            errorText(err, "Không đặt được địa chỉ mặc định."),
            "error",
        );
    } finally {
        saving.value = false;
    }
}

function editAddress(address) {
    if (saving.value || loading.value) return;

    selectedAddressId.value = address.id;
    editingAddressId.value = address.id;
    modalOpen.value = true;
}

function openCreateAddress() {
    if (saving.value || loading.value) return;

    editingAddressId.value = null;
    modalOpen.value = true;
}

async function deleteAddress(address) {
    if (saving.value || loading.value) return;

    if (isTrue(address.is_default)) {
        window.alert("Không thể xóa địa chỉ mặc định.");
        return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;

    saving.value = true;
    error.value = "";
    message.value = "";

    try {
        await ShippingAddressService.remove(address.id);

        addresses.value = addresses.value.filter(
            (item) => Number(item.id) !== Number(address.id),
        );

        const refreshed = await fetchAddresses();

        message.value = "Đã xóa địa chỉ.";

        if (!refreshed) {
            error.value =
                "Đã xóa địa chỉ nhưng chưa tải lại được danh sách. Vui lòng bấm Tải lại.";
        }
    } catch (err) {
        setFlash(errorText(err, "Không xóa được địa chỉ."), "error");
    } finally {
        saving.value = false;
    }
}

onMounted(fetchAddresses);
</script>

<template>
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header
            class="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                    <Icon icon="mdi:map-marker-multiple-outline" class="text-2xl" />
                </span>

                <div>
                    <h1 class="text-lg font-bold text-[#123d27]">Địa chỉ của tôi</h1>
                    <p class="mt-0.5 text-xs text-slate-400">
                        Quản lý địa chỉ nhận hàng của bạn.
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2">
                <button type="button"
                    class="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-semibold text-[#07532b] disabled:opacity-50"
                    :disabled="saving || loading" @click="fetchAddresses">
                    <Icon icon="mdi:refresh" class="text-lg" />
                    Tải lại
                </button>

                <button type="button"
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white transition hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="saving || loading" @click="openCreateAddress">
                    <Icon icon="mdi:plus" class="text-lg" />
                    Thêm địa chỉ mới
                </button>
            </div>
        </header>

        <div class="p-5 sm:p-7">
            <div v-if="message" role="status"
                class="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
                <Icon icon="mdi:check-circle-outline" class="shrink-0 text-xl" />
                {{ message }}
            </div>

            <div v-if="error" role="alert"
                class="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                <Icon icon="mdi:alert-circle-outline" class="shrink-0 text-xl" />
                {{ error }}
            </div>

            <div v-if="loading"
                class="grid min-h-52 place-items-center rounded-2xl border border-slate-100 bg-slate-50">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto animate-spin text-4xl text-[#07532b]" />
                    <p class="mt-3 text-xs font-semibold text-slate-400">
                        Đang tải địa chỉ...
                    </p>
                </div>
            </div>

            <div v-else-if="sortedAddresses.length" class="space-y-4">
                <article v-for="address in sortedAddresses" :key="address.id" class="rounded-2xl border p-5 transition"
                    :class="isTrue(address.is_default)
                        ? 'border-[#8fb49c] bg-[#f7fbf8]'
                        : 'border-slate-200 hover:border-[#b7cebf]'
                        ">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div class="flex min-w-0 gap-3">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                <Icon :icon="address.address_type === 'office'
                                    ? 'mdi:office-building-outline'
                                    : 'mdi:home-outline'
                                    " class="text-xl" />
                            </span>

                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                    <strong class="text-sm text-[#123d27]">
                                        {{ address.receiver_name }}
                                    </strong>

                                    <span class="h-4 w-px bg-slate-200"></span>

                                    <span class="text-sm text-slate-500">
                                        {{ address.receiver_phone }}
                                    </span>

                                    <span v-if="isTrue(address.is_default)"
                                        class="rounded border border-[#0a7139] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0a7139]">
                                        Mặc định
                                    </span>
                                </div>

                                <p class="mt-2 text-xs leading-5 text-slate-500">
                                    {{ addressText(address) }}
                                </p>

                                <span
                                    class="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">
                                    {{
                                        address.address_type === "office"
                                            ? "Văn phòng"
                                            : "Nhà riêng"
                                    }}
                                </span>

                                <p v-if="needsAddressUpdate(address)"
                                    class="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                                    Địa chỉ này cần cập nhật tỉnh/thành và phường/xã mới
                                    trước khi thanh toán.
                                </p>
                            </div>
                        </div>

                        <div class="flex shrink-0 flex-wrap gap-3 text-xs font-semibold">
                            <button type="button"
                                class="text-[#0a7139] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                :disabled="saving" @click="editAddress(address)">
                                Cập nhật
                            </button>

                            <button type="button"
                                class="text-red-400 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                :disabled="saving || isTrue(address.is_default)" @click="deleteAddress(address)">
                                Xóa
                            </button>
                        </div>
                    </div>

                    <button v-if="!isTrue(address.is_default)" type="button"
                        class="mt-4 rounded-full border border-[#9dbba8] px-4 py-2 text-[10px] font-semibold text-[#07532b] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="saving" @click="setDefault(address.id)">
                        Thiết lập mặc định
                    </button>
                </article>
            </div>

            <div v-else-if="!error"
                class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                <Icon icon="mdi:map-marker-off-outline" class="mx-auto text-5xl text-slate-300" />

                <h2 class="mt-4 text-base font-bold text-[#123d27]">
                    Chưa có địa chỉ nhận hàng
                </h2>
                <p class="mt-1 text-xs text-slate-400">
                    Thêm địa chỉ để thanh toán nhanh hơn.
                </p>

                <button type="button"
                    class="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white transition hover:bg-[#0a6837]"
                    @click="openCreateAddress">
                    <Icon icon="mdi:plus" class="text-lg" />
                    Thêm địa chỉ
                </button>
            </div>
        </div>

        <AddressBookModal v-model="modalOpen" :addresses="addresses" :selected-address-id="selectedAddressId"
            :edit-address-id="editingAddressId" :saving="saving" @confirm="selectedAddressId = Number($event)"
            @save-address="saveAddress" />
    </section>
</template>