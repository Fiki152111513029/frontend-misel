<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { downloadCsv } from '~/utils/exportCsv'
import type { RobotStatusMonthlyMode, RobotStatusSummaryRow } from '~/types/robot'

type ViewMode = 'DAILY' | RobotStatusMonthlyMode

const { fetchStatusSummary, fetchMonthlyStatusSummary } = useRobotStatusSummary()
const { items: shifts, fetchShiftOptions } = useShiftOptions()
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

// Which Shift (from the Shift table — see Dashboard > User Management >
// Shifts) to filter by — defaults to the first one once loaded, since the
// summary endpoints require a shiftId and there's no meaningful "all
// shifts" view.
const shiftId = ref<string | null>(null)
const viewMode = ref<ViewMode>('DAILY')
const selectedDate = ref(today.value)
const selectedMonth = ref(currentMonth.value)
const rows = ref<RobotStatusSummaryRow[]>([])
const loading = ref(false)

async function load() {
  if (!shiftId.value) return
  loading.value = true
  rows.value = viewMode.value === 'DAILY'
    ? await fetchStatusSummary(selectedDate.value, shiftId.value)
    : await fetchMonthlyStatusSummary(selectedMonth.value, shiftId.value, viewMode.value)
  loading.value = false
}

onMounted(async () => {
  await fetchShiftOptions()
  if (shifts.value.length > 0) shiftId.value = shifts.value[0]!.id
  await load()
})
watch([shiftId, viewMode, selectedDate, selectedMonth], load)

const categories = computed(() => rows.value.map(row => row.robotName))
const series = computed(() => [
  { name: 'Running', data: rows.value.map(row => row.runningMinutes) },
  { name: 'Idle', data: rows.value.map(row => row.idleMinutes) },
  { name: 'Charging', data: rows.value.map(row => row.chargingMinutes) },
])

// The chart scales to whatever the busiest robot actually reached (e.g.
// ~555 for a full Sesi 1, more on an overtime day) — not a fixed ceiling,
// which would flatten every bar to the same height and make the chart
// useless for comparing robots.
const highestTotalMinutes = computed(() => {
  const totals = rows.value.map(row => row.runningMinutes + row.idleMinutes + row.chargingMinutes)
  return Math.max(...totals, 0)
})

// Rounded up to the next hour, plus a little headroom so the reference
// line at highestTotalMinutes doesn't sit flush against the chart's own
// top edge. Floored at 60 so an all-zero day doesn't collapse the axis.
const axisMax = computed(() => Math.max(Math.ceil((highestTotalMinutes.value + 30) / 60) * 60, 60))

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
  colors: ['#0F1F52', '#F6AE2D', '#01ADEF'],
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
    yaxis: [{
      y: highestTotalMinutes.value,
      borderColor: '#94A3B8',
      strokeDashArray: 4,
      label: {
        text: `${highestTotalMinutes.value} min (highest)`,
        style: { color: '#94A3B8', background: 'transparent' },
      },
    }],
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
  const headers = ['Robot', 'Running (min)', 'Idle (min)', 'Charging (min)', 'Total (min)']
  const dataRows = rows.value.map(row => [
    row.robotName,
    row.runningMinutes,
    row.idleMinutes,
    row.chargingMinutes,
    row.runningMinutes + row.idleMinutes + row.chargingMinutes,
  ])
  const shiftName = shifts.value.find(s => s.id === shiftId.value)?.name ?? 'shift'
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
        <p class="font-medium mt-0.5 text-xs text-slate-500">Running / Idle / Charging minutes per robot</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="shiftId"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        >
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

        <input
          v-if="viewMode === 'DAILY'"
          v-model="selectedDate"
          type="date"
          :max="today"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        />
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

    <div class="flex-1 p-4">
      <div v-if="shifts.length === 0" class="flex h-[280px] flex-col items-center justify-center gap-1 text-center text-sm text-slate-400">
        <p>No shifts configured yet.</p>
        <p>Add one under User Management &gt; Shifts to see this chart.</p>
      </div>
      <div v-else-if="loading && rows.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
      <div v-else-if="rows.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">
        No data for this selection
      </div>
      <ClientOnly v-else>
        <apexchart type="bar" :series="series" :options="chartOptions" height="320" />
        <template #fallback>
          <div class="flex h-[320px] items-center justify-center text-sm text-slate-400">Loading chart...</div>
        </template>
      </ClientOnly>
    </div>
  </UiBaseCard>
</template>
