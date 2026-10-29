<script setup lang="ts">
import { PackageCheck, PackageOpen, RefreshCw, Truck } from 'lucide-vue-next'
import type { BinStatus } from '~/types/checking-area'
import type { WarehouseNotice } from '~/composables/useRealtime'
import {
  isWarehouseNoticeUrgent,
  warehouseNoticeSound,
  warehouseNoticeText,
} from '~/utils/warehouseNotice'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Checking Area — YAZAKI' })

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
// Three different states read the same from an empty box, so say which:
// still loading, nothing to choose from, or simply nothing chosen yet.
const selectPlaceholder = computed(() => {
  if (loading.value) return 'Loading…'
  if (items.value.length === 0) return 'No warehouse locations'
  return 'Select a storage to check'
})

const storageOptions = computed(() =>
  items.value.map(row => ({
    value: row.id,
    label: row.name,
    hint: row.iRaypleLocationCode,
  })),
)

onMounted(async () => {
  // Nothing is picked on purpose. Pre-selecting the first storage put a
  // real location and its bin status on screen that the operator never
  // asked for — one stray click on Set Empty / Set Full and the wrong rack
  // is corrected in RCS. They choose first, then act.
  await fetchRows(null)
})

// ---- Warehouse notices --------------------------------------------------
// Custom Tasks that need something of this area: a rack prepared, or a slot
// cleared. Shown here because this is the page the warehouse staff work
// from, and the only one where they can act on it.
const notices = ref<WarehouseNotice[]>([])
const MAX_NOTICES = 20
// The server re-sends a "running" notice on every status update for the
// same task; only the first of each kind is worth showing.
const seenNotices = new Set<string>()

function playNoticeSound(notice: WarehouseNotice) {
  const src = warehouseNoticeSound(notice)
  if (!src) return
  try {
    // Browsers block audio until the page has been interacted with, and
    // that rejection is expected rather than a fault — the notice is still
    // on screen either way.
    void new Audio(src).play().catch(() => {})
  } catch {
    // No Audio support at all; the visual notice stands on its own.
  }
}

useWarehouseNotices((notice) => {
  const key = `${notice.orderId}:${notice.kind}`
  if (seenNotices.has(key)) return
  seenNotices.add(key)

  notices.value = [notice, ...notices.value].slice(0, MAX_NOTICES)
  playNoticeSound(notice)

  // A held task is waiting on a bin here, so the list behind this page is
  // about to matter — re-read it rather than wait for the stock signal.
  if (isWarehouseNoticeUrgent(notice)) fetchRows(null, { silent: true })
})

function dismissNotice(orderId: string, kind: string) {
  notices.value = notices.value.filter(
    n => !(n.orderId === orderId && n.kind === kind),
  )
}

function noticeTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false })
}

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

// "full" and "empty" are RCS's words, and on the floor they read as the
// opposite of what they mean: a full bin is one with an empty rack standing
// ready. The wording is an admin setting so it can be said the way the
// people using it say it — see App Settings.
const { settings, load: loadSettings, binLabel } = useAppSettings()
onMounted(() => loadSettings())
useRealtime('settings', () => loadSettings({ force: true }))

const statusLabel = computed(() => {
  if (!selected.value) return '—'
  if (selected.value.hasFinishGood) return binLabel(null, true)
  if (selected.value.stockStatus === 'FULL') return binLabel('FULL')
  if (selected.value.stockStatus === 'EMPTY') return binLabel('EMPTY')
  return 'unknown'
})

const statusClass = computed(() => {
  if (selected.value?.hasFinishGood) return 'text-emerald-600'
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

    <!-- Warehouse notices. Above the picker on purpose: they are the
         reason someone opens this page in a hurry, and the held ones are
         asking for something to be done right now. -->
    <div v-if="notices.length > 0" class="space-y-2">
      <div
        v-for="notice in notices"
        :key="`${notice.orderId}:${notice.kind}`"
        class="flex items-start gap-3 rounded-2xl border px-4 py-3"
        :class="isWarehouseNoticeUrgent(notice)
          ? 'border-amber-300 bg-amber-50'
          : 'border-[#E2E8F0] bg-white'"
      >
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          :class="isWarehouseNoticeUrgent(notice)
            ? 'bg-amber-100 text-amber-600'
            : 'bg-[#01ADEF]/10 text-[#01ADEF]'"
        >
          <component :is="isWarehouseNoticeUrgent(notice) ? PackageOpen : Truck" class="h-4 w-4" />
        </span>

        <div class="min-w-0 flex-1">
          <p
            class="break-words text-sm font-medium leading-snug"
            :class="isWarehouseNoticeUrgent(notice) ? 'text-amber-900' : 'text-[#0F1F52]'"
          >
            {{ warehouseNoticeText(notice) }}
          </p>
          <p class="mt-0.5 text-xs text-slate-500">{{ noticeTime(notice.at) }}</p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Dismiss"
          @click="dismissNotice(notice.orderId, notice.kind)"
        >
          ✕
        </button>
      </div>
    </div>

    <UiSearchSelect
      v-model="selectedId"
      :options="storageOptions"
      :disabled="items.length === 0"
      :placeholder="selectPlaceholder"
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
        v-if="selected.stockStatus !== 'EMPTY' || selected.hasFinishGood"
        full-width
        variant="gradient"
        :loading="submitting"
        @click="correct('EMPTY')"
      >
        <PackageOpen class="mr-2 h-4 w-4" />
        Set: {{ settings['bin.label.empty'] }}
      </UiBaseButton>

      <UiBaseButton
        v-if="selected.stockStatus !== 'FULL'"
        full-width
        :variant="selected.stockStatus === 'EMPTY' ? 'gradient' : 'secondary'"
        :loading="submitting"
        @click="correct('FULL')"
      >
        <PackageCheck class="mr-2 h-4 w-4" />
        Set: {{ settings['bin.label.full'] }}
      </UiBaseButton>
    </template>

    <p v-else-if="selected" class="text-center text-xs font-medium text-slate-400">
      You do not have permission to change bin status.
    </p>
  </div>
</template>
