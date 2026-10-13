<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolley Activities — YAZAKI'})

// The activity list below is open to everyone with trolley-activity.read
// (Operator/Warehouse included, to see their own history) — only the
// The Overview block carries figures across every operator, so it is gated
// separately from the table below it. Driven by a permission rather than a
// role name: hardcoding names meant a newly created role could never be
// given these charts without a code change, and revoking the permission in
// Role Management had no effect at all.
const { hasPermission } = useAuth()
const canSeeOverview = computed(() => hasPermission('trolley-activity.summary'))

const {
  items,
  meta,
  loading,
  fetchTrolleyActivities,
} = useTrolleyActivities()

onMounted(() => {
  fetchTrolleyActivities()
})

// Refetches the current page/filters in place — goToPage/handleLimitChange
// already persist the active page+limit via the store, so a plain refetch
// (no args) keeps whatever the user is currently looking at.

// Pushed from the server instead of polled — see useRealtime.
useRealtime('trolley-activities', () => fetchTrolleyActivities())

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
