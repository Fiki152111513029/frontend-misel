<script setup lang="ts">
const { isDark } = useTheme()

// Performance
interface StatusItem { label: string, value: number, color: string }
const statuses = ref<StatusItem[]>([
  { label: 'Completed', value: 90, color: '#014091' },
  { label: 'In progress', value: 60, color: '#F6AE2D' },
  { label: 'Not Start', value: 10, color: '#0991F3' },
  { label: 'Cancelled', value: 10, color: '#F78B0F' },
  { label: 'Failed', value: 10, color: '#EF4444' },
])
const total = computed(() => statuses.value.reduce((sum, status) => sum + status.value, 0))
function percentOf(value: number) {
  return total.value === 0 ? 0 : Math.round((value / total.value) * 100)
}
const series = computed(() => [{ name: 'Tasks', data: statuses.value.map(status => status.value) }])
const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
  colors: statuses.value.map(status => status.color),
  labels: statuses.value.map(status => status.label),
  xaxis: {
    categories: statuses.value.map(status => status.label),
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { show: false } },
  grid: { show: false, padding: { left: 0, right: 0 } },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))

// Abnormality
interface ZoneError { label: string, percent: number }
const zones: ZoneError[] = [
  { label: 'Zone A (Storage)', percent: 12 },
  { label: 'Zone B (Packaging)', percent: 48 },
  { label: 'Zone C (Docking)', percent: 22 },
]
function barColor(percent: number) {
  if (percent >= 40) return 'bg-red-500'
  if (percent >= 20) return 'bg-[#01ADEF]'
  return 'bg-[#2F6FED]'
}

// Charger Status
interface ChargerHub { id: string, unit: string | null, battery: number | null }
const hubs: ChargerHub[] = [
  { id: 'HUB-01', unit: 'AMR-14', battery: 92 },
  { id: 'HUB-02', unit: null, battery: null },
  { id: 'HUB-03', unit: 'AMR-02', battery: 24 },
  { id: 'HUB-04', unit: null, battery: null },
]

// Request Queue
interface QueueRequest { id: string, title: string, route: string, eta: string }
const requests: QueueRequest[] = [
  { id: 'REQ-902', title: 'Pick-up: Pallete #902', route: 'DOCK 4 → ZONE B', eta: '02:14m' },
  { id: 'REQ-A1', title: 'Drop-off: Raw Mat-A', route: 'STORAGE → LINE 12', eta: '05:40m' },
]
</script>

<template>
  <div
    class="flex h-[460px] flex-col overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white transition-colors duration-200 2xl:h-[600px]"
  >
    <!-- Performance -->
    <section class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-semibold text-[#0F1F52]">Performance</p>
          <p class="font-medium mt-0.5 text-xs text-slate-400">Today</p>
        </div>
        <p class="text-xs font-medium text-slate-400">TOTAL : {{ total }}</p>
      </div>

      <div class="mt-3">
        <ClientOnly>
          <apexchart type="bar" :series="series" :options="chartOptions" height="130" />
          <template #fallback>
            <div class="flex h-[130px] items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        <div v-for="status in statuses" :key="status.label" class="flex items-center gap-2 text-xs">
          <span class="h-2.5 w-2.5 flex-shrink-0 rounded-sm" :style="{ backgroundColor: status.color }" />
          <span class="text-slate-500">{{ status.label }}</span>
          <span class="ml-auto text-slate-400">{{ percentOf(status.value) }}%</span>
          <span class="w-5 text-right font-medium text-[#0F1F52]">{{ status.value }}</span>
        </div>
      </div>
    </section>

    <!-- Abnormality -->
    <section class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-semibold text-[#0F1F52]">Abnormality</p>
          <p class="font-medium mt-0.5 text-xs text-slate-400">Error density by zone</p>
        </div>
        <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <div class="mt-4 space-y-4">
        <div v-for="zone in zones" :key="zone.label">
          <div class="mb-1.5 flex items-center justify-between text-xs">
            <span class="text-slate-500">{{ zone.label }}</span>
            <span class="font-medium text-[#0F1F52]">{{ zone.percent }}%</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="barColor(zone.percent)"
              :style="{ width: `${zone.percent}%` }"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Charger Status -->
    <section class="border-b border-[#E2E8F0] p-5">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-[#0F1F52]">Charger Status</p>
        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {{ hubs.length }} Slots Total
        </span>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
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
    </section>

    <!-- Request Queue -->
    <section class="p-5">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-[#0F1F52]">Request Queue</p>
        <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {{ requests.length }} Pending
        </span>
      </div>

      <div class="mt-3 divide-y divide-[#E2E8F0]">
        <div v-for="request in requests" :key="request.id" class="flex items-center gap-3 py-3">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0F1F52]/10 text-[#0F1F52]">
            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.75h16.5M3.75 9.75v8.25A2.25 2.25 0 006 20.25h12a2.25 2.25 0 002.25-2.25V9.75M3.75 9.75L5.7 4.5h12.6l1.95 5.25" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-[#0F1F52]">{{ request.title }}</p>
            <p class="font-medium text-xs text-slate-400">{{ request.route }}</p>
          </div>
          <span class="flex-shrink-0 text-xs font-medium text-slate-400">{{ request.eta }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
