<script setup lang="ts">
import { ChevronDown, ChevronUp, Eye } from 'lucide-vue-next'
import type { Task, TaskSortBy, TaskSortOrder } from '~/types/task'

export type QuarantineTaskSortKey =
  | TaskSortBy
  | 'quarantineLine'
  | 'quarantineArea'
  | 'productionLine'
  | 'area'
  | 'boxType'
  | 'operator'
  | 'status'

interface Props {
  items: Task[]
  loading: boolean
  sortBy?: QuarantineTaskSortKey
  sortOrder?: TaskSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  view: [task: Task]
  sort: [patch: { sortBy: QuarantineTaskSortKey, sortOrder: TaskSortOrder }]
}>()

const columns = [
  { key: 'createdAt', label: 'Created At' },
  { key: 'quarantineLine', label: 'Quarantine Line' },
  { key: 'quarantineArea', label: 'Quarantine Area' },
  { key: 'productionLine', label: 'Production Line' },
  { key: 'area', label: 'Area' },
  { key: 'boxType', label: 'Box Type' },
  { key: 'operator', label: 'Operator' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'actions', label: 'Action', width: '80px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: QuarantineTaskSortKey, order: TaskSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: QuarantineTaskSortKey) {
  const order: TaskSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
            @click="toggleSort(col.key as QuarantineTaskSortKey)"
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
          No quarantine tasks found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.productionLine.quarantineLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.quarantineArea?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.productionLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.productionLineArea?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.boxType.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.operator.fullName }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="taskStatusStyle(item.status)"
            >
              {{ taskStatusLabel(item.status) }}
            </span>
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
