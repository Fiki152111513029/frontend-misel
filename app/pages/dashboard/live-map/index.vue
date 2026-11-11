<script setup lang="ts">
import { Maximize2, Minimize2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Live Map — Ichii' })

// A control-room board: the map large on the left, the fleet and its
// chargers down the right-hand side, and the three things worth watching
// while it runs along the bottom.
//
// Every panel on it is a component the Dashboard also embeds, and each
// fetches and subscribes to realtime on its own — so this page adds no
// fetching of its own and can never disagree with the Dashboard about what
// it is showing. The arrangement is the only thing that differs.
//
// 3D only. There used to be a 2D/3D switch here, but the two draw the same
// topology from the same realtime channels, and the Dashboard already
// carries the 2D map — a toggle that lands on the same floor twice is one
// more thing to leave on the wrong setting on a wall display.
//
// Meant to be left open on a wall display, which is what the fullscreen
// control below is for: it takes the page edge to edge, past the sidebar
// and the browser chrome.
const shellRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

function syncFullscreen() {
  isFullscreen.value = !!document.fullscreenElement
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await shellRef.value?.requestFullscreen()
    }
  } catch {
    // Blocked by the browser (no user gesture, or disallowed in an iframe).
    // Nothing to recover — the page is still perfectly usable unmaximised.
  }
}

onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <!-- -m-* cancels the dashboard layout's padding so the board reaches the
       edges. The page scrolls; in fullscreen it has to scroll inside the
       fullscreen element, since the document behind it is not the one on
       screen. -->
  <div
    ref="shellRef"
    class="animate-fade-in -m-4 bg-white md:-m-6"
    :class="isFullscreen ? 'h-screen overflow-y-auto p-3' : 'p-4 md:p-6'"
  >
    <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Live Map</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Robot positions, alarms and bin status as they happen
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F1F52] transition-colors hover:border-[#01ADEF] hover:text-[#01ADEF]"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          @click="toggleFullscreen"
        >
          <component :is="isFullscreen ? Minimize2 : Maximize2" class="h-4 w-4" />
          {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
        </button>
      </div>
    </div>

    <!-- Two columns from xl up: the board proper, and the sidebar that runs
         the full height beside it. Below xl they stack, because a 340px
         sidebar next to a map on a tablet leaves neither of them readable.

         Built as flex rather than a grid with row spans: the sidebar has to
         be as tall as the map AND the row under it together, and expressing
         that as "one column containing two rows, beside another column" is
         a good deal easier to keep right than counting grid lines. -->
    <div class="flex flex-col gap-4 xl:flex-row xl:items-stretch">
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <!-- Fixed height, deliberately not derived from 100vh: a viewport
             height makes the map grow on a taller screen, so the board
             never reads the same on two monitors and the row below it gets
             pushed off the fold. 2xl is a WIDTH breakpoint, so this does
             not change with screen height. -->
        <div class="h-[420px] rounded-2xl shadow-xl shadow-slate-300/70 2xl:h-[520px]">
          <DashboardFactoryMap3D />
        </div>

        <!-- The three watch-panels. Equal height by the grid, each scrolling
             inside itself, so one busy panel cannot stretch the other two. -->
        <div class="grid gap-4 md:grid-cols-3">
          <div class="h-[260px] rounded-2xl shadow-xl shadow-slate-300/70 2xl:h-[300px]">
            <DashboardPanelsRequestQueue standalone />
          </div>
          <div class="h-[260px] rounded-2xl shadow-xl shadow-slate-300/70 2xl:h-[300px]">
            <DashboardPanelsAbnormality standalone />
          </div>
          <div class="h-[260px] rounded-2xl shadow-xl shadow-slate-300/70 2xl:h-[300px]">
            <DashboardPanelsPerformance standalone />
          </div>
        </div>
      </div>

      <!-- Fixed width rather than a grid fraction: these are columns of
           labelled rows and they read the same at 340px whether the map
           beside them is on a laptop or a wall display. -->
      <div class="flex w-full shrink-0 flex-col gap-4 xl:w-[320px] 2xl:w-[360px]">
        <div class="h-[340px] rounded-2xl shadow-xl shadow-slate-300/70 2xl:h-[420px]">
          <DashboardFleetStatusTable compact />
        </div>
        <div class="min-h-[260px] flex-1 rounded-2xl shadow-xl shadow-slate-300/70">
          <DashboardPanelsChargerStatus standalone />
        </div>
      </div>
    </div>
  </div>
</template>
