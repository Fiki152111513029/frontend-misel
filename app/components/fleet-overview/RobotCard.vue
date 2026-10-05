<script setup lang="ts">
import amrIconSrc from '~/assets/images/irayplay.png'
import type { FleetOverviewRobot } from '~/composables/useFleetOverview'

interface Props {
  robot: FleetOverviewRobot
}

const props = defineProps<Props>()

// Same bucketing rule the Dashboard's fleet table uses, so the two never
// disagree about which robots count as up.
const dotClass = computed(() => {
  const state = props.robot.state?.toLowerCase() ?? ''
  if (state.includes('fault')) return 'bg-red-500'
  if (!state || state.includes('offline')) return 'bg-slate-400'
  return 'bg-[#F6AE2D]'
})

const batteryClass = computed(() => {
  const battery = props.robot.battery
  if (battery == null) return 'bg-slate-400'
  if (battery <= 20) return 'bg-red-500'
  if (battery <= 60) return 'bg-amber-400'
  return 'bg-emerald-400'
})
</script>

<template>
  <div class="rounded-2xl bg-[#15308A] px-5 py-4 text-white shadow-sm">
    <div class="flex items-center gap-4">
      <img :src="amrIconSrc" alt="" class="h-12 w-20 shrink-0 object-contain">
      <div class="min-w-0 flex-1 text-right">
        <p class="truncate text-2xl font-extrabold leading-tight sm:text-3xl">
          {{ robot.name }}
        </p>
        <p class="text-sm font-medium text-white/60">{{ robot.unitId }}</p>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-xs">
      <div>
        <p class="font-semibold text-white/80">Battery</p>
        <div class="mt-1.5 flex items-center gap-1.5">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              class="h-full rounded-full transition-all"
              :class="batteryClass"
              :style="{ width: `${robot.battery ?? 0}%` }"
            />
          </div>
          <span class="shrink-0 text-[11px] font-medium text-white/70">
            {{ robot.battery == null ? '—' : `${robot.battery}%` }}
          </span>
        </div>
      </div>

      <div class="text-center">
        <p class="font-semibold text-white/80">Status</p>
        <p class="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#F6AE2D]">
          <span class="h-1.5 w-1.5 rounded-full" :class="dotClass" />
          {{ robot.state ?? 'Offline' }}
        </p>
      </div>

      <div class="text-right">
        <p class="font-semibold text-white/80">Speed</p>
        <p class="mt-1.5 text-[11px] font-medium text-white/70">
          {{ robot.speed ?? '—' }}
        </p>
      </div>
    </div>

    <p class="mt-3 truncate text-sm font-medium">
      Mission: <span class="text-white/80">{{ robot.mission ?? '—' }}</span>
    </p>
  </div>
</template>
