<script setup lang="ts">
import { PackageCheck, PackageOpen, RefreshCw, Truck, X } from 'lucide-vue-next'
import type { BinStatus, CheckingAreaRow } from '~/types/checking-area'
import type { WarehouseNotice } from '~/composables/useRealtime'
import type { LineStatus } from '~/types/line-status'
import { clearLineStatus, fetchLineStatuses } from '~/services/line-status.service'
import {
  isLineStatusActionable,
  lineStatusBoardText,
  lineStatusColor,
} from '~/utils/lineStatus'
import {
  isWarehouseNoticeActionable,
  isWarehouseNoticeUrgent,
  supersededKinds,
  warehouseNoticeSound,
  warehouseNoticeText,
} from '~/utils/warehouseNotice'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Checking Area — Ichii' })

// Every storage node as a button, colour-coded by what it holds.
//
// Replaces a search dropdown. The dropdown answered "what about this one?"
// but hid the question the warehouse actually asks — which racks need
// attention right now — behind a search box. As buttons the whole area
// reads at a glance, and picking one is a tap instead of a search.
const { hasPermission } = useAuth()
const { items, loading, fetchRows, correctBin } = useCheckingArea()

const selectedId = ref<string | null>(null)
const selected = computed(
  () => items.value.find(row => row.id === selectedId.value) ?? null,
)

// Nothing is picked on purpose. Pre-selecting put a real location and its
// bin status on screen that the operator never asked for — one stray tap
// on Set Empty / Set Full and the wrong rack is corrected in RCS.
onMounted(async () => {
  await fetchRows(null)
})

function selectRow(row: CheckingAreaRow) {
  // Tapping the chosen one again clears it, so there is a way back to
  // "nothing selected" without reloading the page.
  selectedId.value = selectedId.value === row.id ? null : row.id
}

// ---- Warehouse notices --------------------------------------------------
// Custom Tasks that need something of this area: a rack prepared, or a slot
// cleared. Shown here because this is the page the warehouse staff work
// from, and the only one where they can act on it.
const notices = ref<WarehouseNotice[]>([])
const MAX_NOTICES = 20
// The server re-sends a "running" notice on every status update for the
// same task; only the first of each kind is worth showing.
const seenNotices = new Set<string>()

function playSound(src: string) {
  try {
    // Browsers block audio until the page has been interacted with, and
    // that rejection is expected rather than a fault — the notice is still
    // on screen either way.
    void new Audio(src).play().catch(() => {})
  } catch {
    // No Audio support at all; the visual notice stands on its own.
  }
}

function playNoticeSound(notice: WarehouseNotice) {
  const src = warehouseNoticeSound(notice)
  if (src) playSound(src)
}

useWarehouseNotices((notice) => {
  const key = `${notice.orderId}:${notice.kind}`
  if (seenNotices.has(key)) return
  seenNotices.add(key)

  // A task's later notice answers its earlier one — "no rack ready" stops
  // being true once the AMR is on its way. Dropping the answered one keeps
  // the list to things still outstanding.
  const obsolete = supersededKinds(notice.kind)
  notices.value = [
    notice,
    ...notices.value.filter(
      n => !(n.orderId === notice.orderId && obsolete.includes(n.kind)),
    ),
  ].slice(0, MAX_NOTICES)

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

function clearNotices() {
  notices.value = []
}

const urgentCount = computed(
  () => notices.value.filter(isWarehouseNoticeUrgent).length,
)

function noticeTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false })
}

// ---- Line status board --------------------------------------------------
// What each production line is saying about itself, from the four buttons
// at the foot of its group in Custom Task. Unlike the warehouse notices
// above, this is state rather than events: it is fetched on load, so a
// screen switched on mid-shift already knows WRL31 is running LH.
const lineStatuses = ref<LineStatus[]>([])
// Which announcements this screen has already rung for, so a refetch
// triggered by something else does not sound the alarm a second time for
// the same press. Keyed by line and timestamp — a new press of the SAME
// button updates `at`, and that is a real repeat worth hearing.
const heardLineStatuses = new Set<string>()
const clearingLine = ref<string | null>(null)

// Nothing rings on the first read. Those announcements were made before
// this screen was even switched on, and opening the page to four alarms
// would teach the floor to ignore the sound by the end of the shift.
let boardLoaded = false

async function loadLineStatuses() {
  try {
    const items = await fetchLineStatuses()
    lineStatuses.value = items
    for (const status of items) {
      const key = `${status.groupName}:${status.at}`
      if (heardLineStatuses.has(key)) continue
      heardLineStatuses.add(key)
      if (boardLoaded && isLineStatusActionable(status.kind)) {
        playSound('/ringtone/amr.wav')
      }
    }
    boardLoaded = true
  } catch {
    // Non-fatal — the bin grid below is the page's real job, and a failed
    // board read must not take it down with it.
  }
}

