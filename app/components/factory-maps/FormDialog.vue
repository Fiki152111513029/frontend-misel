<script setup lang="ts">
import { ImageIcon, UploadCloud } from 'lucide-vue-next'
import type { FactoryMap, UpdateFactoryMapInput } from '~/types/factory-map'

interface Props {
  modelValue: boolean
  factoryMap?: FactoryMap | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  factoryMap: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: UpdateFactoryMapInput]
  cancel: []
}>()

const name = ref('')
const areaNumberText = ref('')
const imageFile = ref<File | null>(null)
const topologyFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const errors = reactive<{ name?: string, areaNumber?: string, topologyFile?: string }>({})

const isEditMode = computed(() => !!props.factoryMap)

function resetFields() {
  name.value = props.factoryMap?.name ?? ''
  areaNumberText.value = props.factoryMap?.areaNumber != null ? String(props.factoryMap.areaNumber) : ''
  imageFile.value = null
  topologyFile.value = null
  imagePreviewUrl.value = props.factoryMap?.imageUrl ?? null
  errors.name = undefined
  errors.areaNumber = undefined
  errors.topologyFile = undefined
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

function handleImagePick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function handleTopologyPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  topologyFile.value = file
  errors.topologyFile = undefined
}

function validate(): boolean {
  errors.name = undefined
  errors.areaNumber = undefined
  errors.topologyFile = undefined

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  } else if (name.value.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  const areaNumberValue = Number(areaNumberText.value)
  if (!areaNumberText.value.trim()) {
    errors.areaNumber = 'Area Number is required'
  } else if (!Number.isInteger(areaNumberValue) || areaNumberValue < 1) {
    errors.areaNumber = 'Area Number must be an integer starting from 1'
  }

  if (!isEditMode.value && !topologyFile.value) {
    errors.topologyFile = 'A topology JSON file is required'
  }

  return !errors.name && !errors.areaNumber && !errors.topologyFile
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    areaNumber: Number(areaNumberText.value),
    imageFile: imageFile.value ?? undefined,
    topologyFile: topologyFile.value ?? undefined,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Factory Map' : 'Add Factory Map'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <UiBaseInput v-model="name" label="Name" required :error="errors.name" />
      <UiBaseInput
        v-model="areaNumberText"
        label="Area Number"
        required
        :error="errors.areaNumber"
      />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Map Image
          <span class="ml-0.5 font-normal text-slate-400">(optional)</span>
        </label>
        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#E2E8F0] bg-white px-4 py-3 text-sm text-slate-500 hover:border-[#01ADEF]"
        >
          <div class="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
            <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="" class="h-full w-full object-cover" />
            <ImageIcon v-else class="h-5 w-5 text-slate-300" />
          </div>
          <span class="flex items-center gap-1.5">
            <UploadCloud class="h-4 w-4" />
            {{ imageFile ? imageFile.name : isEditMode ? 'Replace image (optional)' : 'Choose an image (JPEG/PNG/WebP) — optional' }}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleImagePick" />
        </label>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Topology JSON
          <span v-if="!isEditMode" class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <label
          class="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#E2E8F0] bg-white px-4 py-3 text-sm text-slate-500 hover:border-[#01ADEF]"
        >
          <UploadCloud class="h-4 w-4 flex-shrink-0" />
          <span class="truncate">
            {{ topologyFile ? topologyFile.name : isEditMode ? 'Replace topology file (optional)' : 'Choose a topology .json file' }}
          </span>
          <input type="file" accept="application/json,.json" class="hidden" @change="handleTopologyPick" />
        </label>
        <p v-if="errors.topologyFile" role="alert" class="font-medium flex items-center gap-1.5 text-xs text-red-500">
          {{ errors.topologyFile }}
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
