<script setup lang="ts">
import type {
  ParkingArea,
  CreateParkingAreaInput,
} from '~/types/parking-area'

interface Props {
  modelValue: boolean
  parkingArea?: ParkingArea | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  parkingArea: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateParkingAreaInput]
  cancel: []
}>()

const name = ref('')
const iRaypleLocationCode = ref('')
const isActive = ref(true)
const errors = reactive<{ name?: string; iRaypleLocationCode?: string }>({})

function resetFields() {
  name.value = props.parkingArea?.name ?? ''
  iRaypleLocationCode.value = props.parkingArea?.iRaypleLocationCode ?? ''
  isActive.value = props.parkingArea?.isActive ?? true
  errors.name = undefined
  errors.iRaypleLocationCode = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.parkingArea)

function validate(): boolean {
  errors.name = undefined
  errors.iRaypleLocationCode = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!iRaypleLocationCode.value.trim()) {
    errors.iRaypleLocationCode = 'iRayple Location Code is required'
  }

  return !errors.name && !errors.iRaypleLocationCode
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    iRaypleLocationCode: iRaypleLocationCode.value.trim(),
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
    :title="isEditMode ? 'Edit Parking Area' : 'Add Parking Area'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput
        v-model="iRaypleLocationCode"
        label="iRayple Location Code"
        required
        :error="errors.iRaypleLocationCode"
      />
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
