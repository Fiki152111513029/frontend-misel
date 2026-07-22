<script setup lang="ts">
import type { CreateQuarantineLineInput, QuarantineLine } from '~/types/quarantine-line'

interface Props {
  modelValue: boolean
  quarantineLine?: QuarantineLine | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  quarantineLine: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateQuarantineLineInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() => modelCodeProcesses.value.filter(process => process.isActive))

const name = ref('')
const isActive = ref(true)
const modelCodeProcessId = ref('')
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.quarantineLine?.name ?? ''
  isActive.value = props.quarantineLine?.isActive ?? true
  modelCodeProcessId.value = props.quarantineLine?.modelCodeProcessId ?? ''
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetFields()
      fetchModelCodeProcesses({ limit: 100 })
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.quarantineLine)

function validate(): boolean {
  errors.name = undefined
  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }
  return !errors.name
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    isActive: isActive.value,
    modelCodeProcessId: modelCodeProcessId.value || undefined,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Quarantine Line' : 'Add Quarantine Line'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseCheckbox v-model="isActive" label="Active" />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
          Task Template
        </label>
        <select
          v-model="modelCodeProcessId"
          class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
        >
          <option value="">None</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
      </div>
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
