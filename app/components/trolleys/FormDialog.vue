<script setup lang="ts">
import type {
  CreateTrolleyInput,
  Trolley,
  TrolleyStatus,
} from '~/types/trolley'

interface Props {
  modelValue: boolean
  trolley?: Trolley | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trolley: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateTrolleyInput]
  cancel: []
}>()

const name = ref('')
const code = ref('')
const status = ref<TrolleyStatus>('EMPTY')
const errors = reactive<{ name?: string; code?: string }>({})

function resetFields() {
  name.value = props.trolley?.name ?? ''
  code.value = props.trolley?.code ?? ''
  status.value = props.trolley?.status ?? 'EMPTY'
  errors.name = undefined
  errors.code = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.trolley)

function validate(): boolean {
  errors.name = undefined
  errors.code = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!code.value.trim()) {
    errors.code = 'Code is required'
  }

  return !errors.name && !errors.code
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    code: code.value.trim(),
    status: status.value,
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
    :title="isEditMode ? 'Edit Trolley' : 'Add Trolley'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput v-model="code" label="Code" required :error="errors.code" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Status
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="status" :class="selectClass">
          <option value="EMPTY">Empty</option>
          <option value="FULL">Full</option>
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
