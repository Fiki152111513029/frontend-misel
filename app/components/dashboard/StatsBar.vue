<script setup lang="ts">
import { fetchFleetStatus } from '~/services/robot.service'
import { fetchAlarmDashboardStats } from '~/services/robot-alarm.service'
import type { FleetStatusRow } from '~/types/robot'

const POLL_INTERVAL_MS = 5000

const fleet = ref<FleetStatusRow[]>([])
const criticalAlarms = ref(0)
// Total Production — today's trolley activity count (see
// GetTrolleyActivityDashboardUseCase, days=1 = today's UTC calendar day).
const totalProduction = ref(0)
const { fetchTrolleyActivityDashboard } = useTrolleyActivities()

// This bar owns the Dashboard's day picker: every day-scoped widget on the
// page (Performance, AMR Performance, Total Production below) reads the
// same date from the store, so the whole Dashboard moves together instead
// of each card being stuck on today.
const dashboardFilters = useDashboardFiltersStore()

const readableDate = computed(() => new Date(`${dashboardFilters.selectedDate}T00:00:00`)
  .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }))

// Fleet and Critical Alarms are live readings with no history behind them,
// so they always describe right now regardless of the day picked; only
// Total Production is day-scoped.
async function load() {
  try {
    fleet.value = await fetchFleetStatus(dashboardFilters.areaNumber)
  } catch {
    // Non-fatal — keep showing the last known counts if a refresh tick fails.
  }
  try {
    criticalAlarms.value = (await fetchAlarmDashboardStats()).criticalCount
  } catch {
    // Non-fatal — same as above.
  }
  const stats = await fetchTrolleyActivityDashboard(undefined, dashboardFilters.selectedDate)
  if (stats) totalProduction.value = stats.totals.total
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await load()
  pollTimer = setInterval(load, POLL_INTERVAL_MS)
})

watch(() => [dashboardFilters.selectedDate, dashboardFilters.areaNumber], load)

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

// Online/Active means "not Offline" — Idle, In task, Charging, etc. all
// count as active/online (only Offline, or no telemetry at all, doesn't).
// Same bucketing rule as DashboardFleetStatusTable's severity(), so the two
// widgets never disagree about which robots count as up.
function isOnline(status: string | null) {
  const value = status?.toLowerCase() ?? ''
  return value.length > 0 && !value.includes('offline')
}

const totalUnits = computed(() => fleet.value.length)
const activeUnits = computed(() => fleet.value.filter(row => isOnline(row.status)).length)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <label
      class="relative inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F1F52] transition-colors hover:border-slate-300"
      :title="dashboardFilters.isToday ? 'Showing today' : 'Showing a past day'"
    >
      <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
      {{ readableDate }}
      <!-- The native picker sits invisibly over the whole chip so the date
           is editable without a second control cluttering the bar. -->
      <input
        :value="dashboardFilters.selectedDate"
        type="date"
        class="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Dashboard date"
        @change="dashboardFilters.setDate(($event.target as HTMLInputElement).value)"
      >
    </label>

    <button
      v-if="!dashboardFilters.isToday"
      type="button"
      class="inline-flex items-center rounded-xl bg-[#01ADEF]/10 px-3 py-2 text-xs font-semibold text-[#01ADEF] transition-colors hover:bg-[#01ADEF]/20"
      @click="dashboardFilters.resetToToday()"
    >
      Back to today
    </button>

    <div class="h-6 w-px bg-[#E2E8F0]" />

    <div class="inline-flex items-center gap-2 rounded-xl bg-[#0F1F52] px-4 py-2 text-sm text-white">
      <span class="text-xs font-medium uppercase tracking-wide text-white/70">Total Production</span>
      <span class="font-bold">{{ totalProduction.toLocaleString('en-US') }} Units</span>
    </div>

    <div class="inline-flex items-center gap-2 rounded-xl bg-[#2F6FED] px-4 py-2 text-sm text-white">
      <span class="text-xs font-medium uppercase tracking-wide text-white/70">Active Units</span>
      <span class="font-bold">{{ activeUnits }} / {{ totalUnits }}</span>
    </div>

    <div class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
      <span class="text-xs font-medium uppercase tracking-wide text-red-400">Critical Alarms</span>
      <span class="font-bold">{{ String(criticalAlarms).padStart(2, '0') }}</span>
    </div>
  </div>
</template>
