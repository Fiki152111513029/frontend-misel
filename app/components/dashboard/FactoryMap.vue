<script setup lang="ts">
import { Maximize, RotateCw, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { fetchLocationCodes } from '~/services/factory-map.service'
import { fetchRobots as fetchRobotsSvc } from '~/services/robot.service'
import { fetchActiveTrolleyActivitiesByRobot } from '~/services/trolley-activity.service'
import type { Robot } from '~/types/robot'
import robotIdleSrc from '~/assets/images/robot/Idle.png'
import robotChargingSrc from '~/assets/images/robot/Charging.png'
import robotOfflineSrc from '~/assets/images/robot/Offline.png'
import robotPickupEmptySrc from '~/assets/images/robot/pickup-empty.png'
import robotPickupFullSrc from '~/assets/images/robot/pickup-full.png'
import chargerNodeSrc from '~/assets/images/location-node/charger-node.png'
import locationNodeSrc from '~/assets/images/location-node/node.png'
import locationNodeEmptySrc from '~/assets/images/location-node/node-empty.png'
import locationNodeFullSrc from '~/assets/images/location-node/node-full.png'

interface ChargeCoorEntry {
  x: number
  y: number
}

interface TopologyData {
  width: number
  height: number
  xAttrMin: number
  yAttrMin: number
  allPath: number[][][]
  chargeCoor: Array<[string, ChargeCoorEntry]>
  nodeArr?: unknown[][]
  nodeKeys?: string[]
}

interface ChargeStation {
  id: string
  x: number
  y: number
}

interface NamedNode {
  id: string
  x: number
  y: number
  content: string
  isCharger: boolean
  warehouseStatus: 'EMPTY' | 'FULL' | null
}

interface RobotMarker {
  id: string
  x: number
  y: number
  name: string
  state: string | null
  battery: number | null
  payload: string | null
}

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

// Maps are managed via the Factory Maps CRUD (Dashboard sidebar) — each one
// has its own uploaded floor-plan image + topology JSON. This card just
// lists them and lets the operator switch between areas, like the "Map
// Display" dropdown in the RCS's own map viewer.
const { items: factoryMaps, fetchFactoryMaps } = useFactoryMaps()
const selectedMapId = ref<string | null>(null)
const selectedMap = computed(
  () => factoryMaps.value.find(m => m.id === selectedMapId.value) ?? null,
)

const topology = ref<TopologyData | null>(null)
const loading = ref(true)
const loadError = ref(false)
const svgRef = ref<SVGSVGElement | null>(null)

// The RCS coordinate system is Y-up; SVG is Y-down, so every point's Y gets
// flipped to render right-side-up (matches background.jpg, whose top row is
// the map's max-Y edge per its ROS-style origin/resolution metadata).
function flipY(y: number) {
  return -y
}

const baseBox = computed<ViewBox | null>(() => {
  const topo = topology.value
  if (!topo) return null
  return { x: topo.xAttrMin, y: flipY(topo.yAttrMin + topo.height), w: topo.width, h: topo.height }
})

// Current pan/zoom window, in the same coordinate space as baseBox. Starts
// equal to baseBox (the whole map fitted to the container) and is mutated by
// the toolbar, wheel, and drag handlers below — the viewBox itself, not a
// CSS transform, so panning/zooming never distorts stroke widths.
const view = reactive<ViewBox>({ x: 0, y: 0, w: 1, h: 1 })
const rotation = ref(0)

function resetView() {
  const box = baseBox.value
  if (!box) return
  view.x = box.x
  view.y = box.y
  view.w = box.w
  view.h = box.h
  rotation.value = 0
}

watch(baseBox, (box) => {
  if (box) resetView()
})

const viewBoxAttr = computed(() => `${view.x} ${view.y} ${view.w} ${view.h}`)
const rotateOrigin = computed(() => `${view.x + view.w / 2} ${view.y + view.h / 2}`)

const imageBox = computed(() => {
  const topo = topology.value
  if (!topo) return null
  return {
    x: topo.xAttrMin,
    y: flipY(topo.yAttrMin + topo.height),
    width: topo.width,
    height: topo.height,
  }
})

function pathPoints(path: number[][]) {
  return path.map(([x, y]) => `${x},${flipY(y)}`).join(' ')
}

const chargeStations = computed<ChargeStation[]>(() =>
  (topology.value?.chargeCoor ?? []).map(([id, coor]) => ({ id, x: coor.x, y: coor.y })),
)

const chargeRadius = computed(() => {
  const topo = topology.value
  if (!topo) return 0
  return Math.max(topo.width, topo.height) / 150
})

// Real location codes (Quarantine Areas, EXIM Locations, Empty Pallet
// Locations, Production Line Areas, Charger Areas) — a topology node only
// gets a marker if its content exactly matches one of these, instead of
// every alphanumeric-looking node (which also includes internal ids like
// "BASE0000" that aren't real locations). chargerLocationCodes is the
// Charger Area subset, used to pick the charger icon over the generic one.
const locationCodes = ref<Set<string>>(new Set())
const chargerLocationCodes = ref<Set<string>>(new Set())
// Warehouse Location occupancy (see CreateTrolleyActivityUseCase) — drives
// the full/empty-trolley icon on these nodes specifically.
const warehouseLocationStatuses = ref<Map<string, 'EMPTY' | 'FULL'>>(new Map())

const namedNodes = computed<NamedNode[]>(() => {
  const topo = topology.value
  if (!topo?.nodeArr || !topo.nodeKeys) return []
  const xIdx = topo.nodeKeys.indexOf('x')
  const yIdx = topo.nodeKeys.indexOf('y')
  const contentIdx = topo.nodeKeys.indexOf('content')
  if (xIdx === -1 || yIdx === -1 || contentIdx === -1) return []

  return topo.nodeArr
    .map((node, index): NamedNode => {
      const content = String(node[contentIdx] ?? '')
      return {
        id: `node-${index}`,
        x: Number(node[xIdx]),
        y: Number(node[yIdx]),
        content,
        isCharger: chargerLocationCodes.value.has(content),
        warehouseStatus: warehouseLocationStatuses.value.get(content) ?? null,
      }
    })
    .filter(node => locationCodes.value.has(node.content))
})

// Charger takes priority (it's a distinct icon regardless of trolley
// occupancy), then Warehouse Location occupancy, then the generic marker.
function nodeImageSrc(node: NamedNode): string {
  if (node.isCharger) return chargerNodeSrc
  if (node.warehouseStatus === 'FULL') return locationNodeFullSrc
  if (node.warehouseStatus === 'EMPTY') return locationNodeEmptySrc
  return locationNodeSrc
}

const nodeIconSize = computed(() => {
  const topo = topology.value
  if (!topo) return 0
  return Math.max(topo.width, topo.height) / 140
})

const hoveredNodeId = ref<string | null>(null)
const selectedNodeId = ref<string | null>(null)

const activeNode = computed(() => {
  const id = hoveredNodeId.value ?? selectedNodeId.value
  return namedNodes.value.find(node => node.id === id) ?? null
})

function toggleNodeSelection(node: NamedNode) {
  selectedNodeId.value = selectedNodeId.value === node.id ? null : node.id
}

function clearSelection() {
  selectedNodeId.value = null
}

// Live robot positions — plotted directly in the topology's own coordinate
// space (devicePostionRec from the AMR telemetry API), so the marker moves
// as the robot moves without any path-following logic of our own. Fetched
// via the plain service function (not the shared Robots-page store/composable)
// so this widget's polling doesn't disturb that page's pagination state.
const liveRobots = ref<Robot[]>([])
const ROBOT_POLL_MS = 1000
let robotPollTimer: ReturnType<typeof setInterval> | null = null
// Guards against overlapping fetches — if a telemetry request runs longer
// than the 1s tick (RCS telemetry has been observed to time out), skip the
// next tick instead of piling up concurrent requests.
let isLoadingLiveRobots = false

async function loadLiveRobots() {
  if (isLoadingLiveRobots) return
  isLoadingLiveRobots = true
  try {
    const result = await fetchRobotsSvc({ limit: 100 })
    liveRobots.value = result.items
  } catch {
    // Non-fatal — markers just stay at their last known position this tick.
  } finally {
    isLoadingLiveRobots = false
  }
}

const robotMarkers = computed<RobotMarker[]>(() => {
  const areaNumber = selectedMap.value?.areaNumber
  if (areaNumber == null) return []
  return liveRobots.value
    .filter(robot => robot.areaId === areaNumber && robot.positionX != null && robot.positionY != null)
    .map(robot => ({
      id: robot.id,
      x: robot.positionX as number,
      y: robot.positionY as number,
      name: robot.name,
      state: robot.state,
      battery: robot.battery,
      payload: robot.payload,
    }))
})

// Which Trolley Task each robot is currently carrying out (PENDING/
// IN_PROGRESS only) — `carrying` is what's physically on the trolley right
// now (see ActiveTrolleyActivityByRobot), not the trolley's own live
// `status`, which already flips to its post-delivery value the instant the
// task order is accepted.
const activeTrolleyByRobot = ref<Map<string, 'EMPTY' | 'FULL'>>(new Map())

async function loadActiveTrolleyActivitiesByRobot() {
  try {
    const rows = await fetchActiveTrolleyActivitiesByRobot()
    activeTrolleyByRobot.value = new Map(rows.map(row => [row.robotId, row.carrying]))
  } catch {
    // Non-fatal — robot markers just fall back to their usual Idle/Charging icon.
  }
}

const robotIconSize = computed(() => {
  const topo = topology.value
  if (!topo) return 0
  return Math.max(topo.width, topo.height) / 90
})

// Matches the loose, case-insensitive state matching used by the Robots
// table (state strings come straight from the AMR telemetry API, e.g.
// "Idle", "Charging", "Offline", "InTask") — states without a dedicated
// image (Fault/Initializing/Upgrading/unknown) fall back to the hand-drawn
// mascot below. Offline always wins regardless of payload/carrying, since a
// robot that's stopped reporting can't be trusted to still be mid-delivery.
function robotImageSrc(robot: RobotMarker): string | null {
  const value = robot.state?.toLowerCase() ?? ''
  if (value.includes('offline')) return robotOfflineSrc

  const isCarrying = Number(robot.payload ?? '0') > 0
  if (isCarrying) {
    const carrying = activeTrolleyByRobot.value.get(robot.id)
    if (carrying === 'FULL') return robotPickupFullSrc
    if (carrying === 'EMPTY') return robotPickupEmptySrc
  }

  if (value.includes('charging')) return robotChargingSrc
  if (value.includes('idle')) return robotIdleSrc
  return null
}

const hoveredRobotId = ref<string | null>(null)
const activeRobot = computed(() => robotMarkers.value.find(robot => robot.id === hoveredRobotId.value) ?? null)

// Paths render at a constant on-screen width (non-scaling-stroke) — but that
// width itself grows as the operator zooms in, so lines get thicker rather
// than staying hairline-thin at high zoom. Zooming out past the fitted view
// is clamped back to the base width instead of shrinking further.
const PATH_STROKE_WIDTH_PX = 2

const pathStrokeWidth = computed(() => {
  const box = baseBox.value
  if (!box || view.w <= 0) return PATH_STROKE_WIDTH_PX
  const zoomRatio = box.w / view.w
  return PATH_STROKE_WIDTH_PX * Math.max(1, zoomRatio)
})

// Zoom bounds, relative to the fitted (base) size — can zoom in to 5% of the
// original span (20x) or out to 4x the original span.
const MIN_SPAN_RATIO = 0.05
const MAX_SPAN_RATIO = 4

function zoomAt(factor: number, centerX?: number, centerY?: number) {
  const box = baseBox.value
  if (!box) return
  const cx = centerX ?? view.x + view.w / 2
  const cy = centerY ?? view.y + view.h / 2
  const minW = box.w * MIN_SPAN_RATIO
  const maxW = box.w * MAX_SPAN_RATIO
  const newW = Math.min(maxW, Math.max(minW, view.w * factor))
  const actualFactor = newW / view.w
  const newH = view.h * actualFactor
  view.x = cx - (cx - view.x) * actualFactor
  view.y = cy - (cy - view.y) * actualFactor
  view.w = newW
  view.h = newH
}

function zoomIn() {
  zoomAt(0.8)
}

function zoomOut() {
  zoomAt(1.25)
}

function rotateView() {
  rotation.value = (rotation.value + 90) % 360
}

// Converts a mouse/pointer screen position to the SVG's own user-space
// (viewBox) coordinates, accounting for preserveAspectRatio letterboxing —
// used so wheel-zoom stays centered under the cursor instead of the box center.
function screenToViewBoxPoint(clientX: number, clientY: number) {
  const svg = svgRef.value
  if (!svg) return null
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const transformed = point.matrixTransform(ctm.inverse())
  return { x: transformed.x, y: transformed.y }
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const point = screenToViewBoxPoint(event.clientX, event.clientY)
  const factor = event.deltaY < 0 ? 0.9 : 1.1
  zoomAt(factor, point?.x, point?.y)
}

let dragging = false
let dragScale = 1
let lastClientX = 0
let lastClientY = 0

function onPointerDown(event: PointerEvent) {
  const svg = svgRef.value
  if (!svg) return
  const ctm = svg.getScreenCTM()
  if (!ctm) return
  dragging = true
  dragScale = ctm.a || 1
  lastClientX = event.clientX
  lastClientY = event.clientY
  svg.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  const dx = (event.clientX - lastClientX) / dragScale
  const dy = (event.clientY - lastClientY) / dragScale
  view.x -= dx
  view.y -= dy
  lastClientX = event.clientX
  lastClientY = event.clientY
}

function onPointerUp(event: PointerEvent) {
  dragging = false
  svgRef.value?.releasePointerCapture(event.pointerId)
}

async function loadTopology(topologyUrl: string) {
  loading.value = true
  loadError.value = false
  try {
    const response = await fetch(topologyUrl)
    if (!response.ok) throw new Error(`status ${response.status}`)
    topology.value = await response.json()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }

}

watch(selectedMap, (map) => {
  if (map) loadTopology(map.topologyUrl)
})

function selectMap(id: string) {
  selectedMapId.value = id
}

async function loadLocationCodes() {
  try {
    const result = await fetchLocationCodes()
    locationCodes.value = new Set(result.codes)
    chargerLocationCodes.value = new Set(result.chargerCodes)
    warehouseLocationStatuses.value = new Map(
      result.warehouseLocationStatuses.map(entry => [entry.code, entry.status]),
    )
  } catch {
    // Non-fatal — the map still renders, just without line/dock markers.
  }
}

// Warehouse Location occupancy changes whenever a Trolley Task is submitted
// elsewhere — polled at a much lighter cadence than robot telemetry since
// it's not nearly as time-sensitive.
const LOCATION_CODES_POLL_MS = 5000
let locationCodesPollTimer: ReturnType<typeof setInterval> | null = null

// Which robots are mid-Trolley-Task — lighter cadence than robot position,
// but tighter than location codes since it drives the marker icon while a
// delivery is visibly in progress.
const ACTIVE_TROLLEY_POLL_MS = 3000
let activeTrolleyPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([
    fetchFactoryMaps({ limit: 100 }),
    loadLocationCodes(),
    loadLiveRobots(),
    loadActiveTrolleyActivitiesByRobot(),
  ])
  if (factoryMaps.value[0]) {
    selectedMapId.value = factoryMaps.value[0].id
  } else {
    loading.value = false
  }
  robotPollTimer = setInterval(loadLiveRobots, ROBOT_POLL_MS)
  locationCodesPollTimer = setInterval(loadLocationCodes, LOCATION_CODES_POLL_MS)
  activeTrolleyPollTimer = setInterval(loadActiveTrolleyActivitiesByRobot, ACTIVE_TROLLEY_POLL_MS)
})

