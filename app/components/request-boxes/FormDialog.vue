<script setup lang="ts">
import type { CreateRequestBoxInput } from '~/types/request-box'
import type { ProductionLine } from '~/types/production-line'
import type { BoxType } from '~/types/box-type'

interface Props {
  modelValue: boolean
  productionLines: ProductionLine[]
  boxTypes: BoxType[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateRequestBoxInput]
  cancel: []
}>()

const { user } = useAuth()

// Super Admin may request boxes for any production line; everyone else is
// restricted to the line(s) they operate.
const availableProductionLines = computed(() =>
  user.value?.role === 'Super Admin'
    ? props.productionLines
    : props.productionLines.filter((line) => line.operatorId === user.value?.id),
)

const productionLineId = ref('')
const boxTypeId = ref('')
const qtyText = ref('')
const errors = reactive<{ productionLineId?: string; boxTypeId?: string; qty?: string }>({})

function resetFields() {
  productionLineId.value = availableProductionLines.value[0]?.id ?? ''
  boxTypeId.value = props.boxTypes[0]?.id ?? ''
  qtyText.value = ''
  errors.productionLineId = undefined
  errors.boxTypeId = undefined
  errors.qty = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

function validate(): boolean {
  errors.productionLineId = undefined
  errors.boxTypeId = undefined
  errors.qty = undefined

  if (!productionLineId.value) {
    errors.productionLineId = 'Production Line is required'
  }

  if (!boxTypeId.value) {
    errors.boxTypeId = 'Box is required'
  }

  const qtyValue = Number(qtyText.value)
  if (!qtyText.value.trim()) {
    errors.qty = 'Qty is required'
  } else if (!Number.isInteger(qtyValue) || qtyValue < 1) {
    errors.qty = 'Qty must be a positive integer'
  }

  return !errors.productionLineId && !errors.boxTypeId && !errors.qty
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    productionLineId: productionLineId.value,
    boxTypeId: boxTypeId.value,
    qty: Number(qtyText.value),
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
    title="Add Request Box"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Production Line
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select
          v-model="productionLineId"
          :class="selectClass"
          :disabled="availableProductionLines.length === 0"
        >
          <option v-for="line in availableProductionLines" :key="line.id" :value="line.id">
            {{ line.name }}
          </option>
        </select>
        <p v-if="errors.productionLineId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.productionLineId }}
        </p>
        <p v-else-if="availableProductionLines.length === 0"
          class="font-medium text-xs text-amber-600 dark:text-amber-400"
        >
          You are not assigned as the operator of any production line.
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Box
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="boxTypeId" :class="selectClass">
          <option v-for="box in boxTypes" :key="box.id" :value="box.id">
            {{ box.name }}
          </option>
        </select>
        <p v-if="errors.boxTypeId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.boxTypeId }}
        </p>
      </div>

      <UiBaseInput v-model="qtyText" label="Qty" required :error="errors.qty" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="handleCancel">Cancel</UiBaseButton>
      <UiBaseButton
        variant="gradient"
        :loading="submitting"
        :disabled="availableProductionLines.length === 0"
        @click="handleSubmit"
      >
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
