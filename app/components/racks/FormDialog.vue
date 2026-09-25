<script setup lang="ts">
import type { CreateRackInput, Rack, RackStatus } from '~/types/rack'

interface Props {
  modelValue: boolean
  rack?: Rack | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rack: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateRackInput]
  cancel: []
}>()

const name = ref('')
const status = ref<RackStatus>('EMPTY')
const isActive = ref(true)
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.rack?.name ?? ''
  status.value = props.rack?.status ?? 'EMPTY'
  isActive.value = props.rack?.isActive ?? true
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.rack)

function validate(): boolean {
  errors.name = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  return !errors.name
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    status: status.value,
    isActive: isActive.value,
  })
}

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Rack' : 'Add Rack'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Status
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="status" :class="selectClass">
          <option value="EMPTY">Empty</option>
          <option value="FULL">Full</option>
        </select>
      </div>

      <UiBaseCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
