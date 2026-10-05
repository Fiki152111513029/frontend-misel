<script setup lang="ts">
import { fetchRobots } from '~/services/robot.service'
import { fetchTaskStatusSummary } from '~/services/webhook-log.service'
import { fetchTrolleyActivities } from '~/services/trolley-activity.service'
import type { Robot } from '~/types/robot'

// The panel is taller than its sections need to be visible all at once, so
// it caps itself and scrolls. The default matches the Dashboard's own
// layout; a page that already pins the column to a measured height (Fleet
// Overview, which matches the Factory Map card exactly) passes "max-h-none"
// so this cap cannot hold it short of its container.
interface Props {
  maxHeightClass?: string
  /**
   * The Performance section at the top. Fleet Overview turns it off because
   * its task tiles already break the same day down per robot, so showing it
   * again beside them is just the same numbers twice.
   */
  showPerformance?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxHeightClass: 'max-h-[460px] 2xl:max-h-[600px]',
  showPerformance: true,
})

const { isDark } = useTheme()

// Performance — the selected day's task breakdown read straight off RCS's
// task-status webhook payloads, not our own TrolleyActivity table. The
// bucket comes from the payload's `status` (RCS's order-status code, the
// same one Tasks/Alarm Logs label via utils/taskStatus.ts), not
// subTaskStatus, which only describes the step within a task. One order
// counts once, under whichever status its most recent webhook call that day
// reported, so an order reported repeatedly as it progresses is not counted
// twice. Orders whose latest call carried no recognized `status` are left
// out entirely (the backend reports them separately as `unknown`).
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

// Every section of this card is scoped to the Factory Map on screen, each
// by whatever actually ties its data to an area:
//   Performance   — the robot that ran the order (the webhook payload's
//                   deviceCode), resolved to an areaId server-side. Also
//                   the only section scoped to the day picker; the three
//                   below are live readings with no history behind them.
//   Abnormality   — the alarm's own areaId.
//   Charger Status / Request Queue — the location codes this map draws,
//                   since a Charger Area and a pickup code have no areaId
//                   of their own.
const dashboardFilters = useDashboardFiltersStore()

async function loadTaskStatus() {
  // Nothing renders these counts when the section is hidden, so skip the
  // request entirely rather than polling for them every few seconds.
  if (!props.showPerformance) return
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

// Abnormality — real alarm counts from RCS's device-alarm webhook, grouped
// by zone (areaId, an opaque RCS zone number with no local name mapping —
// see backend/prisma/schema.prisma's RobotAlarm model). Based on
// alarmStatus (0=active, 1=resolved), not a time window — an alarm stays
// counted here from the moment it's reported active until RCS reports it
// resolved, however long that takes; a zone only drops out once every one
// of its alarms has actually been resolved. percent scales relative to the
// busiest zone right now, not an absolute rate, since there's no fixed
// "total possible alarms" denominator to divide by.
const MAX_ALARMS_SHOWN_PER_ZONE = 3
interface ZoneAlarmEntry { deviceNum: string, alarmType: number | null, alarmDesc: string }
interface ZoneError { label: string, percent: number, alarms: ZoneAlarmEntry[], moreCount: number }
const { fetchDashboardStats } = useRobotAlarms()
const zones = ref<ZoneError[]>([])

async function loadAlarmStats() {
  const stats = await fetchDashboardStats()
  if (!stats) return
  // An alarm carries its own areaId, so this scopes straight to the map's
  // areaNumber — no need for the node-code route the two sections below
  // take. A map with no areaNumber matches no alarm, same as it draws no
  // robots.
  const areaNumber = dashboardFilters.areaNumber
  const byZone = stats.byZone.filter(zone => zone.areaId === areaNumber)
  const maxCount = Math.max(...byZone.map(zone => zone.count), 0)
  zones.value = byZone.slice(0, 5).map((zone) => {
    const alarmsInZone = stats.activeAlarms.filter(alarm => alarm.areaId === zone.areaId)
    return {
      label: `Zone ${zone.areaId}`,
      percent: maxCount > 0 ? Math.round((zone.count / maxCount) * 100) : 0,
      alarms: alarmsInZone.slice(0, MAX_ALARMS_SHOWN_PER_ZONE).map(alarm => ({
        deviceNum: alarm.deviceNum ?? alarm.deviceName ?? '-',
        alarmType: alarm.alarmType,
        alarmDesc: alarm.alarmDesc ?? '-',
      })),
      moreCount: Math.max(0, alarmsInZone.length - MAX_ALARMS_SHOWN_PER_ZONE),
    }
  })
}

function barColor(percent: number) {
  if (percent >= 40) return 'bg-red-500'
  if (percent >= 20) return 'bg-[#01ADEF]'
  return 'bg-[#2F6FED]'
}

// Charger Status — real Charger Area nodes, matched against whichever robot
// (if any) is currently sitting at that node and reporting a "charging"
// state. Robot position/state comes from GET /robots (fleet-status doesn't
// carry position); "charging" uses the same substring rule as the backend's
// toRobotStatusCategory() (robot-status-category.ts) so this stays
// consistent with how "Charging" is detected everywhere else.
const POLL_INTERVAL_MS = 5000

const { items: chargerAreas, fetchChargerAreaOptions } = useChargerAreaOptions()
const robots = ref<Robot[]>([])

async function loadRobots() {
  try {
    const result = await fetchRobots({ page: 1, limit: 1000 })
    robots.value = result.items
  } catch {
    // Non-fatal — keep showing the last known data if a refresh tick fails.
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([fetchChargerAreaOptions(), loadRobots(), loadAlarmStats(), loadTaskStatus(), loadRequestQueue()])
  pollTimer = setInterval(() => {
    loadRobots()
    loadAlarmStats()
    loadTaskStatus()
    loadRequestQueue()
  }, POLL_INTERVAL_MS)
})

// Switching map or day must re-scope immediately, not on the next poll tick.
watch(
  () => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved, dashboardFilters.selectedDate],
  loadTaskStatus,
)
// Alarms key off areaNumber; the queue keys off the map's node set, which
// only settles once that map's topology has loaded. `hubs` is a computed,
// so it re-scopes on its own.
watch(() => dashboardFilters.areaNumber, loadAlarmStats)
watch(
  () => [dashboardFilters.mapLocationCodes, dashboardFilters.isMapTopologyResolved],
  loadRequestQueue,
)

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

