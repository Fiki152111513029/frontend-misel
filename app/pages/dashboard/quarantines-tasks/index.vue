<script setup lang="ts">
import type { QuarantineTaskSortKey } from '~/components/quarantine-tasks/Table.vue'
import type { Task, TaskStatus } from '~/types/task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Quarantines Tasks — Misel' })

const SERVER_SORT_KEYS = ['createdAt'] as const
const STATUS_OPTIONS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']

const { items, meta, loading, filters, operators, fetchTasks, fetchTaskOperators, setFilters } = useTasks()
const toast = useToast()

const dateFrom = ref('')
const dateTo = ref('')
const operatorId = ref('')
const statusFilter = ref('')

function applyFilters() {
  setFilters({
    // Quarantine Tasks is the quarantine-scoped view of the shared Task
    // entity — always pinned to NOT_STANDARD (the quarantine-routing
    // action), never user-toggleable.
    taskAction: 'NOT_STANDARD',
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
    operatorId: operatorId.value || undefined,
    status: (statusFilter.value || undefined) as TaskStatus | undefined,
    // The Tasks store is shared with Tasks and Trouble Shoot, which pin
    // their own activeOnly value — clear it explicitly so a stale value
    // doesn't leak in here.
    activeOnly: undefined,
    page: 1,
  })
  fetchTasks()
}

// Only createdAt is sortable server-side — the remaining columns are sorted
// client-side over the currently loaded page only.
const clientSort = ref<{ key: QuarantineTaskSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: Task) => string> = {
  quarantineLine: item => item.productionLine.quarantineLine.name.toLowerCase(),
  quarantineArea: item => (item.quarantineArea?.name ?? '').toLowerCase(),
  productionLine: item => item.productionLine.name.toLowerCase(),
  area: item => (item.productionLineArea?.name ?? '').toLowerCase(),
  boxType: item => item.boxType.name.toLowerCase(),
  operator: item => item.operator.fullName.toLowerCase(),
  status: item => item.status.toLowerCase(),
}

const sortedItems = computed(() => {
  if (!clientSort.value) return items.value
  const { key, order } = clientSort.value
  const accessor = CLIENT_SORT_ACCESSORS[key]
  if (!accessor) return items.value
  return [...items.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
})

function handleSort(patch: { sortBy: QuarantineTaskSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    setFilters({ ...patch, page: 1 })
    fetchTasks()
  } else {
    clientSort.value = patch
  }
}

onMounted(() => {
  applyFilters()
  fetchTaskOperators()
})

function goToPage(page: number) {
  setFilters({ page })
  fetchTasks()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchTasks()
}

function viewTask(task: Task) {
  toast.success(`Detail view for ${task.taskId} is coming soon`)
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Quarantines Tasks</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Quarantines Tasks</p>
    </div>

    <div class="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-500">Date From</label>
        <input
          v-model="dateFrom"
          type="datetime-local"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          @change="applyFilters"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-500">Date To</label>
        <input
          v-model="dateTo"
          type="datetime-local"
          class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
          @change="applyFilters"
        />
      </div>

      <select
        v-model="operatorId"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        @change="applyFilters"
      >
        <option value="">All Operators</option>
        <option v-for="op in operators" :key="op.id" :value="op.id">{{ op.fullName }}</option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
        @change="applyFilters"
      >
        <option value="">All Status</option>
        <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>

    <QuarantineTasksTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key ?? filters.sortBy"
      :sort-order="clientSort?.order ?? filters.sortOrder"
      @view="viewTask"
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
