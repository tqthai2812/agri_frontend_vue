<script setup>
import { reactive, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    addresses: {
        type: Array,
        default: () => [],
    },
    selectedAddressId: {
        type: [Number, String],
        default: null,
    },
})

const emit = defineEmits([
    'update:modelValue',
    'confirm',
    'save-address',
])

const tempSelectedId = ref(null)
const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
    receiver_name: '',
    receiver_phone: '',
    province: '',
    district: '',
    ward: '',
    address_detail: '',
    address_type: 'home',
    is_default: false,
})

const form = reactive(emptyForm())

watch(
    () => props.modelValue,
    (isOpen) => {
        if (!isOpen) return

        tempSelectedId.value = props.selectedAddressId
        showForm.value = false
        editingId.value = null
    },
)

watch(
    () => props.selectedAddressId,
    (id) => {
        if (props.modelValue) {
            tempSelectedId.value = id
        }
    },
)

function close() {
    emit('update:modelValue', false)
}

function resetForm() {
    Object.assign(form, emptyForm())
}

function openCreateForm() {
    editingId.value = null
    resetForm()
    showForm.value = true
}

function openEditForm(address) {
    editingId.value = address.id

    Object.assign(form, {
        receiver_name: address.receiver_name || '',
        receiver_phone: address.receiver_phone || '',
        province: address.province || '',
        district: address.district || '',
        ward: address.ward || '',
        address_detail: address.address_detail || '',
        address_type: address.address_type || 'home',
        is_default: Boolean(address.is_default),
    })

    showForm.value = true
}

function saveAddress() {
    const requiredValues = [
        form.receiver_name,
        form.receiver_phone,
        form.province,
        form.district,
        form.ward,
        form.address_detail,
    ]

    if (
        requiredValues.some(
            (value) => !String(value).trim(),
        )
    ) {
        window.alert('Vui lòng nhập đầy đủ thông tin địa chỉ.')
        return
    }

    emit('save-address', {
        id: editingId.value,
        ...form,
    })

    showForm.value = false
}

