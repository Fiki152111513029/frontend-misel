<script setup lang="ts">
import { RefreshCw, Search } from 'lucide-vue-next'
import type { TroubleShotSortKey } from '~/components/trouble-shot/Table.vue'
import type { Task, TaskSortOrder, TaskStatus } from '~/types/task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trouble Shot — Misel' })

const { items, loading, fetchTasks, cancelTask } = useTasks()
const toast = useToast()

const search = ref('')
const statusFilter = ref<'All' | TaskStatus>('All')
const sort = ref<{ key: TroubleShotSortKey, order: TaskSortOrder }>({ key: 'createdAt', order: 'desc' })
const currentPage = ref(1)
const pageSize = ref(10)

const CLIENT_SORT_ACCESSORS: Record<TroubleShotSortKey, (item: Task) => string> = {
  createdAt: item => item.createdAt,
  taskId: item => item.taskId.toLowerCase(),
  taskAction: item => item.taskAction.toLowerCase(),
  robot: item => (item.robot?.name ?? '').toLowerCase(),
  operator: item => item.operator.fullName.toLowerCase(),
  status: item => item.status.toLowerCase(),
}

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return items.value.filter((item) => {
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
    const matchesSearch = !query
      || item.taskId.toLowerCase().includes(query)
      || (item.robot?.name.toLowerCase().includes(query) ?? false)
      || item.operator.fullName.toLowerCase().includes(query)
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

function handleSort(patch: { sortBy: TroubleShotSortKey, sortOrder: TaskSortOrder }) {
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
  // Trouble Shoot is the shared Tasks store's "not complete" view — always
  // force activeOnly + a large page size, since the store is also used by
  // the Tasks and Quarantine Tasks pages with their own filters.
  fetchTasks({
    activeOnly: true,
    taskAction: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    operatorId: undefined,
    status: undefined,
    page: 1,
    limit: 200,
  })
}

onMounted(() => {
  refresh()
})

function viewTask(task: Task) {
  toast.success(`Detail view for ${task.taskId} is coming soon`)
}

const showCancelDialog = ref(false)
const cancellingTask = ref<Task | null>(null)
const cancelling = ref(false)

function openCancel(task: Task) {
  cancellingTask.value = task
  showCancelDialog.value = true
}

async function handleCancelConfirm() {
  if (!cancellingTask.value) return
  cancelling.value = true
  await cancelTask(cancellingTask.value.id)
  cancelling.value = false
  showCancelDialog.value = false
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Trouble Shot</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        Tasks currently running or waiting — cancel a task if it's stuck
      </p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search task ID, robot, operator..."
          class="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0F1F52] placeholder-slate-400 outline-none transition-colors focus:border-[#01ADEF]"
        />
      </div>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Status</option>
        <option value="PENDING">Waiting</option>
        <option value="IN_PROGRESS">Running</option>
      </select>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F1F52] transition-colors hover:border-slate-300"
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
      @view="viewTask"
      @cancel="openCancel"
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

    <UiBaseModal v-model="showCancelDialog" title="Cancel Task" size="sm">
      <p class="font-medium text-sm text-slate-600">
        Are you sure you want to cancel <strong>{{ cancellingTask?.taskId }}</strong>? This marks the task as
        failed and cannot be undone.
      </p>

      <template #footer>
        <UiBaseButton variant="secondary" @click="showCancelDialog = false">Back</UiBaseButton>
        <UiBaseButton variant="primary" :loading="cancelling" @click="handleCancelConfirm">
          Cancel Task
        </UiBaseButton>
      </template>
    </UiBaseModal>
  </div>
</template>
