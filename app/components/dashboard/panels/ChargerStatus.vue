<script setup lang="ts">
import { fetchRobots } from '~/services/robot.service'
import type { Robot } from '~/types/robot'

// A Charger Area is identified only by its iRayple location code — it has
// no areaId — so "on this map" means "this map draws a node with that
// code", exactly the rule the map itself uses to place charger icons.
const props = withDefaults(
  defineProps<{ standalone?: boolean, last?: boolean }>(),
  { standalone: false, last: false },
)

const dashboardFilters = useDashboardFiltersStore()
const { items: chargerAreas, fetchChargerAreaOptions } = useChargerAreaOptions()
const robots = ref<Robot[]>([])

async function loadRobots() {
  try {
    const result = await fetchRobots({ page: 1, limit: 1000 })
    robots.value = result.items
  } catch {
    // Non-fatal — keep showing the last known data if a refresh tick fails.
  }
}

function isCharging(robot: Robot) {
  return robot.state?.toLowerCase().includes('charg') ?? false
}

interface ChargerHub { id: string, unit: string | null, battery: number | null }
const hubs = computed<ChargerHub[]>(() => {
  if (!dashboardFilters.isMapTopologyResolved) return []
  return chargerAreas.value
    .filter(area => dashboardFilters.isOnCurrentMap(area.iRaypleLocationCode))
    .map((area) => {
      const occupant = robots.value.find(robot => robot.position === area.iRaypleLocationCode && isCharging(robot))
      return { id: area.name, unit: occupant?.name ?? null, battery: occupant?.battery ?? null }
    })
})

// Two slots at a time on the board, turning themselves — see the same
// reasoning in Abnormality.vue. Stacked on the Dashboard the tiles are two
// across and scrolled by hand, so the whole list is one page there.
const HUBS_PER_PAGE = 2
const { page, pageCount, pagedItems: pagedHubs, step: stepPage } = useAutoPager(
  hubs,
  {
    pageSize: props.standalone ? HUBS_PER_PAGE : Number.MAX_SAFE_INTEGER,
    intervalMs: props.standalone ? 5000 : 0,
  },
)

onMounted(async () => {
  await Promise.all([fetchChargerAreaOptions(), loadRobots()])
})
useRealtime(['robots', 'stock'], loadRobots)
// `hubs` is a computed over the store, so it re-scopes on its own when the
// map changes — nothing to watch here.
</script>

<template>
  <DashboardPanelsPanelShell
    :standalone="props.standalone"
    :last="props.last"
    title="Charger Status"
  >
    <template #icon>
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5a1.5 1.5 0 011.5-1.5h10.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-9zM20.25 10.5v3" />
      </svg>
    </template>

    <template #badge>
      <span
        v-if="!props.standalone"
        class="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
      >
        {{ hubs.length }} Slots Total
      </span>
      <div v-else class="flex items-center gap-2">
        <span class="whitespace-nowrap text-[11px] font-medium text-slate-400">{{ hubs.length }} slots</span>
        <DashboardPanelsPageStepper :page="page" :page-count="pageCount" @step="stepPage" />
      </div>
    </template>

    <div v-if="hubs.length === 0" class="text-center text-xs text-slate-400" :class="props.standalone ? 'py-6' : 'mt-4'">
      {{ dashboardFilters.isMapTopologyResolved
        ? 'No charger areas on this map.'
        : 'Loading this map…' }}
    </div>

    <!-- Standalone the panel is a narrow sidebar column, so the slots read
         as rows — charger, state, who is on it — the way the reference
         board lays them out. Stacked on the Dashboard they stay the
         two-across tiles that card has always shown. -->
    <table v-else-if="props.standalone" class="w-full text-left">
      <thead>
        <tr class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <th class="pb-2 font-semibold">Charger</th>
          <th class="pb-2 font-semibold">State</th>
          <th class="pb-2 text-right font-semibold">AMR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hub in pagedHubs" :key="hub.id" class="align-middle">
          <td class="py-1.5 pr-2 text-xs font-bold text-[#0F1F52]">{{ hub.id }}</td>
          <td class="py-1.5 pr-2">
            <span
              class="block truncate rounded-md px-2 py-1 text-center text-[11px] font-medium"
              :class="hub.unit ? 'bg-[#01ADEF]/10 text-[#01ADEF]' : 'bg-slate-100 text-slate-400'"
            >
              {{ hub.unit ? 'Charging' : 'Idle' }}
            </span>
          </td>
          <td class="py-1.5 text-right text-xs font-medium" :class="hub.unit ? 'text-[#0F1F52]' : 'text-slate-300'">
            {{ hub.unit ?? '—' }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="mt-4 grid grid-cols-2 gap-3">
      <div
        v-for="hub in hubs"
        :key="hub.id"
        class="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-3 py-4 text-center"
        :class="hub.unit ? 'border-[#01ADEF]/40 bg-[#01ADEF]/5' : 'border-[#E2E8F0] '"
      >
        <span class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ hub.id }}</span>

        <svg v-if="hub.unit" class="h-5 w-5 text-[#01ADEF]" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h4.146l-1.879 6.093a.75.75 0 001.292.657l8.5-9.5a.75.75 0 00-.559-1.25h-4.146l1.879-6.093z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <rect x="6" y="3" width="12" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 21v-2" />
        </svg>

        <span v-if="hub.unit" class="text-xs font-semibold text-[#01ADEF]">
          {{ hub.unit }} ({{ hub.battery }}%)
        </span>
        <span v-else class="text-xs font-medium text-slate-300">Vacant</span>
      </div>
    </div>
  </DashboardPanelsPanelShell>
</template>
