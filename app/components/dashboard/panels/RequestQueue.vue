<script setup lang="ts">
import { fetchTrolleyActivities } from '~/services/trolley-activity.service'
import { fetchCustomTaskRuns } from '~/services/custom-task.service'

// Everything still outstanding on this map, from both the places work is
// raised:
//
//   Trolley activities still PENDING — Take Trolley scanned, Drop Trolley
//   not submitted yet.
//
//   Custom Task runs still PENDING — which covers BOTH the runs RCS has
//   not started and the ones parked waiting for a rack, because a held run
//   keeps status PENDING and only carries waitingForBinAt to say so.
//
// PENDING only, not IN_PROGRESS: a run a robot is already driving is work
// in motion, not work in the queue, and this panel's badge says "Pending".
// A cancelled run is stored as FAILED, so asking for PENDING leaves it out
// without a second test.
//
// Newest first, capped to a handful for this compact panel.
const props = withDefaults(
  defineProps<{ standalone?: boolean, last?: boolean }>(),
  { standalone: false, last: false },
)

const dashboardFilters = useDashboardFiltersStore()
// This panel reads two endpoints behind two different permissions, so it
// has to know what this account may ask for before it asks.
const { hasPermission } = useAuth()

type QueueKind = 'trolley' | 'custom'
interface QueueRequest {
  id: string
  kind: QueueKind
  title: string
  route: string
  eta: string
  /** Parked on a rack rather than queued behind a robot. */
  waiting: boolean
  /** Sort key only — the two sources timestamp different columns. */
  at: number
}
const QUEUE_ROWS_SHOWN = 5
const requests = ref<QueueRequest[]>([])
// Counted before the cap. Capping both would have the panel read "5 Pending"
// while twelve are actually waiting, which is worse than saying nothing.
const pendingTotal = ref(0)

