<script setup lang="ts">
import type {
  TrolleyType,
  CreateTrolleyTypeInput,
} from '~/types/trolley-type'

interface Props {
  modelValue: boolean
  trolleyType?: TrolleyType | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trolleyType: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateTrolleyTypeInput]
  cancel: []
}>()

const name = ref('')
const isActive = ref(true)
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.trolleyType?.name ?? ''
  isActive.value = props.trolleyType?.isActive ?? true
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.trolleyType)

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
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Trolley Type' : 'Add Trolley Type'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
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
