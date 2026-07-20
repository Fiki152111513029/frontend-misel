<script setup lang="ts">
import type { CreatePermissionInput, Permission } from '~/types/permission'

interface Props {
  modelValue: boolean
  permission?: Permission | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  permission: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreatePermissionInput]
  cancel: []
}>()

const CODE_PATTERN = /^[a-z]+\.[a-z]+$/

const code = ref('')
const name = ref('')
const description = ref('')
const errors = reactive<{ code?: string; name?: string }>({})

function resetFields() {
  code.value = props.permission?.code ?? ''
  name.value = props.permission?.name ?? ''
  description.value = props.permission?.description ?? ''
  errors.code = undefined
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.permission)

function validate(): boolean {
  errors.code = undefined
  errors.name = undefined

  const trimmedCode = code.value.trim()
  if (!trimmedCode) {
    errors.code = 'Code is required'
  } else if (!CODE_PATTERN.test(trimmedCode)) {
    errors.code = 'Code must be in the format "resource.action", e.g. warehouse.read'
  }

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  }

  return !errors.code && !errors.name
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    code: code.value.trim(),
    name: name.value.trim(),
    description: description.value.trim() || undefined,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Permission' : 'Add Permission'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput
        v-model="code"
        label="Code"
        placeholder="resource.action"
        required
        :error="errors.code"
      />
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput v-model="description" label="Description" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
