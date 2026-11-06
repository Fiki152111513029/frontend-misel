<script setup lang="ts">
import { Maximize2, Minimize2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Live Map — YAZAKI' })

// The Factory Map with the Performance column beside it, and the fleet
// table underneath. Same components the Dashboard embeds — each fetches and
// subscribes to realtime on its own, so this page adds no fetching and can
// never disagree with the Dashboard about what it is showing.
//
// The AMR Performance chart is deliberately left out: it is a day's history
// of alarm minutes per robot, which is a thing to read at a desk. This page
// is for what is happening right now, and the Dashboard still carries it.
//
// Meant to be left open on a wall display, which is what the fullscreen
// control below is for: it takes the page edge to edge, past the sidebar
// and the browser chrome.
//
// 3D only. There used to be a 2D/3D switch here, but the two draw the same
// topology from the same realtime channels, and the Dashboard already
// carries the 2D map — a toggle that lands on the same floor twice is one
// more thing to leave on the wrong setting on a wall display.
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
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen)
})
</script>

<template>
  <!-- -m-* cancels the dashboard layout's padding so the map reaches the
       edges. The page scrolls now that the fleet table sits below the fold;
       in fullscreen it has to scroll inside the fullscreen element, since
       the document behind it is not the one on screen. -->
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

    <!-- Map and Performance fill the first screenful between them, so the
         pair reads as one board rather than two cards to scroll between.
         The height is only set from lg up: stacked on a phone, a shared
         height would squash both into strips. -->
    <div
      class="flex flex-col gap-4 lg:flex-row"
      :class="isFullscreen ? 'lg:h-[calc(100vh-7.5rem)]' : 'lg:h-[calc(100vh-11.5rem)]'"
    >
      <!-- min-h-0 so the map shrinks to the row's height instead of
           pushing it taller from the inside. -->
      <div class="h-[60vh] min-h-[360px] lg:h-auto lg:min-h-0 lg:flex-1">
        <DashboardFactoryMap3D />
      </div>

      <!-- Fixed width rather than a grid fraction: Performance is a column
           of labelled rows, and it reads the same at 400px whether the map
           beside it is on a laptop or a wall display. -->
      <div class="w-full shrink-0 lg:w-[360px] xl:w-[420px]">
        <DashboardPerformancePanel fill />
      </div>
    </div>

    <div class="mt-4 rounded-2xl shadow-xl shadow-slate-300/70">
      <DashboardFleetStatusTable />
    </div>
  </div>
</template>
