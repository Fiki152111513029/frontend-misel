<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { WarehouseCartTask, WarehouseCartTaskSortBy, WarehouseCartTaskSortOrder, WarehouseCartTaskStatus } from '~/types/warehouse-cart-task'

export type WarehouseCartTaskSortKey = WarehouseCartTaskSortBy | 'taskId' | 'taskAction' | 'robot' | 'operator' | 'status'

interface Props {
  items: WarehouseCartTask[]
  loading: boolean
  sortBy?: WarehouseCartTaskSortKey
  sortOrder?: WarehouseCartTaskSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [patch: { sortBy: WarehouseCartTaskSortKey, sortOrder: WarehouseCartTaskSortOrder }]
}>()

const columns = [
  { key: 'taskId', label: 'Task ID' },
  { key: 'taskAction', label: 'Task Action' },
  { key: 'robot', label: 'Robot' },
  { key: 'operator', label: 'Operator' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created At' },
]

const STATUS_STYLE: Record<WarehouseCartTaskStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  IN_PROGRESS: 'bg-[#01ADEF]/10 text-[#01ADEF]',
  COMPLETED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  FAILED: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}

function statusStyle(status: string) {
  return STATUS_STYLE[status as WarehouseCartTaskStatus] ?? STATUS_STYLE.PENDING
}

const activeSort = ref<{ key: WarehouseCartTaskSortKey, order: WarehouseCartTaskSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: WarehouseCartTaskSortKey) {
  const order: WarehouseCartTaskSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
          v-for="col in columns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as WarehouseCartTaskSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
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
            {{ item.taskId }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.modelCodeProcess.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.robot?.name ?? 'Unassigned' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.operator.fullName }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusStyle(item.status)">
              {{ item.status }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.createdAt) }}
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