function formatElapsed(startDate: string) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}m`
}

/** A Custom Task's route is stored as "A,B,C" — the Control Task's nodes. */
function taskPathCodes(taskPath: string) {
  return taskPath.split(',').map(code => code.trim()).filter(Boolean)
}

async function loadRequestQueue() {
  if (!dashboardFilters.isMapTopologyResolved) {
    requests.value = []
    pendingTotal.value = 0
    return
  }
  // Fetched wider than the five shown, because the map filter below removes
  // rows — taking only five up front could leave this map with an empty
  // queue while it actually has pending work.
  //
  // Asked for by status rather than reading the newest page and sorting it
  // out here: a run parked on an empty rack can sit for hours, long enough
  // to fall off any recent page while still being exactly the thing this
  // panel exists to show.
  //
  // Each source is fetched and caught on its own. They sit behind separate
  // permissions, so an account that may read trolleys but not Custom Tasks
  // is ordinary rather than an error — and with one shared catch, that
  // account would lose the trolley rows too.
  const [trolleys, customRuns] = await Promise.all([
    hasPermission('trolley-activity.read')
      ? fetchTrolleyActivities({ status: 'PENDING', page: 1, limit: 50 }).catch(() => null)
      : null,
    hasPermission('custom-task.read')
      ? fetchCustomTaskRuns({ status: 'PENDING', page: 1, limit: 50 }).catch(() => null)
      : null,
  ])

  // Both ends failed — a refresh tick that learned nothing. Keep the last
  // known queue rather than blanking a panel the floor is reading.
  if (!trolleys && !customRuns) return

  const rows: QueueRequest[] = []

  for (const item of trolleys?.items ?? []) {
    // A trip touches this map if either end of it is a node here — the
    // pickup and the dropping can legitimately sit on different floors.
    if (
      !dashboardFilters.isOnCurrentMap(item.pickupLocationCode)
      && !dashboardFilters.isOnCurrentMap(item.droppingLocationCode)
    ) continue

    rows.push({
      // Prefixed because the two sources are separate tables and nothing
      // stops a Custom Task run and a trolley activity sharing an id.
      id: `trolley:${item.id}`,
      kind: 'trolley',
      title: `${item.trolley.name} (${item.trolley.code})`,
      route: `${item.pickupLocationCode} → ${item.droppingLocationCode ?? '?'}`,
      eta: formatElapsed(item.startDate),
      waiting: false,
      at: new Date(item.startDate).getTime(),
    })
  }

  for (const run of customRuns?.items ?? []) {
    const codes = taskPathCodes(run.taskPath)
    // Any stop on the route, not just its ends: a Custom Task route is a
    // list of nodes, and a middle one is on this map just as much.
    if (!codes.some(code => dashboardFilters.isOnCurrentMap(code))) continue

    rows.push({
      id: `custom:${run.id}`,
      kind: 'custom',
      title: `${run.name} (${run.code})`,
      // A parked run has no robot on its way, so printing its route would
      // read as work in motion. Say what is actually blocking it instead
      // — the same thing the operator's own Custom Task card says.
      route: run.waitingForCode
        ? run.waitingForStatus === '0'
          ? `Waiting for ${run.waitingForCode} to clear`
          : `Waiting for ${run.waitingForCode} to fill`
        : `${codes[0] ?? '?'} → ${codes[codes.length - 1] ?? '?'}`,
      eta: formatElapsed(run.createdAt),
      waiting: run.waitingForCode !== null,
      at: new Date(run.createdAt).getTime(),
    })
  }

  rows.sort((a, b) => b.at - a.at)
  pendingTotal.value = rows.length
  requests.value = rows.slice(0, QUEUE_ROWS_SHOWN)
}

onMounted(loadRequestQueue)
// Pushed from the server instead of polled — see useRealtime. Both signals
// land on the same loader because this is one merged list: a Custom Task
// being released, parked or finished changes it just as much as a trolley.
useRealtime('trolley-activities', loadRequestQueue)
useRealtime('custom-tasks', loadRequestQueue)
watch(
  () => [dashboardFilters.mapLocationCodes, dashboardFilters.isMapTopologyResolved],
  loadRequestQueue,
)
</script>

<template>
  <DashboardPanelsPanelShell
    :standalone="props.standalone"
    :last="props.last"
    :title="props.standalone ? 'AMR Request Queue' : 'Request Queue'"
  >
    <template #icon>
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5M3.75 12h16.5M3.75 18.75h16.5" />
      </svg>
    </template>

    <template #badge>
      <span class="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        {{ pendingTotal }} Pending
      </span>
    </template>

    <div v-if="requests.length === 0" class="text-center text-xs text-slate-400" :class="props.standalone ? 'py-6' : 'mt-4'">
      {{ dashboardFilters.isMapTopologyResolved
        ? 'Nothing waiting on this map right now.'
        : 'Loading this map…' }}
    </div>
    <div v-else class="divide-y divide-[#E2E8F0]" :class="props.standalone ? '-my-1' : 'mt-3'">
      <div v-for="request in requests" :key="request.id" class="flex items-center gap-3 py-3">
        <!-- The icon says where the row came from: a crate for a Trolley
             activity, a sheet for a Custom Task. Amber overrides both when
             the task is parked on a rack, because that one is not queued
             behind a robot — it is waiting on something a person has to go
             and deal with. -->
        <div
          class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          :class="request.waiting
            ? 'bg-amber-50 text-amber-600'
            : request.kind === 'custom'
              ? 'bg-[#01ADEF]/10 text-[#01ADEF]'
              : 'bg-[#0F1F52]/10 text-[#0F1F52]'"
        >
          <svg v-if="request.kind === 'custom'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M8.25 3.75h4.129a1.5 1.5 0 011.06.44l4.371 4.37a1.5 1.5 0 01.44 1.061V18.75a1.5 1.5 0 01-1.5 1.5h-8.5a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z" />
          </svg>
          <svg v-else class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.75h16.5M3.75 9.75v8.25A2.25 2.25 0 006 20.25h12a2.25 2.25 0 002.25-2.25V9.75M3.75 9.75L5.7 4.5h12.6l1.95 5.25" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-[#0F1F52]">{{ request.title }}</p>
          <p class="font-medium text-xs" :class="request.waiting ? 'text-amber-600' : 'text-slate-400'">{{ request.route }}</p>
        </div>
        <span class="flex-shrink-0 text-xs font-medium text-slate-400">{{ request.eta }}</span>
      </div>

      <!-- The panel shows five; the badge counts them all. Without this
           line the gap between the two reads as a bug. -->
      <p v-if="pendingTotal > requests.length" class="pt-3 text-center text-xs text-slate-400">
        +{{ pendingTotal - requests.length }} more waiting
      </p>
    </div>

    <!-- A legend only the standalone card has room for: stacked on the
         Dashboard it would sit between two panels and read as a divider. -->
    <template v-if="props.standalone" #footer>
      <div class="flex items-center gap-4 text-[11px] font-medium text-slate-500">
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-[#01ADEF]" /> Custom Task
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-[#0F1F52]" /> Trolley
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-amber-500" /> Waiting
        </span>
      </div>
    </template>
  </DashboardPanelsPanelShell>
</template>
