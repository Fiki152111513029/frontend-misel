<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { taskStatusLabel, taskStatusStyle } from '~/utils/taskStatus'
import type { TrolleyActivity } from '~/types/trolley-activity'

interface Props {
  items: TrolleyActivity[]
  loading: boolean
}

defineProps<Props>()

const { user, hasPermission } = useAuth()
const { deleteTrolleyActivity } = useTrolleyActivities()

// Warehouse/Operator get a trimmed-down view of their own history — the
// timing columns are noise for line staff, they only care what/where.
// Every other role (Super Admin, etc.) keeps the full audit view.
const showTimingColumns = computed(() => !['Warehouse', 'Operator'].includes(user.value?.role ?? ''))
const canDelete = computed(() => hasPermission('trolley-activity.delete'))

const ALL_COLUMNS = [
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
  { key: 'actions', label: 'Actions', width: '90px' },
]
const TIMING_COLUMN_KEYS = new Set(['startDate', 'endDate', 'duration'])

const columns = computed(() => {
  let cols = showTimingColumns.value
    ? ALL_COLUMNS
    : ALL_COLUMNS.filter(col => !TIMING_COLUMN_KEYS.has(col.key))
  if (!canDelete.value) cols = cols.filter(col => col.key !== 'actions')
  return cols
})

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function formatDuration(start: string, end: string | null) {
  if (!end) return '-'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

const showDeleteDialog = ref(false)
const deleteTarget = ref<TrolleyActivity | null>(null)
const deleting = ref(false)

function openDelete(item: TrolleyActivity) {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const ok = await deleteTrolleyActivity(deleteTarget.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
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
            {{ item.statusEnd ?? '-' }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.pickupLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.droppingLocationCode ?? '-' }}
          </td>
          <td v-if="showTimingColumns" class="px-4 py-3 text-sm text-slate-600">
            {{ formatDate(item.startDate) }}
          </td>
          <td v-if="showTimingColumns" class="px-4 py-3 text-sm text-slate-600">
            {{ formatDate(item.endDate) }}
          </td>
          <td v-if="showTimingColumns" class="px-4 py-3 text-sm text-slate-600">
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
          <td v-if="canDelete" class="px-4 py-3">
            <button
              type="button"
              class="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
              aria-label="Delete"
              title="Delete this activity"
              @click="openDelete(item)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </td>
        </tr>
      </template>
    </UiBaseTable>

    <UiBaseModal
      v-model="showDeleteDialog"
      title="Delete Trolley Activity"
      size="sm"
    >
      <p class="font-medium text-sm text-slate-600">
        Are you sure you want to delete this activity for
        <strong>{{ deleteTarget?.trolley.code }}</strong>? This action cannot be undone.
      </p>

      <template #footer>
        <UiBaseButton variant="secondary" @click="showDeleteDialog = false">Cancel</UiBaseButton>
        <UiBaseButton variant="primary" :loading="deleting" @click="confirmDelete">
          Delete
        </UiBaseButton>
      </template>
    </UiBaseModal>
  </UiBaseCard>
</template>
