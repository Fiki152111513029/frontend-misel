<script setup lang="ts">
import { Maximize2, Minimize2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Live Map — YAZAKI' })

// The Factory Map on its own, filling the screen. Same component the
// Dashboard and Fleet Overview embed — the map is driven by realtime
// signals inside it, so this page adds no fetching of its own and can
// never disagree with those two about what it is showing.
//
// Meant to be left open on a wall display, which is what the fullscreen
// control below is for: it takes the map edge to edge, past the sidebar
// and the browser chrome.
// 2D = the realtime SVG map; 3D = the Three.js factory model.
const viewMode = ref<'2d' | '3d'>('2d')

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
       edges, and the height is the viewport minus the header strip above. -->
  <div
    ref="shellRef"
    class="animate-fade-in -m-4 flex flex-col bg-white md:-m-6"
    :class="isFullscreen ? 'h-screen p-3' : 'h-[calc(100vh-5.5rem)] p-4 md:p-6'"
  >
    <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Live Map</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Robot positions, alarms and bin status as they happen
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="inline-flex overflow-hidden rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold">
          <button
            v-for="mode in (['2d', '3d'] as const)"
            :key="mode"
            type="button"
            class="px-4 py-2.5 transition-colors"
            :class="viewMode === mode ? 'bg-[#01ADEF] text-white' : 'text-[#0F1F52] hover:text-[#01ADEF]'"
            @click="viewMode = mode"
          >
            {{ mode.toUpperCase() }}
          </button>
        </div>

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

    <!-- min-h-0 so the map shrinks inside the flex column rather than
         pushing the page into a scrollbar. -->
    <div class="min-h-0 flex-1">
      <DashboardFactoryMap v-if="viewMode === '2d'" fill />
      <DashboardFactoryMap3D v-else />
    </div>
  </div>
</template>
