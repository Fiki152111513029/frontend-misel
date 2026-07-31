<script setup lang="ts">
import { Maximize, RotateCw, ZoomIn, ZoomOut } from 'lucide-vue-next'

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
}

interface ChargeStation {
  id: string
  x: number
  y: number
}

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

// Exported straight from the RCS map editor (same files it keeps under
// .../Maps/common/): background.jpg is the floor-plan raster, topology.json
// is its allPath/chargeCoor data. Both are bundled as static assets, so this
// card never depends on the AMR fleet network being reachable.
const BACKGROUND_URL = '/factory-map/background.jpg'
const TOPOLOGY_URL = '/factory-map/topology.json'

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

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const response = await fetch(TOPOLOGY_URL)
    if (!response.ok) throw new Error(`status ${response.status}`)
    topology.value = await response.json()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
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
    </div>

    <div class="relative h-[460px] w-full overflow-hidden bg-slate-50 2xl:h-[600px]">
      <div v-if="loading" class="flex h-full items-center justify-center text-sm font-medium text-slate-400">
        Loading map…
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
        >
          <g :transform="`rotate(${rotation} ${rotateOrigin})`">
            <image
              v-if="imageBox"
              :href="BACKGROUND_URL"
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
              stroke="#01ADEF"
              stroke-opacity="0.75"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
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
