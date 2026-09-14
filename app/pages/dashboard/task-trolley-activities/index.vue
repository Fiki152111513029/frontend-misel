<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolley Activities — Misel' })

// The activity list below is open to everyone with trolley-activity.read
// (Operator/Warehouse included, to see their own history) — only the
// Overview stats/charts block is Super Admin/Supervisor-only.
const { user } = useAuth()
const canSeeOverview = computed(() => user.value?.role === 'Super Admin' || user.value?.role === 'Supervisor')

const {
  items,
  meta,
  loading,
  fetchTrolleyActivities,
} = useTrolleyActivities()

const AUTO_REFRESH_MS = 60_000
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchTrolleyActivities()
  // Re-fetches the current page/filters in place — goToPage/handleLimitChange
  // already persist the active page+limit via the store, so a plain refetch
  // (no args) here keeps whatever the user is currently looking at.
  refreshTimer = setInterval(() => fetchTrolleyActivities(), AUTO_REFRESH_MS)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

function goToPage(page: number) {
  fetchTrolleyActivities({ page })
}

function handleLimitChange(limit: number) {
  fetchTrolleyActivities({ limit, page: 1 })
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Trolley Activities</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        History of every trolley task scan-and-submit — who did it, which trolley, pickup/dropping route, and duration.
      </p>
    </div>

    <TrolleyActivitiesDashboard v-if="canSeeOverview" class="mb-6" />

    <TrolleyActivitiesTable
      :items="items"
      :loading="loading"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="trolley activities"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />
  </div>
</template>
