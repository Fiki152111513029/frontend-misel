<script setup lang="ts">
import type { CreateRobotInput, Robot } from '~/types/robot'

interface Props {
  modelValue: boolean
  robot?: Robot | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  robot: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateRobotInput]
  cancel: []
}>()

const name = ref('')
const amrDeviceSerialNo = ref('')
const amrDeviceNo = ref('')
const areaIdText = ref('')
const isActive = ref(true)
const errors = reactive<{
  name?: string
  amrDeviceSerialNo?: string
  amrDeviceNo?: string
  areaId?: string
}>({})

function resetFields() {
  name.value = props.robot?.name ?? ''
  amrDeviceSerialNo.value = props.robot?.amrDeviceSerialNo ?? ''
  amrDeviceNo.value = props.robot?.amrDeviceNo ?? ''
  areaIdText.value = props.robot ? String(props.robot.areaId) : ''
  isActive.value = props.robot?.isActive ?? true
  errors.name = undefined
  errors.amrDeviceSerialNo = undefined
  errors.amrDeviceNo = undefined
  errors.areaId = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.robot)

function validate(): boolean {
  errors.name = undefined
  errors.amrDeviceSerialNo = undefined
  errors.amrDeviceNo = undefined
  errors.areaId = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!amrDeviceSerialNo.value.trim()) {
    errors.amrDeviceSerialNo = 'AMR Device Serial No is required'
  }

  if (!amrDeviceNo.value.trim()) {
    errors.amrDeviceNo = 'AMR Device No is required'
  }

  const areaIdValue = Number(areaIdText.value)
  if (!areaIdText.value.trim()) {
    errors.areaId = 'Area ID is required'
  } else if (!Number.isInteger(areaIdValue) || areaIdValue < 1) {
    errors.areaId = 'Area ID must be an integer starting from 1'
  }

  return (
    !errors.name && !errors.amrDeviceSerialNo && !errors.amrDeviceNo && !errors.areaId
  )
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    amrDeviceSerialNo: amrDeviceSerialNo.value.trim(),
    amrDeviceNo: amrDeviceNo.value.trim(),
    areaId: Number(areaIdText.value),
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
    :title="isEditMode ? 'Edit Robot' : 'Add Robot'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput
        v-model="amrDeviceSerialNo"
        label="AMR Device Serial No"
        required
        :error="errors.amrDeviceSerialNo"
      />
      <UiBaseInput
        v-model="amrDeviceNo"
        label="AMR Device No"
        required
        :error="errors.amrDeviceNo"
      />
      <UiBaseInput v-model="areaIdText" label="Area ID" required :error="errors.areaId" />
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
