<script setup lang="ts">
import { Truck } from 'lucide-vue-next'
import { taskStatusLabel } from '~/utils/taskStatus'
import { fetchMyActiveTrolleyActivities } from '~/services/trolley-activity.service'

// Real backend flow (no more mock data):
// 1. Scan Trolley  -> POST /trolley-activities/lookup-trolley
// 2. Scan Location -> POST /trolley-activities/lookup-location
// 3. Submit         -> POST /trolley-activities (flips the trolley's status,
//    records the activity, forwards a task order to RCS) -> a new Current
//    Queue card, polled the same way Mainline polls its own released task.
//    Unlike Mainline, submitting doesn't lock the scan flow — the operator
//    can immediately start scanning the next trolley while earlier ones are
//    still in flight, so several Current Queue cards can be active at once,
//    each disappearing independently once its own task finishes. The queue
//    itself lives in a Pinia store (see stores/trolley-task-queue.ts), not
//    page-local state, so it survives navigating to another page and back.
interface Props {
  roleLabel: string
}

const props = defineProps<Props>()

const toast = useToast()
const {
  lookupTrolley,
  lookupLocation,
  createTrolleyActivity,
} = useTrolleyActivities()
const queue = useTrolleyTaskQueueStore(props.roleLabel)

type Step = 'trolley' | 'location' | 'ready'

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

// The Pinia queue store only lives in browser memory — a page reload (or a
// backend/webserver restart forcing a reconnect) wipes it even though the
// underlying Trolley Activity is safely persisted server-side. Restore this
// user's own still-in-flight tasks on mount so the Current Queue card comes
// back. Warehouse Trolley Task only restores WAREHOUSE-pickup tasks and
// Operator Trolley Task only PRODUCTION-pickup ones — the same split
// CreateTrolleyActivityUseCase derives at submit time — so a task never
// resurfaces on the other page. addTask() is idempotent, so this is safe to
// run every time this component mounts, not just after a real reload.
const expectedPickupSource = props.roleLabel === 'Warehouse' ? 'WAREHOUSE' : 'PRODUCTION'

async function restoreActiveQueue() {
  try {
    const activities = await fetchMyActiveTrolleyActivities()
    for (const activity of activities) {
      if (activity.pickupSource !== expectedPickupSource) continue
      queue.addTask({
        activityId: activity.activityId,
        taskId: activity.taskId,
        trolleyCode: activity.trolleyCode,
        trolleyName: activity.trolleyName,
      })
    }
  } catch {
    // Non-fatal — worst case the queue just starts empty this session.
  }
}

onMounted(restoreActiveQueue)

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

  // Fire-and-forget — the store owns sequence/webhook fetching and polling,
  // so this doesn't need to block the scan flow from resetting below.
  queue.addTask({
    activityId: result.activity.id,
    taskId: result.activity.taskId,
    trolleyCode: result.activity.trolley.code,
    trolleyName: result.activity.trolley.name,
  })

  // Free up the scan flow right away so the next trolley can be scanned
  // without waiting for this one to finish.
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

    <!-- Current Queue — same fields/polling behavior as Mainline, one card
         per trolley task still in flight. -->
    <div
      v-for="item in queue.items"
      :key="item.activityId"
      class="flex items-center gap-4 rounded-2xl border border-[#01ADEF]/20 bg-gradient-to-r from-[#01ADEF]/10 to-transparent px-5 py-4"
    >
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
        <Truck class="h-5 w-5" />
      </div>
      <div class="flex-1 space-y-1 text-sm">
        <p class="font-semibold uppercase tracking-wide text-[#01ADEF]">Current Queue</p>
        <p class="font-medium text-slate-500">
          Trolley :
          <span class="font-medium text-[#0F1F52]">{{ item.trolleyName }} ({{ item.trolleyCode }})</span>
        </p>
        <p class="font-medium text-slate-500">
          No urut :
          <span class="font-medium text-[#0F1F52]">{{ item.queueNumber ?? '-' }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Task ID :
          <span class="font-medium text-[#0F1F52]">{{ item.taskId }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Status :
          <span class="font-semibold text-[#01ADEF]">
            {{ item.webhookStatus?.status ? taskStatusLabel(item.webhookStatus.status) : '-' }}
          </span>
        </p>
        <p class="font-medium text-slate-500">
          subTaskSeq :
          <span class="font-medium text-[#0F1F52]">
            {{ item.webhookStatus?.subTaskSeq ?? '-' }}
            <template v-if="item.webhookStatus?.statusComment"> — {{ item.webhookStatus.statusComment }}</template>
          </span>
        </p>
      </div>
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

      <UiBaseButton full-width variant="gradient" :loading="submitting" @click="handleSubmit">
        Submit
      </UiBaseButton>
    </UiBaseCard>
  </div>
</template>
