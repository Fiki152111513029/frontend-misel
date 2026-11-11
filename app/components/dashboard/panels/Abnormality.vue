<script setup lang="ts">
// Real alarm counts from RCS's device-alarm webhook, grouped by zone
// (areaId, an opaque RCS zone number with no local name mapping — see
// backend/prisma/schema.prisma's RobotAlarm model). Based on alarmStatus
// (0=active, 1=resolved), not a time window — an alarm stays counted here
// from the moment it's reported active until RCS reports it resolved,
// however long that takes; a zone only drops out once every one of its
// alarms has actually been resolved. percent scales relative to the busiest
// zone right now, not an absolute rate, since there's no fixed "total
// possible alarms" denominator to divide by.
//
// An alarm carries its own areaId, so this scopes straight to the map's
// areaNumber rather than going through node codes the way Charger Status
// and Request Queue have to.
const props = withDefaults(
  defineProps<{ standalone?: boolean, last?: boolean }>(),
  { standalone: false, last: false },
)

const dashboardFilters = useDashboardFiltersStore()
const { fetchDashboardStats } = useRobotAlarms()

const MAX_ALARMS_SHOWN_PER_ZONE = 3
interface ZoneAlarmEntry { deviceNum: string, alarmType: number | null, alarmDesc: string }
interface ZoneError { label: string, percent: number, alarms: ZoneAlarmEntry[], moreCount: number }
const zones = ref<ZoneError[]>([])

async function loadAlarmStats() {
  const stats = await fetchDashboardStats()
  if (!stats) return
  // A map with no areaNumber matches no alarm, same as it draws no robots.
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

// Standalone the panel is one tile on a board nobody touches, so it shows
// two zones at a time and turns the page itself. Stacked on the Dashboard
// it is scrolled by hand and shows the lot — pageSize there is the whole
// list, which useAutoPager reads as a single page and leaves alone.
const ZONES_PER_PAGE = 2
const { page, pageCount, pagedItems: pagedZones, step: stepPage } = useAutoPager(
  zones,
  {
    pageSize: props.standalone ? ZONES_PER_PAGE : Number.MAX_SAFE_INTEGER,
    intervalMs: props.standalone ? 5000 : 0,
  },
)

onMounted(loadAlarmStats)
useRealtime('alarms', loadAlarmStats)
watch(() => dashboardFilters.areaNumber, loadAlarmStats)
</script>

<template>
  <DashboardPanelsPanelShell
    :standalone="props.standalone"
    :last="props.last"
    :title="props.standalone ? 'Alarm / Abnormality' : 'Abnormality'"
  >
    <template #icon>
      <svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </template>

    <template #subtitle>
      <p class="font-medium mt-0.5 text-xs text-slate-400">
        Error density by zone<template v-if="dashboardFilters.mapName"> · {{ dashboardFilters.mapName }}</template>
      </p>
    </template>

    <template #badge>
      <svg v-if="!props.standalone" class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <DashboardPanelsPageStepper v-else :page="page" :page-count="pageCount" @step="stepPage" />
    </template>

    <div v-if="zones.length === 0" class="text-center text-xs text-slate-400" :class="props.standalone ? 'py-6' : 'mt-4'">
      {{ dashboardFilters.areaNumber === null
        ? 'This map has no area number, so no alarms are linked to it.'
        : 'No active alarms on this map right now.' }}
    </div>
    <div v-else class="space-y-4" :class="props.standalone ? '' : 'mt-4'">
      <div v-for="zone in pagedZones" :key="zone.label">
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
  </DashboardPanelsPanelShell>
</template>
