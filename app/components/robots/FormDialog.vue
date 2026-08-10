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

const { items: factoryMaps, fetchFactoryMaps } = useFactoryMaps()
// Only maps with an Area Number assigned are selectable — a robot's areaId
// is now taken from its Factory Map, not typed in by hand.
const availableFactoryMaps = computed(() => factoryMaps.value.filter(map => map.areaNumber != null))

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

// Editing a robot whose areaId doesn't match any current Factory Map's Area
// Number (e.g. legacy data, or the map was deleted) — keep it selectable
// as a fallback so opening the form doesn't silently blank it out.
const hasUnmatchedAreaId = computed(() => {
  if (!props.robot) return false
  return !availableFactoryMaps.value.some(map => map.areaNumber === props.robot!.areaId)
})

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
    if (isOpen) {
      resetFields()
      fetchFactoryMaps({ limit: 100 })
    }
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

  if (!areaIdText.value.trim()) {
    errors.areaId = 'Area is required'
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

const selectClass =
  'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
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

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Area
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="areaIdText" :class="selectClass">
          <option value="" disabled>Select a Factory Map</option>
          <option v-if="hasUnmatchedAreaId" :value="areaIdText">
            Area {{ areaIdText }} (no matching Factory Map)
          </option>
          <option v-for="map in availableFactoryMaps" :key="map.id" :value="String(map.areaNumber)">
            {{ map.name }} (Area {{ map.areaNumber }})
          </option>
        </select>
        <p v-if="availableFactoryMaps.length === 0" class="font-medium text-xs text-slate-400">
          No Factory Maps with an Area Number yet — add one from Factory Maps first.
        </p>
        <p v-if="errors.areaId" role="alert" class="font-medium flex items-center gap-1.5 text-xs text-red-500">
          {{ errors.areaId }}
        </p>
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
