<script setup lang="ts">
import type { ControlTask, CreateControlTaskInput } from '~/types/control-task'

interface Props {
  modelValue: boolean
  controlTask?: ControlTask | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  controlTask: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateControlTaskInput]
  cancel: []
}>()

const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()
const activeModelCodeProcesses = computed(() =>
  modelCodeProcesses.value.filter(process => process.isActive),
)
const { production, warehouse, fetchRouteOptions } = useRouteOptions()

const abjad = ref('')
const name = ref('')
const modelCodeProcessId = ref('')
const route = ref<string[]>([])
const isActive = ref(true)
const errors = reactive<{
  abjad?: string
  name?: string
  modelCodeProcessId?: string
  route?: string
}>({})

function resetFields() {
  abjad.value = props.controlTask?.abjad ?? ''
  name.value = props.controlTask?.name ?? ''
  modelCodeProcessId.value = props.controlTask?.modelCodeProcessId ?? ''
  route.value = [...(props.controlTask?.route ?? [])]
  isActive.value = props.controlTask?.isActive ?? true
  errors.abjad = undefined
  errors.name = undefined
  errors.modelCodeProcessId = undefined
  errors.route = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetFields()
      fetchModelCodeProcesses({ limit: 100 })
      fetchRouteOptions()
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.controlTask)

function validate(): boolean {
  errors.abjad = undefined
  errors.name = undefined
  errors.modelCodeProcessId = undefined
  errors.route = undefined

  if (!abjad.value.trim()) {
    errors.abjad = 'Abjad is required'
  } else if (abjad.value.trim().length > 20) {
    errors.abjad = 'Abjad must be at most 20 characters'
  }

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  if (!modelCodeProcessId.value) {
    errors.modelCodeProcessId = 'Model Code Process is required'
  }

  if (route.value.length === 0) {
    errors.route = 'Add at least one location to the route'
  }

  return !errors.abjad && !errors.name && !errors.modelCodeProcessId && !errors.route
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    abjad: abjad.value.trim(),
    name: name.value.trim(),
    modelCodeProcessId: modelCodeProcessId.value,
    route: route.value,
    isActive: isActive.value,
  })
}

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Control Task' : 'Add Control Task'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiBaseInput
          v-model="abjad"
          label="Abjad"
          required
          :error="errors.abjad"
          placeholder="A"
        />
        <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Model Code Process
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="modelCodeProcessId" :class="selectClass">
          <option value="" disabled>Select a Model Code Process</option>
          <option v-for="process in activeModelCodeProcesses" :key="process.id" :value="process.id">
            {{ process.name }}
          </option>
        </select>
        <p v-if="errors.modelCodeProcessId" class="mt-1 text-xs text-red-500">
          {{ errors.modelCodeProcessId }}
        </p>
      </div>

      <ControlTasksRouteBuilder
        v-model="route"
        :production="production"
        :warehouse="warehouse"
        :error="errors.route"
      />

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
