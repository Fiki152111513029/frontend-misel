<script setup lang="ts">
import { PackageOpen, PackageCheck, RefreshCw, Search } from 'lucide-vue-next'
import type { BinStatus, CheckingAreaRow } from '~/types/checking-area'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Checking Area — Misel' })

const { hasPermission } = useAuth()
const { items, loading, fetchRows, correctBin } = useCheckingArea()

// The area is a Factory Map's areaNumber — the same number RCS keys its
// stock status on, and the same one the Dashboard map filters robots by.
const { items: factoryMaps, fetchFactoryMaps } = useFactoryMaps()
const areasWithNumber = computed(() => factoryMaps.value.filter(map => map.areaNumber != null))
const selectedAreaId = ref<number | null>(null)

const search = ref('')
const onlyMismatchProne = ref(false)

const visibleRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return items.value.filter((row) => {
    if (onlyMismatchProne.value && row.stockStatus === null) return true
    if (onlyMismatchProne.value && row.stockStatus !== null) return false
    if (!term) return true
    return (
      row.name.toLowerCase().includes(term)
      || row.iRaypleLocationCode.toLowerCase().includes(term)
    )
  })
})

const summary = computed(() => ({
  empty: items.value.filter(row => row.stockStatus === 'EMPTY').length,
  full: items.value.filter(row => row.stockStatus === 'FULL').length,
  unknown: items.value.filter(row => row.stockStatus === null).length,
}))

// RCS is the system of record here and other integrations write to it too,
// so poll rather than trusting a snapshot the operator may stare at for
// minutes. Silent ticks keep the table from blinking.
const POLL_INTERVAL_MS = 5000
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await fetchFactoryMaps({ limit: 100 })
  selectedAreaId.value = areasWithNumber.value[0]?.areaNumber ?? null
  await fetchRows(selectedAreaId.value)
  pollTimer = setInterval(
    () => fetchRows(selectedAreaId.value, { silent: true }),
    POLL_INTERVAL_MS,
  )
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

watch(selectedAreaId, areaId => fetchRows(areaId))

// Which row is mid-correction — so only that button spins, and a double
// click cannot fire two conflicting corrections at the same bin.
const busyCode = ref<string | null>(null)

async function correct(row: CheckingAreaRow, status: BinStatus) {
  if (busyCode.value) return
  busyCode.value = row.iRaypleLocationCode
  const ok = await correctBin(row.iRaypleLocationCode, status)
  busyCode.value = null
  // Re-read rather than patching the row locally: RCS is the source of
  // truth, and this confirms it really took the change.
  if (ok) await fetchRows(selectedAreaId.value, { silent: true })
}

const controlClass
  = 'rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Checking Area</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          What RCS believes each bin holds. Correct it here when the floor says otherwise.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600">
          {{ summary.empty }} Empty
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
          {{ summary.full }} Full
        </span>
        <span v-if="summary.unknown > 0" class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {{ summary.unknown }} Unknown
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300"
          @click="fetchRows(selectedAreaId)"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="loading ? 'animate-spin' : ''" />
          Refresh
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <select v-model="selectedAreaId" :class="controlClass">
        <option v-if="areasWithNumber.length === 0" :value="null">No area available</option>
        <option v-for="map in areasWithNumber" :key="map.id" :value="map.areaNumber">
          {{ map.name }} (Area {{ map.areaNumber }})
        </option>
      </select>

      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by name or location code"
          :class="`w-full pl-9 ${controlClass}`"
        >
      </div>

      <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
        <input v-model="onlyMismatchProne" type="checkbox" class="h-4 w-4 rounded border-slate-300">
        Unknown only
      </label>
    </div>

    <UiBaseCard padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th class="px-4 py-3">Location</th>
              <th class="px-4 py-3" style="width: 180px">Location Code</th>
              <th class="px-4 py-3" style="width: 150px">RCS Says</th>
              <th class="px-4 py-3" style="width: 240px">Correct To</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && items.length === 0">
              <td colspan="4" class="py-12 text-center text-slate-400">Loading…</td>
            </tr>
            <tr v-else-if="visibleRows.length === 0">
              <td colspan="4" class="py-12 text-center text-slate-400">
                {{ selectedAreaId === null
                  ? 'No Factory Map has an area number yet, so RCS cannot be asked about any area.'
                  : 'No warehouse locations match.' }}
              </td>
            </tr>
            <tr
              v-for="row in visibleRows"
              :key="row.id"
              class="border-b border-[#E2E8F0] last:border-0"
            >
              <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
                {{ row.name }}
                <span v-if="row.inTask" class="ml-2 rounded bg-[#01ADEF]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#01ADEF]">
                  in task
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500">
                {{ row.iRaypleLocationCode }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="row.stockStatus === 'FULL'
                    ? 'bg-amber-50 text-amber-600'
                    : row.stockStatus === 'EMPTY'
                      ? 'bg-sky-50 text-sky-600'
                      : 'bg-slate-100 text-slate-400'"
                >
                  {{ row.stockStatus === 'FULL' ? 'Full bin' : row.stockStatus === 'EMPTY' ? 'Empty bin' : 'Unknown' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div v-if="hasPermission('checking-area.update')" class="flex items-center gap-2">
                  <!-- Only the opposite of what RCS says is offered, since
                       re-sending the status it already holds changes nothing.
                       An unknown bin gets both. -->
                  <button
                    v-if="row.stockStatus !== 'EMPTY'"
                    type="button"
                    :disabled="busyCode !== null"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="correct(row, 'EMPTY')"
                  >
                    <PackageOpen class="h-3.5 w-3.5" />
                    {{ busyCode === row.iRaypleLocationCode ? 'Sending…' : 'Kosongkan' }}
                  </button>
                  <button
                    v-if="row.stockStatus !== 'FULL'"
                    type="button"
                    :disabled="busyCode !== null"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="correct(row, 'FULL')"
                  >
                    <PackageCheck class="h-3.5 w-3.5" />
                    {{ busyCode === row.iRaypleLocationCode ? 'Sending…' : 'Isi (Full)' }}
                  </button>
                </div>
                <span v-else class="text-xs text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiBaseCard>
  </div>
</template>
