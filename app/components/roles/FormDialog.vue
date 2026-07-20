<script setup lang="ts">
import type { CreateRoleInput, Role } from '~/types/role'

interface Props {
  modelValue: boolean
  role?: Role | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateRoleInput]
  cancel: []
}>()

const name = ref('')
const description = ref('')
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.role?.name ?? ''
  description.value = props.role?.description ?? ''
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.role)

function validate(): boolean {
  errors.name = undefined
  if (!name.value.trim()) {
    errors.name = 'Name is required'
  }
  return !errors.name
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
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
    :title="isEditMode ? 'Edit Role' : 'Add Role'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
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
