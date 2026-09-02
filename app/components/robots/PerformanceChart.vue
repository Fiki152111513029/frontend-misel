<script setup lang="ts">
import type { RobotStatusSummaryRow } from '~/types/robot'

const { fetchStatusSummary } = useRobotStatusSummary()
const { isDark } = useTheme()

// The backend treats a "day" as a UTC calendar day (see
// GetRobotStatusSummaryUseCase) — matching that here keeps the date picker
// and the data it fetches referring to the same day.
const today = computed(() => new Date().toISOString().slice(0, 10))

const selectedDate = ref(today.value)
const rows = ref<RobotStatusSummaryRow[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  rows.value = await fetchStatusSummary(selectedDate.value)
  loading.value = false
}

onMounted(load)
watch(selectedDate, load)

// A full day, regardless of the selected date — today's bars fill in as the
// day progresses, past days' bars are already complete against this same
// reference.
const MINUTES_PER_DAY = 1440

const categories = computed(() => rows.value.map(row => row.robotName))
const series = computed(() => [
  { name: 'Running', data: rows.value.map(row => row.runningMinutes) },
  { name: 'Idle', data: rows.value.map(row => row.idleMinutes) },
  { name: 'Charging', data: rows.value.map(row => row.chargingMinutes) },
])

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
    max: MINUTES_PER_DAY,
    tickAmount: 4,
    labels: {
      style: { colors: isDark.value ? '#64748B' : '#94A3B8', fontSize: '11px' },
      formatter: (value: number) => String(Math.round(value)),
    },
  },
  annotations: {
    yaxis: [{
      y: MINUTES_PER_DAY,
      borderColor: '#94A3B8',
      strokeDashArray: 4,
      label: {
        text: `${MINUTES_PER_DAY} min (24h)`,
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
</script>

<template>
  <UiBaseCard padding="none">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4">
      <div>
        <p class="font-semibold text-[#0F1F52]">AMR Performance</p>
        <p class="font-medium mt-0.5 text-xs text-slate-500">Running / Idle / Charging minutes per robot</p>
      </div>
      <input
        v-model="selectedDate"
        type="date"
        :max="today"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      />
    </div>

    <div class="p-4">
      <div v-if="loading && rows.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
      <div v-else-if="rows.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">
        No robots found
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
