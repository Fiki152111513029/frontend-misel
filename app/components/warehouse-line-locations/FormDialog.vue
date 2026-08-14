<script setup lang="ts">
import type {
  CreateWarehouseLineLocationInput,
  WarehouseLineLocation,
} from '~/types/warehouse-line-location'

interface Props {
  modelValue: boolean
  warehouseLineLocation?: WarehouseLineLocation | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  warehouseLineLocation: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateWarehouseLineLocationInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() => modelCodeProcesses.value.filter(process => process.isActive))

// Dropping/Picking Location Code used to be free text, which meant it could
// be filled with any string regardless of whether a matching location
// actually existed — operators kept getting confused about what to type.
// Now it's a dropdown sourced from the two real "physical location" tables
// (Warehouse Locations + Production Locations), backed by the same
// validation server-side.
const { items: warehouseLocations, fetchWarehouseLocations } = useWarehouseLocations()
const { items: productionLocations, fetchProductionLocations } = useProductionLocations()

interface LocationCodeOption { code: string, label: string }

const locationCodeOptions = computed<LocationCodeOption[]>(() => [
  ...warehouseLocations.value
    .filter(location => location.isActive)
    .map(location => ({ code: location.iRaypleLocationCode, label: `${location.name} (${location.iRaypleLocationCode}) · Warehouse` })),
  ...productionLocations.value
    .filter(location => location.isActive)
    .map(location => ({ code: location.iRaypleLocationCode, label: `${location.name} (${location.iRaypleLocationCode}) · Production` })),
])

// Existing rows may hold a code from before this became a dropdown (or one
// whose location was since deactivated) — keep it selectable so editing
// doesn't silently blank the field out.
function optionsWithLegacyValue(currentValue: string) {
  if (!currentValue || locationCodeOptions.value.some(option => option.code === currentValue)) {
    return locationCodeOptions.value
  }
  return [{ code: currentValue, label: `${currentValue} (current value)` }, ...locationCodeOptions.value]
}

const name = ref('')
const droppingLocationCode = ref('')
const pickingLocationCode = ref('')
const modelCodeProcessId = ref('')
const errors = reactive<{
  name?: string
  droppingLocationCode?: string
  pickingLocationCode?: string
}>({})

const droppingLocationCodeOptions = computed(() => optionsWithLegacyValue(droppingLocationCode.value))
const pickingLocationCodeOptions = computed(() => optionsWithLegacyValue(pickingLocationCode.value))

function resetFields() {
  name.value = props.warehouseLineLocation?.name ?? ''
  droppingLocationCode.value = props.warehouseLineLocation?.droppingLocationCode ?? ''
  pickingLocationCode.value = props.warehouseLineLocation?.pickingLocationCode ?? ''
  modelCodeProcessId.value = props.warehouseLineLocation?.modelCodeProcessId ?? ''
  errors.name = undefined
  errors.droppingLocationCode = undefined
  errors.pickingLocationCode = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetFields()
      fetchModelCodeProcesses({ limit: 100 })
      fetchWarehouseLocations({ limit: 100 })
      fetchProductionLocations({ limit: 100 })
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.warehouseLineLocation)

function validate(): boolean {
  errors.name = undefined
  errors.droppingLocationCode = undefined
  errors.pickingLocationCode = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!droppingLocationCode.value.trim()) {
    errors.droppingLocationCode = 'Dropping Location Code is required'
  }

  if (!pickingLocationCode.value.trim()) {
    errors.pickingLocationCode = 'Picking Location Code is required'
  }

  return !errors.name && !errors.droppingLocationCode && !errors.pickingLocationCode
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    droppingLocationCode: droppingLocationCode.value.trim(),
    pickingLocationCode: pickingLocationCode.value.trim(),
    modelCodeProcessId: modelCodeProcessId.value || undefined,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Warehouse Line Location' : 'Add Warehouse Line Location'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-[#0F1F52]">
          Dropping Location Code
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select
          v-model="droppingLocationCode"
          class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        >
          <option value="" disabled>Select a location</option>
          <option v-for="option in droppingLocationCodeOptions" :key="option.code" :value="option.code">
            {{ option.label }}
          </option>
        </select>
        <p v-if="errors.droppingLocationCode" role="alert" class="font-medium mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          {{ errors.droppingLocationCode }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-[#0F1F52]">
          Picking Location Code
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select
          v-model="pickingLocationCode"
          class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        >
          <option value="" disabled>Select a location</option>
          <option v-for="option in pickingLocationCodeOptions" :key="option.code" :value="option.code">
            {{ option.label }}
          </option>
        </select>
        <p v-if="errors.pickingLocationCode" role="alert" class="font-medium mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          {{ errors.pickingLocationCode }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-[#0F1F52]">
          Model Code Process
        </label>
        <select
          v-model="modelCodeProcessId"
          class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        >
          <option value="">None</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
        <p class="font-medium mt-1.5 text-xs text-slate-400">
          Used by Warehouse Control to release cart tasks for this line location.
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