onBeforeUnmount(() => {
  if (robotPollTimer) {
    clearInterval(robotPollTimer)
    robotPollTimer = null
  }
  if (locationCodesPollTimer) {
    clearInterval(locationCodesPollTimer)
    locationCodesPollTimer = null
  }
  if (activeTrolleyPollTimer) {
    clearInterval(activeTrolleyPollTimer)
    activeTrolleyPollTimer = null
  }
})
</script>

<template>
  <UiBaseCard padding="none" class="flex flex-col">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
      <div class="flex items-center gap-2.5">
        <svg class="h-5 w-5 text-[#01ADEF]" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p class="text-lg font-semibold text-[#0F1F52]">Factory Map</p>
      </div>

      <select
        v-if="factoryMaps.length > 0"
        :value="selectedMapId"
        class="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#0F1F52] outline-none focus:border-[#01ADEF]"
        @change="selectMap(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="map in factoryMaps" :key="map.id" :value="map.id">
          {{ map.name }}
        </option>
      </select>
    </div>

    <div class="relative h-[460px] w-full overflow-hidden bg-slate-50 2xl:h-[600px]">
      <div v-if="loading" class="flex h-full items-center justify-center text-sm font-medium text-slate-400">
        Loading map…
      </div>

      <div v-else-if="factoryMaps.length === 0" class="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
        <p class="text-sm font-semibold">No factory maps yet</p>
        <p class="text-xs">
          Add one from
          <NuxtLink to="/dashboard/factory-maps" class="text-[#01ADEF] hover:underline">
            Factory Maps
          </NuxtLink>
        </p>
      </div>

      <div v-else-if="loadError || !topology" class="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
        <p class="text-sm font-semibold">Map unavailable</p>
        <p class="text-xs">Couldn't load the factory map assets</p>
      </div>

      <template v-else>
        <svg
          ref="svgRef"
          class="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
          :viewBox="viewBoxAttr"
          preserveAspectRatio="xMidYMid meet"
          @wheel="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @click="clearSelection"
        >
          <g :transform="`rotate(${rotation} ${rotateOrigin})`">
            <image
              v-if="imageBox && selectedMap?.imageUrl"
              :href="selectedMap.imageUrl"
              :x="imageBox.x"
              :y="imageBox.y"
              :width="imageBox.width"
              :height="imageBox.height"
              preserveAspectRatio="none"
            />

            <polyline
              v-for="(path, index) in topology.allPath"
              :key="index"
              :points="pathPoints(path)"
              fill="none"
              stroke="#BFC6C4"
              :stroke-width="pathStrokeWidth"
              stroke-linecap="square"
              stroke-linejoin="miter"
              vector-effect="non-scaling-stroke"
            />

            <g v-for="station in chargeStations" :key="station.id">
              <circle
                :cx="station.x"
                :cy="flipY(station.y)"
                :r="chargeRadius"
                fill="#01ADEF"
                fill-opacity="0.2"
                stroke="#01ADEF"
                stroke-width="1.5"
                vector-effect="non-scaling-stroke"
              />
              <text
                :x="station.x"
                :y="flipY(station.y)"
                fill="#01ADEF"
                text-anchor="middle"
                dominant-baseline="central"
                :font-size="chargeRadius"
              >
                ⚡
              </text>
            </g>

            <!-- Named line/dock markers (e.g. "L3CPA") — hover or click to see the code. -->
            <g
              v-for="node in namedNodes"
              :key="node.id"
              class="cursor-pointer"
              @pointerdown.stop
              @pointerenter="hoveredNodeId = node.id"
              @pointerleave="hoveredNodeId = null"
              @click.stop="toggleNodeSelection(node)"
            >
              <svg
                :x="node.x - nodeIconSize / 2"
                :y="flipY(node.y) - nodeIconSize / 2"
                :width="nodeIconSize"
                :height="nodeIconSize"
                viewBox="0 0 100 100"
              >
                <image
                  :href="nodeImageSrc(node)"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  preserveAspectRatio="xMidYMid meet"
                />
              </svg>
            </g>

            <!-- Tooltip for the hovered/selected named node, counter-rotated so
                 its text stays upright regardless of the map's own rotation. -->
            <g
              v-if="activeNode"
              :transform="`rotate(${-rotation} ${activeNode.x} ${flipY(activeNode.y)})`"
            >
              <rect
                :x="activeNode.x - (activeNode.content.length * nodeIconSize * 0.32 + nodeIconSize * 0.5)"
                :y="flipY(activeNode.y) - nodeIconSize * 1.9"
                :width="activeNode.content.length * nodeIconSize * 0.64 + nodeIconSize"
                :height="nodeIconSize * 1.1"
                :rx="nodeIconSize * 0.25"
                fill="#0F1F52"
              />
              <text
                :x="activeNode.x"
                :y="flipY(activeNode.y) - nodeIconSize * 1.35"
                fill="white"
                text-anchor="middle"
                dominant-baseline="central"
                :font-size="nodeIconSize * 0.55"
                font-weight="600"
              >
                Line {{ activeNode.content }}
              </text>
            </g>

            <!-- Live robot positions, straight off the AMR telemetry API's
                 devicePostionRec — same coordinate space as the topology, so
                 no path-following math is needed, just re-plot on each poll. -->
            <g
              v-for="robot in robotMarkers"
              :key="robot.id"
              class="robot-marker"
              :style="{ transform: `translate(${robot.x}px, ${flipY(robot.y)}px)` }"
              @pointerdown.stop
              @pointerenter="hoveredRobotId = robot.id"
              @pointerleave="hoveredRobotId = null"
            >
              <svg
                v-if="robotImageSrc(robot)"
                class="robot-marker__bob"
                :x="-robotIconSize / 2"
                :y="-robotIconSize / 2"
                :width="robotIconSize"
                :height="robotIconSize"
                viewBox="0 0 100 100"
              >
                <image
                  :href="robotImageSrc(robot) as string"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  preserveAspectRatio="xMidYMid meet"
                />
              </svg>
              <svg
                v-else
                class="robot-marker__bob"
                :x="-robotIconSize / 2"
                :y="-robotIconSize / 2"
                :width="robotIconSize"
                :height="robotIconSize"
                viewBox="0 0 100 100"
              >
                <rect x="0" y="0" width="100" height="100" fill="white" fill-opacity="0.001" />
                <!-- arms -->
                <path d="M25 30 Q8 30 8 20" fill="none" stroke="#0F1F52" stroke-width="5" stroke-linecap="round" />
                <rect x="2" y="12" width="12" height="10" rx="5" fill="#0F1F52" />
                <path d="M75 30 Q92 30 92 20" fill="none" stroke="#0F1F52" stroke-width="5" stroke-linecap="round" />
                <rect x="86" y="12" width="12" height="10" rx="5" fill="#0F1F52" />
                <!-- head -->
                <rect x="22" y="8" width="56" height="46" rx="22" fill="white" stroke="#01ADEF" stroke-width="5" />
                <rect x="37" y="18" width="26" height="18" rx="4" fill="#0F1F52" />
                <circle cx="50" cy="27" r="2.5" fill="white" />
                <rect x="42" y="42" width="16" height="4" rx="2" fill="#0F1F52" />
                <!-- neck + base -->
                <rect x="42" y="54" width="16" height="10" fill="#0F1F52" />
                <rect x="18" y="70" width="12" height="24" rx="6" fill="white" stroke="#01ADEF" stroke-width="5" />
                <rect x="70" y="70" width="12" height="24" rx="6" fill="white" stroke="#01ADEF" stroke-width="5" />
                <rect x="24" y="78" width="52" height="8" rx="3" fill="#0F1F52" />
              </svg>
            </g>

            <g
              v-if="activeRobot"
              :transform="`rotate(${-rotation} ${activeRobot.x} ${flipY(activeRobot.y)})`"
            >
              <rect
                :x="activeRobot.x - (activeRobot.name.length * robotIconSize * 0.22 + robotIconSize * 0.4)"
                :y="flipY(activeRobot.y) - robotIconSize * 1.05"
                :width="activeRobot.name.length * robotIconSize * 0.44 + robotIconSize * 0.8"
                :height="robotIconSize * 0.6"
                :rx="robotIconSize * 0.15"
                fill="#0F1F52"
              />
              <text
                :x="activeRobot.x"
                :y="flipY(activeRobot.y) - robotIconSize * 0.75"
                fill="white"
                text-anchor="middle"
                dominant-baseline="central"
                :font-size="robotIconSize * 0.32"
                font-weight="600"
              >
                {{ activeRobot.name }}{{ activeRobot.battery != null ? ` · ${activeRobot.battery}%` : '' }}
              </text>
            </g>
          </g>
        </svg>

        <div class="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#01ADEF]"
            title="Zoom in"
            @click="zoomIn"
          >
            <ZoomIn class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center border-t border-[#E2E8F0] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#01ADEF]"
            title="Zoom out"
            @click="zoomOut"
          >
            <ZoomOut class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center border-t border-[#E2E8F0] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#01ADEF]"
            title="Rotate"
            @click="rotateView"
          >
            <RotateCw class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center border-t border-[#E2E8F0] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#01ADEF]"
            title="Reset view"
            @click="resetView"
          >
            <Maximize class="h-4 w-4" />
          </button>
        </div>
      </template>
    </div>
  </UiBaseCard>
</template>

<style scoped>
/* Glides to its new spot on each position poll instead of jumping. */
.robot-marker {
  transition: transform 1s linear;
}

/* Small idle bob so the marker reads as "live" even between polls. */
.robot-marker__bob {
  animation: robot-marker-bob 1.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes robot-marker-bob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4%);
  }
}
</style>
