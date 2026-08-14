<script setup lang="ts">
// UI-only scan wizard — no backend calls yet ("tampilan saja dulu"). Meant to
// be driven by a handheld/USB-HID barcode scanner acting as a keyboard: it
// types the scanned code into whichever input is focused, then sends Enter.
// So the flow just needs one auto-focused input per step and an Enter
// handler — no camera access needed.
interface Props {
  roleLabel: string
}

const props = defineProps<Props>()

const toast = useToast()

type Step = 'trolley' | 'area' | 'ready'

const step = ref<Step>('trolley')
const scanValue = ref('')
const SCAN_INPUT_ID = 'trolley-task-scan-input'

const trolleyCode = ref('')
const areaCode = ref('')
const pickupLocation = ref('')
const dropLocation = ref('')
const queueItems = ref<string[]>([])
const submitting = ref(false)

const scanLabel = computed(() => (step.value === 'trolley' ? 'Scan Trolley' : 'Scan Area'))

function focusScanInput() {
  nextTick(() => {
    document.getElementById(SCAN_INPUT_ID)?.focus()
  })
}

onMounted(focusScanInput)

// Mock lookup — stands in for the real Pickup/Drop/Queue API call that'll
// replace this once the backend side is wired up.
function mockLookupArea(code: string) {
  pickupLocation.value = `Pickup ${code}-A`
  dropLocation.value = `Drop ${code}-B`
  queueItems.value = [
    `TASK-${code}-01 · Pending`,
    `TASK-${code}-02 · In Progress`,
  ]
}

function handleScanSubmit() {
  const value = scanValue.value.trim()
  if (!value) return

  if (step.value === 'trolley') {
    trolleyCode.value = value
    step.value = 'area'
  } else if (step.value === 'area') {
    areaCode.value = value
    mockLookupArea(value)
    step.value = 'ready'
  }

  scanValue.value = ''
  focusScanInput()
}

function changeTrolley() {
  step.value = 'trolley'
  trolleyCode.value = ''
  areaCode.value = ''
  pickupLocation.value = ''
  dropLocation.value = ''
  queueItems.value = []
  scanValue.value = ''
  focusScanInput()
}

function changeArea() {
  step.value = 'area'
  areaCode.value = ''
  pickupLocation.value = ''
  dropLocation.value = ''
  queueItems.value = []
  scanValue.value = ''
  focusScanInput()
}

async function handleSubmit() {
  submitting.value = true
  // No backend yet — simulate the round trip so the UI/flow can be reviewed.
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  toast.success('Trolley task submitted')
  changeTrolley()
}
</script>

<template>
  <div class="mx-auto w-full max-w-md space-y-4 px-4 py-6 sm:px-0">
    <div>
      <h1 class="text-xl font-extrabold text-[#0F1F52] sm:text-2xl">
        {{ roleLabel }} Trolley Task
      </h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        Scan a trolley to start
      </p>
    </div>

    <!-- Confirmed scans so far, each re-scannable -->
    <div v-if="trolleyCode" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeTrolley"
      >
        Trolley: {{ trolleyCode }} · Change
      </button>
      <button
        v-if="areaCode"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeArea"
      >
        Area: {{ areaCode }} · Change
      </button>
    </div>

    <!-- Active scan step — a real <form> so Enter submits natively (key
         modifiers on component fallthrough listeners aren't reliable, and a
         handheld scanner's Enter terminator needs to just work). -->
    <UiBaseCard v-if="step !== 'ready'">
      <form class="space-y-3" @submit.prevent="handleScanSubmit">
        <span class="inline-flex items-center rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-[#0F1F52]">
          {{ scanLabel }}
        </span>
        <UiBaseInput
          v-model="scanValue"
          :id="SCAN_INPUT_ID"
          :label="step === 'trolley' ? 'Trolley Code' : 'Area Code'"
          placeholder="Waiting for scan…"
        />
        <UiBaseButton type="submit" full-width variant="gradient">
          Confirm
        </UiBaseButton>
      </form>
    </UiBaseCard>

    <!-- Review + submit -->
    <UiBaseCard v-else class="space-y-4">
      <UiBaseInput :model-value="trolleyCode" label="Trolley Code" disabled />
      <UiBaseInput v-model="pickupLocation" label="Pickup Location" />
      <UiBaseInput v-model="dropLocation" label="Drop Location" />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Current Queue</label>
        <div class="min-h-[88px] space-y-1.5 rounded-xl border border-[#E2E8F0] bg-white p-3">
          <p v-if="queueItems.length === 0" class="text-sm text-slate-400">
            No pending tasks
          </p>
          <p
            v-for="item in queueItems"
            :key="item"
            class="text-sm text-[#0F1F52]"
          >
            {{ item }}
          </p>
        </div>
      </div>

      <UiBaseButton full-width variant="gradient" :loading="submitting" @click="handleSubmit">
        Submit
      </UiBaseButton>
    </UiBaseCard>
  </div>
</template>
