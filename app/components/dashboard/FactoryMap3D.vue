<script setup lang="ts">
// 3D version of the Factory Map (Three.js). All the 3D logic lives in
// ~/utils/factoryMap3d.js; this component only owns the canvas container and
// the control buttons. Assets (GLB models, Draco decoder, topology JSON) are
// served from /public/factory-3d.
//
// The three.js module is imported dynamically in onMounted so nothing
// WebGL-related is touched during SSR.
import { fetchRobots } from '~/services/robot.service'
import { fetchStockStatus } from '~/services/factory-map.service'
import { fetchActiveAlarmDeviceNames } from '~/services/robot-alarm.service'

type LiveRobot = {
  id: string
  name: string
  x: number
  y: number
  orientation: number
  hasActiveAlarm: boolean
}

type MapApi = {
  setView: (name: string) => void
  setRobots: (robots: LiveRobot[]) => void
  setBinStatus: (byCode: Map<string, string | number>) => void
  dispose: () => void
}

// Which Factory Map is drawn. The 3D topology JSON is the same shape the
// 2D map already reads from each map's topologyUrl, so the scene is built
// from the database rather than the static workshop.json that used to be
// hardcoded here.
const { items: factoryMaps, fetchFactoryMaps } = useFactoryMaps()
const selectedMapId = ref<string | null>(null)
const selectedMap = computed(
  () => factoryMaps.value.find(m => m.id === selectedMapId.value) ?? null,
)

const containerRef = ref<HTMLElement | null>(null)
let api: MapApi | null = null
let unmounted = false

const VIEWS = [
  { name: 'top', label: 'Atas' },
  { name: 'bottom', label: 'Bawah' },
  { name: 'front', label: 'Depan' },
  { name: 'back', label: 'Belakang' },
  { name: 'left', label: 'Kiri' },
  { name: 'right', label: 'Kanan' },
]

// ---- Realtime ------------------------------------------------------------
// Exactly the sources the 2D Factory Map reads, so the two views can never
// disagree: /robots for telemetry, active alarms for the warning markers,
// and RCS stock status for which racks are occupied. Nothing here polls —
// each load runs on the server signal that says its data changed.
const dashboardFilters = useDashboardFiltersStore()
const alarmDeviceNames = ref<Set<string>>(new Set())
const robotCount = ref(0)

async function loadRobots() {
  try {
    const result = await fetchRobots({ limit: 100 })
    // The 3D scene is built from a single static workshop.json, so it shows
    // one physical area. Follow the Dashboard's selected area when there is
    // one; before a map has been picked, show every robot that reports a
    // position rather than an empty floor.
    const areaNumber = dashboardFilters.isAreaResolved
      ? dashboardFilters.areaNumber
      : null
    const robots = result.items
      .filter(robot =>
        robot.positionX != null
        && robot.positionY != null
        && (areaNumber == null || robot.areaId === areaNumber),
      )
      .map(robot => ({
        id: robot.id,
        name: robot.name,
        x: robot.positionX as number,
        y: robot.positionY as number,
        orientation: robot.orientation ?? 0,
        hasActiveAlarm: alarmDeviceNames.value.has(robot.amrDeviceSerialNo),
      }))
    robotCount.value = robots.length
    api?.setRobots(robots)
  } catch {
    // Non-fatal — the scene keeps the last positions it was given.
  }
}

async function loadAlarms() {
  try {
    alarmDeviceNames.value = new Set(await fetchActiveAlarmDeviceNames())
    // Alarm state is drawn on the robots, so re-apply it there.
    await loadRobots()
  } catch {
    // Non-fatal — markers keep whatever they last knew.
  }
}

async function loadBins() {
  const areaNumber = dashboardFilters.areaNumber
  if (areaNumber == null) return
  try {
    const result = await fetchStockStatus(areaNumber)
    api?.setBinStatus(new Map(result.map(entry => [entry.code, entry.status])))
  } catch {
    // Non-fatal — rack markers keep their last colour.
  }
}

useRealtime('robots', loadRobots)
useRealtime('alarms', loadAlarms)
useRealtime('stock', loadBins)

// The map card publishes the area, so the first load can land before one is
// picked — re-read whenever it settles or changes.
watch(
  () => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved],
  () => {
    loadRobots()
    loadBins()
  },
)

// Rebuilding the whole scene on a map change, rather than swapping the
// topology inside the running engine: a switch is rare, and a partial
// rebuild would have to unpick the paths, racks, arms and patrol the
// engine built from the previous map — far more to get wrong.
async function buildScene() {
  const { createFactoryMap3D } = await import('~/utils/factoryMap3d.js')
  if (unmounted || !containerRef.value) return

  api?.dispose()
  api = null

  api = createFactoryMap3D(containerRef.value, {
    topologyUrl: selectedMap.value?.topologyUrl,
  })

  // Safe to call before the topology has finished loading: the engine holds
  // the data and applies it as soon as it has a coordinate transform.
  await loadAlarms()
  await loadBins()
}

function selectMap(id: string) {
  selectedMapId.value = id
}

onMounted(async () => {
  await fetchFactoryMaps({ limit: 100 })
  if (unmounted) return
  if (factoryMaps.value[0]) selectedMapId.value = factoryMaps.value[0].id
  await buildScene()
})

// Publish the chosen area the same way the 2D map does, so the robot and
// bin filters below follow this view rather than whatever was picked last
// on another page.
watch(selectedMap, (map) => {
  if (!map) {
    dashboardFilters.markAreaResolvedWithoutMap()
    return
  }
  dashboardFilters.setArea({ areaNumber: map.areaNumber, mapName: map.name })
  buildScene()
})

onBeforeUnmount(() => {
  unmounted = true
  api?.dispose()
  api = null
})
</script>

<template>
  <UiBaseCard padding="none" class="flex h-full flex-col">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
      <div>
        <h2 class="text-base font-bold text-[#0F1F52]">
          Factory Map 3D<span v-if="selectedMap"> — {{ selectedMap.name }}</span>
        </h2>
        <p class="text-xs font-medium text-slate-500">
          Klik kiri: rotasi · Scroll: zoom · Klik kanan / Shift+klik kiri: geser
        </p>
        <p class="mt-0.5 text-xs font-semibold" :class="robotCount > 0 ? 'text-emerald-600' : 'text-slate-400'">
          <span class="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" :class="robotCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'" />
          {{ robotCount > 0 ? `${robotCount} AMR live` : 'Menunggu data AMR' }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select
          v-if="factoryMaps.length > 0"
          :value="selectedMapId"
          class="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F1F52] outline-none focus:border-[#01ADEF]"
          @change="selectMap(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="map in factoryMaps" :key="map.id" :value="map.id">
            {{ map.name }}
          </option>
        </select>

        <button
          v-for="v in VIEWS"
          :key="v.name"
          type="button"
          class="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F1F52] transition-colors hover:border-[#01ADEF] hover:text-[#01ADEF]"
          @click="api?.setView(v.name)"
        >
          {{ v.label }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F1F52] transition-colors hover:border-[#01ADEF] hover:text-[#01ADEF]"
          @click="api?.setView('reset')"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- The canvas fills this box; the module watches its size. -->
    <div ref="containerRef" class="relative min-h-[420px] w-full flex-1 overflow-hidden bg-[#eaf0f6]" />
  </UiBaseCard>
</template>
