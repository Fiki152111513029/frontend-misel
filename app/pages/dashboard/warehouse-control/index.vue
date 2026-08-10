<script setup lang="ts">
import { AlertTriangle, Building2, ClipboardList, LayoutGrid, RefreshCw, Signal, Wifi } from 'lucide-vue-next'
import { fetchRobotSystemStatus } from '~/services/robot.service'
import type { RobotSystemStatus } from '~/types/robot'
import type { WarehouseCartTaskStatus } from '~/types/warehouse-cart-task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Warehouse Control — Misel' })

const { hasPermission } = useAuth()
const { items: lineLocations, fetchWarehouseLineLocations } = useWarehouseLineLocations()
const { items: cartTasks, loading: tasksLoading, fetchWarehouseCartTasks, releaseWarehouseCartTask } = useWarehouseCartTasks()
const toast = useToast()

const workingLineLocationId = ref<string | null>(null)
const releasing = ref(false)
const lastUpdatedAt = ref(new Date())

const lastUpdatedLabel = computed(() =>
  lastUpdatedAt.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
)

// Same System Status rule as Mainline: offline if the AMR telemetry endpoint
// can't be reached at all, OR it's reachable but every known robot is
// reporting "Offline". Online requires the endpoint to be reachable AND at
// least one robot in a non-Offline state.
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

const workingLineLocation = computed(
  () => lineLocations.value.find(location => location.id === workingLineLocationId.value) ?? null,
)

onMounted(async () => {
  await Promise.all([
    fetchWarehouseLineLocations({ limit: 100 }),
    fetchWarehouseCartTasks({ limit: 10 }),
    refreshSystemStatus(),
  ])
  if (!workingLineLocationId.value && lineLocations.value[0]) {
    workingLineLocationId.value = lineLocations.value[0].id
  }
  systemStatusTimer = setInterval(refreshSystemStatus, SYSTEM_STATUS_POLL_MS)
})

onBeforeUnmount(() => {
  if (systemStatusTimer) {
    clearInterval(systemStatusTimer)
    systemStatusTimer = null
  }
})

function setWorkingLineLocation(id: string) {
  workingLineLocationId.value = id
}

async function releaseCart() {
  if (!workingLineLocation.value) {
    toast.error('Select a Line Location first')
    return
  }
  if (!workingLineLocation.value.modelCodeProcess) {
    toast.error('This Line Location has no Model Code Process assigned — set one on the Line Locations page first')
    return
  }
  releasing.value = true
  await releaseWarehouseCartTask({ warehouseLineLocationId: workingLineLocation.value.id })
  releasing.value = false
}

function viewQueue() {
  navigateTo('/dashboard/warehouse-tasks')
}

const columns = [
  { key: 'taskId', label: 'Task ID' },
  { key: 'taskAction', label: 'Task Action' },
  { key: 'robot', label: 'Robot' },
  { key: 'operator', label: 'Operator' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created At' },
]

const STATUS_STYLE: Record<WarehouseCartTaskStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-[#01ADEF]/10 text-[#01ADEF]',
  COMPLETED: 'bg-emerald-50 text-emerald-600',
  FAILED: 'bg-red-50 text-red-500',
}

function statusStyle(status: string) {
  return STATUS_STYLE[status as WarehouseCartTaskStatus] ?? STATUS_STYLE.PENDING
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="animate-fade-in space-y-4">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Warehouse Control</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          AMR / Warehouse Automation System
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

    <UiBaseCard>
      <div class="mb-4 flex items-center gap-2">
        <LayoutGrid class="h-4 w-4 text-[#01ADEF]" />
        <p class="text-xs font-bold uppercase tracking-wide text-[#0F1F52]">
          Warehouse Line Locations
        </p>
      </div>

      <p v-if="lineLocations.length === 0" class="font-medium py-6 text-center text-sm text-slate-400">
        No line locations found
      </p>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          v-for="location in lineLocations"
          :key="location.id"
          type="button"
          class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left shadow-sm transition-all hover:shadow-md"
          :class="workingLineLocationId === location.id
 ? 'border-emerald-200 bg-emerald-50/60 '
 : 'border-blue-200 bg-blue-50/60 hover:border-[#01ADEF]/40 '"
          @click="setWorkingLineLocation(location.id)"
        >
          <Building2
            class="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 opacity-[0.06] transition-transform group-hover:scale-105"
            :class="workingLineLocationId === location.id ? 'text-emerald-600' : 'text-[#01ADEF]'"
          />

          <div
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-105"
            :class="
              workingLineLocationId === location.id
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
            "
          >
            <Building2 class="h-6 w-6" />
          </div>
          <div class="relative">
            <p class="font-semibold text-[#0F1F52]">{{ location.name }}</p>
            <p class="font-medium text-xs text-slate-400">
              {{ location.modelCodeProcess?.name ?? 'No process assigned' }}
            </p>
            <span
              class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="
                workingLineLocationId === location.id
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                  : 'bg-blue-200 text-blue-600'
              "
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {{ workingLineLocationId === location.id ? 'Currently Working' : 'Available' }}
            </span>
          </div>
        </button>
      </div>
    </UiBaseCard>

    <UiBaseCard padding="none">
      <UiBaseTable :columns="columns" :loading="tasksLoading">
        <tr v-if="!tasksLoading && cartTasks.length === 0">
          <td :colspan="columns.length" class="py-12 text-center">
            <p class="text-sm font-medium text-slate-400">Nothing is currently being worked on</p>
          </td>
        </tr>
        <template v-if="!tasksLoading">
          <tr
            v-for="task in cartTasks"
            :key="task.id"
            class="border-b border-[#E2E8F0] last:border-0"
          >
            <td class="px-4 py-3 text-sm font-mono font-bold text-[#0F1F52]">{{ task.taskId }}</td>
            <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ task.modelCodeProcess.name }}</td>
            <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ task.robot?.name ?? '—' }}</td>
            <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ task.operator.fullName }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusStyle(task.status)">
                {{ task.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ formatDate(task.createdAt) }}</td>
          </tr>
        </template>
      </UiBaseTable>
    </UiBaseCard>

    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        v-if="hasPermission('warehouse-cart-task.create')"
        type="button"
        class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="releasing"
        @click="releaseCart"
      >
        <AlertTriangle class="h-4 w-4" />
        {{ releasing ? 'Releasing…' : 'Release Cart' }}
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
  </div>
</template>
