<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'ICS Alarm Logs — Misel' })

const { fetchAlarms } = useRobotAlarms()
const items = ref<Awaited<ReturnType<typeof fetchAlarms>>['items']>([])
const meta = ref<Awaited<ReturnType<typeof fetchAlarms>>['meta']>({ total: 0, page: 1, limit: 10, totalPages: 0 })
const loading = ref(false)

async function load(query?: { page?: number, limit?: number }) {
  // Only show the loading state on a genuine first load (or when jumping
  // page/limit) — this page is polled every 5s for auto-refresh, and
  // re-blanking the table on every tick would flash distractingly instead
  // of just swapping in fresh rows. Same convention as useWebhookLogsStore.
  if (items.value.length === 0 || query) loading.value = true
  const result = await fetchAlarms({ page: meta.value.page, limit: meta.value.limit, ...query })
  items.value = result.items
  meta.value = result.meta
  loading.value = false
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  load()
  refreshTimer = setInterval(() => load(), 5000)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

function goToPage(page: number) {
  load({ page })
}

function handleLimitChange(limit: number) {
  load({ limit, page: 1 })
}
</script>

<template>
  <IcsLogsPasswordGate title="ICS Alarm Logs">
    <div class="animate-fade-in space-y-4">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">ICS Alarm Logs</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Every device alarm RCS has reported — device offline, etc. Kept for 7 days, then purged automatically.
        </p>
      </div>

      <UiBaseCard padding="none">
        <p class="font-medium border-b border-[#E2E8F0] px-5 py-3.5 text-sm text-slate-500">
          {{ meta.total }} record(s) found
        </p>

        <RobotAlarmsTable :items="items" :loading="loading" />
      </UiBaseCard>

      <UiBasePagination
        v-if="meta.total > 0"
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total="meta.total"
        :limit="meta.limit"
        item-label="alarms"
        @update:page="goToPage"
        @update:limit="handleLimitChange"
      />
    </div>
  </IcsLogsPasswordGate>
</template>
