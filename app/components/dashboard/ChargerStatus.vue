<script setup lang="ts">
interface ChargerHub {
  id: string
  unit: string | null
  battery: number | null
}

const hubs: ChargerHub[] = [
  { id: 'HUB-01', unit: 'AMR-14', battery: 92 },
  { id: 'HUB-02', unit: null, battery: null },
  { id: 'HUB-03', unit: 'AMR-02', battery: 24 },
  { id: 'HUB-04', unit: null, battery: null },
]
</script>

<template>
  <UiBaseCard padding="none">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] px-5 py-4">
      <p class="font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Charger Status</p>
      <span class="rounded-lg bg-slate-100 dark:bg-[#1E293B] px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ hubs.length }} Slots Total
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 p-5">
      <div
        v-for="hub in hubs"
        :key="hub.id"
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center"
        :class="hub.unit ? 'border-[#01ADEF]/40 bg-[#01ADEF]/5' : 'border-[#E2E8F0] dark:border-[#1E293B]'"
      >
        <span class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ hub.id }}</span>

        <svg
          v-if="hub.unit"
          class="h-6 w-6 text-[#01ADEF]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h4.146l-1.879 6.093a.75.75 0 001.292.657l8.5-9.5a.75.75 0 00-.559-1.25h-4.146l1.879-6.093z" clip-rule="evenodd" />
        </svg>
        <svg
          v-else
          class="h-6 w-6 text-slate-300 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <rect x="6" y="3" width="12" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 21v-2" />
        </svg>

        <span
          v-if="hub.unit"
          class="text-sm font-semibold text-[#01ADEF]"
        >
          {{ hub.unit }} ({{ hub.battery }}%)
        </span>
        <span v-else class="text-sm font-medium text-slate-300 dark:text-slate-600">
          Vacant
        </span>
      </div>
    </div>
  </UiBaseCard>
</template>
