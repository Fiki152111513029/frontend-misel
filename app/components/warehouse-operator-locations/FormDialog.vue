<script setup lang="ts">
import type {
  AvailableOperator,
  CreateWarehouseOperatorLocationInput,
  WarehouseOperatorLocation,
} from '~/types/warehouse-operator-location'

interface Props {
  modelValue: boolean
  warehouseOperatorLocation?: WarehouseOperatorLocation | null
  availableOperators: AvailableOperator[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  warehouseOperatorLocation: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateWarehouseOperatorLocationInput]
  cancel: []
}>()

const name = ref('')
const locationCode = ref('')
const operatorId = ref('')
const errors = reactive<{ name?: string; locationCode?: string; operatorId?: string }>({})

function resetFields() {
  name.value = props.warehouseOperatorLocation?.name ?? ''
  locationCode.value = props.warehouseOperatorLocation?.locationCode ?? ''
  operatorId.value = props.warehouseOperatorLocation?.operatorId ?? ''
  errors.name = undefined
  errors.locationCode = undefined
  errors.operatorId = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.warehouseOperatorLocation)

function validate(): boolean {
  errors.name = undefined
  errors.locationCode = undefined
  errors.operatorId = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!locationCode.value.trim()) {
    errors.locationCode = 'Location Code is required'
  }

  if (!operatorId.value) {
    errors.operatorId = 'Operator is required'
  }

  return !errors.name && !errors.locationCode && !errors.operatorId
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    locationCode: locationCode.value.trim(),
    operatorId: operatorId.value,
  })
}

function handleCancel() {
  emit('cancel')
}

const selectClass =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#020617] px-4 py-3 text-sm text-[#0F1F52] dark:text-[#F8FAFC] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Warehouse Operator Location' : 'Add Warehouse Operator Location'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput
        v-model="locationCode"
        label="Location Code"
        required
        :error="errors.locationCode"
      />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Operator
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="operatorId" :class="selectClass">
          <option value="" disabled>-- Select Operator --</option>
          <option v-for="user in availableOperators" :key="user.id" :value="user.id">
            {{ user.username }}
          </option>
        </select>
        <p v-if="errors.operatorId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.operatorId }}
        </p>
        <p v-else-if="availableOperators.length === 0"
          class="font-medium text-xs text-slate-400 dark:text-slate-500"
        >
          No available users with the Warehouse role
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
