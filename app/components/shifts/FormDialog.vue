<script setup lang="ts">
import type {
  Shift,
  CreateShiftInput,
} from '~/types/shift'

interface Props {
  modelValue: boolean
  shift?: Shift | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shift: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateShiftInput]
  cancel: []
}>()

const name = ref('')
const startTime = ref('')
const endTime = ref('')
const isActive = ref(true)
const errors = reactive<{ name?: string; startTime?: string; endTime?: string }>({})

function resetFields() {
  name.value = props.shift?.name ?? ''
  startTime.value = props.shift?.startTime ?? ''
  endTime.value = props.shift?.endTime ?? ''
  isActive.value = props.shift?.isActive ?? true
  errors.name = undefined
  errors.startTime = undefined
  errors.endTime = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.shift)

function validate(): boolean {
  errors.name = undefined
  errors.startTime = undefined
  errors.endTime = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!startTime.value) {
    errors.startTime = 'Start time is required'
  }
  if (!endTime.value) {
    errors.endTime = 'End time is required'
  }

  return !errors.name && !errors.startTime && !errors.endTime
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    startTime: startTime.value,
    endTime: endTime.value,
    isActive: isActive.value,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Shift' : 'Add Shift'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52]">
            Start Time <span class="text-[#01ADEF]">*</span>
          </label>
          <input
            v-model="startTime"
            type="time"
            class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          />
          <p v-if="errors.startTime" class="mt-1 font-medium text-xs text-red-500">{{ errors.startTime }}</p>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52]">
            End Time <span class="text-[#01ADEF]">*</span>
          </label>
          <input
            v-model="endTime"
            type="time"
            class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          />
          <p v-if="errors.endTime" class="mt-1 font-medium text-xs text-red-500">{{ errors.endTime }}</p>
        </div>
      </div>
      <UiBaseCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
