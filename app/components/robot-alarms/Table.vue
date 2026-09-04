<script setup lang="ts">
import type { RobotAlarm } from '~/types/robot-alarm'

interface Props {
  items: RobotAlarm[]
  loading: boolean
}
defineProps<Props>()

const columns = [
  { key: 'receivedAt', label: 'Received At' },
  { key: 'device', label: 'Device' },
  { key: 'zone', label: 'Zone' },
  { key: 'alarm', label: 'Alarm' },
  { key: 'grade', label: 'Grade', width: '110px' },
  { key: 'source', label: 'Source', width: '100px' },
]

// RCS's own severity scale: 1 = Tip, 2 = Alert, 3 = Emergency.
const GRADE_LABEL: Record<number, string> = { 1: 'Tip', 2: 'Alert', 3: 'Emergency' }
const GRADE_STYLE: Record<number, string> = {
  1: 'bg-slate-100 text-slate-500',
  2: 'bg-amber-50 text-amber-600',
  3: 'bg-red-50 text-red-600',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div>
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th
          v-for="col in columns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {{ col.label }}
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-16 text-center">
          <p class="text-lg font-semibold text-[#0F1F52]">No alarms found</p>
          <p class="font-medium mt-1.5 text-sm text-slate-500">
            No robot alarms have been received yet.
          </p>
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.receivedAt) }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            <p>{{ item.deviceName ?? '-' }}</p>
            <p class="font-medium text-xs text-slate-400">{{ item.deviceNum ?? '-' }}</p>
          </td>
          <td class="px-4 py-3 text-sm text-slate-500">
            {{ item.areaId !== null ? `Zone ${item.areaId}` : '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.alarmDesc ?? '-' }}
          </td>
          <td class="px-4 py-3">
            <span
              v-if="item.alarmGrade !== null"
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="GRADE_STYLE[item.alarmGrade] ?? 'bg-slate-100 text-slate-500'"
            >
              {{ GRADE_LABEL[item.alarmGrade] ?? `Grade ${item.alarmGrade}` }}
            </span>
            <span v-else class="text-sm text-slate-400">-</span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-500">
            {{ item.alarmSource ?? '-' }}
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </div>
</template>
