<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  type: 'area' | 'line' | 'bar' | 'donut'
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  categories?: string[]
  colors?: string[]
  labels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#01ADEF'],
  categories: () => [],
})

const { isDark } = useTheme()

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: props.type,
    background: 'transparent',
    toolbar: { show: false },
    sparkline: { enabled: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  colors: props.colors,
  fill: props.type === 'area' ? {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
  } : {},
  stroke: { curve: 'smooth', width: props.type === 'bar' ? 0 : 2.5 },
  grid: {
    borderColor: isDark.value ? '#1E293B' : '#E2E8F0',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
  },
  xaxis: {
    categories: props.categories.length ? props.categories : months,
    labels: {
      style: { colors: isDark.value ? '#64748B' : '#94A3B8', fontSize: '11px' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { colors: isDark.value ? '#64748B' : '#94A3B8', fontSize: '11px' },
      formatter: (val: number) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)),
    },
  },
  dataLabels: { enabled: false },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    x: { show: true },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: isDark.value ? '#94A3B8' : '#64748B' },
    fontSize: '12px',
  },
  plotOptions: props.type === 'bar' ? {
    bar: { borderRadius: 6, columnWidth: '55%' },
  } : props.type === 'donut' ? {
    pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', color: isDark.value ? '#F8FAFC' : '#0F172A' } } } },
  } : {},
  labels: props.labels ?? [],
}))
</script>

<template>
  <UiBaseCard padding="none" class="flex flex-col">
    <div class="border-b border-[#E2E8F0] px-6 py-4">
      <p class="font-semibold text-[#0F1F52]">{{ title }}</p>
      <p v-if="subtitle" class="font-medium mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
    </div>
    <div class="p-4">
      <ClientOnly>
        <apexchart
          :type="type"
          :series="series"
          :options="chartOptions"
          height="220"
        />
        <template #fallback>
          <div class="flex h-[220px] items-center justify-center text-slate-400 text-sm">Loading chart...</div>
        </template>
      </ClientOnly>
    </div>
  </UiBaseCard>
</template>
