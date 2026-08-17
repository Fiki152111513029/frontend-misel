<script setup lang="ts">
import { taskStatusLabel, taskStatusStyle } from '~/utils/taskStatus'
import type { TrolleyActivity } from '~/types/trolley-activity'

interface Props {
  items: TrolleyActivity[]
  loading: boolean
}

defineProps<Props>()

const columns = [
  { key: 'user', label: 'Name' },
  { key: 'trolley', label: 'Code' },
  { key: 'statusBeginning', label: 'Status Beginning' },
  { key: 'statusEnd', label: 'Status End' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'dropping', label: 'Dropping Location Code' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'duration', label: 'Duration' },
  { key: 'status', label: 'Task Status' },
]

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
</script>

<template>
  <UiBaseCard padding="none">
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th
          v-for="col in columns"
          :key="col.key"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {{ col.label }}
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No trolley activities found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.user.fullName }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.trolley.code }}
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">
            {{ item.statusBeginning }}
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">
            {{ item.statusEnd }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.pickupLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.droppingLocationCode ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">
            {{ formatDate(item.startDate) }}
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">
            {{ formatDate(item.endDate) }}
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">
            {{ formatDuration(item.startDate, item.endDate) }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="taskStatusStyle(item.status)"
            >
              {{ taskStatusLabel(item.status) }}
            </span>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
