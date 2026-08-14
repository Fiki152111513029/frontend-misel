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

const name = ref('')
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.trolleyCategory?.name ?? ''
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
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
  })
}

function handleCancel() {
  emit('cancel')
}
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
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
