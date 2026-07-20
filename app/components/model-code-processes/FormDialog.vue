<script setup lang="ts">
import type {
  CreateModelCodeProcessInput,
  FromSystem,
  ModelCodeProcess,
} from '~/types/model-code-process'

interface Props {
  modelValue: boolean
  modelCodeProcess?: ModelCodeProcess | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelCodeProcess: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateModelCodeProcessInput]
  cancel: []
}>()

const name = ref('')
const fromSystem = ref<FromSystem>('MES')
const isActive = ref(true)
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.modelCodeProcess?.name ?? ''
  fromSystem.value = props.modelCodeProcess?.fromSystem ?? 'MES'
  isActive.value = props.modelCodeProcess?.isActive ?? true
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.modelCodeProcess)

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
    fromSystem: fromSystem.value,
    isActive: isActive.value,
  })
}

function handleCancel() {
  emit('cancel')
}

const selectClass =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#020617] px-4 py-3 text-sm text-[#0F1F52] dark:text-[#F8FAFC] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Model Code Process' : 'Add Model Code Process'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          From System
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="fromSystem" :class="selectClass">
          <option value="MES">MES</option>
          <option value="WMS">WMS</option>
        </select>
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
