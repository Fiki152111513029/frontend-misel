<script setup lang="ts">
import { ImageIcon, Trash2, UploadCloud } from 'lucide-vue-next'
import { fetchLocationCodes } from '~/services/factory-map.service'
import type { FactoryMap, FactoryMapFormInput, RackTarget } from '~/types/factory-map'
import { parseTopologyLocations } from '~/utils/topologyLocations'
import type { TopologyLocation, TopologyLocations } from '~/utils/topologyLocations'

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
// Edit only: drop the background and keep the topology. Held here rather
// than acted on at once, so the whole thing is one Save that can be
// abandoned with Cancel like every other field in this dialog.
const removeImage = ref(false)
const errors = reactive<{ name?: string, areaNumber?: string, topologyFile?: string }>({})

// What the chosen topology file contains: chargers and parking areas are
// imported automatically, while each rack has to be routed to Production or
// Warehouse Location here first — the file itself can't tell those two
// apart.
//
// Read on edit as well as create. A map's topology gets re-exported as the
// floor changes, and the nodes added since last time are exactly the ones
// nothing in the system knows about yet; without this they would be drawn
// on the map with no location behind them.
const detected = ref<TopologyLocations | null>(null)
const rackTargets = ref<Record<string, RackTarget | null>>({})

// Codes already registered as a Production or Warehouse Location.
//
// Fetched rather than inferred, because the import skips an existing code
// instead of overwriting it — so offering one here would be a checkbox
// that does nothing. On a re-upload of a map that has been imported once,
// this is what empties the list down to just the genuinely new racks.
const registeredCodes = ref<Set<string>>(new Set())
const registeredLoaded = ref(false)

async function loadRegisteredCodes() {
  registeredLoaded.value = false
  try {
    const { warehouseCodes, productionCodes } = await fetchLocationCodes()
    registeredCodes.value = new Set([...warehouseCodes, ...productionCodes])
  } catch {
    // Non-fatal: an empty set offers every rack, and the import still
    // skips the ones that exist. Showing too many beats showing none.
    registeredCodes.value = new Set()
  } finally {
    registeredLoaded.value = true
  }
}

const isEditMode = computed(() => !!props.factoryMap)

/** The racks worth asking about — the ones no location backs yet. */
const newRacks = computed<TopologyLocation[]>(() =>
  (detected.value?.racks ?? []).filter(rack => !registeredCodes.value.has(rack.code)),
)

/** How many of this file's racks were already registered, for the summary. */
const knownRackCount = computed(
  () => (detected.value?.racks.length ?? 0) - newRacks.value.length,
)

function resetFields() {
  name.value = props.factoryMap?.name ?? ''
  areaNumberText.value = props.factoryMap?.areaNumber != null ? String(props.factoryMap.areaNumber) : ''
  imageFile.value = null
  topologyFile.value = null
  imagePreviewUrl.value = props.factoryMap?.imageUrl ?? null
  removeImage.value = false
  errors.name = undefined
  errors.areaNumber = undefined
  errors.topologyFile = undefined
  detected.value = null
  rackTargets.value = {}
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    resetFields()
    // Started on open rather than on the file pick: by the time anyone has
    // found their .json in a file browser this has long since answered, so
    // the rack list never appears and then rearranges itself.
    void loadRegisteredCodes()
  },
  { immediate: true },
)

function handleImagePick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  // Picking a replacement undoes a pending removal — the server resolves
  // the same contradiction the same way, and the preview now shows an
  // image, so leaving the flag set would make Save do the opposite of what
  // the dialog is displaying.
  removeImage.value = false
}

function clearImage() {
  imageFile.value = null
  imagePreviewUrl.value = null
  removeImage.value = true
}

async function handleTopologyPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  topologyFile.value = file
  errors.topologyFile = undefined
  detected.value = null
  rackTargets.value = {}

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
  rackTargets.value = Object.fromEntries(newRacks.value.map(rack => [rack.code, target]))
}

const assignedRackCount = computed(
  () => newRacks.value.filter(rack => rackTargets.value[rack.code]).length,
)

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
    removeImage: removeImage.value || undefined,
    // Only the racks still on screen: a target left over from a file the
    // operator picked and then replaced is not something they chose.
    rackAssignments: newRacks.value
      .map(rack => ({ code: rack.code, target: rackTargets.value[rack.code] }))
      .filter((entry): entry is { code: string, target: RackTarget } => entry.target != null),
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
    :size="detected ? 'lg' : 'sm'"
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
          <span class="flex-1 truncate">
            <span class="flex items-center gap-1.5">
              <UploadCloud class="h-4 w-4 flex-shrink-0" />
              {{ imageFile
                ? imageFile.name
                : removeImage
                  ? 'Background will be removed on Save'
                  : isEditMode ? 'Replace image (optional)' : 'Choose an image (JPEG/PNG/WebP) — optional' }}
            </span>
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleImagePick" />
        </label>

        <!-- Removing the background leaves the topology untouched, which is
             the point: the nodes and paths are the map, the raster behind
             them is only a backdrop. Shown only when there is one to
             remove — on a map that never had an image, or once removal is
             already pending, the button would do nothing. -->
        <div v-if="isEditMode && imagePreviewUrl" class="flex justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-red-500"
            @click="clearImage"
          >
            <Trash2 class="h-3.5 w-3.5" />
            Remove background image
          </button>
        </div>
        <p v-else-if="isEditMode && removeImage" class="text-xs font-medium text-red-500">
          The background will be removed when you save. Choose an image above to keep one instead.
        </p>
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

      <div v-if="detected" class="space-y-3 rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-4">
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

        <!-- Only the racks nothing backs yet. A code that is already a
             Production or Warehouse Location is skipped by the import
             rather than overwritten, so listing it would be a checkbox
             with no effect — and on a re-upload that is most of the file. -->
        <p v-if="!registeredLoaded" class="text-xs text-slate-400">
          Checking which racks are already registered…
        </p>
        <p v-else-if="detected.racks.length > 0 && newRacks.length === 0" class="text-xs text-slate-500">
          All {{ detected.racks.length }} rack(s) in this file are already registered as a Production or Warehouse Location — nothing new to import.
        </p>

        <div v-else-if="newRacks.length > 0" class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-semibold text-[#0F1F52]">
              New racks (type 1) — choose where each goes
              <span class="font-normal text-slate-400">· {{ assignedRackCount }} / {{ newRacks.length }} selected</span>
            </p>
            <div class="flex gap-1.5 text-[11px] font-semibold">
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-600 hover:border-[#01ADEF]" @click="setAllRacks('PRODUCTION')">All → Production</button>
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-600 hover:border-[#01ADEF]" @click="setAllRacks('WAREHOUSE')">All → Warehouse</button>
              <button type="button" class="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-slate-400 hover:border-slate-300" @click="setAllRacks(null)">Clear</button>
            </div>
          </div>

          <div class="max-h-60 divide-y divide-[#E2E8F0] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white">
            <div v-for="rack in newRacks" :key="rack.code" class="flex items-center gap-3 px-3 py-1.5 text-xs">
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
          <p class="text-[11px] text-slate-400">
            Racks left unchecked are not imported.
            <template v-if="knownRackCount > 0">
              {{ knownRackCount }} already-registered rack(s) in this file are not listed.
            </template>
          </p>
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
