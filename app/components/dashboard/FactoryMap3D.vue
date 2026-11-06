<script setup lang="ts">
// 3D version of the Factory Map (Three.js). All the 3D logic lives in
// ~/utils/factoryMap3d.js; this component only owns the canvas container and
// the control buttons. Assets (GLB models, Draco decoder, topology JSON) are
// served from /public/factory-3d.
//
// The three.js module is imported dynamically in onMounted so nothing
// WebGL-related is touched during SSR.
import { fetchLocationCodes } from '~/services/factory-map.service'
import { fetchRobots } from '~/services/robot.service'
import { fetchActiveAlarmDeviceNames } from '~/services/robot-alarm.service'

type LiveRobot = {
  id: string
  name: string
  x: number
  y: number
  orientation: number
  hasActiveAlarm: boolean
  /** RCS payLoad — what decides whether the AMR is drawn carrying a rack. */
  payload: string | null
}

type MapApi = {
  setView: (name: string) => void
  setRobots: (robots: LiveRobot[]) => void
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
const loadError = ref<{ message: string, url: string } | null>(null)
// What the engine actually built. Null means the topology never arrived —
// which looks identical on screen to geometry that loaded but is out of
// the camera's view, so it has to be stated rather than guessed at.
interface BuiltInfo {
  nodes: number
  paths: number
  racks: number
  scale: number
  /** Every `content` value in the topology, including unregistered ids. */
  nodeCodes: string[]
}
const built = ref<BuiltInfo | null>(null)
let api: MapApi | null = null
// Two builds can overlap: onMounted starts one and the selectedMap watcher
// starts another in the same tick. Without a token the slower one finishes
// last and wins, which may not be the map that is currently selected.
let buildToken = 0
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

// Real location codes (Charger Areas, Parking Areas, Line/EXIM/Quarantine
// locations...) — the same lookup the 2D map filters its markers by. A
// topology node only counts as a location if its `content` is one of
// these; the rest are internal ids like "BASE0000".
const registeredCodes = ref<Set<string>>(new Set())

async function loadLocationCodes() {
  try {
    registeredCodes.value = new Set((await fetchLocationCodes()).codes)
  } catch {
    // Non-fatal — the scene still renders, and the publish below simply
    // reports an empty set rather than hanging the panels on "loading".
  }
}

// Publish the nodes this map draws, by exactly the rule the 2D map uses.
// Without this, Charger Status and Request Queue sit at "Loading this
// map…" forever in 3D: those two are scoped by location code rather than
// areaId (a Charger Area has no areaId), setArea() below empties the set
// so the previous map's nodes cannot leak into this one, and nothing
// refilled it. Fires again when either side arrives, so the set converges
// instead of being read once too early.
//
// `true` regardless of whether the code lookup landed, same as 2D: a
// failed lookup should read as "no charger area on this map", not as a
// panel still waiting for something that is not coming.
watch([() => built.value?.nodeCodes, registeredCodes], ([nodeCodes]) => {
  if (!nodeCodes) return
  dashboardFilters.setMapLocationCodes(
    new Set(nodeCodes.filter(code => registeredCodes.value.has(code))),
    true,
  )
}, { immediate: true })

const alarmDeviceNames = ref<Set<string>>(new Set())
const robotCount = ref(0)
// Positions carry ids, not names or device serials. These two lookups are
// filled by the REST read and let the push stay as small as possible.
const robotNames = ref<Map<string, string>>(new Map())
const alarmSerials = ref<Set<string>>(new Set())

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
        payload: robot.payload ?? null,
      }))
    robotNames.value = new Map(result.items.map(r => [r.id, r.name]))
    alarmSerials.value = new Set(
      result.items
        .filter(r => alarmDeviceNames.value.has(r.amrDeviceSerialNo))
        .map(r => r.id),
    )
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

