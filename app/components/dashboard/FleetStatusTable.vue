<script setup lang="ts">
import { fetchFleetStatus } from '~/services/robot.service'
import type { FleetStatusRow } from '~/types/robot'

const POLL_INTERVAL_MS = 5000

const rows = ref<FleetStatusRow[]>([])
const loading = ref(true)

async function load() {
  try {
    rows.value = await fetchFleetStatus()
  } catch {
    // Non-fatal — keep showing the last known data if a refresh tick fails.
  } finally {
    loading.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await load()
  pollTimer = setInterval(load, POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

// Buckets the free-text `state` reported by the AMR telemetry API (Idle,
// Initializing, In task, Fault, Offline, Charging, Upgrading — casing and
// spacing vary) into the three summary categories this card shows.
type Severity = 'normal' | 'warning' | 'error'

function severity(status: string | null): Severity {
  const value = status?.toLowerCase() ?? ''
  if (value.includes('fault')) return 'error'
  if (value.includes('offline') || !value) return 'warning'
  return 'normal'
}

const summary = computed(() => ({
  normal: rows.value.filter(row => severity(row.status) === 'normal').length,
  warning: rows.value.filter(row => severity(row.status) === 'warning').length,
  error: rows.value.filter(row => severity(row.status) === 'error').length,
}))

const statusStyles: Record<Severity, string> = {
  normal: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
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
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E2E8F0]">
          <tr v-if="!loading && rows.length === 0">
            <td colspan="5" class="px-5 py-8 text-center text-sm text-slate-400">
              No robots found
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.unitId">
            <td class="whitespace-nowrap px-5 py-3.5 font-bold text-[#0F1F52]">
              {{ row.unitId }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5">
              <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusStyles[severity(row.status)]">
                {{ row.status ?? 'Unknown' }}
              </span>
            </td>
            <td
              class="whitespace-nowrap px-5 py-3.5 font-medium"
              :class="severity(row.status) === 'error' ? 'text-red-500' : 'text-[#0F1F52] '"
            >
              {{ row.mission ?? '-' }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5 font-medium text-[#0F1F52]">
              {{ row.load ?? '-' }}
            </td>
            <td class="whitespace-nowrap px-5 py-3.5">
              <div v-if="row.battery !== null" class="flex items-center gap-2">
                <span class="w-9 text-xs font-medium text-[#0F1F52]">{{ row.battery }}%</span>
                <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full"
                    :class="batteryColor(row.battery)"
                    :style="{ width: `${row.battery}%` }"
                  />
                </div>
              </div>
              <span v-else class="text-xs font-medium text-slate-400">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiBaseCard>
</template>
