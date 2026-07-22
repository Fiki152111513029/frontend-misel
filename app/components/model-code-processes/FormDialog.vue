<script setup lang="ts">
import type {
  CreateModelCodeProcessInput,
  FromSystem,
  ModelCodeProcess,
} from '~/types/model-code-process'

interface Props {
  modelValue: boolean
  modelCodeProcess?: ModelCodeProcess | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelCodeProcess: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreateModelCodeProcessInput]
  cancel: []
}>()

const name = ref('')
const fromSystem = ref<FromSystem>('MES')
const isActive = ref(true)
// 8 fixed comment slots shown to Operator and Admin, explaining what each
// task status stage means for this Model Code Process.
const statusComments = reactive<string[]>(Array.from({ length: 8 }, () => ''))
const errors = reactive<{ name?: string }>({})

function resetFields() {
  name.value = props.modelCodeProcess?.name ?? ''
  fromSystem.value = props.modelCodeProcess?.fromSystem ?? 'MES'
  isActive.value = props.modelCodeProcess?.isActive ?? true
  statusComments[0] = props.modelCodeProcess?.statusComment1 ?? ''
  statusComments[1] = props.modelCodeProcess?.statusComment2 ?? ''
  statusComments[2] = props.modelCodeProcess?.statusComment3 ?? ''
  statusComments[3] = props.modelCodeProcess?.statusComment4 ?? ''
  statusComments[4] = props.modelCodeProcess?.statusComment5 ?? ''
  statusComments[5] = props.modelCodeProcess?.statusComment6 ?? ''
  statusComments[6] = props.modelCodeProcess?.statusComment7 ?? ''
  statusComments[7] = props.modelCodeProcess?.statusComment8 ?? ''
  errors.name = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.modelCodeProcess)

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
    fromSystem: fromSystem.value,
    isActive: isActive.value,
    statusComment1: statusComments[0],
    statusComment2: statusComments[1],
    statusComment3: statusComments[2],
    statusComment4: statusComments[3],
    statusComment5: statusComments[4],
    statusComment6: statusComments[5],
    statusComment7: statusComments[6],
    statusComment8: statusComments[7],
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
    :title="isEditMode ? 'Edit Model Code Process' : 'Add Model Code Process'"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          From System
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <select v-model="fromSystem" :class="selectClass">
          <option value="MES">MES</option>
          <option value="WMS">WMS</option>
        </select>
      </div>

      <UiBaseCheckbox v-model="isActive" label="Active" />

      <div class="space-y-3 border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]">
        <p class="text-xs font-bold uppercase tracking-wide text-[#0F1F52] dark:text-[#F8FAFC]">
          Status Comments
        </p>
        <p class="font-medium -mt-2 text-xs text-slate-400">
          Shown to Operator and Admin for each of the 8 task status stages.
        </p>
        <UiBaseInput
          v-for="index in 8"
          :key="index"
          v-model="statusComments[index - 1]"
          :label="`Status ${index} Comment`"
        />
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