async function dismissLineStatus(groupName: string) {
  if (clearingLine.value) return
  clearingLine.value = groupName
  try {
    await clearLineStatus(groupName)
    lineStatuses.value = lineStatuses.value.filter(
      status => status.groupName !== groupName,
    )
  } catch {
    // Left on screen on purpose: it is still true on the server, and
    // hiding it here would only disagree with the next refetch.
  } finally {
    clearingLine.value = null
  }
}

onMounted(() => loadLineStatuses())
useRealtime('line-status', () => loadLineStatuses())

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
  const code = selected.value.iRaypleLocationCode
  const ok = await correctBin(code, status)
  submitting.value = false
  if (!ok) return

  // Setting the bin right is the answer to whatever was being asked about
  // that node, so those notices go with it. The "AMR on its way" ones stay
  // — correcting a bin does not stop a robot that is already moving.
  notices.value = notices.value.filter(
    n => !(n.nodeCode === code && isWarehouseNoticeActionable(n)),
  )

  // Re-read rather than patching locally: RCS is the source of truth, and
  // this confirms it really took the change.
  await fetchRows(null, { silent: true })
}

// "full" and "empty" are RCS's words, and on the floor they read as the
// opposite of what they mean: a full bin is one with an empty rack standing
// ready. The wording is an admin setting so it can be said the way the
// people using it say it — see App Settings.
const { settings, load: loadSettings, binLabel } = useAppSettings()
onMounted(() => loadSettings())
useRealtime('settings', () => loadSettings({ force: true }))

/** Which of the four states a node is in — the one place that decides. */
type BinTone = 'finishGood' | 'full' | 'empty' | 'unknown'

function toneOf(row: CheckingAreaRow): BinTone {
  if (row.hasFinishGood) return 'finishGood'
  if (row.stockStatus === 'FULL') return 'full'
  if (row.stockStatus === 'EMPTY') return 'empty'
  return 'unknown'
}

// Colour carries the status, so the grid reads as a board rather than a
// list of names. Kept as whole class strings because Tailwind only keeps
// classes it can see written out.
const TONE_BUTTON: Record<BinTone, string> = {
  finishGood: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  full: 'border-amber-300 bg-amber-50 text-amber-700',
  empty: 'border-sky-200 bg-sky-50 text-sky-700',
  unknown: 'border-[#E2E8F0] bg-white text-slate-400',
}

const TONE_TEXT: Record<BinTone, string> = {
  finishGood: 'text-emerald-600',
  full: 'text-amber-600',
  empty: 'text-sky-600',
  unknown: 'text-slate-400',
}

const TONE_DOT: Record<BinTone, string> = {
  finishGood: 'bg-emerald-500',
  full: 'bg-amber-500',
  empty: 'bg-sky-400',
  unknown: 'bg-slate-300',
}

function rowLabel(row: CheckingAreaRow): string {
  return binLabel(row.stockStatus, row.hasFinishGood)
}

const statusLabel = computed(() =>
  selected.value ? rowLabel(selected.value) : '—',
)

const statusClass = computed(() =>
  selected.value ? TONE_TEXT[toneOf(selected.value)] : 'text-slate-400',
)

// The legend doubles as a count, which is what someone walking in wants to
// know first: how many racks are waiting on them.
const legend = computed(() => {
  const counts: Record<BinTone, number> = {
    finishGood: 0,
    full: 0,
    empty: 0,
    unknown: 0,
  }
  for (const row of items.value) counts[toneOf(row)] += 1
  return [
    { tone: 'full' as const, label: settings.value['bin.label.full'], count: counts.full },
    { tone: 'empty' as const, label: settings.value['bin.label.empty'], count: counts.empty },
    { tone: 'finishGood' as const, label: settings.value['bin.label.finishGood'], count: counts.finishGood },
    { tone: 'unknown' as const, label: 'Unknown', count: counts.unknown },
  ].filter(entry => entry.count > 0)
})
</script>

