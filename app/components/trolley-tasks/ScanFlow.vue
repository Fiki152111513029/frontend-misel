<script setup lang="ts">
import { Truck } from 'lucide-vue-next'
import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import { isTaskCompleted, isTaskTerminal, taskStatusLabel } from '~/utils/taskStatus'
import type { LatestWebhookStatus } from '~/types/webhook-log'

// Real backend flow (no more mock data):
// 1. Scan Trolley  -> POST /trolley-activities/lookup-trolley
// 2. Scan Location -> POST /trolley-activities/lookup-location
// 3. Submit         -> POST /trolley-activities (flips the trolley's status,
//    records the activity, forwards a task order to RCS) -> Current Queue
//    (No urut / Task ID / Status / subTaskSeq), polled the same way Mainline
//    polls its own released task.
interface Props {
  roleLabel: string
}

defineProps<Props>()

const toast = useToast()
const {
  lookupTrolley,
  lookupLocation,
  createTrolleyActivity,
  fetchTrolleyActivitySequence,
} = useTrolleyActivities()

type Step = 'trolley' | 'location' | 'ready' | 'submitted'

const step = ref<Step>('trolley')
const scanValue = ref('')
const SCAN_INPUT_ID = 'trolley-task-scan-input'
const submitting = ref(false)

const trolleyId = ref('')
const trolleyCode = ref('')
const userName = ref('')
const statusBeginning = ref('')
const droppingLocationCode = ref<string | null>(null)
const startDate = ref('')

const pickupLocationCode = ref('')
const pickupLocationName = ref('')
const pickupLocationSource = ref<'WAREHOUSE' | 'PRODUCTION' | ''>('')

// Warehouse->Production: dropping is the trolley's own fixed code, already
// known. Production->Warehouse: dropping is auto-picked from an EMPTY
// Warehouse Location only at submit time, so there's nothing to preview yet.
const droppingLocationPreview = computed(() => {
  if (pickupLocationSource.value === 'PRODUCTION') return 'Auto-assigned (empty Warehouse Location) on submit'
  return droppingLocationCode.value ?? '-'
})

const scanLabel = computed(() => (step.value === 'location' ? 'Scan Area' : 'Scan Trolley'))

function focusScanInput() {
  nextTick(() => {
    document.getElementById(SCAN_INPUT_ID)?.focus()
  })
}

onMounted(focusScanInput)

async function handleScanSubmit() {
  const value = scanValue.value.trim()
  if (!value) return

  if (step.value === 'trolley') {
    const result = await lookupTrolley(value)
    if (!result) return
    trolleyId.value = result.trolleyId
    trolleyCode.value = result.trolleyCode
    userName.value = result.userName
    statusBeginning.value = result.statusBeginning
    droppingLocationCode.value = result.droppingLocationCode
    startDate.value = result.startDate
    step.value = 'location'
  } else if (step.value === 'location') {
    const result = await lookupLocation(value)
    if (!result) return
    pickupLocationCode.value = result.pickupLocationCode
    pickupLocationName.value = result.pickupLocationName
    pickupLocationSource.value = result.pickupLocationSource
    step.value = 'ready'
  }

  scanValue.value = ''
  focusScanInput()
}

function changeTrolley() {
  step.value = 'trolley'
  trolleyId.value = ''
  trolleyCode.value = ''
  userName.value = ''
  statusBeginning.value = ''
  droppingLocationCode.value = null
  startDate.value = ''
  pickupLocationCode.value = ''
  pickupLocationName.value = ''
  pickupLocationSource.value = ''
  scanValue.value = ''
  focusScanInput()
}

function changeLocation() {
  step.value = 'location'
  pickupLocationCode.value = ''
  pickupLocationName.value = ''
  pickupLocationSource.value = ''
  scanValue.value = ''
  focusScanInput()
}

// Live "now" for the duration display on the review step — start_date is
// server-stamped (from the trolley scan), end_date/duration are only
// authoritative once actually submitted, this is just an indicative preview.
const nowTick = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  nowTimer = setInterval(() => { nowTick.value = Date.now() }, 1000)
})
onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer)
})

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

const durationPreview = computed(() => {
  if (!startDate.value) return '-'
  return formatDuration(nowTick.value - new Date(startDate.value).getTime())
})

// --- Current Queue (post-submit), polled exactly like Mainline ---
const queueNumber = ref<number | null>(null)
const submittedTaskId = ref<string | null>(null)
const submittedActivityId = ref<string | null>(null)
const webhookStatus = ref<LatestWebhookStatus | null>(null)

const POLL_INTERVAL_MS = 3000
const TERMINAL_GRACE_MS = 5000
let pollTimer: ReturnType<typeof setInterval> | null = null
let terminalSince: number | null = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  terminalSince = null
}

function clearCurrentQueue() {
  queueNumber.value = null
  submittedTaskId.value = null
  submittedActivityId.value = null
  webhookStatus.value = null
  changeTrolley()
  step.value = 'trolley'
}

