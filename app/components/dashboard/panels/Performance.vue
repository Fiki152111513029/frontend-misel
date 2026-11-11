<script setup lang="ts">
import { fetchTaskStatusSummary } from '~/services/webhook-log.service'

// The selected day's task breakdown read straight off RCS's task-status
// webhook payloads, not our own TrolleyActivity table. The bucket comes from
// the payload's `status` (RCS's order-status code, the same one Tasks/Alarm
// Logs label via utils/taskStatus.ts), not subTaskStatus, which only
// describes the step within a task. One order counts once, under whichever
// status its most recent webhook call that day reported, so an order
// reported repeatedly as it progresses is not counted twice. Orders whose
// latest call carried no recognized `status` are left out entirely (the
// backend reports them separately as `unknown`).
//
// Scoped by the robot that ran the order (the webhook payload's deviceCode,
// resolved to an areaId server-side). The only panel scoped to the day
// picker too — the other three are live readings with no history behind them.
const props = withDefaults(
  defineProps<{ standalone?: boolean, last?: boolean }>(),
  { standalone: false, last: false },
)

const { isDark } = useTheme()
const dashboardFilters = useDashboardFiltersStore()

interface StatusItem { label: string, value: number, color: string }
const STATUS_COLORS = {
  notStarted: '#0991F3',
  inProgress: '#F6AE2D',
  completed: '#014091',
  failed: '#EF4444',
  cancelled: '#94A3B8',
} as const
const statuses = ref<StatusItem[]>([
  { label: 'Not Start', value: 0, color: STATUS_COLORS.notStarted },
  { label: 'In Progress', value: 0, color: STATUS_COLORS.inProgress },
  { label: 'Completed', value: 0, color: STATUS_COLORS.completed },
  { label: 'Failed', value: 0, color: STATUS_COLORS.failed },
  { label: 'Cancelled', value: 0, color: STATUS_COLORS.cancelled },
])

async function loadTaskStatus() {
  if (!dashboardFilters.isAreaResolved) return
  if (dashboardFilters.areaNumber == null) {
    statuses.value = statuses.value.map(status => ({ ...status, value: 0 }))
    return
  }
  try {
    const summary = await fetchTaskStatusSummary(
      dashboardFilters.areaNumber,
      dashboardFilters.selectedDate,
    )
    statuses.value = [
      { label: 'Not Start', value: summary.notStarted, color: STATUS_COLORS.notStarted },
      { label: 'In Progress', value: summary.inProgress, color: STATUS_COLORS.inProgress },
      { label: 'Completed', value: summary.completed, color: STATUS_COLORS.completed },
      { label: 'Failed', value: summary.failed, color: STATUS_COLORS.failed },
      { label: 'Cancelled', value: summary.cancelled, color: STATUS_COLORS.cancelled },
    ]
  } catch {
    // Non-fatal — keep showing the last known counts if a refresh tick fails.
  }
}

const total = computed(() => statuses.value.reduce((sum, status) => sum + status.value, 0))
function percentOf(value: number) {
  return total.value === 0 ? 0 : Math.round((value / total.value) * 100)
}

const series = computed(() => [{ name: 'Tasks', data: statuses.value.map(status => status.value) }])
const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
  colors: statuses.value.map(status => status.color),
  labels: statuses.value.map(status => status.label),
  xaxis: {
    categories: statuses.value.map(status => status.label),
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { show: false } },
  grid: { show: false, padding: { left: 0, right: 0 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))

onMounted(loadTaskStatus)
useRealtime('tasks', loadTaskStatus)
// Switching map or day must re-scope immediately, not on the next tick.
watch(
  () => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved, dashboardFilters.selectedDate],
  loadTaskStatus,
)
</script>

<template>
  <DashboardPanelsPanelShell
    :standalone="props.standalone"
    :last="props.last"
    :title="props.standalone ? 'AMR Performance' : 'Performance'"
  >
    <template #icon>
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    </template>

    <template #subtitle>
      <p class="font-medium mt-0.5 text-xs text-slate-400">
        {{ dashboardFilters.isToday ? 'Today' : dashboardFilters.selectedDate }}<template v-if="dashboardFilters.mapName"> · {{ dashboardFilters.mapName }}</template>
      </p>
    </template>

    <template #badge>
      <p class="whitespace-nowrap text-xs font-medium text-slate-400">TOTAL : {{ total }}</p>
    </template>

    <div :class="props.standalone ? '' : 'mt-3'">
      <ClientOnly>
        <apexchart type="bar" :series="series" :options="chartOptions" height="130" />
        <template #fallback>
          <div class="flex h-[130px] items-center justify-center text-sm text-slate-400">
            Loading chart...
          </div>
        </template>
      </ClientOnly>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
      <div v-for="status in statuses" :key="status.label" class="flex items-center gap-2 text-xs">
        <span class="h-2.5 w-2.5 flex-shrink-0 rounded-sm" :style="{ backgroundColor: status.color }" />
        <span class="text-slate-500">{{ status.label }}</span>
        <span class="ml-auto text-slate-400">{{ percentOf(status.value) }}%</span>
        <span class="w-5 text-right font-medium text-[#0F1F52]">{{ status.value }}</span>
      </div>
    </div>
  </DashboardPanelsPanelShell>
</template>
