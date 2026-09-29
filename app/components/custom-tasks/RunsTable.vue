<script setup lang="ts">
import { Ban, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type {
  CustomTaskRun,
  CustomTaskRunSortBy,
  CustomTaskRunSortOrder,
} from '~/types/custom-task'
import { taskStatusStyle } from '~/utils/taskStatus'

interface Props {
  items: CustomTaskRun[]
  loading: boolean
  sortBy?: CustomTaskRunSortBy
  sortOrder?: CustomTaskRunSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [patch: { sortBy: CustomTaskRunSortBy, sortOrder: CustomTaskRunSortOrder }]
  cancel: [run: CustomTaskRun]
}>()

const { hasPermission } = useAuth()

// One list drives both the header and the cells below, so a non-sortable
// column in the middle can never knock the two out of alignment.
const columns = [
  { key: 'createdAt', label: 'Released', width: '150px', sortable: true },
  { key: 'abjad', label: 'Abjad', width: '90px', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'orderId', label: 'Order ID', width: '190px', sortable: false },
  { key: 'modelProcessCode', label: 'Model Process Code', width: '170px', sortable: false },
  { key: 'taskPath', label: 'Route', sortable: false },
  { key: 'robot', label: 'Robot', width: '120px', sortable: false },
  { key: 'operator', label: 'Operator', width: '150px', sortable: false },
  { key: 'status', label: 'Status', width: '120px', sortable: false },
  { key: 'actions', label: 'Actions', width: '110px', sortable: false },
]

// Only a run still in flight can be cancelled — the backend rejects the
// rest anyway, so the button is hidden rather than left to fail.
function isCancellable(run: CustomTaskRun) {
  return run.status === 'PENDING' || run.status === 'IN_PROGRESS'
}

const activeSort = ref<{ key: CustomTaskRunSortBy, order: CustomTaskRunSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: CustomTaskRunSortBy) {
  const order: CustomTaskRunSortOrder
    = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

const STATUS_LABEL: Record<CustomTaskRun['status'], string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

// A cancelled run is stored as FAILED (TaskStatus has no CANCELLED member),
// so cancelledAt is what tells the two apart on screen.
function statusLabel(run: CustomTaskRun) {
  return run.cancelledAt ? 'Cancelled' : STATUS_LABEL[run.status]
}

function statusClass(run: CustomTaskRun) {
  return run.cancelledAt
    ? 'bg-slate-100 text-slate-500'
    : taskStatusStyle(run.status)
}

function formatReleased(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
            v-if="col.sortable"
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as CustomTaskRunSortBy)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
          <template v-else>{{ col.label }}</template>
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No custom tasks have been run yet
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-600">
            {{ formatReleased(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex min-w-7 items-center justify-center rounded-lg bg-[#0F1F52] px-2 py-1 text-xs font-bold text-white">
              {{ item.abjad }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3 font-mono text-xs text-slate-500">
            {{ item.orderId }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-slate-600">
            {{ item.modelProcessCode }}
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap items-center gap-1">
              <template v-for="(code, index) in item.taskPath.split(',')" :key="`${item.id}-${index}`">
                <span v-if="index > 0" class="text-xs text-slate-300">→</span>
                <span class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-[#0F1F52]">
                  {{ code }}
                </span>
              </template>
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-slate-600">
            {{ item.robot?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-slate-600">
            {{ item.operator.fullName }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(item)">
              {{ statusLabel(item) }}
            </span>
          </td>
          <td class="px-4 py-3">
            <button
              v-if="isCancellable(item) && hasPermission('custom-task.update')"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100"
              @click="emit('cancel', item)"
            >
              <Ban class="h-3.5 w-3.5" />
              Cancel
            </button>
            <span v-else class="text-xs text-slate-300">—</span>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
