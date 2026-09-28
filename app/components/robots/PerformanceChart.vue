<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { downloadCsv } from '~/utils/exportCsv'
import type { RobotStatusMonthlyMode, RobotStatusSummaryRow } from '~/types/robot'

type ViewMode = 'DAILY' | RobotStatusMonthlyMode

const { fetchStatusSummary, fetchMonthlyStatusSummary } = useRobotStatusSummary()
const { isDark } = useTheme()

// The backend treats a "day"/"month" as UTC (see GetRobotStatusSummaryUseCase
// / GetRobotStatusMonthlySummaryUseCase) — matching that here keeps the
// pickers and the data they fetch referring to the same day/month.
const today = computed(() => new Date().toISOString().slice(0, 10))
const currentMonth = computed(() => today.value.slice(0, 7))

const VIEW_MODE_OPTIONS: { value: ViewMode, label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'AVERAGE', label: 'Average / Month' },
  { value: 'TOTAL', label: 'Total / Month' },
]

const viewMode = ref<ViewMode>('DAILY')

// Scoped to the Dashboard's two shared filters (see stores/dashboard-filters):
// the Factory Map on screen, and the day picked in the stats bar. The Daily
// view no longer carries its own date input — one day picker drives the
// whole Dashboard, so this card can never disagree with Performance or
// Total Production beside it. The month pickers stay local, since the
// monthly views are this card's own thing.
const dashboardFilters = useDashboardFiltersStore()
const selectedDate = computed(() => dashboardFilters.selectedDate)
const selectedMonth = ref(currentMonth.value)
const rows = ref<RobotStatusSummaryRow[]>([])
const loading = ref(false)

// Which Shift (from the Shift table — see Dashboard > User Management >
// Shifts) to filter by — defaults to and automatically follows whichever
// Shift is actually running right now (accounts for the weekly A/B
// rotation), only while looking at today's Daily view; see useShiftFilter.
const isViewingCurrentShift = computed(() => viewMode.value === 'DAILY' && selectedDate.value === today.value)
const { shifts, shiftId, initShiftFilter, refreshShiftFilter, handleManualShiftChange } = useShiftFilter(isViewingCurrentShift)

// A map with no areaNumber is linked to no robot, so there is nothing to
// chart for it — same rule the map itself uses to decide which markers to
// draw.
// A null shiftId is "All Shifts" — the whole day rather than one shift's
// slice of it — so it is a selection to honour, not a reason to bail out.
// It is also what the chart is left with when no Shift has been configured
// at all, which is exactly when bailing out would leave it permanently
// empty.
async function load() {
  if (!dashboardFilters.isAreaResolved) return
  if (dashboardFilters.areaNumber == null) {
    rows.value = []
    loading.value = false
    return
  }
  loading.value = true
  const areaId = dashboardFilters.areaNumber
  rows.value = viewMode.value === 'DAILY'
    ? await fetchStatusSummary(selectedDate.value, shiftId.value, areaId)
    : await fetchMonthlyStatusSummary(selectedMonth.value, shiftId.value, viewMode.value, areaId)
  loading.value = false
}

const AUTO_REFRESH_MS = 60_000
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await initShiftFilter()
  await load()
  // shiftId is watched below, so a change picked up here flows into a
  // reload on its own — this timer only needs to re-check which shift is
  // current, not call load() itself.
  refreshTimer = setInterval(refreshShiftFilter, AUTO_REFRESH_MS)
})
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
watch([shiftId, viewMode, selectedDate, selectedMonth, () => dashboardFilters.areaNumber, () => dashboardFilters.isAreaResolved], load)

const categories = computed(() => rows.value.map(row => row.robotName))
const series = computed(() => [
  { name: 'Running', data: rows.value.map(row => row.runningMinutes) },
  { name: 'Idle', data: rows.value.map(row => row.idleMinutes) },
  { name: 'Charging', data: rows.value.map(row => row.chargingMinutes) },
  // Mutually exclusive with the three above — the backend excludes any time
  // under an active alarm from Running/Idle/Charging, resuming normal
  // counting once the alarm is reported resolved — so this is genuine
  // additional elapsed shift time and belongs in highestTotalMinutes/axisMax
  // below, not just stacked on top for visibility.
  { name: 'Alarm', data: rows.value.map(row => row.alarmMinutes) },
])

// The chart scales to whatever the busiest robot actually reached (e.g.
// ~555 for a full Sesi 1, more on an overtime day) — not a fixed ceiling,
// which would flatten every bar to the same height and make the chart
// useless for comparing robots.
const highestTotalMinutes = computed(() => {
  const totals = rows.value.map(
    row => row.runningMinutes + row.idleMinutes + row.chargingMinutes + row.alarmMinutes,
  )
  return Math.max(...totals, 0)
})

// A full shift's "Complete" target — shown as a reference line even on a
// light day where no robot has reached it yet, so the axis must stretch to
// fit it too, not just the busiest robot's bar.
const TARGET_MINUTES = 480

