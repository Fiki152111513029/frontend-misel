<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolley Activities — Misel' })

const {
  items,
  meta,
  loading,
  fetchTrolleyActivities,
} = useTrolleyActivities()

onMounted(() => {
  fetchTrolleyActivities()
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