function isCharging(robot: Robot) {
  return robot.state?.toLowerCase().includes('charg') ?? false
}

// A Charger Area is identified only by its iRayple location code — it has
// no areaId — so "on this map" means "this map draws a node with that
// code", exactly the rule the map itself uses to place charger icons.
interface ChargerHub { id: string, unit: string | null, battery: number | null }
const hubs = computed<ChargerHub[]>(() => {
  if (!dashboardFilters.isMapTopologyResolved) return []
  return chargerAreas.value
    .filter(area => dashboardFilters.isOnCurrentMap(area.iRaypleLocationCode))
    .map((area) => {
      const occupant = robots.value.find(robot => robot.position === area.iRaypleLocationCode && isCharging(robot))
      return { id: area.name, unit: occupant?.name ?? null, battery: occupant?.battery ?? null }
    })
})

// Request Queue — real trolley activities still PENDING (Take Trolley
// scanned, Drop Trolley not submitted yet), newest first, capped to a
// handful for this compact card.
interface QueueRequest { id: string, title: string, route: string, eta: string }
const QUEUE_ROWS_SHOWN = 5
const requests = ref<QueueRequest[]>([])

function formatElapsed(startDate: string) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}m`
}

async function loadRequestQueue() {
  if (!dashboardFilters.isMapTopologyResolved) {
    requests.value = []
    return
  }
  try {
    // Fetched wider than the five shown, because the map filter below
    // removes rows — taking only five up front could leave this map with
    // an empty queue while it actually has pending work.
    const result = await fetchTrolleyActivities({ status: 'PENDING', page: 1, limit: 50 })
    requests.value = result.items
      // A trip touches this map if either end of it is a node here — the
      // pickup and the dropping can legitimately sit on different floors.
      .filter(item =>
        dashboardFilters.isOnCurrentMap(item.pickupLocationCode)
        || dashboardFilters.isOnCurrentMap(item.droppingLocationCode),
      )
      .slice(0, QUEUE_ROWS_SHOWN)
      .map(item => ({
        id: item.id,
        title: `${item.trolley.name} (${item.trolley.code})`,
        route: `${item.pickupLocationCode} → ${item.droppingLocationCode ?? '?'}`,
        eta: formatElapsed(item.startDate),
      }))
  } catch {
    // Non-fatal — keep showing the last known queue if a refresh tick fails.
  }
}
</script>

<template>
  <div
    class="flex h-full flex-col overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white transition-colors duration-200"
    :class="maxHeightClass"
  >
    <!-- Performance -->
    <section v-if="showPerformance" class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-semibold text-[#0F1F52]">Performance</p>
          <p class="font-medium mt-0.5 text-xs text-slate-400">
            {{ dashboardFilters.isToday ? 'Today' : dashboardFilters.selectedDate }}<template v-if="dashboardFilters.mapName"> · {{ dashboardFilters.mapName }}</template>
          </p>
        </div>
        <p class="text-xs font-medium text-slate-400">TOTAL : {{ total }}</p>
      </div>

      <div class="mt-3">
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
    </section>

    <!-- Abnormality -->
    <section class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-semibold text-[#0F1F52]">Abnormality</p>
          <p class="font-medium mt-0.5 text-xs text-slate-400">
            Error density by zone<template v-if="dashboardFilters.mapName"> · {{ dashboardFilters.mapName }}</template>
          </p>
        </div>
        <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <div v-if="zones.length === 0" class="mt-4 text-center text-xs text-slate-400">
        {{ dashboardFilters.areaNumber === null
          ? 'This map has no area number, so no alarms are linked to it.'
          : 'No active alarms on this map right now.' }}
      </div>
      <div v-else class="mt-4 space-y-4">
        <div v-for="zone in zones" :key="zone.label">
          <div class="mb-1.5 flex items-center justify-between text-xs">
            <span class="text-slate-500">{{ zone.label }}</span>
            <span class="font-medium text-[#0F1F52]">{{ zone.percent }}%</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="barColor(zone.percent)"
              :style="{ width: `${zone.percent}%` }"
            />
          </div>

          <div class="mt-1.5 space-y-1">
            <div
              v-for="(alarm, index) in zone.alarms"
              :key="index"
              class="flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <span class="truncate font-mono text-slate-500">{{ alarm.deviceNum }}</span>
              <span class="truncate">— {{ alarm.alarmDesc }}</span>
              <span
                v-if="alarm.alarmType !== null"
                class="ml-auto flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-slate-400"
              >
                Type {{ alarm.alarmType }}
              </span>
            </div>
            <p v-if="zone.moreCount > 0" class="text-[11px] text-slate-400">
              +{{ zone.moreCount }} more
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Charger Status -->
    <section class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-[#0F1F52]">Charger Status</p>
        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {{ hubs.length }} Slots Total
        </span>
      </div>

      <div v-if="hubs.length === 0" class="mt-4 text-center text-xs text-slate-400">
        {{ dashboardFilters.isMapTopologyResolved
          ? 'No charger areas on this map.'
          : 'Loading this map…' }}
      </div>
      <div v-else class="mt-4 grid grid-cols-2 gap-3">
        <div
          v-for="hub in hubs"
          :key="hub.id"
          class="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-3 py-4 text-center"
          :class="hub.unit ? 'border-[#01ADEF]/40 bg-[#01ADEF]/5' : 'border-[#E2E8F0] '"
        >
          <span class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ hub.id }}</span>

          <svg v-if="hub.unit" class="h-5 w-5 text-[#01ADEF]" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h4.146l-1.879 6.093a.75.75 0 001.292.657l8.5-9.5a.75.75 0 00-.559-1.25h-4.146l1.879-6.093z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <rect x="6" y="3" width="12" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 21v-2" />
          </svg>

          <span v-if="hub.unit" class="text-xs font-semibold text-[#01ADEF]">
            {{ hub.unit }} ({{ hub.battery }}%)
          </span>
          <span v-else class="text-xs font-medium text-slate-300">Vacant</span>
        </div>
      </div>
    </section>

    <!-- Request Queue -->
    <section class="p-5">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-[#0F1F52]">Request Queue</p>
        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {{ requests.length }} Pending
        </span>
      </div>

      <div v-if="requests.length === 0" class="mt-4 text-center text-xs text-slate-400">
        {{ dashboardFilters.isMapTopologyResolved
          ? 'No pending trolley activities on this map right now.'
          : 'Loading this map…' }}
      </div>
      <div v-else class="mt-3 divide-y divide-[#E2E8F0]">
        <div v-for="request in requests" :key="request.id" class="flex items-center gap-3 py-3">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0F1F52]/10 text-[#0F1F52]">
            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.75h16.5M3.75 9.75v8.25A2.25 2.25 0 006 20.25h12a2.25 2.25 0 002.25-2.25V9.75M3.75 9.75L5.7 4.5h12.6l1.95 5.25" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-[#0F1F52]">{{ request.title }}</p>
            <p class="font-medium text-xs text-slate-400">{{ request.route }}</p>
          </div>
          <span class="flex-shrink-0 text-xs font-medium text-slate-400">{{ request.eta }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
