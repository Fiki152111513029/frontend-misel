<script setup lang="ts">
import type { SensorStatus } from '~/composables/useRobotFleet'

defineProps<{ sensors: SensorStatus[] }>()

const STATUS_STYLE: Record<SensorStatus['status'], string> = {
  nominal: 'text-emerald-500',
  stable: 'text-[#01ADEF]',
  drift: 'text-amber-500',
  offline: 'text-red-500',
}
</script>

<template>
  <UiBaseCard padding="none" class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3 dark:border-[#1E293B]">
      <p class="text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Sensor Integrity</p>
      <span class="text-xs font-semibold text-emerald-500">98.4% calibrated</span>
    </div>
    <div class="flex flex-1 flex-col justify-center gap-3 px-4 py-4">
      <div v-for="sensor in sensors" :key="sensor.key" class="flex items-center justify-between text-sm">
        <span class="text-slate-500 dark:text-slate-400">{{ sensor.label }}</span>
        <span
          class="font-mono text-xs font-bold uppercase tracking-wide"
          :class="STATUS_STYLE[sensor.status]"
        >
          {{ sensor.status }}
        </span>
      </div>
    </div>
  </UiBaseCard>
</template>
