<script setup lang="ts">
import { RefreshCw, Search } from 'lucide-vue-next'
import type { TaskSortKey } from '~/components/tasks/Table.vue'
import type { TaskAction } from '~/types/task'
import { taskActionLabel } from '~/utils/taskStatus'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Tasks — Misel' })

const SERVER_SORT_KEYS = ['createdAt'] as const

const { items, meta, loading, filters, fetchTasks, setFilters } = useTasks()

const search = ref('')
const taskActionFilter = ref('All')
const statusFilter = ref('All')

const taskActionOptions = computed(() => ['All', ...new Set(items.value.map(t => t.taskAction))])
const statusOptions = computed(() => ['All', ...new Set(items.value.map(t => t.status))])

function actionOptionLabel(option: string) {
  return option === 'All' ? 'All Task Actions' : taskActionLabel(option as TaskAction)
}

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return items.value.filter((item) => {
    const matchesAction = taskActionFilter.value === 'All' || item.taskAction === taskActionFilter.value
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    const matchesSearch = !query
      || item.taskId.toLowerCase().includes(query)
      || (item.robot?.name.toLowerCase().includes(query) ?? false)
      || item.operator.fullName.toLowerCase().includes(query)
    return matchesAction && matchesStatus && matchesSearch
  })
})

// Only createdAt is sortable server-side — the remaining columns are sorted
// client-side over the currently loaded page only.
const clientSort = ref<{ key: TaskSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: typeof items.value[number]) => string> = {
  taskId: item => item.taskId.toLowerCase(),
  taskAction: item => taskActionLabel(item.taskAction).toLowerCase(),
  robot: item => (item.robot?.name ?? '').toLowerCase(),
  operator: item => item.operator.fullName.toLowerCase(),
  status: item => item.status.toLowerCase(),
}

const sortedItems = computed(() => {
  if (!clientSort.value) return filteredItems.value
  const { key, order } = clientSort.value
  const accessor = CLIENT_SORT_ACCESSORS[key]
  if (!accessor) return filteredItems.value
  return [...filteredItems.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
})

function handleSort(patch: { sortBy: TaskSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    setFilters({ ...patch, page: 1 })
    fetchTasks()
  } else {
    clientSort.value = patch
  }
}

onMounted(() => {
  fetchTasks()
})

function goToPage(page: number) {
  setFilters({ page })
  fetchTasks()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchTasks()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Tasks</h1>
      <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage tasks</p>
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
        v-model="taskActionFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option v-for="option in taskActionOptions" :key="option" :value="option">
          {{ actionOptionLabel(option) }}
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

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="fetchTasks()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <TasksTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key ?? filters.sortBy"
      :sort-order="clientSort?.order ?? filters.sortOrder"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="tasks"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />
  </div>
</template>
