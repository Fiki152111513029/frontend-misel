<script setup lang="ts">
import type { TrolleyActivityDashboardStats } from '~/types/trolley-activity'

const { fetchTrolleyActivityDashboard } = useTrolleyActivities()

const days = ref(7)
const stats = ref<TrolleyActivityDashboardStats | null>(null)
const loading = ref(false)

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
]

async function load() {
  loading.value = true
  stats.value = await fetchTrolleyActivityDashboard(days.value)
  loading.value = false
}

onMounted(load)
watch(days, load)

function formatSeconds(seconds: number | null) {
  if (seconds === null) return '-'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return `${minutes}m ${remainder}s`
}

const STAT_CARDS = [
  { key: 'total' as const, label: 'Total', accent: 'text-[#0F1F52]', bg: 'bg-slate-50' },
  { key: 'completed' as const, label: 'Completed', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'pending' as const, label: 'Pending', accent: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'inProgress' as const, label: 'In Progress', accent: 'text-[#01ADEF]', bg: 'bg-sky-50' },
  { key: 'failed' as const, label: 'Failed', accent: 'text-red-600', bg: 'bg-red-50' },
]

const dailyTrendCategories = computed(() =>
  (stats.value?.dailyTrend ?? []).map(d =>
    new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  ),
)
const dailyTrendSeries = computed(() => [
  { name: 'Completed', data: (stats.value?.dailyTrend ?? []).map(d => d.completed) },
  { name: 'Failed', data: (stats.value?.dailyTrend ?? []).map(d => d.failed) },
])

const statusDonutLabels = ['Pending', 'In Progress', 'Completed', 'Failed']
const statusDonutColors = ['#F6AE2D', '#01ADEF', '#10B981', '#EF4444']
const statusDonutSeries = computed(() => {
  const t = stats.value?.totals
  return t ? [t.pending, t.inProgress, t.completed, t.failed] : [0, 0, 0, 0]
})
</script>


<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-[#0F1F52]">Overview</h2>
        <p class="font-medium text-xs text-slate-500">Aggregated stats over the selected range</p>
      </div>
      <div class="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          v-for="option in RANGE_OPTIONS"
          :key="option.value"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="days === option.value ? 'bg-white text-[#0F1F52] shadow-sm' : 'text-slate-500 hover:text-[#0F1F52]'"
          @click="days = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="loading && !stats" class="flex h-32 items-center justify-center text-sm text-slate-400">
      Loading dashboard...
    </div>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-7">
        <div
          v-for="card in STAT_CARDS"
          :key="card.key"
          class="rounded-2xl border border-[#E2E8F0] p-4"
          :class="card.bg"
        >
          <p class="font-medium text-xs text-slate-500">{{ card.label }}</p>
          <p class="mt-1 text-2xl font-extrabold" :class="card.accent">{{ stats.totals[card.key] }}</p>
        </div>
        <div class="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <p class="font-medium text-xs text-slate-500">Avg Duration</p>
          <p class="mt-1 text-2xl font-extrabold text-[#0F1F52]">{{ formatSeconds(stats.avgDurationSeconds) }}</p>
        </div>
        <div class="col-span-2 rounded-2xl border border-[#E2E8F0] bg-indigo-50 p-4 md:col-span-1">
          <p class="font-medium text-xs text-slate-500">Active Operators</p>
          <p class="mt-1 text-2xl font-extrabold text-[#4338CA]">{{ stats.activeOperators }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="xl:col-span-2">
          <DashboardAnalyticsChart
            title="Daily Trend"
            subtitle="Completed vs Failed trolley tasks"
            type="bar"
            :series="dailyTrendSeries"
            :categories="dailyTrendCategories"
            :colors="['#10B981', '#EF4444']"
          />
        </div>
        <DashboardAnalyticsChart
          title="Status Breakdown"
          :subtitle="`${stats.totals.total} total activities`"
          type="donut"
          :series="statusDonutSeries"
          :labels="statusDonutLabels"
          :colors="statusDonutColors"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UiBaseCard v-if="stats.topOperators.length" padding="none">
          <div class="border-b border-[#E2E8F0] px-6 py-4">
            <p class="font-semibold text-[#0F1F52]">Top Operators</p>
            <p class="font-medium mt-0.5 text-xs text-slate-500">By completed trolley tasks</p>
          </div>
          <div class="divide-y divide-[#E2E8F0]">
            <div
              v-for="(operator, index) in stats.topOperators"
              :key="operator.userId"
              class="flex items-center gap-3 px-6 py-3"
            >
              <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {{ index + 1 }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[#0F1F52]">{{ operator.fullName }}</p>
                <p class="font-medium text-xs text-slate-400">Avg {{ formatSeconds(operator.avgDurationSeconds) }}</p>
              </div>
              <span class="flex-shrink-0 text-sm font-bold text-[#0F1F52]">{{ operator.completedCount }}</span>
            </div>
          </div>
        </UiBaseCard>

        <UiBaseCard padding="none">
          <div class="border-b border-[#E2E8F0] px-6 py-4">
            <p class="font-semibold text-[#0F1F52]">Busiest Locations</p>
            <p class="font-medium mt-0.5 text-xs text-slate-500">Pickup + dropping combined</p>
          </div>
          <div v-if="stats.topLocations.length" class="divide-y divide-[#E2E8F0]">
            <div
              v-for="location in stats.topLocations"
              :key="location.code"
              class="flex items-center justify-between px-6 py-3"
            >
              <p class="text-sm font-medium text-[#0F1F52]">{{ location.code }}</p>
              <span class="text-sm font-bold text-[#0F1F52]">{{ location.count }}</span>
            </div>
          </div>
          <p v-else class="px-6 py-8 text-center text-sm text-slate-400">No activity in this range yet</p>
        </UiBaseCard>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TrolleyActivitiesOperatorDurationChart
          direction="WAREHOUSE"
          title="Yamazumi Dealer Operator"
          subtitle="Total task-handling time per operator — pickup from Warehouse node"
        />
        <TrolleyActivitiesOperatorDurationChart
          direction="PRODUCTION"
          title="Yamazumi Supply Operator"
          subtitle="Total task-handling time per operator — pickup from Production node"
        />
      </div>

      <TrolleyActivitiesTrolleyFrequencyChart />
    </template>
  </div>
</template>
