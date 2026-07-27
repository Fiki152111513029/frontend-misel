<script setup lang="ts">
import type { BoxType, BoxTypeFromSystem, CreateBoxTypeInput } from '~/types/box-type'

interface Props {
  modelValue: boolean
  boxType?: BoxType | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  boxType: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateBoxTypeInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() => modelCodeProcesses.value.filter(process => process.isActive))

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

const name = ref('')
const orderingText = ref('')
const colorCode = ref('#01ADEF')
const modelProcessCode = ref('')
const fromSystem = ref<BoxTypeFromSystem>('MES')
const errors = reactive<{
  name?: string
  ordering?: string
  colorCode?: string
  modelProcessCode?: string
}>({})

function resetFields() {
  name.value = props.boxType?.name ?? ''
  orderingText.value = props.boxType ? String(props.boxType.ordering) : ''
  colorCode.value = props.boxType?.colorCode ?? '#01ADEF'
  modelProcessCode.value = props.boxType?.modelProcessCode ?? ''
  fromSystem.value = props.boxType?.fromSystem ?? 'MES'
  errors.name = undefined
  errors.ordering = undefined
  errors.colorCode = undefined
  errors.modelProcessCode = undefined
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

const isEditMode = computed(() => !!props.boxType)

function validate(): boolean {
  errors.name = undefined
  errors.ordering = undefined
  errors.colorCode = undefined
  errors.modelProcessCode = undefined

  const trimmedName = name.value.trim()
  if (!trimmedName) {
    errors.name = 'Name is required'
  } else if (trimmedName.length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  const orderingValue = Number(orderingText.value)
  if (!orderingText.value.trim()) {
    errors.ordering = 'Ordering is required'
  } else if (!Number.isInteger(orderingValue) || orderingValue < 0) {
    errors.ordering = 'Ordering must be a non-negative integer'
  }

  if (!colorCode.value.trim()) {
    errors.colorCode = 'Color code is required'
  } else if (!HEX_PATTERN.test(colorCode.value.trim())) {
    errors.colorCode = 'Color code must be a valid HEX color, e.g. #FF0000'
  }

  if (!modelProcessCode.value.trim()) {
    errors.modelProcessCode = 'Model Process Code is required'
  }

  return (
    !errors.name && !errors.ordering && !errors.colorCode && !errors.modelProcessCode
  )
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    ordering: Number(orderingText.value),
    colorCode: colorCode.value.trim(),
    modelProcessCode: modelProcessCode.value.trim(),
    fromSystem: fromSystem.value,
  })
}

function handleCancel() {
  emit('cancel')
}

const selectClass =
  'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Box Type' : 'Add Box Type'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput v-model="orderingText" label="Ordering" required :error="errors.ordering" />
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Color Code
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <div class="flex items-center gap-3">
          <input
            v-model="colorCode"
            type="color"
            aria-label="Pick color"
            class="h-11 w-11 flex-shrink-0 cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-1"
          />
          <UiBaseInput v-model="colorCode" placeholder="#01ADEF" class="flex-1" />
        </div>
        <p v-if="errors.colorCode"
          role="alert"
          class="font-medium flex items-center gap-1.5 text-xs text-red-500"
        >
          {{ errors.colorCode }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Model Process Code
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="modelProcessCode" :class="selectClass">
          <option value="" disabled>Select Model Process Code</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.name">
            {{ process.name }}
          </option>
        </select>
        <p v-if="errors.modelProcessCode"
          role="alert"
          class="font-medium flex items-center gap-1.5 text-xs text-red-500"
        >
          {{ errors.modelProcessCode }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          From System
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="fromSystem" :class="selectClass">
          <option value="MES">MES</option>
          <option value="WMS">WMS</option>
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
