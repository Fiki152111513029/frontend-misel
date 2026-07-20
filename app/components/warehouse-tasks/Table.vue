<script setup lang="ts">
import { ChevronDown, ChevronUp, Eye } from 'lucide-vue-next'
import type { WarehouseTask, WarehouseTaskStatus } from '~/composables/useWarehouseTasks'

export type WarehouseTaskSortKey = 'id' | 'lineLocation' | 'status' | 'createdAt'
export type WarehouseTaskSortOrder = 'asc' | 'desc'

interface Props {
  items: WarehouseTask[]
  loading: boolean
  sortBy?: WarehouseTaskSortKey
  sortOrder?: WarehouseTaskSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  view: [warehouseTask: WarehouseTask]
  sort: [patch: { sortBy: WarehouseTaskSortKey, sortOrder: WarehouseTaskSortOrder }]
}>()

const columns = [
  { key: 'id', label: 'Task ID' },
  { key: 'lineLocation', label: 'Line Location' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'actions', label: 'Action', width: '80px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const STATUS_STYLE: Record<WarehouseTaskStatus, string> = {
  Pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  'In Progress': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  Completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  Failed: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}

const activeSort = ref<{ key: WarehouseTaskSortKey, order: WarehouseTaskSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: WarehouseTaskSortKey) {
  const order: WarehouseTaskSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <UiBaseCard padding="none">
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th
          v-for="col in sortableColumns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as WarehouseTaskSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 80px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Action
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No warehouse tasks found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-mono font-bold text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.id }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.lineLocation }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="STATUS_STYLE[item.status]"
            >
              {{ item.status }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] dark:hover:bg-slate-800/60 transition-colors"
              aria-label="View"
              @click="emit('view', item)"
            >
              <Eye class="h-4 w-4" />
            </button>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
