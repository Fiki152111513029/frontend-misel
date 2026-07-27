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
import { fetchTasks as fetchTasksSvc } from '~/services/task.service'
import type { Task, TaskAction } from '~/types/task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Mainline — Misel' })

const { user, hasPermission } = useAuth()
const { items: productionLines, fetchProductionLines } = useProductionLines()
const { items: productionLineAreas, fetchProductionLineAreas } = useProductionLineAreas()
const { items: boxTypes, fetchBoxTypes } = useBoxTypes()
const { releaseTask } = useTasks()
const toast = useToast()

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED']

const workingAreaId = ref<string | null>(null)
const selectedBoxTypeId = ref('')
const showBoxTypeModal = ref(false)
// No default — the operator must actively pick Ambil FG or Not Standard.
const taskAction = ref<TaskAction | null>(null)
const releasing = ref(false)
const lastReleasedTask = ref<Task | null>(null)
const queueNumber = ref<number | null>(null)
const lastUpdatedAt = ref(new Date())

// A released task locks Line Area switching until it reaches a terminal
// status. Since completion happens on the robot/RCS side (not a frontend
// action), we poll for the latest status instead of just trusting the
// release response.
const isTaskActive = computed(
  () => !!lastReleasedTask.value && !TERMINAL_STATUSES.includes(lastReleasedTask.value.status),
)

let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
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

function startPolling(taskDbId: string) {
  stopPolling()
  pollTimer = setInterval(async () => {
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
        if (TERMINAL_STATUSES.includes(match.status)) {
          stopPolling()
          if (match.status === 'COMPLETED') {
            advanceToNextArea()
          }
        }
      }
    } catch {
      // Transient error — the next tick retries.
    }
  }, 5000)
}

onBeforeUnmount(() => stopPolling())

const lastUpdatedLabel = computed(() =>
  lastUpdatedAt.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
)

onMounted(async () => {
  await Promise.all([
    fetchProductionLines({ limit: 100 }),
    fetchProductionLineAreas({ limit: 100 }),
    fetchBoxTypes({ limit: 100 }),
  ])
  if (!workingAreaId.value && myAreas.value[0]) {
    workingAreaId.value = myAreas.value[0].id
  }
  if (!selectedBoxTypeId.value && boxTypes.value[0]) {
    selectedBoxTypeId.value = boxTypes.value[0].id
  }
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
  const task = await releaseTask({
    productionLineAreaId: workingArea.value.id,
    boxTypeId: selectedBoxType.value.id,
    taskAction: action,
  })
  releasing.value = false
  if (task) {
    lastReleasedTask.value = task
    queueNumber.value = (queueNumber.value ?? 0) + 1
    startPolling(task.id)
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
          <Wifi class="h-4 w-4 text-slate-400" />
          <span class="font-medium text-slate-500">System Status</span>
          <span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
            Offline
          </span>
        </div>
        <p class="font-medium mt-1 text-xs text-slate-400">
          Last updated: just now | {{ lastUpdatedLabel }}
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
            class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
            :class="[
              workingAreaId === area.id
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-blue-200 bg-blue-50/60 hover:border-[#01ADEF]/40',
              workingAreaId === area.id && isTaskActive ? 'border-dashed' : '',
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
          <span class="font-semibold text-[#01ADEF]">{{ lastReleasedTask?.status ?? '-' }}</span>
        </p>
      </div>
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

    <!-- Connection status -->
    <div class="flex justify-center pt-1">
      <div class="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-slate-400 shadow-sm">
        <Signal class="h-3.5 w-3.5 text-emerald-500" />
        42 ms
        <RefreshCw class="h-3.5 w-3.5 text-slate-300" />
      </div>
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
  </div>
</template>
