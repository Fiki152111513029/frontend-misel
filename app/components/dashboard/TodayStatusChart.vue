<script setup lang="ts">
interface StatusItem {
  label: string
  value: number
  color: string
}

const { isDark } = useTheme()

const statuses = ref<StatusItem[]>([
  { label: 'Completed', value: 90, color: '#2F6FED' },
  { label: 'In progress', value: 60, color: '#FACC15' },
  { label: 'Not Start', value: 0, color: '#8B93F7' },
  { label: 'Cancelled', value: 0, color: '#DCE6F5' },
  { label: 'Failed', value: 0, color: '#EF4444' },
])

const total = computed(() => statuses.value.reduce((sum, status) => sum + status.value, 0))

function percentOf(value: number) {
  return total.value === 0 ? 0 : Math.round((value / total.value) * 100)
}

const series = computed(() => [{ name: 'Tasks', data: statuses.value.map(status => status.value) }])

const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '55%',
      distributed: true,
    },
  },
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
</script>

<template>
  <UiBaseCard padding="md">
    <div class="flex items-start justify-between">
      <div>
        <p class="font-semibold text-[#0F1F52]">Performance</p>
        <p class="font-medium mt-0.5 text-xs text-slate-400">Today</p>
      </div>
      <p class="text-xs font-medium text-slate-400">TOTAL : {{ total }}</p>
    </div>

    <div class="mt-3">
      <ClientOnly>
        <apexchart type="bar" :series="series" :options="chartOptions" height="150" />
        <template #fallback>
          <div class="flex h-[150px] items-center justify-center text-sm text-slate-400">
            Loading chart...
          </div>
        </template>
      </ClientOnly>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
      <div
        v-for="status in statuses"
        :key="status.label"
        class="flex items-center gap-2 text-xs"
      >
        <span class="h-2.5 w-2.5 flex-shrink-0 rounded-sm" :style="{ backgroundColor: status.color }" />
        <span class="text-slate-500">{{ status.label }}</span>
        <span class="ml-auto text-slate-400">{{ percentOf(status.value) }}%</span>
        <span class="w-5 text-right font-medium text-[#0F1F52]">{{ status.value }}</span>
      </div>
    </div>
  </UiBaseCard>
</template>
