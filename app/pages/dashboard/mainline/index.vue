<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Package,
  RefreshCw,
  ShieldAlert,
  Signal,
  Sparkles,
  Truck,
  Wifi,
} from 'lucide-vue-next'
import { fetchRobotSystemStatus } from '~/services/robot.service'
import { fetchTaskSequence, fetchTasks as fetchTasksSvc } from '~/services/task.service'
import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import type { RobotSystemStatus } from '~/types/robot'
import type { RcsOrderRequest, Task, TaskAction } from '~/types/task'
import type { LatestWebhookStatus } from '~/types/webhook-log'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Mainline — Misel' })

const { user, hasPermission } = useAuth()
const { items: productionLines, fetchProductionLines } = useProductionLines()
const { items: productionLineAreas, fetchProductionLineAreas } = useProductionLineAreas()
const { items: boxTypes, fetchBoxTypes } = useBoxTypes()
const { items: quarantineAreas, fetchQuarantineAreas } = useQuarantineAreas()
const { releaseTask } = useTasks()
const toast = useToast()

const workingAreaId = ref<string | null>(null)
const selectedBoxTypeId = ref('')
const showBoxTypeModal = ref(false)
// No default — the operator must actively pick Ambil FG or Not Standard.
const taskAction = ref<TaskAction | null>(null)
const releasing = ref(false)
const lastReleasedTask = ref<Task | null>(null)
const queueNumber = ref<number | null>(null)
const lastUpdatedAt = ref(new Date())

// System Status: offline if the AMR telemetry endpoint can't be reached at
// all, OR it's reachable but every known robot is reporting "Offline".
// Online requires the endpoint to be reachable AND at least one robot in a
// non-Offline state.
const systemStatus = ref<RobotSystemStatus | null>(null)
const isSystemOnline = computed(() => systemStatus.value?.online ?? false)
const SYSTEM_STATUS_POLL_MS = 5000

async function refreshSystemStatus() {
  try {
    systemStatus.value = await fetchRobotSystemStatus()
  } catch {
    systemStatus.value = { online: false, checkedAt: new Date().toISOString() }
  }
  lastUpdatedAt.value = new Date()
}

let systemStatusTimer: ReturnType<typeof setInterval> | null = null

// Live off the raw webhook payload — never persisted to Task, so it's
// fetched fresh on the same cadence as the task-status poll.
const webhookStatus = ref<LatestWebhookStatus | null>(null)

// How often we poll, and how long we keep polling after the task goes
// terminal before giving up and blanking the Current Queue back to "-".
// The faster cadence is because the last webhook update sometimes arrives a
// beat late — RCS's status occasionally still shows the step before the
// truly final one for a moment.
const POLL_INTERVAL_MS = 3000
const TERMINAL_GRACE_MS = 5000

async function refreshQueueNumber(taskDbId: string) {
  try {
    const { sequenceNumber } = await fetchTaskSequence(taskDbId)
    queueNumber.value = sequenceNumber
  } catch {
    // Non-fatal — "No urut" just stays blank this tick.
  }
}

async function refreshWebhookStatus(taskId: string) {
  try {
    webhookStatus.value = await fetchLatestWebhookStatus(taskId)
  } catch {
    // Non-fatal — the webhook-derived fields just stay stale this tick.
  }
}

// What we actually sent to / got back from the RCS system for the last
// released task, so it can be inspected from the page instead of the
// backend logs.
const lastRcsExchange = ref<{ request: RcsOrderRequest, response: unknown } | null>(null)
const showRcsModal = ref(false)

// A released task locks Line Area switching until it reaches a terminal
// status. Since completion happens on the robot/RCS side (not a frontend
// action), we poll for the latest status instead of just trusting the
// release response.
const isTaskActive = computed(
  () => !!lastReleasedTask.value && !isTaskTerminal(lastReleasedTask.value.status),
)

let pollTimer: ReturnType<typeof setInterval> | null = null
let terminalSince: number | null = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  terminalSince = null
}

