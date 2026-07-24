<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, PauseCircle, RotateCcw, Trash2 } from 'lucide-vue-next'
import type { Robot, RobotSortBy, RobotSortOrder } from '~/types/robot'

export type RobotSortKey =
  | RobotSortBy
  | 'amrDeviceSerialNo'
  | 'amrDeviceNo'
  | 'areaId'
  | 'speed'
  | 'battery'
  | 'state'
  | 'lastUpdate'
  | 'isActive'

interface Props {
  items: Robot[]
  loading: boolean
  sortBy?: RobotSortKey
  sortOrder?: RobotSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [robot: Robot]
  delete: [robot: Robot]
  reset: [robot: Robot]
  suspend: [robot: Robot]
  sort: [patch: { sortBy: RobotSortKey, sortOrder: RobotSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'amrDeviceSerialNo', label: 'AMR Device Serial No' },
  { key: 'amrDeviceNo', label: 'AMR Device No' },
  { key: 'areaId', label: 'Area ID', width: '80px' },
  { key: 'speed', label: 'Speed', width: '80px' },
  { key: 'battery', label: 'Battery', width: '80px' },
  { key: 'state', label: 'State', width: '110px' },
  { key: 'lastUpdate', label: 'Last Update' },
  { key: 'isActive', label: 'Active', width: '80px' },
  { key: 'actions', label: 'Actions', width: '160px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: RobotSortKey, order: RobotSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: RobotSortKey) {
  const order: RobotSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

// Possible values reported by the AMR telemetry API: Idle, Initializing, In task,
// Fault, Offline, Charging, Upgrading. Match loosely so casing/spacing differences
// from the external system still get a sensible color instead of falling through.
function stateStyle(state: string | null) {
  const value = state?.toLowerCase() ?? ''
  if (!value) return 'bg-slate-100 text-slate-400'
  if (value.includes('fault')) return 'bg-red-50 text-red-500'
  if (value.includes('offline')) return 'bg-slate-100 text-slate-500'
  if (value.includes('idle')) return 'bg-amber-50 text-amber-600'
  if (value.includes('charging')) return 'bg-emerald-50 text-emerald-600'
  if (value.includes('upgrading')) return 'bg-purple-50 text-purple-600'
  if (value.includes('initializing')) return 'bg-indigo-50 text-indigo-600'
  return 'bg-[#01ADEF]/10 text-[#01ADEF]'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
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
            @click="toggleSort(col.key as RobotSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 160px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No robots found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.amrDeviceSerialNo }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.amrDeviceNo }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.areaId }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.speed ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.battery !== null ? `${item.battery}%` : '-' }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="stateStyle(item.state)">
              {{ item.state ?? '-' }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.lastUpdate) }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="item.isActive
 ? 'bg-emerald-50 text-emerald-600 '
 : 'bg-slate-100 text-slate-500 '"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('robot.update')"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('robot.update')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-[#01ADEF]/10 hover:text-[#01ADEF] transition-colors"
                aria-label="Reset"
                @click="emit('reset', item)"
              >
                <RotateCcw class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('robot.update')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                aria-label="Suspend"
                @click="emit('suspend', item)"
              >
                <PauseCircle class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('robot.delete')"
                type="button"
                class="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                aria-label="Delete"
                @click="emit('delete', item)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