function confirmSelection() {
    if (!tempSelectedId.value) return

    emit('confirm', tempSelectedId.value)
    close()
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0"
            leave-active-class="transition duration-150" leave-to-class="opacity-0">
            <div v-if="modelValue"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-5"
                @click.self="close">
                <div
                    class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <h2 class="text-lg font-bold text-[#123d27]">
                                {{
                                    showForm
                                        ? editingId
                                            ? 'Cập nhật địa chỉ'
                                            : 'Thêm địa chỉ mới'
                                        : 'Địa chỉ của tôi'
                                }}
                            </h2>

                            <p class="mt-0.5 text-xs text-slate-400">
                                {{
                                    showForm
                                        ? 'Thông tin này sẽ được dùng để giao hàng.'
                                        : 'Chọn địa chỉ nhận đơn hàng.'
                                }}
                            </p>
                        </div>

                        <button type="button"
                            class="grid size-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Đóng" @click="close">
                            <Icon icon="mdi:close" class="text-2xl" />
                        </button>
                    </header>

                    <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                        <template v-if="!showForm">
                            <div class="space-y-3">
                                <label v-for="address in addresses" :key="address.id"
                                    class="flex cursor-pointer gap-3 rounded-2xl border p-4 transition" :class="tempSelectedId === address.id
                                        ? 'border-[#0a7139] bg-[#f2f8f4] ring-2 ring-[#0a7139]/10'
                                        : 'border-slate-200 hover:border-[#9dbba8]'
                                        ">
                                    <input v-model="tempSelectedId" type="radio" :value="address.id"
                                        class="mt-1 size-4 shrink-0 accent-[#07532b]" />

                                    <div class="min-w-0 flex-1">
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
                                                address.address_type === 'office'
                                                    ? 'Văn phòng'
                                                    : 'Nhà riêng'
                                            }}
                                        </span>
                                    </div>

                                    <button type="button"
                                        class="self-start text-xs font-semibold text-[#0a7139] hover:underline"
                                        @click.prevent="openEditForm(address)">
                                        Cập nhật
                                    </button>
                                </label>
                            </div>

                            <button type="button"
                                class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#8fb49c] py-3 text-sm font-semibold text-[#07532b] transition hover:bg-[#f2f8f4]"
                                @click="openCreateForm">
                                <Icon icon="mdi:plus-circle-outline" class="text-xl" />
                                Thêm địa chỉ mới
                            </button>
                        </template>

                        <form v-else class="space-y-4" @submit.prevent="saveAddress">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <label class="block">
                                    <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Họ và tên
                                    </span>

                                    <input v-model.trim="form.receiver_name" class="checkout-input"
                                        placeholder="Tên người nhận" />
                                </label>

                                <label class="block">
                                    <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Số điện thoại
                                    </span>

                                    <input v-model.trim="form.receiver_phone" class="checkout-input" inputmode="tel"
                                        placeholder="Ví dụ: 0334745378" />
                                </label>
                            </div>

                            <div class="grid gap-4 sm:grid-cols-3">
                                <label class="block">
                                    <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Tỉnh/Thành phố
                                    </span>

                                    <input v-model.trim="form.province" class="checkout-input" placeholder="Cần Thơ" />
                                </label>

                                <label class="block">
                                    <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Quận/Huyện
                                    </span>

                                    <input v-model.trim="form.district" class="checkout-input"
                                        placeholder="Ninh Kiều" />
                                </label>

                                <label class="block">
                                    <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Phường/Xã
                                    </span>

                                    <input v-model.trim="form.ward" class="checkout-input" placeholder="Hưng Lợi" />
                                </label>
                            </div>

                            <label class="block">
                                <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                                    Địa chỉ cụ thể
                                </span>

                                <textarea v-model.trim="form.address_detail" rows="3" class="checkout-input resize-none"
                                    placeholder="Số nhà, tên đường, tòa nhà..."></textarea>
                            </label>

                            <div>
                                <span class="mb-2 block text-xs font-semibold text-slate-600">
                                    Loại địa chỉ
                                </span>

                                <div class="flex gap-3">
                                    <label v-for="type in [
                                        {
                                            value: 'home',
                                            label: 'Nhà riêng',
                                            icon: 'mdi:home-outline',
                                        },
                                        {
                                            value: 'office',
                                            label: 'Văn phòng',
                                            icon: 'mdi:office-building-outline',
                                        },
                                    ]" :key="type.value"
                                        class="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition"
                                        :class="form.address_type === type.value
                                            ? 'border-[#0a7139] bg-[#edf5f0] text-[#07532b]'
                                            : 'border-slate-200 text-slate-500'
                                            ">
                                        <input v-model="form.address_type" type="radio" :value="type.value"
                                            class="hidden" />

                                        <Icon :icon="type.icon" class="text-lg" />

                                        {{ type.label }}
                                    </label>
                                </div>
                            </div>

                            <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                                <input v-model="form.is_default" type="checkbox" class="size-4 accent-[#07532b]" />
                                Đặt làm địa chỉ mặc định
                            </label>

                            <div class="flex justify-end gap-3 pt-2">
                                <button type="button"
                                    class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    @click="showForm = false">
                                    Trở lại
                                </button>

                                <button type="submit"
                                    class="rounded-full bg-[#07532b] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a6837]">
                                    Lưu địa chỉ
                                </button>
                            </div>
                        </form>
                    </div>

                    <footer v-if="!showForm" class="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
                        <button type="button"
                            class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            @click="close">
                            Hủy
                        </button>

                        <button type="button"
                            class="rounded-full bg-[#07532b] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a6837] disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="!tempSelectedId" @click="confirmSelection">
                            Xác nhận
                        </button>
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@reference "../../../style.css";

.checkout-input {
    @apply w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#0a7139] focus:ring-4 focus:ring-[#0a7139]/10;
}
</style>