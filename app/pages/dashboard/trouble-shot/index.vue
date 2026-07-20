<script setup lang="ts">
import { RefreshCw, Search } from 'lucide-vue-next'
import type { TroubleShotSortKey, TroubleShotSortOrder } from '~/components/trouble-shot/Table.vue'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trouble Shot — Misel' })

const { troubleShots, loading, viewTroubleShot } = useTroubleShots()

const search = ref('')
const statusFilter = ref('All')
const sort = ref<{ key: TroubleShotSortKey, order: TroubleShotSortOrder }>({ key: 'createdAt', order: 'desc' })
const currentPage = ref(1)
const pageSize = ref(10)

const statusOptions = computed(() => ['All', ...new Set(troubleShots.value.map(t => t.status))])

const CLIENT_SORT_ACCESSORS: Record<TroubleShotSortKey, (item: typeof troubleShots.value[number]) => string> = {
  id: item => item.id,
  taskAction: item => item.taskAction.toLowerCase(),
  robot: item => item.robot.toLowerCase(),
  operator: item => item.operator.toLowerCase(),
  status: item => item.status,
  createdAt: item => item.createdAt,
}

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return troubleShots.value.filter((item) => {
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    const matchesSearch = !query
      || item.id.toLowerCase().includes(query)
      || item.taskAction.toLowerCase().includes(query)
      || item.robot.toLowerCase().includes(query)
      || item.operator.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })
})

const sortedItems = computed(() => {
  const accessor = CLIENT_SORT_ACCESSORS[sort.value.key]
  return [...filteredItems.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return sort.value.order === 'asc' ? -1 : 1
    if (av > bv) return sort.value.order === 'asc' ? 1 : -1
    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedItems.value.length / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

watch([search, statusFilter], () => {
  currentPage.value = 1
})

function handleSort(patch: { sortBy: TroubleShotSortKey, sortOrder: TroubleShotSortOrder }) {
  sort.value = { key: patch.sortBy, order: patch.sortOrder }
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

function handleLimitChange(limit: number) {
  pageSize.value = limit
  currentPage.value = 1
}

function refresh() {
  search.value = ''
  statusFilter.value = 'All'
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Trouble Shot</h1>
      <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Trouble Shot</p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search task ID, robot, operator..."
          class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] placeholder-slate-400 outline-none transition-colors focus:border-[#01ADEF]"
        />
      </div>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in statusOptions" :key="option" :value="option">
          {{ option === 'All' ? 'All Status' : option }}
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

    <TroubleShotTable
      :items="paginatedItems"
      :loading="loading"
      :sort-by="sort.key"
      :sort-order="sort.order"
      @view="viewTroubleShot"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="currentPage"
      :total-pages="totalPages"
      :total="sortedItems.length"
      :limit="pageSize"
      item-label="trouble shots"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />
  </div>
</template>
