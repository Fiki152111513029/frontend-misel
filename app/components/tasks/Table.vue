<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { Task, TaskSortBy, TaskSortOrder } from '~/types/task'

export type TaskSortKey = TaskSortBy | 'taskId' | 'taskAction' | 'robot' | 'operator' | 'status'

interface Props {
  items: Task[]
  loading: boolean
  sortBy?: TaskSortKey
  sortOrder?: TaskSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [patch: { sortBy: TaskSortKey, sortOrder: TaskSortOrder }]
}>()

const columns = [
  { key: 'taskId', label: 'Task ID' },
  { key: 'taskAction', label: 'Task Action' },
  { key: 'robot', label: 'Robot' },
  { key: 'operator', label: 'Operator' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created At' },
]

const activeSort = ref<{ key: TaskSortKey, order: TaskSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: TaskSortKey) {
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
          v-for="col in columns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as TaskSortKey)"
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
          No tasks found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-mono font-bold text-[#0F1F52]">
            {{ item.taskId }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ taskActionLabel(item.taskAction) }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.robot?.name ?? 'Unassigned' }}
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
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
