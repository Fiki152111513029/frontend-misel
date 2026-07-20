<script setup lang="ts">
interface Props {
  date?: string
  shift?: string
  totalProduction?: number
  activeUnits?: number
  totalUnits?: number
  criticalAlarms?: number
}

withDefaults(defineProps<Props>(), {
  date: '24 May 2024',
  shift: 'Morning Shift',
  totalProduction: 14202,
  activeUnits: 42,
  totalUnits: 48,
  criticalAlarms: 2,
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
    >
      <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
      {{ date }}
      <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
    >
      <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ shift }}
      <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div class="h-6 w-px bg-[#E2E8F0] dark:bg-[#1E293B]" />

    <div class="inline-flex items-center gap-2 rounded-xl bg-[#0F1F52] px-4 py-2 text-sm text-white">
      <span class="text-xs font-medium uppercase tracking-wide text-white/70">Total Production</span>
      <span class="font-bold">{{ totalProduction.toLocaleString('en-US') }} Units</span>
    </div>

    <div class="inline-flex items-center gap-2 rounded-xl bg-[#2F6FED] px-4 py-2 text-sm text-white">
      <span class="text-xs font-medium uppercase tracking-wide text-white/70">Active Units</span>
      <span class="font-bold">{{ activeUnits }} / {{ totalUnits }}</span>
    </div>

    <div class="inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
      <span class="text-xs font-medium uppercase tracking-wide text-red-400">Critical Alarms</span>
      <span class="font-bold">{{ String(criticalAlarms).padStart(2, '0') }}</span>
    </div>
  </div>
</template>
