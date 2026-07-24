<script setup lang="ts">
import type { WarehouseCartTaskSortKey } from '~/components/warehouse-tasks/Table.vue'
import type { WarehouseCartTaskStatus } from '~/types/warehouse-cart-task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Warehouse Tasks — Misel' })

const SERVER_SORT_KEYS = ['createdAt'] as const
const STATUS_OPTIONS: WarehouseCartTaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']

const {
  items,
  meta,
  loading,
  filters,
  operators,
  fetchWarehouseCartTasks,
  fetchWarehouseCartTaskOperators,
  setFilters,
} = useWarehouseCartTasks()

const dateFrom = ref('')
const dateTo = ref('')
const operatorId = ref('')
const statusFilter = ref('')

function applyFilters() {
  setFilters({
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
    operatorId: operatorId.value || undefined,
    status: (statusFilter.value || undefined) as WarehouseCartTaskStatus | undefined,
    page: 1,
  })
  fetchWarehouseCartTasks()
}

// Only createdAt is sortable server-side — the remaining columns are sorted
// client-side over the currently loaded page only.
const clientSort = ref<{ key: WarehouseCartTaskSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: typeof items.value[number]) => string> = {
  taskId: item => item.taskId.toLowerCase(),
  taskAction: item => item.modelCodeProcess.name.toLowerCase(),
  robot: item => (item.robot?.name ?? '').toLowerCase(),
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

function handleSort(patch: { sortBy: WarehouseCartTaskSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    setFilters({ ...patch, page: 1 })
    fetchWarehouseCartTasks()
  } else {
    clientSort.value = patch
  }
}

onMounted(() => {
  fetchWarehouseCartTasks()
  fetchWarehouseCartTaskOperators()
})

function goToPage(page: number) {
  setFilters({ page })
  fetchWarehouseCartTasks()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchWarehouseCartTasks()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Warehouse Tasks</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Warehouse Tasks</p>
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

    <WarehouseTasksTable
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
      item-label="warehouse tasks"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />
  </div>
</template>
