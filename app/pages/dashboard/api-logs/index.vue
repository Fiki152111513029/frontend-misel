<script setup lang="ts">
import type { ApiLogSortBy, ApiLogSortOrder } from '~/components/api-logs/Table.vue'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'ICS API Logs — Misel' })

const { apiLogs, loading } = useApiLogs()

const dateFrom = ref('')
const dateTo = ref('')
const appliedDateFrom = ref('')
const appliedDateTo = ref('')

const sort = ref<{ key: ApiLogSortBy, order: ApiLogSortOrder }>({ key: 'createdAt', order: 'desc' })
const currentPage = ref(1)
const pageSize = ref(10)

const showPayloadModal = ref(false)
const payloadTitle = ref('')
const payloadData = ref<Record<string, unknown> | null>(null)

const CLIENT_SORT_ACCESSORS: Record<ApiLogSortBy, (item: typeof apiLogs.value[number]) => string | number> = {
  createdAt: item => item.createdAt,
  method: item => item.method,
  endpoint: item => item.endpoint.toLowerCase(),
  statusCode: item => item.statusCode,
  durationMs: item => item.durationMs,
}

const filteredLogs = computed(() => {
  const from = appliedDateFrom.value ? new Date(appliedDateFrom.value) : null
  const to = appliedDateTo.value ? new Date(appliedDateTo.value) : null
  return apiLogs.value.filter((log) => {
    const createdAt = new Date(log.createdAt)
    return (!from || createdAt >= from) && (!to || createdAt <= to)
  })
})

const sortedLogs = computed(() => {
  const accessor = CLIENT_SORT_ACCESSORS[sort.value.key]
  return [...filteredLogs.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return sort.value.order === 'asc' ? -1 : 1
    if (av > bv) return sort.value.order === 'asc' ? 1 : -1
    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedLogs.value.length / pageSize.value)))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedLogs.value.slice(start, start + pageSize.value)
})

function applyFilter() {
  appliedDateFrom.value = dateFrom.value
  appliedDateTo.value = dateTo.value
  currentPage.value = 1
}

function resetFilter() {
  dateFrom.value = ''
  dateTo.value = ''
  appliedDateFrom.value = ''
  appliedDateTo.value = ''
  currentPage.value = 1
}

function handleSort(patch: { sortBy: ApiLogSortBy, sortOrder: ApiLogSortOrder }) {
  sort.value = { key: patch.sortBy, order: patch.sortOrder }
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

function handleLimitChange(limit: number) {
  pageSize.value = limit
  currentPage.value = 1
}

function viewPayload(payload: Record<string, unknown>, title: string) {
  payloadData.value = payload
  payloadTitle.value = title
  showPayloadModal.value = true
}
</script>

<template>
  <IcsLogsPasswordGate title="ICS API Logs">
    <div class="animate-fade-in space-y-4">
      <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">ICS API Logs</h1>

      <UiBaseCard>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Date &amp; Time From</label>
            <input
              v-model="dateFrom"
              type="datetime-local"
              class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Date &amp; Time To</label>
            <input
              v-model="dateTo"
              type="datetime-local"
              class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
            @click="applyFilter"
          >
            Apply Filter
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
            @click="resetFilter"
          >
            Reset
          </button>
        </div>
      </UiBaseCard>

      <UiBaseCard padding="none">
        <p class="font-medium border-b border-[#E2E8F0] dark:border-[#1E293B] px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
          {{ filteredLogs.length }} record(s) found
        </p>

        <ApiLogsTable
          :items="paginatedLogs"
          :loading="loading"
          :sort-by="sort.key"
          :sort-order="sort.order"
          @sort="handleSort"
          @view-payload="viewPayload"
        />
      </UiBaseCard>

      <UiBasePagination
        v-if="filteredLogs.length > 0"
        :page="currentPage"
        :total-pages="totalPages"
        :total="filteredLogs.length"
        :limit="pageSize"
        item-label="API logs"
        @update:page="goToPage"
        @update:limit="handleLimitChange"
      />

      <UiJsonPayloadModal
        v-model="showPayloadModal"
        :title="payloadTitle"
        :payload="payloadData"
      />
    </div>
  </IcsLogsPasswordGate>
</template>
