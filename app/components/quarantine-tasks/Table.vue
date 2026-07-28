<script setup lang="ts">
import { ChevronDown, ChevronUp, Truck } from 'lucide-vue-next'
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
  // id of the task currently being released, so only that row's button shows
  // a loading state (releasing one task shouldn't disable every row).
  releasingTaskId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  releasingTaskId: null,
})

const emit = defineEmits<{
  release: [task: Task]
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
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
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
        <th style="width: 80px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.productionLine.quarantineLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.quarantineArea?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.productionLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.productionLineArea?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.boxType.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
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
              v-if="isTaskCompleted(item.status)"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="releasingTaskId === item.id"
              @click="emit('release', item)"
            >
              <Truck class="h-3.5 w-3.5" />
              {{ releasingTaskId === item.id ? 'Releasing…' : 'Release' }}
            </button>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
