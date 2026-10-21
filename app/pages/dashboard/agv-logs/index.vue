<script setup lang="ts">
import { fetchAgvDeviceCodes, fetchAgvLogs } from '~/services/agv-log.service'
import type { AgvLog, AgvLogListMeta } from '~/types/agv-log'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'ICS AGV Logs — YAZAKI' })

// Raw AGV reports RCS pushes to POST /agv-logs. Deliberately shows the
// payload verbatim rather than mapping it into columns: the shape varies by
// report type, and the reason to open this page is usually to find out what
// RCS actually sent.
const items = ref<AgvLog[]>([])
const meta = ref<AgvLogListMeta>({ page: 1, limit: 25, total: 0, totalPages: 0 })
const deviceCodes = ref<string[]>([])
const loading = ref(false)

const deviceFilter = ref('')
const dateFilter = ref('')
const page = ref(1)
const limit = ref(25)

const payloadOpen = ref(false)
const payloadTitle = ref('')
const payloadData = ref<Record<string, unknown> | null>(null)

async function load(options: { silent?: boolean } = {}) {
  if (!options.silent) loading.value = true
  try {
    const result = await fetchAgvLogs({
      page: page.value,
      limit: limit.value,
      deviceCode: deviceFilter.value || undefined,
      date: dateFilter.value || undefined,
    })
    items.value = result.items
    meta.value = result.meta
  } catch {
    // Non-fatal — the table keeps what it last showed.
  }
  loading.value = false
}

async function loadDeviceCodes() {
  try {
    deviceCodes.value = await fetchAgvDeviceCodes()
  } catch {
    // Non-fatal — the dropdown just stays as it was.
  }
}

onMounted(async () => {
  await Promise.all([load(), loadDeviceCodes()])
})

// Pushed from the server instead of polled — see useRealtime. Silent so a
// report arriving does not blank the table the operator is reading.
useRealtime('agv-logs', () => load({ silent: true }))

function applyFilters() {
  page.value = 1
  load()
}

function goToPage(next: number) {
  page.value = next
  load()
}

function handleLimitChange(next: number) {
  limit.value = next
  page.value = 1
  load()
}

function openPayload(log: AgvLog, which: 'request' | 'response') {
  payloadTitle.value = which === 'request'
    ? `Request — ${log.deviceCode ?? 'unknown device'}`
    : `Response — ${log.deviceCode ?? 'unknown device'}`
  payloadData.value = which === 'request' ? log.requestPayload : log.responsePayload
  payloadOpen.value = true
}

// RCS has been seen sending field names with trailing spaces
// ("deviceName "), which read as undefined under the plain name. Every
// lookup into a payload goes through this.
function field(payload: Record<string, unknown>, name: string): string | null {
  for (const [key, value] of Object.entries(payload)) {
    if (key.trim() !== name) continue
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return null
}

/** The human-readable name, when the report carries one separate from the code. */
function deviceName(log: AgvLog): string | null {
  const name = field(log.requestPayload, 'deviceName')
  return name && name !== log.deviceCode ? name : null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { hour12: false })
}

/** A short, one-line hint of the payload so the row is scannable. */
function preview(payload: Record<string, unknown>) {
  const text = JSON.stringify(payload)
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

const controlClass
  = 'rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">ICS AGV Logs</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        Raw AGV reports received from RCS, newest first
      </p>
    </div>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <select v-model="deviceFilter" :class="controlClass" @change="applyFilters">
        <option value="">All devices</option>
        <option v-for="code in deviceCodes" :key="code" :value="code">{{ code }}</option>
      </select>
      <input v-model="dateFilter" type="date" :class="controlClass" @change="applyFilters">
      <button
        v-if="deviceFilter || dateFilter"
        type="button"
        class="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
        @click="deviceFilter = ''; dateFilter = ''; applyFilters()"
      >
        Clear
      </button>
    </div>

    <UiBaseCard padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3 font-semibold">Received</th>
              <th class="px-5 py-3 font-semibold">Device</th>
              <th class="px-5 py-3 font-semibold">Payload</th>
              <th class="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && items.length === 0">
              <td colspan="4" class="px-5 py-10 text-center text-slate-400">Loading…</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="4" class="px-5 py-10 text-center text-slate-400">
                No AGV reports received yet
              </td>
            </tr>
            <tr
              v-for="log in items"
              v-else
              :key="log.id"
              class="border-b border-[#F1F5F9] last:border-0 hover:bg-slate-50/60"
            >
              <td class="whitespace-nowrap px-5 py-3 font-medium text-[#0F1F52]">
                {{ formatTime(log.createdAt) }}
              </td>
              <td class="whitespace-nowrap px-5 py-3">
                <template v-if="log.deviceCode">
                  <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#01ADEF]">
                    {{ log.deviceCode }}
                  </span>
                  <!-- Only when the report names the device separately from
                       its code; otherwise the chip above already says it. -->
                  <span v-if="deviceName(log)" class="ml-2 text-xs text-slate-500">
                    {{ deviceName(log) }}
                  </span>
                </template>
                <span v-else class="text-xs text-slate-400">—</span>
              </td>
              <td class="px-5 py-3 font-mono text-xs text-slate-500">
                {{ preview(log.requestPayload) }}
              </td>
              <td class="whitespace-nowrap px-5 py-3">
                <button
                  type="button"
                  class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0F1F52] transition-colors hover:bg-slate-200"
                  @click="openPayload(log, 'request')"
                >
                  Request
                </button>
                <button
                  type="button"
                  class="ml-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0F1F52] transition-colors hover:bg-slate-200"
                  @click="openPayload(log, 'response')"
                >
                  Response
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiBaseCard>

    <UiBasePagination
      v-if="meta.total > 0"
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="AGV reports"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <!-- Same viewer the Webhook Logs page uses, so both read identically. -->
    <UiJsonPayloadModal
      v-model="payloadOpen"
      :title="payloadTitle"
      :payload="payloadData"
    />
  </div>
</template>
