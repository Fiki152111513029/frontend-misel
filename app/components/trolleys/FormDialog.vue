<script setup lang="ts">
import type {
  CreateTrolleyInput,
  Trolley,
  TrolleyStatus,
} from '~/types/trolley'

interface Props {
  modelValue: boolean
  trolley?: Trolley | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trolley: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateTrolleyInput]
  cancel: []
}>()

const { items: trolleyCategories, fetchTrolleyCategories } = useTrolleyCategories()
const { items: productionLocations, fetchProductionLocations } = useProductionLocations()
const activeProductionLocations = computed(() => productionLocations.value.filter(location => location.isActive))

const name = ref('')
const code = ref('')
const status = ref<TrolleyStatus>('EMPTY')
const trolleyCategoryId = ref('')
const droppingLocationCode = ref('')
const errors = reactive<{ name?: string; code?: string }>({})

function resetFields() {
  name.value = props.trolley?.name ?? ''
  code.value = props.trolley?.code ?? ''
  status.value = props.trolley?.status ?? 'EMPTY'
  trolleyCategoryId.value = props.trolley?.trolleyCategoryId ?? ''
  droppingLocationCode.value = props.trolley?.droppingLocationCode ?? ''
  errors.name = undefined
  errors.code = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetFields()
      fetchTrolleyCategories({ limit: 100 })
      fetchProductionLocations({ limit: 100 })
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.trolley)

function validate(): boolean {
  errors.name = undefined
  errors.code = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!code.value.trim()) {
    errors.code = 'Code is required'
  }

  return !errors.name && !errors.code
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    code: code.value.trim(),
    status: status.value,
    trolleyCategoryId: trolleyCategoryId.value || undefined,
    droppingLocationCode: droppingLocationCode.value || undefined,
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
    :title="isEditMode ? 'Edit Trolley' : 'Add Trolley'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput v-model="code" label="Code" required :error="errors.code" />

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

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Category
        </label>
        <select v-model="trolleyCategoryId" :class="selectClass">
          <option value="">No Category</option>
          <option v-for="category in trolleyCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Dropping Location Code
        </label>
        <select v-model="droppingLocationCode" :class="selectClass">
          <option value="">None</option>
          <option v-for="location in activeProductionLocations" :key="location.id" :value="location.iRaypleLocationCode">
            {{ location.name }} ({{ location.iRaypleLocationCode }})
          </option>
        </select>
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