<template>
  <!-- Wider than the old single column: the point of the grid is that the
       whole area is visible at once, and on a desktop that is many more
       buttons per row. -->
  <div class="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-0">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-[#0F1F52] sm:text-2xl">Checking Area</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Tap a storage to see what RCS believes it holds, and correct it.
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

    <!-- What each line is saying about itself. Above the warehouse
         notices because it is standing state rather than a stream of
         events: the board answers "where is every line right now", and
         burying that under the newest task notice would mean scrolling
         for it. Full-width colour bars, blue for LH and red for RH, so
         the side reads from across the warehouse without reading words. -->
    <div v-if="lineStatuses.length > 0" class="space-y-2">
      <div
        v-for="status in lineStatuses"
        :key="status.groupName"
        class="flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm"
        :style="{ backgroundColor: lineStatusColor(status.kind) }"
      >
        <p class="min-w-0 flex-1 break-words text-center text-sm font-extrabold uppercase leading-tight tracking-wide text-white sm:text-base">
          {{ lineStatusBoardText(status.groupName, status.kind) }}
        </p>
        <span class="shrink-0 text-[11px] font-semibold text-white/80">
          {{ noticeTime(status.at) }}
        </span>
        <!-- Clearing is a correction, not an acknowledgement: it deletes
             the line's current state, so it sits behind the same
             permission as correcting a bin. -->
        <button
          v-if="hasPermission('checking-area.update')"
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40"
          :disabled="clearingLine !== null"
          :aria-label="`Clear ${status.groupName}`"
          @click="dismissLineStatus(status.groupName)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Warehouse notices. Above the grid on purpose: they are the reason
         someone opens this page in a hurry, and the held ones are asking
         for something to be done right now.

         Boxed and scrolled rather than listed in full: a busy shift can
         raise a dozen, and an unbounded list would push the node buttons
         off the screen entirely. Three are visible, newest first, and the
         count says how many are behind them. -->
    <div v-if="notices.length > 0" class="rounded-2xl border border-[#E2E8F0] bg-white p-3">
      <div class="mb-2 flex items-center justify-between gap-2 px-1">
        <p class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#0F1F52]">
          Notifikasi
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-bold"
            :class="urgentCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ notices.length }}
          </span>
        </p>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          @click="clearNotices"
        >
          Hapus semua
        </button>
      </div>

      <!-- Height of roughly three cards, so the fourth peeks out and the
           list is visibly scrollable rather than looking truncated. -->
      <div class="max-h-72 space-y-2 overflow-y-auto pr-1">
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
    </div>

    <!-- Legend and tally in one. Only the states actually present are
         listed, so it does not grow into four rows that mean nothing. -->
    <div v-if="legend.length > 0" class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span
        v-for="entry in legend"
        :key="entry.tone"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        <span class="h-2 w-2 shrink-0 rounded-full" :class="TONE_DOT[entry.tone]" />
        {{ entry.label }}
        <span class="font-bold text-[#0F1F52]">{{ entry.count }}</span>
      </span>
    </div>

    <p v-if="loading && items.length === 0" class="py-12 text-center text-sm text-slate-400">
      Loading…
    </p>

    <p
      v-else-if="items.length === 0"
      class="rounded-2xl border border-dashed border-[#E2E8F0] py-12 text-center text-sm text-slate-400"
    >
      No warehouse locations configured.
    </p>

    <!-- Two to a row on a phone: wide enough for a gloved thumb, and wide
         enough to carry the storage name under the code rather than making
         the operator match bare codes. -->
    <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      <button
        v-for="row in items"
        :key="row.id"
        type="button"
        class="rounded-xl border px-2 py-2.5 text-center transition-all active:scale-[0.97]"
        :class="[
          TONE_BUTTON[toneOf(row)],
          selectedId === row.id ? 'ring-2 ring-[#01ADEF] ring-offset-1' : '',
        ]"
        :title="`${row.name} — ${rowLabel(row)}`"
        @click="selectRow(row)"
      >
        <span class="block truncate font-mono text-xs font-bold leading-tight">
          {{ row.iRaypleLocationCode }}
        </span>
        <!-- Only when it adds something: in this data the name is often
             the code repeated, and printing it twice helps nobody. -->
        <span
          v-if="row.name !== row.iRaypleLocationCode"
          class="mt-0.5 block truncate text-[10px] font-medium opacity-70"
        >
          {{ row.name }}
        </span>
      </button>
    </div>

    <!-- The detail panel only exists once something is chosen, so the
         action buttons can never be tapped against nothing. -->
    <template v-if="selected">
      <UiBaseCard class="space-y-3">
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
          <span class="font-semibold" :class="statusClass">{{ statusLabel }}</span>
        </div>
      </UiBaseCard>

      <template v-if="hasPermission('checking-area.update')">
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

      <p v-else class="text-center text-xs font-medium text-slate-400">
        You do not have permission to change bin status.
      </p>
    </template>
  </div>
</template>