// Rounded up to the next hour, plus a little headroom so the reference
// lines don't sit flush against the chart's own top edge. Floored at 60 so
// an all-zero day doesn't collapse the axis.
const axisMax = computed(() => Math.max(Math.ceil((Math.max(highestTotalMinutes.value, TARGET_MINUTES) + 30) / 60) * 60, 60))

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}h ${remainder}m`
}

const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    background: 'transparent',
    toolbar: { show: false },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  colors: ['#0F1F52', '#F6AE2D', '#01ADEF', '#EF4444'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
  stroke: { width: 0 },
  xaxis: {
    categories: categories.value,
    labels: { style: { colors: isDark.value ? '#64748B' : '#94A3B8', fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
    max: axisMax.value,
    labels: {
      style: { colors: isDark.value ? '#64748B' : '#94A3B8', fontSize: '11px' },
      formatter: (value: number) => String(Math.round(value)),
    },
  },
  annotations: {
    yaxis: [
      {
        y: highestTotalMinutes.value,
        borderColor: '#94A3B8',
        strokeDashArray: 4,
        label: {
          text: `${highestTotalMinutes.value} min (highest)`,
          style: { color: '#94A3B8', background: 'transparent' },
        },
      },
      {
        y: TARGET_MINUTES,
        borderColor: '#10B981',
        strokeDashArray: 4,
        label: {
          text: `Complete (${TARGET_MINUTES} min)`,
          style: { color: '#10B981', background: 'transparent' },
        },
      },
    ],
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom',
    labels: { colors: isDark.value ? '#94A3B8' : '#64748B' },
    fontSize: '12px',
  },
  grid: {
    borderColor: isDark.value ? '#1E293B' : '#E2E8F0',
    strokeDashArray: 4,
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (value: number) => formatMinutes(value) },
  },
}))

function exportToExcel() {
  const headers = ['Robot', 'Running (min)', 'Idle (min)', 'Charging (min)', 'Alarm (min)', 'Total (min)']
  const dataRows = rows.value.map(row => [
    row.robotName,
    row.runningMinutes,
    row.idleMinutes,
    row.chargingMinutes,
    row.alarmMinutes,
    row.runningMinutes + row.idleMinutes + row.chargingMinutes + row.alarmMinutes,
  ])
  const shiftName = shiftId.value
    ? (shifts.value.find(s => s.id === shiftId.value)?.name ?? 'shift')
    : 'all-shifts'
  const scope = viewMode.value === 'DAILY' ? selectedDate.value : selectedMonth.value
  const filename = `amr-performance_${scope}_${shiftName.toLowerCase().replace(/\s+/g, '-')}_${viewMode.value.toLowerCase()}.csv`
  downloadCsv(filename, headers, dataRows)
}
</script>

<template>
  <UiBaseCard padding="none" class="flex h-full flex-col">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4">
      <div>
        <p class="font-semibold text-[#0F1F52]">AMR Performance</p>
        <p class="font-medium mt-0.5 text-xs text-slate-500">
          Running / Idle / Charging minutes per robot<template v-if="dashboardFilters.mapName"> · {{ dashboardFilters.mapName }}</template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="shiftId"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          @change="handleManualShiftChange"
        >
          <!-- Whole day, no shift window. Always offered, and the only
               thing on the list when no Shift has been configured. -->
          <option :value="null">All Shifts</option>
          <option v-for="option in shifts" :key="option.id" :value="option.id">
            {{ option.name }}
          </option>
        </select>

        <div class="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            v-for="option in VIEW_MODE_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="viewMode === option.value ? 'bg-white text-[#0F1F52] shadow-sm' : 'text-slate-500 hover:text-[#0F1F52]'"
            @click="viewMode = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <span
          v-if="viewMode === 'DAILY'"
          class="rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
          title="Set by the date picker at the top of the Dashboard"
        >
          {{ selectedDate }}
        </span>
        <input
          v-else
          v-model="selectedMonth"
          type="month"
          :max="currentMonth"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        />

        <button
          type="button"
          :disabled="rows.length === 0"
          class="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#0F1F52] transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          @click="exportToExcel"
        >
          <Download class="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </div>

    <div class="flex min-h-[320px] flex-1 flex-col p-4">
      <div v-if="shifts.length === 0" class="flex flex-1 flex-col items-center justify-center gap-1 text-center text-sm text-slate-400">
        <p>No shifts configured yet.</p>
        <p>Add one under User Management &gt; Shifts to see this chart.</p>
      </div>
      <div v-else-if="loading && rows.length === 0" class="flex flex-1 items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
      <div v-else-if="rows.length === 0" class="flex flex-1 items-center justify-center text-sm text-slate-400">
        No data for this selection
      </div>
      <ClientOnly v-else class="flex-1">
        <apexchart type="bar" :series="series" :options="chartOptions" height="100%" />
        <template #fallback>
          <div class="flex flex-1 items-center justify-center text-sm text-slate-400">Loading chart...</div>
        </template>
      </ClientOnly>
    </div>
  </UiBaseCard>
</template>