// Reset the Current Queue card back to its blank "-" state once a finished
// task's grace period has elapsed with no further update.
function clearCurrentQueue() {
  lastReleasedTask.value = null
  webhookStatus.value = null
  queueNumber.value = null
  lastRcsExchange.value = null
}

// On completion, automatically move to the next Line Area in the list
// (wrapping back to the first) so the operator doesn't have to switch by
// hand. A FAILED task does NOT auto-advance — that needs attention first.
function advanceToNextArea() {
  if (myAreas.value.length < 2) return
  const currentIndex = myAreas.value.findIndex(a => a.id === workingAreaId.value)
  if (currentIndex === -1) return
  const completedArea = myAreas.value[currentIndex]
  const nextArea = myAreas.value[(currentIndex + 1) % myAreas.value.length]
  if (nextArea) {
    workingAreaId.value = nextArea.id
    toast.success(`${completedArea?.name} completed — switched to ${nextArea.name}`)
  }
}

function startPolling(taskDbId: string, taskId: string) {
  stopPolling()
  pollTimer = setInterval(async () => {
    await refreshWebhookStatus(taskId)
    try {
      const result = await fetchTasksSvc({
        operatorId: user.value?.id,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      const match = result.items.find(t => t.id === taskDbId)
      if (match) {
        lastReleasedTask.value = match
        if (isTaskTerminal(match.status)) {
          if (terminalSince === null) {
            // First tick we've seen this task as finished — run the
            // one-time completion side effect, then start the grace window
            // (a slightly late webhook update can still land after this).
            terminalSince = Date.now()
            if (isTaskCompleted(match.status)) {
              advanceToNextArea()
            }
          }
          if (Date.now() - terminalSince >= TERMINAL_GRACE_MS) {
            stopPolling()
            clearCurrentQueue()
          }
        } else {
          terminalSince = null
        }
      }
    } catch {
      // Transient error — the next tick retries.
    }
  }, POLL_INTERVAL_MS)
}

onBeforeUnmount(() => {
  stopPolling()
  if (systemStatusTimer) {
    clearInterval(systemStatusTimer)
    systemStatusTimer = null
  }
})

const lastUpdatedLabel = computed(() =>
  lastUpdatedAt.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
)

// The "task in progress" lock only lived in this component's memory, so a
// page refresh silently forgot it and let Release Task fire again while the
// previous task was still running on RCS. Re-derive the lock from the
// backend on every mount instead of trusting local state alone.
async function restoreActiveTask() {
  if (!user.value?.id) return
  try {
    const result = await fetchTasksSvc({
      operatorId: user.value.id,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    const active = result.items.find(t => !isTaskTerminal(t.status))
    if (active) {
      lastReleasedTask.value = active
      if (active.productionLineAreaId) {
        workingAreaId.value = active.productionLineAreaId
      }
      await Promise.all([
        refreshQueueNumber(active.id),
        refreshWebhookStatus(active.taskId),
      ])
      startPolling(active.id, active.taskId)
    }
  } catch {
    // Non-fatal — worst case the page just starts as if it were a fresh session.
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProductionLines({ limit: 100 }),
    fetchProductionLineAreas({ limit: 100 }),
    fetchBoxTypes({ limit: 100 }),
    fetchQuarantineAreas({ limit: 100 }),
  ])
  if (!workingAreaId.value && myAreas.value[0]) {
    workingAreaId.value = myAreas.value[0].id
  }
  if (!selectedBoxTypeId.value && boxTypes.value[0]) {
    selectedBoxTypeId.value = boxTypes.value[0].id
  }
  await Promise.all([restoreActiveTask(), refreshQuarantineProgress(), refreshSystemStatus()])
  systemStatusTimer = setInterval(refreshSystemStatus, SYSTEM_STATUS_POLL_MS)
})

// Super Admin can act on any production line; everyone else is restricted to
// the line(s) they operate.
const myLines = computed(() =>
  user.value?.role === 'Super Admin'
    ? productionLines.value
    : productionLines.value.filter((line) => line.operatorId === user.value?.id),
)
const myLineIds = computed(() => new Set(myLines.value.map((line) => line.id)))
const myAreas = computed(() =>
  productionLineAreas.value.filter((area) => myLineIds.value.has(area.productionLineId)),
)

const workingArea = computed(
  () => myAreas.value.find((area) => area.id === workingAreaId.value) ?? null,
)
const workingLine = computed(
  () => myLines.value.find((line) => line.id === workingArea.value?.productionLineId) ?? null,
)

// Quarantine Areas belonging to the working line's Quarantine Line, and how
// many of them already have a task recorded against them (i.e. their
// quarantine leg has been started) — shown as an X/Y progress indicator.
const workingLineQuarantineAreas = computed(() =>
  workingLine.value
    ? quarantineAreas.value.filter(a => a.quarantineLineId === workingLine.value?.quarantineLineId)
    : [],
)

const filledQuarantineAreaIds = ref<Set<string>>(new Set())

async function refreshQuarantineProgress() {
  try {
    const result = await fetchTasksSvc({
      taskAction: 'NOT_STANDARD',
      limit: 200,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    filledQuarantineAreaIds.value = new Set(
      result.items
        .map(t => t.quarantineAreaId)
        .filter((id): id is string => !!id),
    )
  } catch {
    // Non-fatal — the ratio just won't update this tick.
  }
}

const quarantineProgress = computed(() => {
  const areas = workingLineQuarantineAreas.value
  if (areas.length === 0) return null
  const filled = areas.filter(a => filledQuarantineAreaIds.value.has(a.id)).length
  return { filled, total: areas.length }
})

watch(workingLine, () => {
  refreshQuarantineProgress()
})

function setWorkingArea(id: string) {
  if (isTaskActive.value && id !== workingAreaId.value) {
    toast.error('Finish the current task before switching Line Area')
    return
  }
  workingAreaId.value = id
}

function goToQuarantineTasks() {
  navigateTo('/dashboard/quarantines-tasks')
}

const selectedBoxType = computed(
  () => boxTypes.value.find((box) => box.id === selectedBoxTypeId.value) ?? null,
)

function chooseBoxType(id: string) {
  selectedBoxTypeId.value = id
  showBoxTypeModal.value = false
}

async function handleReleaseTask() {
  if (isTaskActive.value) {
    toast.error('Finish the current task before releasing another one')
    return
  }
  if (!workingArea.value) {
    toast.error('Select a Line Area first')
    return
  }
  if (!selectedBoxType.value) {
    toast.error('Select a Box Type first')
    return
  }
  const action = taskAction.value
  if (!action) {
    toast.error('Select a Function (Ambil FG / Not Standard) first')
    return
  }
  releasing.value = true
  const result = await releaseTask({
    productionLineAreaId: workingArea.value.id,
    boxTypeId: selectedBoxType.value.id,
    taskAction: action,
  })
  releasing.value = false
  if (result) {
    lastReleasedTask.value = result.task
    lastRcsExchange.value = result.rcsRequest
      ? { request: result.rcsRequest, response: result.rcsResponse }
      : null
    webhookStatus.value = null
    await Promise.all([
      refreshQueueNumber(result.task.id),
      refreshWebhookStatus(result.task.taskId),
    ])
    startPolling(result.task.id, result.task.taskId)
  }
}

function viewQueue() {
  navigateTo('/dashboard/tasks')
}
</script>

<template>
  <div class="animate-fade-in space-y-4">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Mainline</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Warehouse line control and task queue
        </p>
      </div>

      <div class="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm">
        <div class="flex items-center gap-2 text-sm">
          <Wifi class="h-4 w-4" :class="isSystemOnline ? 'text-emerald-500' : 'text-slate-400'" />
          <span class="font-medium text-slate-500">System Status</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="isSystemOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
          >
            {{ isSystemOnline ? 'Online' : 'Offline' }}
          </span>
        </div>
        <p class="font-medium mt-1 text-xs text-slate-400">
          Last updated: {{ lastUpdatedLabel }}
        </p>
      </div>
    </div>

    <!-- Line Areas + Quarantine -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <UiBaseCard class="lg:col-span-2">
        <div class="mb-4 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <LayoutGrid class="h-4 w-4 text-[#01ADEF]" />
            <p class="text-xs font-bold uppercase tracking-wide text-[#0F1F52]">
              Line Areas
            </p>
          </div>
          <span
            v-if="isTaskActive"
            class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600"
          >
            Task in progress
          </span>
        </div>

        <p v-if="myAreas.length === 0" class="font-medium py-6 text-center text-sm text-slate-400">
          No production line areas assigned to you
        </p>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            v-for="area in myAreas"
            :key="area.id"
            type="button"
            class="group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-4 text-left shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
            :class="[
              workingAreaId === area.id
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-blue-200 bg-blue-50/60 hover:border-[#01ADEF]/40',
              workingAreaId === area.id && isTaskActive ? 'border-4 border-dashed' : 'border',
            ]"
            :disabled="isTaskActive && workingAreaId !== area.id"
            @click="setWorkingArea(area.id)"
          >
            <Building2
              class="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 opacity-[0.06] transition-transform group-hover:scale-105"
              :class="workingAreaId === area.id ? 'text-emerald-600' : 'text-[#01ADEF]'"
            />

            <div
              class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-105"
              :class="
                workingAreaId === area.id
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                  : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
              "
            >
              <LayoutGrid class="h-6 w-6" />
            </div>
            <div class="relative">
              <p class="font-semibold text-[#0F1F52]">{{ area.name }}</p>
              <p class="font-medium text-xs text-slate-400">{{ area.productionLine.name }}</p>
              <span
                class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="
                  workingAreaId === area.id
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                    : 'bg-blue-200 text-blue-600'
                "
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {{ workingAreaId === area.id ? 'Currently Working' : 'Available' }}
              </span>
            </div>
          </button>
        </div>
      </UiBaseCard>

      <UiBaseCard
        class="group relative cursor-pointer overflow-hidden transition-all hover:shadow-md"
        @click="goToQuarantineTasks"
      >
        <div
          class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-red-500/5"
        />
        <ShieldAlert
          class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 text-red-500 opacity-[0.08]"
        />

        <div class="relative mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            <p class="text-xs font-bold uppercase tracking-wide text-red-500">Quarantine</p>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-400"
          />
        </div>

        <template v-if="workingLine">
          <p class="relative font-semibold text-[#0F1F52]">
            {{ workingLine.quarantineLine.name }}
          </p>
          <p class="font-medium relative mt-1 text-xs text-slate-400">
            Quarantine line for {{ workingLine.name }}
          </p>
          <p v-if="quarantineProgress" class="font-medium relative mt-2 text-xs text-slate-500">
            <span class="font-bold text-red-500">{{ quarantineProgress.filled }}</span>
            / {{ quarantineProgress.total }} Quarantine Areas filled
          </p>
          <div class="relative mt-6 flex items-end justify-end">
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-[#01ADEF]">
              View Details
              <ChevronRight class="h-3.5 w-3.5" />
            </span>
          </div>
        </template>
        <p v-else class="font-medium relative py-6 text-center text-sm text-slate-400">
          Select a Line Area to see its Quarantine Line
        </p>
      </UiBaseCard>
    </div>

    <!-- Current queue -->
    <div
      class="flex items-center gap-4 rounded-2xl border border-[#01ADEF]/20 bg-gradient-to-r from-[#01ADEF]/10 to-transparent px-5 py-4"
    >
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm"
      >
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
          <span class="font-medium text-[#0F1F52]">{{ lastReleasedTask?.taskId ?? '-' }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Status :
          <span class="font-semibold text-[#01ADEF]">
            {{ webhookStatus?.status ? taskStatusLabel(webhookStatus.status) : lastReleasedTask ? taskStatusLabel(lastReleasedTask.status) : '-' }}
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
      <button
        v-if="lastRcsExchange"
        type="button"
        class="shrink-0 rounded-xl border border-[#01ADEF]/30 bg-white px-3 py-2 text-xs font-semibold text-[#01ADEF] shadow-sm transition-colors hover:bg-[#01ADEF]/5"
        @click="showRcsModal = true"
      >
        View RCS Request
      </button>
    </div>

    <!-- Select action -->
    <UiBaseCard>
      <div class="mb-4 flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-[#01ADEF]" />
        <p class="text-xs font-bold uppercase tracking-wide text-[#0F1F52]">
          Select Action
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <!-- Box type picker -->
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 text-left shadow-sm transition-all hover:shadow-md"
          :style="
            selectedBoxType
              ? { borderColor: selectedBoxType.colorCode, backgroundColor: `${selectedBoxType.colorCode}14` }
              : undefined
          "
          :class="!selectedBoxType && 'border-[#E2E8F0] bg-white hover:border-[#01ADEF]/40 '"
          @click="showBoxTypeModal = true"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            :style="{ backgroundColor: selectedBoxType?.colorCode ?? '#94A3B8' }"
          >
            <Package class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-[#0F1F52]">
              {{ selectedBoxType?.name ?? 'Select Box Type' }}
            </p>
            <p class="font-medium text-xs text-slate-400">Box type</p>
          </div>
        </button>

        <!-- Ambil FG -->
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition-all hover:shadow-md"
          :class="taskAction === 'AMBIL_FG'
 ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-transparent '
 : 'border-[#E2E8F0] bg-white hover:border-[#01ADEF]/40 '"
          @click="taskAction = 'AMBIL_FG'"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="taskAction === 'AMBIL_FG'
 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
 : 'bg-slate-100 text-slate-400 '"
          >
            <Truck class="h-5 w-5" />
          </div>
          <div>
            <p class="font-semibold text-[#0F1F52]">Ambil FG</p>
            <p class="font-medium text-xs text-slate-400">Function</p>
          </div>
        </button>

        <!-- Not Standard -->
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition-all hover:shadow-md"
          :class="taskAction === 'NOT_STANDARD'
 ? 'border-red-500 bg-gradient-to-br from-red-50 to-transparent '
 : 'border-[#E2E8F0] bg-white hover:border-[#01ADEF]/40 '"
          @click="taskAction = 'NOT_STANDARD'"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="taskAction === 'NOT_STANDARD'
 ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
 : 'bg-slate-100 text-slate-400 '"
          >
            <AlertTriangle class="h-5 w-5" />
          </div>
          <div>
            <p class="font-semibold text-[#0F1F52]">Not Standard</p>
            <p class="font-medium text-xs text-slate-400">Function</p>
          </div>
        </button>
      </div>
    </UiBaseCard>

    <!-- Actions -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        v-if="hasPermission('task.create')"
        type="button"
        class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="releasing || isTaskActive"
        @click="handleReleaseTask"
      >
        <AlertTriangle class="h-4 w-4" />
        {{ releasing ? 'Releasing…' : isTaskActive ? 'Task in progress…' : 'Release Task' }}
      </button>

      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#01ADEF]/20 transition-all hover:shadow-md hover:shadow-[#01ADEF]/30 active:scale-[0.99]"
        @click="viewQueue"
      >
        <ClipboardList class="h-4 w-4" />
        View Queue
      </button>
    </div>
    
    <!-- Box type modal -->
    <UiBaseModal v-model="showBoxTypeModal" title="Select Box Type" size="sm">
      <p v-if="boxTypes.length === 0" class="font-medium py-6 text-center text-sm text-slate-400">
        No box types found
      </p>
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="box in boxTypes"
          :key="box.id"
          type="button"
          class="flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors"
          :style="{
            borderColor: selectedBoxTypeId === box.id ? box.colorCode : '#E2E8F0',
            backgroundColor: selectedBoxTypeId === box.id ? `${box.colorCode}14` : undefined,
          }"
          @click="chooseBoxType(box.id)"
        >
          <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: box.colorCode }" />
          <span class="font-semibold text-[#0F1F52]">{{ box.name }}</span>
        </button>
      </div>
    </UiBaseModal>

    <!-- RCS request/response -->
    <UiJsonPayloadModal
      v-model="showRcsModal"
      title="RCS Request & Response"
      :payload="lastRcsExchange"
    />
  </div>
</template>
