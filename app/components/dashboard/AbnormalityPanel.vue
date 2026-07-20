<script setup lang="ts">
interface ZoneError {
  label: string
  percent: number
}

const zones: ZoneError[] = [
  { label: 'Zone A (Storage)', percent: 12 },
  { label: 'Zone B (Packaging)', percent: 48 },
  { label: 'Zone C (Docking)', percent: 22 },
]

function barColor(percent: number) {
  if (percent >= 40) return 'bg-red-500'
  if (percent >= 20) return 'bg-[#01ADEF]'
  return 'bg-[#2F6FED]'
}
</script>

<template>
  <UiBaseCard padding="md">
    <div class="flex items-start justify-between">
      <div>
        <p class="font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Abnormality</p>
        <p class="font-medium mt-0.5 text-xs text-slate-400">Error density by zone</p>
      </div>
      <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>

    <div class="mt-4 space-y-4">
      <div v-for="zone in zones" :key="zone.label">
        <div class="mb-1.5 flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400">{{ zone.label }}</span>
          <span class="font-medium text-[#0F1F52] dark:text-[#F8FAFC]">{{ zone.percent }}%</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="barColor(zone.percent)"
            :style="{ width: `${zone.percent}%` }"
          />
        </div>
      </div>
    </div>
  </UiBaseCard>
</template>
