<script setup lang="ts">
import { ImageIcon, UploadCloud } from 'lucide-vue-next'
import type { FactoryMap, FactoryMapFormInput, RackTarget } from '~/types/factory-map'
import { parseTopologyLocations } from '~/utils/topologyLocations'
import type { TopologyLocations } from '~/utils/topologyLocations'

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
  submit: [input: FactoryMapFormInput]
  cancel: []
}>()

const name = ref('')
const areaNumberText = ref('')
const imageFile = ref<File | null>(null)
const topologyFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const errors = reactive<{ name?: string, areaNumber?: string, topologyFile?: string }>({})

// What the chosen topology file contains (create mode only): chargers and
// parking areas are imported automatically, while each rack has to be
// routed to Production or Warehouse Location here first — the file itself
// can't tell those two apart.
const detected = ref<TopologyLocations | null>(null)
const rackTargets = ref<Record<string, RackTarget | null>>({})

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
  detected.value = null
  rackTargets.value = {}
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

async function handleTopologyPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  topologyFile.value = file
  errors.topologyFile = undefined
  detected.value = null
  rackTargets.value = {}
  if (isEditMode.value) return

  try {
    const locations = await parseTopologyLocations(file)
    detected.value = locations
    rackTargets.value = Object.fromEntries(locations.racks.map(rack => [rack.code, null]))
  } catch {
    topologyFile.value = null
    errors.topologyFile = 'This file is not valid JSON'
    input.value = ''
  }
}

function toggleRack(code: string, target: RackTarget) {
  rackTargets.value = { ...rackTargets.value, [code]: rackTargets.value[code] === target ? null : target }
}

function setAllRacks(target: RackTarget | null) {
  rackTargets.value = Object.fromEntries((detected.value?.racks ?? []).map(rack => [rack.code, target]))
}

const assignedRackCount = computed(() => Object.values(rackTargets.value).filter(Boolean).length)

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
    rackAssignments: isEditMode.value
      ? undefined
      : Object.entries(rackTargets.value)
          .filter((entry): entry is [string, RackTarget] => entry[1] !== null)
          .map(([code, target]) => ({ code, target })),
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
    :size="!isEditMode && detected ? 'lg' : 'sm'"
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

      <div v-if="detected && !isEditMode" class="space-y-3 rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-4">
        <p class="text-sm font-semibold text-[#0F1F52]">Locations found in this map</p>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="rounded-lg bg-white px-3 py-2">
            <p class="font-semibold text-[#0F1F52]">{{ detected.chargers.length }} Charger Area(s)</p>
            <p class="text-slate-400">Node type 6 — added automatically</p>
          </div>
          <div class="rounded-lg bg-white px-3 py-2">
            <p class="font-semibold text-[#0F1F52]">{{ detected.parkings.length }} Parking Area(s)</p>
            <p class="text-slate-400">Node type 7 — added automatically</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-400">
          Node “content” becomes the iRayple Location Code and “name” becomes the Name. Codes that already exist are skipped.
        </p>

        <div v-if="detected.racks.length > 0" class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-semibold text-[#0F1F52]">
              Racks (type 1) — choose where each goes
              <span class="font-normal text-slate-400">· {{ assignedRackCount }} / {{ detected.racks.length }} selected</span>
            </p>
            <div class="flex gap-1.5 text-[11px] font-semibold">
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-600 hover:border-[#01ADEF]" @click="setAllRacks('PRODUCTION')">All → Production</button>
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-600 hover:border-[#01ADEF]" @click="setAllRacks('WAREHOUSE')">All → Warehouse</button>
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-400 hover:border-slate-300" @click="setAllRacks(null)">Clear</button>
            </div>
          </div>

          <div class="max-h-60 divide-y divide-[#E2E8F0] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white">
            <div v-for="rack in detected.racks" :key="rack.code" class="flex items-center gap-3 px-3 py-1.5 text-xs">
              <span class="min-w-0 flex-1 truncate font-mono font-medium text-[#0F1F52]">
                {{ rack.code }}
                <span v-if="rack.name !== rack.code" class="font-sans font-normal text-slate-400">· {{ rack.name }}</span>
              </span>
              <label class="flex cursor-pointer items-center gap-1.5 text-slate-600">
                <input type="checkbox" class="accent-[#01ADEF]" :checked="rackTargets[rack.code] === 'PRODUCTION'" @change="toggleRack(rack.code, 'PRODUCTION')">
                Production
              </label>
              <label class="flex cursor-pointer items-center gap-1.5 text-slate-600">
                <input type="checkbox" class="accent-[#01ADEF]" :checked="rackTargets[rack.code] === 'WAREHOUSE'" @change="toggleRack(rack.code, 'WAREHOUSE')">
                Warehouse
              </label>
            </div>
          </div>
          <p class="text-[11px] text-slate-400">Racks left unchecked are not imported.</p>
        </div>
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
