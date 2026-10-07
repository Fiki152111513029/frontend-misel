<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { CustomTaskRun, CustomTaskRunSortBy } from '~/types/custom-task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Task Custom — JAI

const { items, meta, loading, filters, fetchRuns, refreshRuns, cancelRun, setFilters } = useCustomTaskRuns()

const cancellingRun = ref<CustomTaskRun | null>(null)
const showCancelDialog = ref(false)
const cancelling = ref(false)

const search = ref('')
const statusFilter = ref<CustomTaskRun['status'] | ''>('')
const dateFilter = ref('')

onMounted(async () => {
  await fetchRuns()
})

// Pushed from the server instead of polled — see useRealtime.
useRealtime(['custom-tasks', 'tasks'], refreshRuns)

function applyFilters() {
  setFilters({
    search: search.value.trim() || undefined,
    status: statusFilter.value || undefined,
    date: dateFilter.value || undefined,
    page: 1,
  })
  fetchRuns()
}

function openCancel(run: CustomTaskRun) {
  cancellingRun.value = run
  showCancelDialog.value = true
}

async function handleCancelConfirm() {
  if (!cancellingRun.value) return
  cancelling.value = true
  const ok = await cancelRun(cancellingRun.value.id)
  cancelling.value = false
  if (ok) showCancelDialog.value = false
}

function handleSort(patch: { sortBy: CustomTaskRunSortBy, sortOrder: 'asc' | 'desc' }) {
  setFilters({ ...patch, page: 1 })
  fetchRuns()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchRuns()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchRuns()
}

const controlClass
  = 'rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Task Custom</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        Every Task Custom sent to RCS from the scan page, newest first
      </p>
    </div>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by code, name or order id"
          :class="`w-full pl-9 ${controlClass}`"
          @keyup.enter="applyFilters"
          @search="applyFilters"
        >
      </div>
      <select v-model="statusFilter" :class="controlClass" @change="applyFilters">
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="FAILED">Failed</option>
      </select>
      <input v-model="dateFilter" type="date" :class="controlClass" @change="applyFilters">
      <button
        v-if="search || statusFilter || dateFilter"
        type="button"
        class="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
        @click="search = ''; statusFilter = ''; dateFilter = ''; applyFilters()"
      >
        Clear
      </button>
    </div>

    <CustomTasksRunsTable
      :items="items"
      :loading="loading"
      :sort-by="filters.sortBy"
      :sort-order="filters.sortOrder"
      @sort="handleSort"
      @cancel="openCancel"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="custom tasks"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <CustomTasksCancelDialog
      v-model="showCancelDialog"
      :run="cancellingRun"
      :cancelling="cancelling"
      @confirm="handleCancelConfirm"
      @cancel="showCancelDialog = false"
    />
  </div>
</template>
