<script setup lang="ts">
import type {
  CreateTrolleyCategoryInput,
  TrolleyCategory,
} from '~/types/trolley-category'

interface Props {
  modelValue: boolean
  trolleyCategory?: TrolleyCategory | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trolleyCategory: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateTrolleyCategoryInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() => modelCodeProcesses.value.filter(process => process.isActive))

const name = ref('')
const modelCodeProcessId = ref('')
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.trolleyCategory?.name ?? ''
  modelCodeProcessId.value = props.trolleyCategory?.modelCodeProcessId ?? ''
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

const isEditMode = computed(() => !!props.trolleyCategory)

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
    modelCodeProcessId: modelCodeProcessId.value || undefined,
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
    :title="isEditMode ? 'Edit Trolley Category' : 'Add Trolley Category'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Model Code Process
        </label>
        <select v-model="modelCodeProcessId" :class="selectClass">
          <option value="">None</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
        <p class="font-medium mt-1.5 text-xs text-slate-400">
          Used to build the RCS task order for Trolley Activities whose trolley belongs to this category.
        </p>
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
