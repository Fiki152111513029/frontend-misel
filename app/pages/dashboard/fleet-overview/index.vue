<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Fleet Overview — Ichii' })

// Two views over the same robot list, toggled by the chevron:
//   map    — the Factory Map and the Performance panel beside the cards
//   tasks  — per-robot task tiles instead, where the map was
// Both reuse the Dashboard's own components and its shared area/day filters,
// so this page can never disagree with the Dashboard about what it is showing.
//
// The map card is what publishes the area into that store, and it is only
// mounted in the map view. Unmounting it does not clear the store, so the
// task view keeps the last selected area — switch back to the map to change
// which area the page is scoped to.
const dashboardFilters = useDashboardFiltersStore()
const { items, load } = useFleetOverview()

const view = ref<'map' | 'tasks'>('map')

const POLL_INTERVAL_MS = 5000
let pollTimer: ReturnType<typeof setInterval> | null = null

function refresh(options: { silent?: boolean } = {}) {
  return load(dashboardFilters.areaNumber, dashboardFilters.selectedDate, options)
}

onMounted(async () => {
  await refresh()
  pollTimer = setInterval(() => refresh({ silent: true }), POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

// The map card publishes the area, so the first load can land before a map
// is picked — re-read once it settles, and whenever the day changes.
watch(
  () => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved, dashboardFilters.selectedDate],
  () => refresh({ silent: true }),
)

// The card column is capped at exactly the map column's height and scrolls
// inside itself, so a long fleet never stretches the page past the map.
// Measured rather than hardcoded: the map card sizes itself (and changes at
// the 2xl breakpoint), so copying a number here would quietly go stale.
const mapColumnRef = ref<HTMLElement | null>(null)
const mapColumnHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

watch(mapColumnRef, (element) => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!element) {
    mapColumnHeight.value = 0
    return
  }
  resizeObserver = new ResizeObserver(() => {
    mapColumnHeight.value = element.offsetHeight
  })
  resizeObserver.observe(element)
})

onBeforeUnmount(() => resizeObserver?.disconnect())

// Both the card column and the Performance panel are pinned to this, so
// all three columns end on the same line.
const mapHeightStyle = computed(() =>
  view.value === 'map' && mapColumnHeight.value > 0
    ? { height: `${mapColumnHeight.value}px` }
    : undefined,
)

const emptyMessage = computed(() =>
  dashboardFilters.isAreaResolved && dashboardFilters.areaNumber === null
    ? 'This map has no area number, so no robots are linked to it'
    : 'No robots found',
)
</script>

<template>
  <div class="animate-fade-in -m-4 space-y-4 bg-white p-4 md:-m-6 md:p-6">
    <DashboardStatsBar />

    <!-- Map view: cards on the left, scrolling within the map's height. -->
    <div v-if="view === 'map'" class="flex items-start gap-3">
      <div
        class="w-full max-w-[460px] shrink-0 space-y-4 overflow-y-auto pr-1"
        :style="mapHeightStyle"
      >
        <FleetOverviewRobotCard
          v-for="robot in items"
          :key="robot.id"
          :robot="robot"
        />
        <p v-if="items.length === 0" class="rounded-2xl border border-dashed border-[#E2E8F0] py-12 text-center text-sm text-slate-400">
          {{ emptyMessage }}
        </p>
      </div>

      <button
        type="button"
        class="mt-6 flex h-10 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-[#0F1F52]"
        aria-label="Show task breakdown"
        @click="view = 'tasks'"
      >
        <ChevronRight class="h-7 w-7" />
      </button>

      <div ref="mapColumnRef" class="min-w-0 flex-1 rounded-2xl shadow-xl shadow-slate-300/70">
        <DashboardFactoryMap />
      </div>
      <!-- max-h-none hands the panel's height over to this column, which
           is pinned to the map — its own default cap is shorter than the
           map card and would leave a gap under it. -->
      <div
        class="w-[340px] shrink-0 rounded-2xl shadow-xl shadow-slate-300/70 xl:w-[380px]"
        :style="mapHeightStyle"
      >
        <DashboardPerformancePanel max-height-class="max-h-none" :show-performance="false" />
      </div>
    </div>

    <!-- Task view: one row per robot, card and tiles in the same row so they
         stay aligned however tall either side gets. -->
    <div v-else class="flex items-start gap-3">
      <div class="min-w-0 flex-1 space-y-4">
        <div
          v-for="robot in items"
          :key="robot.id"
          class="grid grid-cols-1 gap-3 lg:grid-cols-[300px_1fr]"
        >
          <FleetOverviewRobotCard :robot="robot" />
          <!-- h-full so the tiles stretch to the row's height, which the
               taller of the two sides sets — otherwise they sit short and
               their bottoms do not line up with the AMR card. -->
          <div class="grid h-full grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <FleetOverviewTaskTile
              label="Total" tone="total"
              :value="robot.tasks?.total ?? 0" :total="robot.tasks?.total ?? 0"
            />
            <FleetOverviewTaskTile
              label="Completed" tone="completed"
              :value="robot.tasks?.completed ?? 0" :total="robot.tasks?.total ?? 0"
            />
            <FleetOverviewTaskTile
              label="In Progress" tone="inProgress"
              :value="robot.tasks?.inProgress ?? 0" :total="robot.tasks?.total ?? 0"
            />
            <FleetOverviewTaskTile
              label="Failed" tone="failed"
              :value="robot.tasks?.failed ?? 0" :total="robot.tasks?.total ?? 0"
            />
            <!-- A duration, not a task count — the same alarmMinutes the
                 AMR Performance chart plots, over the same day. -->
            <FleetOverviewTaskTile
              label="Alarm Time" tone="alarm" unit="Min" :show-share="false"
              :value="robot.tasks?.alarmMinutes ?? 0" :total="robot.tasks?.total ?? 0"
            />
          </div>
        </div>
        <p v-if="items.length === 0" class="rounded-2xl border border-dashed border-[#E2E8F0] py-12 text-center text-sm text-slate-400">
          {{ emptyMessage }}
        </p>
      </div>

      <button
        type="button"
        class="mt-6 flex h-10 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-[#0F1F52]"
        aria-label="Show factory map"
        @click="view = 'map'"
      >
        <ChevronLeft class="h-7 w-7" />
      </button>
    </div>
  </div>
</template>