// Positions arrive on their own channel with the data attached, so this
// draws straight from the push — no HTTP request per tick, however fast
// the robots move. The REST read below still runs, but only for the
// fields positions do not carry (name, device serial) and only when the
// much slower 'robots' signal says the fleet itself changed.
useRobotPositions((positions) => {
  const areaNumber = dashboardFilters.isAreaResolved
    ? dashboardFilters.areaNumber
    : null
  const robots = positions
    .filter(p => areaNumber == null || p.areaId === areaNumber)
    .map(p => ({
      id: p.id,
      name: robotNames.value.get(p.id) ?? '',
      x: p.x,
      y: p.y,
      orientation: p.orientation,
      hasActiveAlarm: alarmSerials.value.has(p.id),
      payload: p.payload,
    }))
  robotCount.value = robots.length
  api?.setRobots(robots)
})

useRealtime('robots', loadRobots)
useRealtime('alarms', loadAlarms)

// The map card publishes the area, so the first load can land before one is
// picked — re-read whenever it settles or changes.
watch(
  () => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved],
  () => {
    loadRobots()
  },
)

// Rebuilding the whole scene on a map change, rather than swapping the
// topology inside the running engine: a switch is rare, and a partial
// rebuild would have to unpick the paths, racks, arms and patrol the
// engine built from the previous map — far more to get wrong.
async function buildScene() {
  const token = ++buildToken
  const { createFactoryMap3D } = await import('~/utils/factoryMap3d.js')
  // A newer build started while this one was loading the module — let that
  // one own the canvas instead of fighting it for the container.
  if (unmounted || token !== buildToken || !containerRef.value) return

  loadError.value = null
  built.value = null
  api?.dispose()
  api = null

  api = createFactoryMap3D(containerRef.value, {
    topologyUrl: selectedMap.value?.topologyUrl,
    // Straight down. This view is what the floor is read from — an
    // isometric start looks better in a screenshot but hides whichever
    // aisle the racks in front happen to stand in.
    initialView: 'top',
    onError: (message: string, url: string) => {
      if (token === buildToken) loadError.value = { message, url }
    },
    onReady: (info: BuiltInfo) => {
      if (token === buildToken) built.value = info
    },
  })

  // Safe to call before the topology has finished loading: the engine holds
  // the data and applies it as soon as it has a coordinate transform.
  await loadAlarms()
}

function selectMap(id: string) {
  selectedMapId.value = id
}

// Charger/Parking/Line codes only change when someone edits master data,
// so this stays on a slow timer rather than earning a realtime topic — the
// same cadence the 2D map uses, since this page is meant to be left open.
const LOCATION_CODES_POLL_MS = 60_000
let locationCodesPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([fetchFactoryMaps({ limit: 100 }), loadLocationCodes()])
  if (unmounted) return
  if (factoryMaps.value[0]) selectedMapId.value = factoryMaps.value[0].id
  await buildScene()
  locationCodesPollTimer = setInterval(loadLocationCodes, LOCATION_CODES_POLL_MS)
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
  if (locationCodesPollTimer) {
    clearInterval(locationCodesPollTimer)
    locationCodesPollTimer = null
  }
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
          <span v-if="built" class="ml-2 font-normal text-slate-500">
            · topologi: {{ built.nodes }} node, {{ built.paths }} jalur, {{ built.racks }} rak
            (skala {{ built.scale.toFixed(6) }})
          </span>
          <span v-else-if="!loadError" class="ml-2 font-normal text-amber-600">
            · topologi belum termuat
          </span>
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
    <div ref="containerRef" class="relative min-h-[420px] w-full flex-1 overflow-hidden bg-[#eaf0f6]">
      <div
        v-if="loadError"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#eaf0f6] px-6 text-center"
      >
        <p class="text-sm font-semibold text-[#0F1F52]">Topologi peta gagal dimuat</p>
        <p class="text-xs text-red-600">{{ loadError.message }}</p>
        <p class="max-w-full break-all font-mono text-[11px] text-slate-500">{{ loadError.url }}</p>
        <button
          type="button"
          class="mt-1 rounded-lg bg-[#01ADEF] px-3 py-1.5 text-xs font-semibold text-white"
          @click="buildScene"
        >
          Coba lagi
        </button>
      </div>

      <p
        v-else-if="factoryMaps.length === 0"
        class="absolute inset-0 z-10 flex items-center justify-center text-sm font-semibold text-slate-400"
      >
        Belum ada Factory Map
      </p>
    </div>
  </UiBaseCard>
</template>
