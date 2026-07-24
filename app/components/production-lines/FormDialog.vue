<script setup lang="ts">
import type { CreateProductionLineInput, ProductionLine } from '~/types/production-line'
import type { QuarantineLine } from '~/types/quarantine-line'
import type { User } from '~/types/user'

interface Props {
  modelValue: boolean
  productionLine?: ProductionLine | null
  quarantineLines: QuarantineLine[]
  users: User[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  productionLine: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateProductionLineInput]
  cancel: []
}>()

const name = ref('')
const quarantineLineId = ref('')
const operatorId = ref('')
const isActive = ref(true)
const errors = reactive<{ name?: string; quarantineLineId?: string; operatorId?: string }>({})

function resetFields() {
  name.value = props.productionLine?.name ?? ''
  quarantineLineId.value =
    props.productionLine?.quarantineLineId ?? props.quarantineLines[0]?.id ?? ''
  operatorId.value = props.productionLine?.operatorId ?? ''
  isActive.value = props.productionLine?.isActive ?? true
  errors.name = undefined
  errors.quarantineLineId = undefined
  errors.operatorId = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.productionLine)

function validate(): boolean {
  errors.name = undefined
  errors.quarantineLineId = undefined
  errors.operatorId = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!quarantineLineId.value) {
    errors.quarantineLineId = 'Quarantine Line is required'
  }

  if (!operatorId.value) {
    errors.operatorId = 'Operator is required'
  }

  return !errors.name && !errors.quarantineLineId && !errors.operatorId
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    quarantineLineId: quarantineLineId.value,
    operatorId: operatorId.value,
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
    :title="isEditMode ? 'Edit Production Line' : 'Add Production Line'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Quarantine Line
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="quarantineLineId" :class="selectClass">
          <option v-for="line in quarantineLines" :key="line.id" :value="line.id">
            {{ line.name }}
          </option>
        </select>
        <p v-if="errors.quarantineLineId" class="font-medium text-xs text-red-500">
          {{ errors.quarantineLineId }}
        </p>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Operator
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="operatorId" :class="selectClass">
          <option value="" disabled>-- Select Operator --</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.username }}
          </option>
        </select>
        <p v-if="errors.operatorId" class="font-medium text-xs text-red-500">
          {{ errors.operatorId }}
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
