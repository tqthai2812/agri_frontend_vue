<script setup>
import { computed, ref } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        default: "",
    },

    id: {
        type: String,
        required: true,
    },

    label: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        default: "text",
    },

    error: {
        type: String,
        default: "",
    },

    autocomplete: {
        type: String,
        default: "",
    },

    placeholder: {
        type: String,
        default: "",
    },

    disabled: {
        type: Boolean,
        default: false,
    },

    required: {
        type: Boolean,
        default: true,
    },

    maxlength: {
        type: [Number, String],
        default: undefined,
    },

    inputmode: {
        type: String,
        default: undefined,
    },

    pattern: {
        type: String,
        default: undefined,
    },
});

const emit = defineEmits(["update:modelValue"]);

const visible = ref(false);

const inputType = computed(() => {
    if (props.type === "password" && visible.value) {
        return "text";
    }

    return props.type;
});
</script>

<template>
    <div class="nf-field">
        <label :for="id">
            {{ label }}
        </label>

        <div class="nf-input-wrap">
            <input :id="id" :name="id" :value="modelValue" :type="inputType" :autocomplete="autocomplete"
                :placeholder="placeholder" :disabled="disabled" :required="required" :maxlength="maxlength"
                :inputmode="inputmode" :pattern="pattern" :aria-invalid="Boolean(error)"
                :class="{ 'nf-password-input': type === 'password' }"
                @input="emit('update:modelValue', $event.target.value)" />

            <button v-if="type === 'password'" type="button" class="nf-reveal" :disabled="disabled"
                :aria-label="visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="visible = !visible">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

                    <circle cx="12" cy="12" r="3" />

                    <path v-if="visible" d="m3 3 18 18" />
                </svg>
            </button>
        </div>

        <p v-if="error" class="nf-field-error">
            {{ error }}
        </p>
    </div>
</template>