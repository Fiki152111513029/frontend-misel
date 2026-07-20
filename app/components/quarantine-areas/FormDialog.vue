<script setup lang="ts">
import type { QuarantineArea, CreateQuarantineAreaInput } from '~/types/quarantine-area'
import type { QuarantineLine } from '~/types/quarantine-line'

interface Props {
  modelValue: boolean
  quarantineArea?: QuarantineArea | null
  quarantineLines: QuarantineLine[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  quarantineArea: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateQuarantineAreaInput]
  cancel: []
}>()

const name = ref('')
const iRaypleLocationCode = ref('')
const quarantineLineId = ref('')
const errors = reactive<{ name?: string; iRaypleLocationCode?: string; quarantineLineId?: string }>(
  {},
)

function resetFields() {
  name.value = props.quarantineArea?.name ?? ''
  iRaypleLocationCode.value = props.quarantineArea?.iRaypleLocationCode ?? ''
  quarantineLineId.value =
    props.quarantineArea?.quarantineLineId ?? props.quarantineLines[0]?.id ?? ''
  errors.name = undefined
  errors.iRaypleLocationCode = undefined
  errors.quarantineLineId = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.quarantineArea)

function validate(): boolean {
  errors.name = undefined
  errors.iRaypleLocationCode = undefined
  errors.quarantineLineId = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!iRaypleLocationCode.value.trim()) {
    errors.iRaypleLocationCode = 'iRayple Location Code is required'
  }

  if (!quarantineLineId.value) {
    errors.quarantineLineId = 'Quarantine Line is required'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    iRaypleLocationCode: iRaypleLocationCode.value.trim(),
    quarantineLineId: quarantineLineId.value,
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
    :title="isEditMode ? 'Edit Quarantine Area' : 'Add Quarantine Area'"
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

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Quarantine Line
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="quarantineLineId" :class="selectClass">
          <option v-for="line in quarantineLines" :key="line.id" :value="line.id">
            {{ line.name }}
          </option>
        </select>
        <p v-if="errors.quarantineLineId" class="font-medium text-xs text-red-500 dark:text-red-400">
          {{ errors.quarantineLineId }}
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
