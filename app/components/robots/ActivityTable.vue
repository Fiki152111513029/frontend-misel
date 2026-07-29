<script setup lang="ts">
import type { RobotActivityLog } from '~/types/robot'

interface Props {
  items: RobotActivityLog[]
  loading: boolean
}

defineProps<Props>()

const columns = [
  { key: 'recordedAt', label: 'Date/Time' },
  { key: 'deviceCode', label: 'Device Code' },
  { key: 'deviceName', label: 'Device Name' },
  { key: 'speed', label: 'Speed', width: '90px' },
  { key: 'battery', label: 'Battery', width: '90px' },
  { key: 'status', label: 'Status', width: '90px' },
  { key: 'state', label: 'State', width: '100px' },
  { key: 'position', label: 'Position' },
  { key: 'payload', label: 'Payload' },
  { key: 'orientation', label: 'Orientation' },
]

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
          <p class="text-lg font-semibold text-[#0F1F52]">No activity found</p>
          <p class="font-medium mt-1.5 text-sm text-slate-500">
            No records match the selected time range.
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
            {{ formatDate(item.recordedAt) }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.deviceCode }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.deviceName }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.speed ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.battery !== null ? `${item.battery}%` : '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.status ?? '-' }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full bg-[#01ADEF]/10 px-2 py-0.5 text-xs font-medium text-[#01ADEF]">
              {{ item.state ?? '-' }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.position ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.payload ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.orientation ?? '-' }}
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </div>
</template>