async function refreshWebhookStatus(taskId: string) {
  try {
    webhookStatus.value = await fetchLatestWebhookStatus(taskId)
  } catch {
    // Non-fatal — stays stale this tick.
  }
}

function startPolling(activityId: string, taskId: string) {
  stopPolling()
  pollTimer = setInterval(async () => {
    await refreshWebhookStatus(taskId)
    const status = webhookStatus.value?.status
    if (status && isTaskTerminal(status)) {
      if (terminalSince === null) {
        terminalSince = Date.now()
        if (isTaskCompleted(status)) {
          toast.success('Trolley task completed')
        }
      }
      if (Date.now() - terminalSince >= TERMINAL_GRACE_MS) {
        stopPolling()
        clearCurrentQueue()
      }
    } else {
      terminalSince = null
    }
  }, POLL_INTERVAL_MS)
}

onBeforeUnmount(stopPolling)

async function handleSubmit() {
  submitting.value = true
  const result = await createTrolleyActivity({
    trolleyId: trolleyId.value,
    pickupLocationCode: pickupLocationCode.value,
    startDate: startDate.value,
  })
  submitting.value = false
  if (!result) return

  toast.success('Trolley task submitted')
  submittedActivityId.value = result.activity.id
  submittedTaskId.value = result.activity.taskId
  step.value = 'submitted'

  const sequence = await fetchTrolleyActivitySequence(result.activity.id)
  queueNumber.value = sequence?.sequenceNumber ?? null
  await refreshWebhookStatus(result.activity.taskId)
  startPolling(result.activity.id, result.activity.taskId)
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
    <div v-if="trolleyCode && step !== 'submitted'" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeTrolley"
      >
        Trolley: {{ trolleyCode }} · Change
      </button>
      <button
        v-if="pickupLocationCode"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeLocation"
      >
        Area: {{ pickupLocationCode }} · Change
      </button>
    </div>

    <!-- Active scan step — a real <form> so Enter submits natively (key
         modifiers on component fallthrough listeners aren't reliable, and a
         handheld scanner's Enter terminator needs to just work). -->
    <UiBaseCard v-if="step === 'trolley' || step === 'location'">
      <form class="space-y-3" @submit.prevent="handleScanSubmit">
        <span class="inline-flex items-center rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-[#0F1F52]">
          {{ scanLabel }}
        </span>
        <UiBaseInput
          v-model="scanValue"
          :id="SCAN_INPUT_ID"
          :label="step === 'location' ? 'Area Code' : 'Trolley Code'"
          placeholder="Waiting for scan…"
        />
        <UiBaseButton type="submit" full-width variant="gradient">
          Confirm
        </UiBaseButton>
      </form>
    </UiBaseCard>

    <!-- Review + submit -->
    <UiBaseCard v-else-if="step === 'ready'" class="space-y-4">
      <UiBaseInput :model-value="userName" label="Name" disabled />
      <UiBaseInput :model-value="trolleyCode" label="Trolley Code" disabled />
      <UiBaseInput :model-value="statusBeginning" label="Status Beginning" disabled />
      <UiBaseInput :model-value="pickupLocationName ? `${pickupLocationName} (${pickupLocationCode})` : ''" label="Pickup Location" disabled />
      <UiBaseInput :model-value="droppingLocationPreview" label="Dropping Location Code" disabled />
      <UiBaseInput :model-value="durationPreview" label="Duration (so far)" disabled />

      <UiBaseButton full-width variant="gradient" :loading="submitting" @click="handleSubmit">
        Submit
      </UiBaseButton>
    </UiBaseCard>

    <!-- Current Queue — same fields/polling behavior as Mainline. -->
    <div
      v-else-if="step === 'submitted'"
      class="flex items-center gap-4 rounded-2xl border border-[#01ADEF]/20 bg-gradient-to-r from-[#01ADEF]/10 to-transparent px-5 py-4"
    >
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
        <Truck class="h-5 w-5" />
      </div>
      <div class="flex-1 space-y-1 text-sm">
        <p class="font-semibold uppercase tracking-wide text-[#01ADEF]">Current Queue</p>
        <p class="font-medium text-slate-500">
          No urut :
          <span class="font-medium text-[#0F1F52]">{{ queueNumber ?? '-' }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Task ID :
          <span class="font-medium text-[#0F1F52]">{{ submittedTaskId ?? '-' }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Status :
          <span class="font-semibold text-[#01ADEF]">
            {{ webhookStatus?.status ? taskStatusLabel(webhookStatus.status) : '-' }}
          </span>
        </p>
        <p class="font-medium text-slate-500">
          subTaskSeq :
          <span class="font-medium text-[#0F1F52]">
            {{ webhookStatus?.subTaskSeq ?? '-' }}
            <template v-if="webhookStatus?.statusComment"> — {{ webhookStatus.statusComment }}</template>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>
