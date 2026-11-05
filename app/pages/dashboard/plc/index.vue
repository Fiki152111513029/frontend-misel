<script setup lang="ts">
import { Cpu, Plus, RefreshCw, TriangleAlert, Wifi, WifiOff } from 'lucide-vue-next'
import { fetchPlcLive } from '~/services/plc.service'
import type { PlcDeviceSnapshot, PlcTagValue } from '~/types/plc'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'PLC Monitor — YAZAKI' })

// Live values from every Modbus device, as the server's poller reads them.
//
// The browser never speaks Modbus and never polls: one REST read on mount
// for what is already known, then the socket pushes each device's snapshot
// whenever one of its values moves. A PLC has far less headroom for extra
// connections than a web server does, so the number of people watching
// must not change the load on it — same reasoning as the robot map.
const { hasPermission } = useAuth()

const snapshots = ref<PlcDeviceSnapshot[]>([])
const loading = ref(true)
const loadedAt = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    snapshots.value = await fetchPlcLive()
    loadedAt.value = new Date().toISOString()
  } catch {
    // The socket is the live path; a failed first read leaves the page
    // empty until the next push rather than showing an error the operator
    // cannot act on.
    snapshots.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

// Replace the one device that changed, leave the rest untouched. A device
// that has been quiet keeps the values it last reported instead of
// flickering out while another one updates.
const { connected } = usePlcValues((snapshot) => {
  const index = snapshots.value.findIndex(s => s.deviceId === snapshot.deviceId)
  if (index === -1) snapshots.value = [...snapshots.value, snapshot]
  else snapshots.value.splice(index, 1, snapshot)
  loadedAt.value = snapshot.at
})

// A device or tag was added, edited or removed, so the shape of the page
// changed rather than just its numbers.
useRealtime('plc', load)

const ordered = computed(() =>
  [...snapshots.value].sort((a, b) => a.deviceName.localeCompare(b.deviceName)),
)

const anyDisconnected = computed(() =>
  snapshots.value.some(snapshot => !snapshot.connected),
)

/**
 * A bit is worth reading as a word, not a number.
 *
 * On a PLC these are the ones an operator actually acts on — "rack full",
 * "door open" — and 1 is a poor way to say yes.
 */
function displayValue(value: PlcTagValue): string {
  if (value.value === null) return '—'
  if (value.dataType === 'BOOL' || value.registerType === 'COIL'
    || value.registerType === 'DISCRETE_INPUT') {
    return value.value ? 'ON' : 'OFF'
  }
  return String(value.value)
}

function isBit(value: PlcTagValue): boolean {
  return value.dataType === 'BOOL' || value.registerType === 'COIL'
    || value.registerType === 'DISCRETE_INPUT'
}

function valueClass(value: PlcTagValue): string {
  if (value.error) return 'text-red-500'
  if (value.value === null) return 'text-slate-300'
  if (isBit(value)) {
    return value.value ? 'text-emerald-600' : 'text-slate-400'
  }
  return 'text-[#0F1F52]'
}

function clockTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false })
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">PLC Monitor</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Live values read from the factory PLCs over Modbus TCP
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Whether the page is actually live, said plainly. A frozen
             number and a disconnected socket look identical otherwise. -->
        <span
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
          :class="connected
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-amber-50 text-amber-600'"
        >
          <component :is="connected ? Wifi : WifiOff" class="h-3.5 w-3.5" />
          {{ connected ? 'Live' : 'Reconnecting…' }}
        </span>

        <button
          type="button"
          class="rounded-xl border border-[#E2E8F0] bg-white p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-[#0F1F52]"
          aria-label="Refresh"
          @click="load"
        >
          <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
        </button>

        <NuxtLink
          v-if="hasPermission('plc.create')"
          to="/dashboard/plc-devices"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        >
          <Plus class="h-4 w-4" />
          Devices
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="anyDisconnected"
      class="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p class="text-sm font-medium text-amber-900">
        One or more devices are not answering. Their last known values are
        still shown below — check the message on the device card.
      </p>
    </div>

    <p v-if="loading && ordered.length === 0" class="py-16 text-center text-sm text-slate-400">
      Loading…
    </p>

    <!-- Nothing configured yet is the normal first state here, not a fault:
         the register map is site-specific and has to be entered by hand. -->
    <UiBaseCard v-else-if="ordered.length === 0" class="py-14 text-center">
      <Cpu class="mx-auto h-10 w-10 text-slate-300" />
      <p class="mt-3 font-semibold text-[#0F1F52]">No PLC data yet</p>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Add a Modbus device with its IP address, then add the tags from your
        PLC tag list. Values appear here as soon as the first read succeeds.
      </p>
      <NuxtLink
        v-if="hasPermission('plc.create')"
        to="/dashboard/plc-devices"
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
      >
        <Plus class="h-4 w-4" />
        Add a device
      </NuxtLink>
    </UiBaseCard>

    <div v-else class="grid gap-4 xl:grid-cols-2">
      <UiBaseCard v-for="device in ordered" :key="device.deviceId" class="space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-[#0F1F52]">
              {{ device.deviceName }}
            </h2>
            <p class="font-mono text-xs text-slate-400">
              {{ device.host }}:{{ device.port }}
            </p>
          </div>

          <span
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="device.connected
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'"
          >
            <component :is="device.connected ? Wifi : WifiOff" class="h-3 w-3" />
            {{ device.connected ? 'Connected' : 'Offline' }}
          </span>
        </div>

        <!-- The explained message from the server, not the raw errno: a
             wrong IP and a blocked port both read as "timed out" raw. -->
        <p
          v-if="device.lastError"
          class="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
        >
          {{ device.lastError }}
        </p>

        <p
          v-if="device.values.length === 0"
          class="rounded-xl border border-dashed border-[#E2E8F0] py-8 text-center text-sm text-slate-400"
        >
          No tags configured on this device yet.
        </p>

        <div v-else class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="value in device.values"
            :key="value.tagId"
            class="rounded-xl border border-[#E2E8F0] px-3 py-2.5"
            :class="value.error ? 'border-red-200 bg-red-50/40' : 'bg-white'"
          >
            <p class="truncate text-xs font-medium text-slate-500" :title="value.name">
              {{ value.name }}
            </p>
            <p class="mt-0.5 flex items-baseline gap-1">
              <span class="text-2xl font-extrabold leading-none" :class="valueClass(value)">
                {{ displayValue(value) }}
              </span>
              <span v-if="value.unit && value.value !== null && !isBit(value)" class="text-xs font-semibold text-slate-400">
                {{ value.unit }}
              </span>
            </p>
            <p v-if="value.error" class="mt-1 text-[11px] leading-snug text-red-500">
              {{ value.error }}
            </p>
            <p v-else class="mt-1 font-mono text-[11px] text-slate-300">
              {{ value.registerType.replace('_', ' ').toLowerCase() }} {{ value.address }}
            </p>
          </div>
        </div>

        <p class="text-right text-[11px] font-medium text-slate-400">
          Last read {{ clockTime(device.at) }}
        </p>
      </UiBaseCard>
    </div>
  </div>
</template>
