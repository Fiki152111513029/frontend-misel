<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Robot Activity — Misel' })

const route = useRoute()
const robotId = route.params.id as string

const { robotName, items, meta, loading, fetchRobotActivity } = useRobotActivity()

const startDate = ref('')
const endDate = ref('')
const appliedStartDate = ref('')
const appliedEndDate = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

function load() {
  fetchRobotActivity(robotId, {
    page: currentPage.value,
    limit: pageSize.value,
    startDate: appliedStartDate.value || undefined,
    endDate: appliedEndDate.value || undefined,
  })
}

function applyFilter() {
  appliedStartDate.value = startDate.value
  appliedEndDate.value = endDate.value
  currentPage.value = 1
  load()
}

function resetFilter() {
  startDate.value = ''
  endDate.value = ''
  appliedStartDate.value = ''
  appliedEndDate.value = ''
  currentPage.value = 1
  load()
}

function goToPage(page: number) {
  currentPage.value = page
  load()
}

function handleLimitChange(limit: number) {
  pageSize.value = limit
  currentPage.value = 1
  load()
}

function goBack() {
  navigateTo('/dashboard/robots')
}

onMounted(load)

// New activity is recorded every time the Robots list is open elsewhere
// (5s poll) — refresh this page on the same cadence so it stays live too.
let refreshTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  refreshTimer = setInterval(load, 5000)
})
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div class="animate-fade-in space-y-4">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] transition-colors"
        aria-label="Back to Robots"
        @click="goBack"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">
          Robot Activity<span v-if="robotName"> — {{ robotName }}</span>
        </h1>
        <p class="font-medium mt-1 text-sm text-slate-500">Telemetry history for this robot</p>
      </div>
    </div>

    <UiBaseCard>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52]">Start Date</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52]">End Date</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
          @click="applyFilter"
        >
          Filter
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#0F1F52] transition-colors hover:border-slate-300"
          @click="resetFilter"
        >
          Reset
        </button>
      </div>
    </UiBaseCard>

    <UiBaseCard padding="none">
      <p class="font-medium border-b border-[#E2E8F0] px-5 py-3.5 text-sm text-slate-500">
        {{ meta.total }} record(s) found
      </p>

      <RobotsActivityTable :items="items" :loading="loading" />
    </UiBaseCard>

    <UiBasePagination
      v-if="meta.total > 0"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="activity records"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />
  </div>
</template>
