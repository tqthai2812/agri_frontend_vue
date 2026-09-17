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

const sortedAddresses = computed(() => {
    return [...addresses.value].sort((a, b) => {
        return Number(b.is_default) - Number(a.is_default);
    });
});

function extractList(response) {
    return response.data?.data || [];
}

function extractOne(response) {
    return response.data?.data || null;
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

        const defaultAddress =
            addresses.value.find((address) => address.is_default) ||
            addresses.value[0] ||
            null;

        selectedAddressId.value = defaultAddress?.id || null;
    } catch (err) {
        setFlash(
            err.response?.data?.message || "Không tải được danh sách địa chỉ.",
            "error",
        );
    } finally {
        loading.value = false;
    }
}

async function saveAddress(payload) {
    saving.value = true;
    error.value = "";
    message.value = "";

    try {
        const { id, ...data } = payload;

        const response = id
            ? await ShippingAddressService.update(id, data)
            : await ShippingAddressService.create(data);

        const savedAddress = extractOne(response);

        await fetchAddresses();

        if (savedAddress?.id) {
            selectedAddressId.value = savedAddress.id;
        }

        editingAddressId.value = null;
        modalOpen.value = false;

        setFlash(
            id
                ? "Cập nhật địa chỉ thành công."
                : "Thêm địa chỉ mới thành công.",
        );
    } catch (err) {
        setFlash(
            err.response?.data?.message || "Không lưu được địa chỉ.",
            "error",
        );
    } finally {
        saving.value = false;
    }
}

async function setDefault(addressId) {
    saving.value = true;
    error.value = "";
    message.value = "";

    try {
        await ShippingAddressService.setDefault(addressId);
        await fetchAddresses();

        selectedAddressId.value = addressId;

        setFlash("Đã đặt làm địa chỉ mặc định.");
    } catch (err) {
        setFlash(
            err.response?.data?.message || "Không đặt được địa chỉ mặc định.",
            "error",
        );
    } finally {
        saving.value = false;
    }
}

function editAddress(address) {
    selectedAddressId.value = address.id;
    editingAddressId.value = address.id;
    modalOpen.value = true;
}

function openCreateAddress() {
    editingAddressId.value = null;
    modalOpen.value = true;
}

async function deleteAddress(address) {
    if (address.is_default) {
        window.alert("Không thể xóa địa chỉ mặc định.");
        return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa địa chỉ này?");

    if (!confirmed) {
        return;
    }

    saving.value = true;
    error.value = "";
    message.value = "";

    try {
        await ShippingAddressService.remove(address.id);
        await fetchAddresses();

        setFlash("Đã xóa địa chỉ.");
    } catch (err) {
        setFlash(
            err.response?.data?.message || "Không xóa được địa chỉ.",
            "error",
        );
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    fetchAddresses();
});
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
                    <h1 class="text-lg font-bold text-[#123d27]">
                        Địa chỉ của tôi
                    </h1>

                    <p class="mt-0.5 text-xs text-slate-400">
                        Quản lý địa chỉ nhận hàng của bạn.
                    </p>
                </div>
            </div>

            <button type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white transition hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="saving" @click="openCreateAddress">
                <Icon icon="mdi:plus" class="text-lg" />
                Thêm địa chỉ mới
            </button>
        </header>

        <div class="p-5 sm:p-7">
            <div v-if="message"
                class="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
                <Icon icon="mdi:check-circle-outline" class="text-xl" />
                {{ message }}
            </div>

            <div v-if="error"
                class="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                <Icon icon="mdi:alert-circle-outline" class="text-xl" />
                {{ error }}
            </div>

            <div v-if="loading"
                class="grid min-h-52 place-items-center rounded-2xl border border-slate-100 bg-slate-50">
                <div class="text-center">
                    <Icon icon="mdi:loading" class="mx-auto text-4xl text-[#07532b] animate-spin" />

                    <p class="mt-3 text-xs font-semibold text-slate-400">
                        Đang tải địa chỉ...
                    </p>
                </div>
            </div>

            <div v-else-if="sortedAddresses.length" class="space-y-4">
                <article v-for="address in sortedAddresses" :key="address.id" class="rounded-2xl border p-5 transition"
                    :class="address.is_default
                        ? 'border-[#8fb49c] bg-[#f7fbf8]'
                        : 'border-slate-200 hover:border-[#b7cebf]'">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div class="flex min-w-0 gap-3">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                <Icon :icon="address.address_type === 'office'
                                    ? 'mdi:office-building-outline'
                                    : 'mdi:home-outline'" class="text-xl" />
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

                                    <span v-if="address.is_default"
                                        class="rounded border border-[#0a7139] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0a7139]">
                                        Mặc định
                                    </span>
                                </div>

                                <p class="mt-2 text-xs leading-5 text-slate-500">
                                    {{ address.full_address || `${address.address_detail}, ${address.ward},
                                    ${address.district}, ${address.province}` }}
                                </p>

                                <span
                                    class="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">
                                    {{
                                        address.address_type === "office"
                                            ? "Văn phòng"
                                            : "Nhà riêng"
                                    }}
                                </span>
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
                                :disabled="saving || address.is_default" @click="deleteAddress(address)">
                                Xóa
                            </button>
                        </div>
                    </div>

                    <button v-if="!address.is_default" type="button"
                        class="mt-4 rounded-full border border-[#9dbba8] px-4 py-2 text-[10px] font-semibold text-[#07532b] transition hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="saving" @click="setDefault(address.id)">
                        Thiết lập mặc định
                    </button>
                </article>
            </div>

            <div v-else class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                <Icon icon="mdi:map-marker-off-outline" class="mx-auto text-5xl text-slate-300" />

                <h2 class="mt-4 text-base font-bold text-[#123d27]">
                    Chưa có địa chỉ nhận hàng
                </h2>

                <p class="mt-1 text-xs text-slate-400">
                    Thêm địa chỉ để checkout nhanh hơn.
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