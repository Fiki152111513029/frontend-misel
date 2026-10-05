<script setup lang="ts">
interface Props {
  label: string
  value: number
  /** Share of this robot's total, used for the bar and its caption. */
  total: number
  tone: 'total' | 'completed' | 'inProgress' | 'failed' | 'cancelled' | 'alarm'
  /** Word after the number. Defaults to Task; alarm time is in minutes. */
  unit?: string
  /**
   * Alarm time is a duration, not a slice of the task count, so it has no
   * honest percentage to show — the bar and its caption are hidden instead
   * of inventing a denominator.
   */
  showShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'Task',
  showShare: true,
})

// One entry per tone keeps the header, number and bar in step — picking
// them separately at each use site is how they drift apart.
const TONES = {
  total: { header: 'bg-[#0F1F52]', body: 'bg-slate-200/70', value: 'text-[#0F1F52]', bar: 'bg-[#0F1F52]', track: 'bg-white' },
  completed: { header: 'bg-[#1D4FD8]', body: 'bg-[#2F6FED]/15', value: 'text-[#1D4FD8]', bar: 'bg-[#1D4FD8]', track: 'bg-white' },
  inProgress: { header: 'bg-[#F6AE2D]', body: 'bg-amber-100/70', value: 'text-[#D98E12]', bar: 'bg-[#F6AE2D]', track: 'bg-white' },
  failed: { header: 'bg-[#EF4444]', body: 'bg-red-100/70', value: 'text-[#EF4444]', bar: 'bg-[#EF4444]', track: 'bg-white' },
  cancelled: { header: 'bg-[#94A3B8]', body: 'bg-slate-200/60', value: 'text-slate-400', bar: 'bg-[#94A3B8]', track: 'bg-white' },
  alarm: { header: 'bg-[#F97316]', body: 'bg-orange-100/70', value: 'text-[#EA6A0C]', bar: 'bg-[#F97316]', track: 'bg-white' },
} as const

const tone = computed(() => TONES[props.tone])

// The Total tile is its own denominator, so it always reads 100% rather
// than dividing by itself and looking like a coincidence.
const percent = computed(() => {
  if (props.tone === 'total') return props.total > 0 ? 100 : 0
  if (props.total <= 0) return 0
  return Math.round((props.value / props.total) * 100)
})
</script>

<template>
  <!-- Fills whatever height the row gives it, so a tile always lines up
       with the AMR card beside it however tall that card happens to be.
       The number stays centred in the space left over and the bar stays
       pinned to the bottom. -->
  <div class="flex h-full flex-col overflow-hidden rounded-2xl shadow-sm">
    <p class="px-3 py-3.5 text-center text-lg font-semibold text-white" :class="tone.header">
      {{ label }}
    </p>
    <div class="flex flex-1 flex-col px-5 pb-5 pt-6" :class="tone.body">
      <p class="flex flex-1 items-baseline justify-center text-center">
        <span class="text-5xl font-extrabold leading-none" :class="tone.value">{{ value.toLocaleString('en-US') }}</span>
        <span class="ml-2 text-lg font-medium" :class="tone.value">{{ unit }}</span>
      </p>
      <div v-if="showShare" class="mt-6 flex items-center gap-2">
        <span class="shrink-0 text-sm font-semibold" :class="tone.value">{{ percent }}%</span>
        <div class="h-2 flex-1 overflow-hidden rounded-full" :class="tone.track">
          <div
            class="h-full rounded-full transition-all"
            :class="tone.bar"
            :style="{ width: `${percent}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
