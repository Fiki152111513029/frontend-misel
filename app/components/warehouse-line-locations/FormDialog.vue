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

const name = ref('')
const droppingLocationCode = ref('')
const pickingLocationCode = ref('')
const modelCodeProcessId = ref('')
const errors = reactive<{
  name?: string
  droppingLocationCode?: string
  pickingLocationCode?: string
}>({})

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
      <UiBaseInput
        v-model="droppingLocationCode"
        label="Dropping Location Code"
        required
        :error="errors.droppingLocationCode"
      />
      <UiBaseInput
        v-model="pickingLocationCode"
        label="Picking Location Code"
        required
        :error="errors.pickingLocationCode"
      />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
          Model Code Process
        </label>
        <select
          v-model="modelCodeProcessId"
          class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
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
