<script setup lang="ts">
import type {
  CreateProductionLineAreaInput,
  ProductionLineArea,
} from '~/types/production-line-area'
import type { ProductionLine } from '~/types/production-line'
import type { EximLocation } from '~/types/exim-location'
import type { EmptyPalletLocation } from '~/types/empty-pallet-location'
import type { ModelCodeProcess } from '~/types/model-code-process'

interface Props {
  modelValue: boolean
  productionLineArea?: ProductionLineArea | null
  productionLines: ProductionLine[]
  eximLocations: EximLocation[]
  emptyPalletLocations: EmptyPalletLocation[]
  modelCodeProcesses: ModelCodeProcess[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  productionLineArea: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateProductionLineAreaInput]
  cancel: []
}>()

const name = ref('')
const type = ref<'PRODUCTION' | 'STOCK'>('PRODUCTION')
const iRaypleLocationCode = ref('')
const productionLineId = ref('')
const eximLocationId = ref('')
const emptyPalletLocationId = ref('')
const modelCodeProcessId = ref('')
const orderText = ref('')
const errors = reactive<{
  name?: string
  iRaypleLocationCode?: string
  productionLineId?: string
  eximLocationId?: string
  emptyPalletLocationId?: string
  order?: string
}>({})

function resetFields() {
  name.value = props.productionLineArea?.name ?? ''
  type.value = props.productionLineArea?.type ?? 'PRODUCTION'
  iRaypleLocationCode.value = props.productionLineArea?.iRaypleLocationCode ?? ''
  productionLineId.value =
    props.productionLineArea?.productionLineId ?? props.productionLines[0]?.id ?? ''
  eximLocationId.value =
    props.productionLineArea?.eximLocationId ?? props.eximLocations[0]?.id ?? ''
  emptyPalletLocationId.value =
    props.productionLineArea?.emptyPalletLocationId ?? props.emptyPalletLocations[0]?.id ?? ''
  modelCodeProcessId.value = props.productionLineArea?.modelCodeProcessId ?? ''
  orderText.value =
    props.productionLineArea?.order !== undefined ? String(props.productionLineArea.order) : ''
  errors.name = undefined
  errors.iRaypleLocationCode = undefined
  errors.productionLineId = undefined
  errors.eximLocationId = undefined
  errors.emptyPalletLocationId = undefined
  errors.order = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.productionLineArea)

function validate(): boolean {
  errors.name = undefined
  errors.iRaypleLocationCode = undefined
  errors.productionLineId = undefined
  errors.eximLocationId = undefined
  errors.emptyPalletLocationId = undefined
  errors.order = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!iRaypleLocationCode.value.trim()) {
    errors.iRaypleLocationCode = 'iRayple Location Code is required'
  }

  if (!productionLineId.value) {
    errors.productionLineId = 'Production Line is required'
  }

  if (!eximLocationId.value) {
    errors.eximLocationId = 'EXIM Location is required'
  }

  if (!emptyPalletLocationId.value) {
    errors.emptyPalletLocationId = 'Empty Pallet Location is required'
  }

  const orderValue = Number(orderText.value)
  if (!orderText.value.trim()) {
    errors.order = 'Order is required'
  } else if (!Number.isInteger(orderValue) || orderValue < 0) {
    errors.order = 'Order must be a non-negative integer'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    type: type.value,
    iRaypleLocationCode: iRaypleLocationCode.value.trim(),
    productionLineId: productionLineId.value,
    eximLocationId: eximLocationId.value,
    emptyPalletLocationId: emptyPalletLocationId.value,
    modelCodeProcessId: modelCodeProcessId.value || undefined,
    order: Number(orderText.value),
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
    :title="isEditMode ? 'Edit Production Line Area' : 'Add Production Line Area'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Jenis
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="type" :class="selectClass">
          <option value="PRODUCTION">Production</option>
          <option value="STOCK">Stock</option>
        </select>
      </div>

      <UiBaseInput
        v-model="iRaypleLocationCode"
        label="iRayple Location Code"
        required
        :error="errors.iRaypleLocationCode"
      />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Production Line
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="productionLineId" :class="selectClass">
          <option v-for="line in productionLines" :key="line.id" :value="line.id">
            {{ line.name }}
          </option>
        </select>
        <p v-if="errors.productionLineId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.productionLineId }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          EXIM Location
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="eximLocationId" :class="selectClass">
          <option v-for="location in eximLocations" :key="location.id" :value="location.id">
            {{ location.name }}
          </option>
        </select>
        <p v-if="errors.eximLocationId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.eximLocationId }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Empty Pallet Location
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="emptyPalletLocationId" :class="selectClass">
          <option
            v-for="location in emptyPalletLocations"
            :key="location.id"
            :value="location.id"
          >
            {{ location.name }}
          </option>
        </select>
        <p v-if="errors.emptyPalletLocationId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.emptyPalletLocationId }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Task Template
        </label>
        <select v-model="modelCodeProcessId" :class="selectClass">
          <option value="">None</option>
          <option v-for="process in modelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
      </div>

      <UiBaseInput v-model="orderText" label="Order" required :error="errors.order" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
