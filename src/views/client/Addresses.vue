<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import AddressBookModal from '@/components/client/checkout/AddressBookModal.vue'

const addresses = ref([
    {
        id: 1,
        user_id: 3,
        receiver_name: 'Trần Quốc Thái',
        receiver_phone: '0334745378',
        province: 'Thành phố Cần Thơ',
        district: 'Quận Ninh Kiều',
        ward: 'Phường Hưng Lợi',
        address_detail:
            '30/4, đường 3 Tháng 2',
        address_type: 'home',
        is_default: true,
    },
    {
        id: 2,
        user_id: 3,
        receiver_name: 'Trần Quốc Thái',
        receiver_phone: '0334745378',
        province: 'Thành phố Cần Thơ',
        district: 'Quận Ninh Kiều',
        ward: 'Phường Tân An',
        address_detail:
            'Văn phòng NFarmHouse, đường Hai Bà Trưng',
        address_type: 'office',
        is_default: false,
    },
])

const modalOpen = ref(false)
const selectedAddressId = ref(1)
const editingAddressId = ref(null)
const message = ref('')

const sortedAddresses = computed(() => {
    return [...addresses.value].sort(
        (a, b) =>
            Number(b.is_default) -
            Number(a.is_default),
    )
})

function saveAddress(payload) {
    if (payload.is_default) {
        addresses.value.forEach((address) => {
            address.is_default = false
        })
    }

    if (payload.id) {
        const index = addresses.value.findIndex(
            (address) => address.id === payload.id,
        )

        if (index !== -1) {
            addresses.value[index] = {
                ...addresses.value[index],
                ...payload,
            }
        }

        message.value =
            'Cập nhật địa chỉ thành công.'

        return
    }

    const newAddress = {
        ...payload,

        id:
            Math.max(
                0,
                ...addresses.value.map((address) =>
                    Number(address.id),
                ),
            ) + 1,

        user_id: 3,
    }

    addresses.value.push(newAddress)
    selectedAddressId.value = newAddress.id

    message.value =
        'Thêm địa chỉ mới thành công.'
}

function setDefault(addressId) {
    addresses.value.forEach((address) => {
        address.is_default =
            address.id === addressId
    })

    selectedAddressId.value = addressId
    message.value =
        'Đã đặt làm địa chỉ mặc định.'

    // Backend:
    // PATCH /api/shipping-addresses/:id/default
}

function editAddress(address) {
    selectedAddressId.value = address.id
    editingAddressId.value = address.id
    modalOpen.value = true
}

function openCreateAddress() {
    editingAddressId.value = null
    modalOpen.value = true
}

function deleteAddress(address) {
    if (address.is_default) {
        window.alert(
            'Không thể xóa địa chỉ mặc định.',
        )

        return
    }

    if (
        !window.confirm(
            'Bạn có chắc muốn xóa địa chỉ này?',
        )
    ) {
        return
    }

    addresses.value = addresses.value.filter(
        (item) => item.id !== address.id,
    )

    message.value = 'Đã xóa địa chỉ.'

    // Backend:
    // DELETE /api/shipping-addresses/:id
}
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
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07532b] px-5 text-xs font-bold text-white transition hover:bg-[#0a6837]"
                @click="openCreateAddress">
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

            <div v-if="sortedAddresses.length" class="space-y-4">
                <article v-for="address in sortedAddresses" :key="address.id" class="rounded-2xl border p-5 transition"
                    :class="address.is_default
                        ? 'border-[#8fb49c] bg-[#f7fbf8]'
                        : 'border-slate-200 hover:border-[#b7cebf]'
                        ">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div class="flex min-w-0 gap-3">
                            <span
                                class="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#07532b]">
                                <Icon :icon="address.address_type ===
                                    'office'
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

                                    <span v-if="address.is_default"
                                        class="rounded border border-[#0a7139] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0a7139]">
                                        Mặc định
                                    </span>
                                </div>

                                <p class="mt-2 text-xs leading-5 text-slate-500">
                                    {{ address.address_detail }},
                                    {{ address.ward }},
                                    {{ address.district }},
                                    {{ address.province }}
                                </p>

                                <span
                                    class="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">
                                    {{
                                        address.address_type ===
                                            'office'
                                            ? 'Văn phòng'
                                            : 'Nhà riêng'
                                    }}
                                </span>
                            </div>
                        </div>

                        <div class="flex shrink-0 flex-wrap gap-3 text-xs font-semibold">
                            <button type="button" class="text-[#0a7139] hover:underline" @click="editAddress(address)">
                                Cập nhật
                            </button>

                            <button type="button" class="text-red-400 hover:underline" @click="deleteAddress(address)">
                                Xóa
                            </button>
                        </div>
                    </div>

                    <button v-if="!address.is_default" type="button"
                        class="mt-4 rounded-full border border-[#9dbba8] px-4 py-2 text-[10px] font-semibold text-[#07532b] transition hover:bg-[#edf5f0]"
                        @click="setDefault(address.id)">
                        Thiết lập mặc định
                    </button>
                </article>
            </div>
        </div>

        <AddressBookModal v-model="modalOpen" :addresses="addresses" :selected-address-id="selectedAddressId
            " :edit-address-id="editingAddressId" @confirm="
                selectedAddressId = $event
                " @save-address="saveAddress" />
    </section>
</template>