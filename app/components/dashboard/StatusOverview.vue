<script setup lang="ts">
import type { FleetStatusCounts } from '~/composables/useRobotFleet'

defineProps<{ status: FleetStatusCounts }>()

const boxes = [
  { key: 'active', label: 'Active', color: 'text-[#01ADEF] border-[#01ADEF]/30 bg-[#01ADEF]/5' },
  { key: 'charging', label: 'Charging', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  { key: 'idle', label: 'Idle', color: 'text-slate-400 border-slate-400/30 bg-slate-400/5' },
  { key: 'error', label: 'Error', color: 'text-red-400 border-red-400/30 bg-red-400/5' },
] as const
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Operational Status
      </p>
      <p class="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-500">
        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Nominal
      </p>
    </div>

    <div class="flex flex-1 flex-wrap gap-2">
      <div
        v-for="box in boxes"
        :key="box.key"
        class="flex min-w-[84px] flex-1 flex-col items-center rounded-xl border px-3 py-2"
        :class="box.color"
      >
        <span class="text-[10px] font-semibold uppercase tracking-wide opacity-80">{{ box.label }}</span>
        <span class="mt-0.5 font-mono text-lg font-bold">
          {{ String(status[box.key]).padStart(2, '0') }}
        </span>
      </div>
    </div>
  </div>
</template>
