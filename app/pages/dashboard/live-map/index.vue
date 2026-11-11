<script setup lang="ts">
import { Maximize2, Minimize2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Live Map — Ichii' })

// A control-room board: the map as a square on the left, then two columns
// of panels beside it — the fleet and what it is waiting on.
//
// Every panel is a component the Dashboard also embeds, and each fetches
// and subscribes to realtime on its own, so this page adds no fetching of
// its own and can never disagree with the Dashboard about what it shows.
// The arrangement is the only thing that differs.
//
// 2D, not 3D. The 3D view is a better picture of the floor but a worse
// board: it needs a wide frame to read, and this one is square. The 2D map
// fits its viewBox to whatever box it is given, so a square suits it.
//
// Nothing here is scrolled by hand. The panels that hold more rows than
// they have room for turn their own pages — see useAutoPager.
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

/**
 * The box every panel on the board sits in.
 *
 * Each takes an equal share of its column and scrolls inside itself, which
 * is what lets the board end flush with the bottom of the screen. Only
 * below xl, where the three columns stack into one, does a panel need a
 * height of its own — nothing above it is setting one there.
 */
const panelBox = computed(() =>
  isFullscreen.value
    ? 'min-h-0 flex-1'
    : 'h-[260px] xl:h-auto xl:min-h-0 xl:flex-1',
)

onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <!-- -m-* cancels the dashboard layout's padding so the board reaches the
       edges.

       One arrangement in both modes, because a board that rearranges
       itself when you press Fullscreen is a different board: a flex column
       pinned to the screen height, the heading on top, the board taking
       everything left under it, and nothing allowed to scroll. The panels
       scroll inside themselves instead, so the board always ends flush
       with the bottom edge.

       The two modes differ only in where that height comes from. Fullscreen
       owns the whole screen, so h-screen. Otherwise the page sits under the
       64px topbar, so calc(100vh-4rem) — and the -m-6/p-6 pair above cancels
       out exactly, leaving the board filling the layout's content box with
       nothing to spare. -->
  <div
    ref="shellRef"
    class="animate-fade-in -m-4 flex flex-col bg-white md:-m-6"
    :class="isFullscreen
      ? 'h-screen overflow-hidden p-3'
      : 'p-4 md:p-6 xl:h-[calc(100vh-4rem)] xl:overflow-hidden'"
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

    <!-- Map, then the pair, then the trio on the far right.

         Direction lives entirely in the bound class: 'flex-col' and
         'flex-row' set the same property, and which one wins is decided by
         their order in Tailwind's stylesheet, not by the order they are
         written here — so having both on the element at once would be a
         coin toss. Fullscreen is always three columns; otherwise from xl,
         below which they stack — three columns beside a square map need
         about 1280px before any of them is wide enough to read, and under
         that the page goes back to scrolling. -->
    <div
      class="flex gap-4"
      :class="isFullscreen
        ? 'min-h-0 flex-1 flex-row items-stretch'
        : 'flex-col xl:min-h-0 xl:flex-1 xl:flex-row xl:items-stretch'"
    >
      <!-- The map, square, driven by HEIGHT: h-full with aspect-square and
           w-auto, so it grows to the full height of the board and takes the
           matching width. That is what makes it big — sizing it by width
           instead left it a fixed tile with the screen half empty around it.

           max-w is the guard for when a full-height square would crowd out
           the two columns beside it. It is tighter outside fullscreen (40%
           against 52%) because the sidebar has already taken 280px off the
           width there, and the columns have to come out of what is left.

           Below xl it stacks, and there the square is sized by width again
           — "full height" means nothing in a column that scrolls. -->
      <div
        class="aspect-square shrink-0 rounded-2xl shadow-xl shadow-slate-300/70"
        :class="isFullscreen
          ? 'h-full w-auto max-w-[52%]'
          : 'mx-auto w-full max-w-[560px] xl:mx-0 xl:h-full xl:w-auto xl:max-w-[40%]'"
      >
        <DashboardFactoryMap fill />
      </div>

      <!-- The pair: the day's figures, and what is queued right now. -->
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <div class="rounded-2xl shadow-xl shadow-slate-300/70" :class="panelBox">
          <DashboardPanelsPerformance standalone />
        </div>
        <div class="rounded-2xl shadow-xl shadow-slate-300/70" :class="panelBox">
          <DashboardPanelsRequestQueue standalone />
        </div>
      </div>

      <!-- The trio, hard against the right edge: the fleet, what is wrong
           with it, and where it charges. -->
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <div class="rounded-2xl shadow-xl shadow-slate-300/70" :class="panelBox">
          <DashboardFleetStatusTable compact />
        </div>
        <div class="rounded-2xl shadow-xl shadow-slate-300/70" :class="panelBox">
          <DashboardPanelsAbnormality standalone />
        </div>
        <div class="rounded-2xl shadow-xl shadow-slate-300/70" :class="panelBox">
          <DashboardPanelsChargerStatus standalone />
        </div>
      </div>
    </div>
  </div>
</template>
