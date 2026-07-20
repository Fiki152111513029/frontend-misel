<script setup lang="ts">
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-vue-next'
import type { DockingSortKey, DockingSortOrder } from '~/components/docking/Table.vue'
import type { Docking, DockingStatus } from '~/composables/useDockings'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Docking — Misel' })

const { dockings, loading, viewDocking } = useDockings()

const search = ref('')
const statusFilter = ref<DockingStatus | 'All'>('All')
const boxTypeFilter = ref('All')
const lineFilter = ref('All')
const shiftFilter = ref('All')
const dateFrom = ref('')
const dateTo = ref('')
const pageSize = ref(10)
const currentPage = ref(1)
const sort = ref<{ key: DockingSortKey, order: DockingSortOrder }>({ key: 'timeCreated', order: 'desc' })

const SORT_ACCESSORS: Record<DockingSortKey, (item: Docking) => string | number> = {
  noUrut: item => item.noUrut,
  taskId: item => item.taskId.toLowerCase(),
  timeCreated: item => item.timeCreated,
  boxType: item => item.boxType.name.toLowerCase(),
  from: item => item.from.toLowerCase(),
  to: item => item.to.toLowerCase(),
  amrCode: item => item.amrCode.toLowerCase(),
  amrName: item => item.amrName.toLowerCase(),
  status: item => item.status,
}

function handleSort(patch: { sortBy: DockingSortKey, sortOrder: DockingSortOrder }) {
  sort.value = { key: patch.sortBy, order: patch.sortOrder }
}

const statusOptions: (DockingStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'Completed', 'Failed']
const shiftOptions = ['All', 'Morning Shift', 'Afternoon Shift', 'Night Shift']

const boxTypeOptions = computed(() => ['All', ...new Set(dockings.value.map(d => d.boxType.name))])

const lineOptions = computed(() => {
  const lines = dockings.value.flatMap(d => [d.from, d.to]).filter(value => /^Line \d+/i.test(value))
  return ['All', ...new Set(lines)]
})

const stats = computed(() => ({
  total: dockings.value.length,
  inProgress: dockings.value.filter(d => d.status === 'In Progress').length,
  completed: dockings.value.filter(d => d.status === 'Completed').length,
  failed: dockings.value.filter(d => d.status === 'Failed').length,
}))

const filteredDockings = computed(() => {
  const query = search.value.trim().toLowerCase()
  const from = dateFrom.value ? new Date(dateFrom.value) : null
  const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59`) : null

  return dockings.value.filter((docking) => {
    const matchesStatus = statusFilter.value === 'All' || docking.status === statusFilter.value
    const matchesBoxType = boxTypeFilter.value === 'All' || docking.boxType.name === boxTypeFilter.value
    const matchesLine = lineFilter.value === 'All' || docking.from === lineFilter.value || docking.to === lineFilter.value
    const createdAt = new Date(docking.timeCreated)
    const matchesDate = (!from || createdAt >= from) && (!to || createdAt <= to)
    const matchesSearch = !query
      || docking.taskId.toLowerCase().includes(query)
      || docking.amrName.toLowerCase().includes(query)
      || docking.amrCode.toLowerCase().includes(query)
      || docking.from.toLowerCase().includes(query)
      || docking.to.toLowerCase().includes(query)
    return matchesStatus && matchesBoxType && matchesLine && matchesDate && matchesSearch
  })
})

watch([search, statusFilter, boxTypeFilter, lineFilter, dateFrom, dateTo], () => {
  currentPage.value = 1
})

const sortedDockings = computed(() => {
  const accessor = SORT_ACCESSORS[sort.value.key]
  return [...filteredDockings.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return sort.value.order === 'asc' ? -1 : 1
    if (av > bv) return sort.value.order === 'asc' ? 1 : -1
    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDockings.value.length / pageSize.value)))

const paginatedDockings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedDockings.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() => filteredDockings.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredDockings.value.length))

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

function refresh() {
  search.value = ''
  statusFilter.value = 'All'
  boxTypeFilter.value = 'All'
  lineFilter.value = 'All'
  shiftFilter.value = 'All'
  dateFrom.value = ''
  dateTo.value = ''
  currentPage.value = 1
}
</script>

<template>
  <div class="animate-fade-in space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Docking</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Docking tasks</p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
      >
        <Plus class="h-4 w-4" />
        New Docking Task
      </button>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UiBaseCard padding="sm" class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total Tasks</p>
          <p class="mt-1 text-2xl font-bold text-[#0F1F52] dark:text-[#F8FAFC]">{{ stats.total }}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#01ADEF]/10 text-[#01ADEF]">
          <ClipboardList class="h-5 w-5" />
        </div>
      </UiBaseCard>

      <UiBaseCard padding="sm" class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">In Progress</p>
          <p class="mt-1 text-2xl font-bold text-amber-500">{{ stats.inProgress }}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
          <Loader2 class="h-5 w-5" />
        </div>
      </UiBaseCard>

      <UiBaseCard padding="sm" class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Completed</p>
          <p class="mt-1 text-2xl font-bold text-emerald-500">{{ stats.completed }}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10">
          <CheckCircle2 class="h-5 w-5" />
        </div>
      </UiBaseCard>

      <UiBaseCard padding="sm" class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Failed</p>
          <p class="mt-1 text-2xl font-bold text-red-500">{{ stats.failed }}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
          <XCircle class="h-5 w-5" />
        </div>
      </UiBaseCard>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3 py-2">
        <CalendarDays class="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          v-model="dateFrom"
          type="date"
          class="w-[110px] bg-transparent text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none [color-scheme:light] dark:[color-scheme:dark]"
        />
        <span class="text-slate-300">–</span>
        <input
          v-model="dateTo"
          type="date"
          class="w-[110px] bg-transparent text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      <select
        v-model="shiftFilter"
        title="Shift filter is not wired to task data yet"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in shiftOptions" :key="option" :value="option">
          {{ option === 'All' ? 'All Shifts' : option }}
        </option>
      </select>

      <select
        v-model="boxTypeFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in boxTypeOptions" :key="option" :value="option">
          {{ option === 'All' ? 'All Box Type' : option }}
        </option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in statusOptions" :key="option" :value="option">
          {{ option === 'All' ? 'All Status' : option }}
        </option>
      </select>

      <select
        v-model="lineFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in lineOptions" :key="option" :value="option">
          {{ option === 'All' ? 'All Lines' : option }}
        </option>
      </select>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="refresh"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search task ID, AMR, location..."
        class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] placeholder-slate-400 outline-none transition-colors focus:border-[#01ADEF]"
      />
    </div>

    <DockingTable
      :items="paginatedDockings"
      :loading="loading"
      :sort-by="sort.key"
      :sort-order="sort.order"
      @view="viewDocking"
      @sort="handleSort"
    />

    <!-- Pagination -->
    <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p class="font-medium text-sm text-slate-500 dark:text-slate-400">
        Showing {{ rangeStart }} to {{ rangeEnd }} of {{ filteredDockings.length }} tasks
      </p>

      <div class="flex items-center gap-2">
        <select
          v-model.number="pageSize"
          class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3 py-2 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] outline-none"
        >
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors"
            :class="page === currentPage
              ? 'bg-[#2F6FED] text-white'
              : 'border border-[#E2E8F0] dark:border-[#1E293B] text-slate-500 dark:text-slate-400 hover:border-slate-300'"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] text-slate-400 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
