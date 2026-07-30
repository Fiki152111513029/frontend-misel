<script setup lang="ts">
import { fetchFactoryMap } from '~/services/robot.service'
import type { FactoryMapData } from '~/types/robot'

const mapData = ref<FactoryMapData | null>(null)
const loading = ref(true)
const loadError = ref(false)

// The external topology data uses a Y-up coordinate system; SVG is Y-down, so
// every point gets its Y flipped to render right-side-up.
function flipY(y: number) {
  return -y
}

const viewBox = computed(() => {
  const map = mapData.value
  if (!map) return '0 0 1 1'
  return `${map.xAttrMin} ${flipY(map.yAttrMin + map.height)} ${map.width} ${map.height}`
})

function pathPoints(path: number[][]) {
  return path.map(([x, y]) => `${x},${flipY(y)}`).join(' ')
}

// Charging-station markers are drawn at a size proportional to the map's own
// scale (viewBox units, not screen pixels), so they stay visible whether the
// floor plan is small or sprawling.
const chargeRadius = computed(() => {
  const map = mapData.value
  if (!map) return 0
  return Math.max(map.width, map.height) / 150
})

async function load() {
  loading.value = true
  loadError.value = false
  try {
    mapData.value = await fetchFactoryMap()
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
      <span v-if="mapData" class="text-sm font-medium text-slate-400">Area {{ mapData.mapId }}</span>
    </div>

    <div class="relative h-[460px] w-full overflow-hidden bg-slate-50 2xl:h-[600px]">
      <div v-if="loading" class="flex h-full items-center justify-center text-sm font-medium text-slate-400">
        Loading map…
      </div>

      <div v-else-if="loadError || !mapData" class="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
        <p class="text-sm font-semibold">Map unavailable</p>
        <p class="text-xs">Couldn't reach the AMR fleet topology service</p>
      </div>

      <svg v-else class="h-full w-full" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
        <polyline
          v-for="(path, index) in mapData.allPath"
          :key="index"
          :points="pathPoints(path)"
          fill="none"
          stroke="#CBD5E1"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />

        <g v-for="station in mapData.chargeStations" :key="station.id">
          <circle
            :cx="station.x"
            :cy="flipY(station.y)"
            :r="chargeRadius"
            fill="#01ADEF"
            fill-opacity="0.15"
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
      </svg>
    </div>
  </UiBaseCard>
</template>
