<script setup lang="ts">
interface MapUnit {
  id: string
  top: string
  left: string
  status: 'normal' | 'error'
}

const units: MapUnit[] = [
  { id: 'AMR-15', top: '28%', left: '78%', status: 'normal' },
  { id: 'AMR-21', top: '48%', left: '48%', status: 'normal' },
  { id: 'AMR-04', top: '68%', left: '62%', status: 'error' },
]
</script>

<template>
  <UiBaseCard padding="none" class="flex flex-col">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] px-6 py-5">
      <div class="flex items-center gap-2.5">
        <svg class="h-5 w-5 text-[#01ADEF]" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p class="text-lg font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Factory Map</p>
      </div>
      <span class="text-sm font-medium text-slate-400">ZOOM: 100%</span>
    </div>

    <div class="relative h-[460px] w-full overflow-hidden bg-slate-50 dark:bg-[#0B1220] 2xl:h-[600px]">
      <!-- Zones -->
      <div class="absolute left-[15%] top-[20%] h-[55%] w-[20%] rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white/60 dark:bg-white/5">
        <span class="absolute left-3 top-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Zone A</span>
      </div>
      <div class="absolute left-[30%] top-[35%] h-[38%] w-[26%] rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white/80 dark:bg-white/10">
        <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-semibold uppercase tracking-wide text-slate-400">
          Storage Hub
        </span>
      </div>

      <!-- AMR markers -->
      <div
        v-for="unit in units"
        :key="unit.id"
        class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
        :style="{ top: unit.top, left: unit.left }"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
          :class="unit.status === 'error' ? 'bg-red-500' : 'bg-[#2F6FED]'"
        >
          <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="4" y="7" width="16" height="11" rx="2" stroke-linecap="round" stroke-linejoin="round" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 7V5a3 3 0 016 0v2" />
          </svg>
        </div>
        <span class="rounded bg-white/90 dark:bg-[#0F172A]/90 px-1.5 py-0.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {{ unit.id }}
        </span>
      </div>

      <!-- Charging stations -->
      <div class="absolute bottom-4 left-4 flex gap-2">
        <div
          v-for="n in 3"
          :key="n"
          class="flex h-8 w-8 items-center justify-center rounded-md border border-[#01ADEF]/40 text-[#01ADEF]"
        >
          <svg class="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h4.146l-1.879 6.093a.75.75 0 001.292.657l8.5-9.5a.75.75 0 00-.559-1.25h-4.146l1.879-6.093z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  </UiBaseCard>
</template>
