<script setup lang="ts">
import { fetchFleetStatus } from '~/services/robot.service'
import type { FleetStatusRow } from '~/types/robot'

// `compact` is the sidebar form: the same rows and the same fetch, drawn
// as a narrow three-column card with its own paging. A separate component
// would have meant a second copy of the loading, scoping and realtime
// wiring below — all of which must stay identical, since both forms are on
// screen at once on Live Map.
const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const rows = ref<FleetStatusRow[]>([])
const loading = ref(true)

// Scoped to whichever Factory Map is on screen (see stores/dashboard-area)
// so this table lists the robots the map is actually drawing. A map with no
// areaNumber matches no robot, which is why the map shows no markers for it
// — the table says the same rather than falling back to every area.
const dashboardFilters = useDashboardFiltersStore()

async function load() {
  if (!dashboardFilters.isAreaResolved) return
  if (dashboardFilters.areaNumber == null) {
    rows.value = []
    loading.value = false
    return
  }
  try {
    rows.value = await fetchFleetStatus(dashboardFilters.areaNumber)
  } catch {
    // Non-fatal — keep showing the last known data if a refresh tick fails.
  } finally {
    loading.value = false
  }
}

// Switching maps must re-scope immediately, not on the next poll tick.
watch(() => [dashboardFilters.areaNumber, dashboardFilters.isAreaResolved], load)

onMounted(async () => {
  await load()
})

// Pushed from the server instead of polled — see useRealtime.
useRealtime(['robots', 'tasks'], load)

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

// Paged rather than scrolled in the sidebar: a scroll area inside a column
// that is itself in a scrolling page is a trap for a mouse wheel, and the
// board is meant to be read from across the room, not interacted with —
// which is also why the pages turn themselves. See useAutoPager.
const COMPACT_PAGE_SIZE = 5
const { page, pageCount, pagedItems: pagedRows, step: stepPage } = useAutoPager(
  rows,
  // intervalMs 0 switches the timer off: the Dashboard renders the full
  // table, so a ticking pager there would be work nobody ever sees.
  { pageSize: COMPACT_PAGE_SIZE, intervalMs: props.compact ? 5000 : 0 },
)

function batteryColor(battery: number) {
  if (battery <= 20) return 'bg-red-500'
  if (battery <= 60) return 'bg-amber-400'
  return 'bg-emerald-500'
}
</script>

<template>
  <!-- Sidebar form -->
  <div
    v-if="props.compact"
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
  >
    <div class="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
      <div class="flex min-w-0 items-center gap-2">
        <svg class="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5h16.5v9H3.75zM7.5 16.5v2.25M16.5 16.5v2.25" />
        </svg>
        <p class="truncate text-xs font-bold uppercase tracking-wide text-[#0F1F52]">AMR Status</p>
      </div>
      <DashboardPanelsPageStepper :page="page" :page-count="pageCount" @step="stepPage" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <table class="w-full text-left">
        <thead>
          <tr class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <th class="pb-2 font-semibold">AMR</th>
            <th class="pb-2 font-semibold">State</th>
            <th class="pb-2 text-right font-semibold">Batt.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="3" class="py-6 text-center text-xs text-slate-400">
              {{ dashboardFilters.isAreaResolved && dashboardFilters.areaNumber === null
                ? 'This map has no area number'
                : 'No robots found' }}
            </td>
          </tr>
          <tr v-for="row in pagedRows" :key="row.unitId" class="align-middle">
            <td class="py-1.5 pr-2 text-xs font-bold text-[#0F1F52]">{{ row.unitId }}</td>
            <td class="py-1.5 pr-2">
              <span
                class="block truncate rounded-md px-2 py-1 text-center text-[11px] font-medium"
                :class="statusStyles[severity(row.status)]"
              >
                {{ row.status ?? 'Unknown' }}
              </span>
            </td>
            <td class="py-1.5 text-right">
              <div v-if="row.battery !== null" class="flex items-center justify-end gap-1.5">
                <span class="text-[11px] font-medium text-[#0F1F52]">{{ row.battery }}%</span>
                <div class="h-1.5 w-8 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full" :class="batteryColor(row.battery)" :style="{ width: `${row.battery}%` }" />
                </div>
              </div>
              <span v-else class="text-[11px] font-medium text-slate-400">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-shrink-0 items-center gap-3 border-t border-[#E2E8F0] px-4 py-2.5 text-[11px] font-medium text-slate-500">
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500" /> {{ summary.normal }} Normal</span>
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-400" /> {{ summary.warning }} Warning</span>
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-red-500" /> {{ summary.error }} Error</span>
    </div>
  </div>

  <!-- Full-width table form -->
  <UiBaseCard v-else padding="none">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        <p class="font-semibold text-[#0F1F52]">AMR Fleet Real-time Status</p>
        <span v-if="dashboardFilters.mapName" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {{ dashboardFilters.mapName }}
        </span>
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
            <th class="px-5 py-3">Battery</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E2E8F0]">
          <tr v-if="!loading && rows.length === 0">
            <td colspan="4" class="px-5 py-8 text-center text-sm text-slate-400">
              {{ dashboardFilters.isAreaResolved && dashboardFilters.areaNumber === null
                ? 'This map has no area number, so no robots are linked to it'
                : 'No robots found' }}
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
