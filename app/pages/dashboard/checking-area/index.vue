<script setup lang="ts">
import { PackageCheck, PackageOpen, RefreshCw } from 'lucide-vue-next'
import type { BinStatus } from '~/types/checking-area'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Checking Area — JAI' })

// Same single-column shape as the Custom Task scan page: pick one storage,
// read what RCS says about it, correct it with one button. No area picker —
// a Warehouse Location carries no area of its own, so the backend asks
// every area and merges, rather than making the operator guess.
const { hasPermission } = useAuth()
const { items, loading, fetchRows, correctBin } = useCheckingArea()

const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find(row => row.id === selectedId.value) ?? null)

// Searching happens inside the dropdown itself (UiSearchSelect), so the
// page only has to hand it the full list — the location code rides along
// as the hint so it is searchable too, not just the name.
const storageOptions = computed(() =>
  items.value.map(row => ({
    value: row.id,
    label: row.name,
    hint: row.iRaypleLocationCode,
  })),
)

onMounted(async () => {
  await fetchRows(null)
  selectedId.value = items.value[0]?.id ?? null
})

// Pushed from the server instead of polled — see useRealtime.
useRealtime(['stock', 'tasks'], () => fetchRows(null, { silent: true }))

// RCS owns bin status and has no webhook for it, so a bin changed from
// outside this app (a handheld, RCS itself) produces no signal at all. This
// page exists to show the truth about bins, so it keeps one slow safety
// re-read on top of the signals above.
const SAFETY_REFRESH_MS = 60_000
let safetyTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  safetyTimer = setInterval(() => fetchRows(null, { silent: true }), SAFETY_REFRESH_MS)
})

onBeforeUnmount(() => {
  if (safetyTimer) {
    clearInterval(safetyTimer)
    safetyTimer = null
  }
})

const submitting = ref(false)

async function correct(status: BinStatus) {
  if (!selected.value || submitting.value) return
  submitting.value = true
  const ok = await correctBin(selected.value.iRaypleLocationCode, status)
  submitting.value = false
  // Re-read rather than patching locally: RCS is the source of truth, and
  // this confirms it really took the change.
  if (ok) await fetchRows(null, { silent: true })
}

const statusLabel = computed(() => {
  if (!selected.value) return '—'
  if (selected.value.stockStatus === 'FULL') return 'full'
  if (selected.value.stockStatus === 'EMPTY') return 'empty'
  return 'unknown'
})

const statusClass = computed(() => {
  if (selected.value?.stockStatus === 'FULL') return 'text-amber-600'
  if (selected.value?.stockStatus === 'EMPTY') return 'text-sky-600'
  return 'text-slate-400'
})

</script>

<template>
  <div class="mx-auto w-full max-w-md space-y-4 px-4 py-6 sm:px-0">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-[#0F1F52] sm:text-2xl">Checking Area</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          What RCS believes this storage holds. Correct it when the floor says otherwise.
        </p>
      </div>
      <button
        type="button"
        class="mt-1 shrink-0 rounded-xl border border-[#E2E8F0] bg-white p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-[#0F1F52]"
        aria-label="Refresh"
        @click="fetchRows(null)"
      >
        <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
      </button>
    </div>

    <UiSearchSelect
      v-model="selectedId"
      :options="storageOptions"
      :disabled="items.length === 0"
      :placeholder="loading ? 'Loading…' : 'No warehouse locations'"
      search-placeholder="Search storage by name or code"
      empty-text="No storage matches that search"
    />

    <UiBaseCard v-if="selected" class="space-y-3">
      <div class="flex items-baseline gap-2 text-sm">
        <span class="w-16 shrink-0 font-medium text-slate-400">Name</span>
        <span class="font-semibold text-[#0F1F52]">{{ selected.name }}</span>
      </div>
      <div class="flex items-baseline gap-2 text-sm">
        <span class="w-16 shrink-0 font-medium text-slate-400">Node</span>
        <span class="font-mono font-semibold text-[#0F1F52]">{{ selected.iRaypleLocationCode }}</span>
      </div>
      <div class="flex items-baseline gap-2 text-sm">
        <span class="w-16 shrink-0 font-medium text-slate-400">Status</span>
        <span class="font-semibold capitalize" :class="statusClass">{{ statusLabel }}</span>
      </div>
    </UiBaseCard>

    <template v-if="selected && hasPermission('checking-area.update')">
      <!-- Only the opposite of what RCS holds is offered — resending the
           status it already has would change nothing. A bin RCS says
           nothing about gets both, since either could be the truth. -->
      <UiBaseButton
        v-if="selected.stockStatus !== 'EMPTY'"
        full-width
        variant="gradient"
        :loading="submitting"
        @click="correct('EMPTY')"
      >
        <PackageOpen class="mr-2 h-4 w-4" />
        Clear the area
      </UiBaseButton>

      <UiBaseButton
        v-if="selected.stockStatus !== 'FULL'"
        full-width
        :variant="selected.stockStatus === 'EMPTY' ? 'gradient' : 'secondary'"
        :loading="submitting"
        @click="correct('FULL')"
      >
        <PackageCheck class="mr-2 h-4 w-4" />
        Fill the area
      </UiBaseButton>
    </template>

    <p v-else-if="selected" class="text-center text-xs font-medium text-slate-400">
      You do not have permission to change bin status.
    </p>
  </div>
</template>
