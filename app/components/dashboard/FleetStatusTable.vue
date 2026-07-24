<script setup lang="ts">
interface FleetRow {
  unitId: string
  status: 'Normal' | 'Warning' | 'Error'
  mission: string
  load: string
  battery: number
}

const rows: FleetRow[] = [
  { unitId: 'AMR-V2-001', status: 'Normal', mission: 'Transfer to Hub A', load: '450kg / 800kg', battery: 79 },
  { unitId: 'AMR-V2-014', status: 'Warning', mission: 'Moving to Charger 3', load: '0kg', battery: 12 },
  { unitId: 'AMR-V2-004', status: 'Error', mission: 'Obstacle Detection Fault', load: '120kg', battery: 62 },
  { unitId: 'AMR-V2-031', status: 'Normal', mission: 'Idle at Dock 2', load: '0kg', battery: 98 },
  { unitId: 'AMR-V2-042', status: 'Normal', mission: 'Idle at Dock 2', load: '0kg', battery: 45 },
]

const summary = computed(() => ({
  normal: rows.filter(row => row.status === 'Normal').length,
  warning: rows.filter(row => row.status === 'Warning').length,
  error: rows.filter(row => row.status === 'Error').length,
}))

const statusStyles: Record<FleetRow['status'], string> = {
  Normal: 'bg-emerald-50 text-emerald-600',
  Warning: 'bg-amber-50 text-amber-600',
  Error: 'bg-red-50 text-red-600',
}

function batteryColor(battery: number) {
  if (battery <= 20) return 'bg-red-500'
  if (battery <= 60) return 'bg-amber-400'
  return 'bg-emerald-500'
}
</script>

<template>
  <UiBaseCard padding="none">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        <p class="font-semibold text-[#0F1F52]">AMR Fleet Real-time Status</p>
      </div>
      <div class="flex items-center gap-4 text-xs font-medium text-slate-500">
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-emerald-500" /> {{ summary.normal }} Normal
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-amber-400" /> {{ summary.warning }} Warning
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-red-500" /> {{ summary.error }} Error
        </span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <th class="px-5 py-3">Unit ID</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3">Mission</th>
            <th class="px-5 py-3">Load</th>
            <th class="px-5 py-3">Battery</th>
            <th class="px-5 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E2E8F0]">
          <tr v-for="row in rows" :key="row.unitId">
            <td class="whitespace-nowrap px-5 py-3.5 font-bold text-[#0F1F52]">
              {{ row.unitId }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5">
              <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusStyles[row.status]">
                {{ row.status }}
              </span>
            </td>
            <td class="whitespace-nowrap px-5 py-3.5 font-medium" :class="row.status === 'Error' ? 'text-red-500' : 'text-[#0F1F52] '">
              {{ row.mission }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5 font-medium text-[#0F1F52]">
              {{ row.load }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span class="w-9 text-xs font-medium text-[#0F1F52]">{{ row.battery }}%</span>
                <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full"
                    :class="batteryColor(row.battery)"
                    :style="{ width: `${row.battery}%` }"
                  />
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap px-5 py-3.5 text-right">
              <button
                v-if="row.status === 'Error'"
                type="button"
                class="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
              >
                Reset
              </button>
              <button
                v-else
                type="button"
                class="text-slate-400 hover:text-slate-600"
                aria-label="More options"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiBaseCard>
</template>
