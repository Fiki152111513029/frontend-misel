<script setup lang="ts">
import { fetchFleetStatus } from '~/services/robot.service'
import { fetchAlarmDashboardStats } from '~/services/robot-alarm.service'
import type { FleetStatusRow } from '~/types/robot'

// Fleet Overview turns the Critical Alarms chip off — it has no alarm
// widget of its own to pair it with, and its per-robot Alarm Time tiles
// already carry that story. The Dashboard keeps it.
interface Props {
  showCriticalAlarms?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCriticalAlarms: true,
})

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

// There is no data for a day that has not happened yet, so the calendar
// stops at today rather than letting someone pick into the future and get
// empty widgets with no explanation.
const todayIso = computed(() => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
})

const dateInputRef = ref<HTMLInputElement | null>(null)

function openDatePicker() {
  const input = dateInputRef.value
  if (!input) return
  // showPicker() is the only reliable way to open a date input's calendar
  // from somewhere else on the page. It throws if the browser blocks it
  // (not a user gesture, or unsupported), so fall back to focusing the
  // field, which still allows typing the date.
  try {
    input.showPicker()
  } catch {
    input.focus()
  }
}

// Fleet and Critical Alarms are live readings with no history behind them,
// so they always describe right now regardless of the day picked; only
// Total Production is day-scoped.
async function load() {
  try {
    fleet.value = await fetchFleetStatus(dashboardFilters.areaNumber)
  } catch {
    // Non-fatal — keep showing the last known counts if a refresh tick fails.
  }
  // Skipped entirely when the chip is hidden, rather than polling every few
  // seconds for a number nothing renders.
  if (props.showCriticalAlarms) {
    try {
      criticalAlarms.value = (await fetchAlarmDashboardStats()).criticalCount
    } catch {
      // Non-fatal — same as above.
    }
  }
  const stats = await fetchTrolleyActivityDashboard(undefined, dashboardFilters.selectedDate)
  if (stats) totalProduction.value = stats.totals.total
}

onMounted(async () => {
  await load()
})

// Pushed from the server instead of polled — see useRealtime.
useRealtime(['robots', 'trolley-activities'], load)

watch(() => [dashboardFilters.selectedDate, dashboardFilters.areaNumber], load)

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
    <!-- The chip is the click target and the native input only supplies the
         picker. Clicking a date input does NOT open its calendar — only its
         small indicator icon does — so an invisible input stretched over the
         chip left almost all of it dead. The button calls showPicker()
         instead, and the input is pointer-events-none so it can never
         swallow the click. -->
    <div class="relative inline-flex">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F1F52] transition-colors hover:border-slate-300"
        :title="dashboardFilters.isToday ? 'Showing today' : 'Showing a past day'"
        @click="openDatePicker"
      >
        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        {{ readableDate }}
      </button>
      <input
        ref="dateInputRef"
        :value="dashboardFilters.selectedDate"
        :max="todayIso"
        type="date"
        class="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        aria-label="Dashboard date"
        @change="dashboardFilters.setDate(($event.target as HTMLInputElement).value)"
      >
    </div>

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

    <div
      v-if="showCriticalAlarms"
      class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600"
    >
      <span class="text-xs font-medium uppercase tracking-wide text-red-400">Critical Alarms</span>
      <span class="font-bold">{{ String(criticalAlarms).padStart(2, '0') }}</span>
    </div>
  </div>
</template>
