<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, QrCode, Trash2 } from 'lucide-vue-next'
import type {
  ControlTask,
  ControlTaskSortBy,
  ControlTaskSortOrder,
} from '~/types/control-task'

export type ControlTaskSortKey = ControlTaskSortBy | 'isActive'

interface Props {
  items: ControlTask[]
  loading: boolean
  sortBy?: ControlTaskSortKey
  sortOrder?: ControlTaskSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [controlTask: ControlTask]
  delete: [controlTask: ControlTask]
  sort: [patch: { sortBy: ControlTaskSortKey, sortOrder: ControlTaskSortOrder }]
}>()

const { hasPermission } = useAuth()

// One list drives both the header and the cell order below, so the two can
// never drift apart. Model Code Process and Route are a join and a list with
// no meaningful ordering, so they carry no sort control.
const columns = [
  { key: 'abjad', label: 'Abjad', width: '90px', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'modelCodeProcess', label: 'Model Code Process', width: '170px', sortable: false },
  { key: 'route', label: 'Route', sortable: false },
  { key: 'isActive', label: 'Active', width: '90px', sortable: true },
  { key: 'actions', label: 'Actions', width: '140px', sortable: false },
]

const activeSort = ref<{ key: ControlTaskSortKey, order: ControlTaskSortOrder }>({
  key: props.sortBy ?? 'abjad',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: ControlTaskSortKey) {
  const order: ControlTaskSortOrder
    = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

const showQrModal = ref(false)
const qrControlTask = ref<ControlTask | null>(null)

// The QR encodes `abjad`, the same value GET /control-tasks/by-abjad resolves,
// so a scan on the floor lands straight on this task.
function openQr(controlTask: ControlTask) {
  qrControlTask.value = controlTask
  showQrModal.value = true
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
            @click="toggleSort(col.key as ControlTaskSortKey)"
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
          No control tasks found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3">
            <span class="inline-flex min-w-7 items-center justify-center rounded-lg bg-[#0F1F52] px-2 py-1 text-xs font-bold text-white">
              {{ item.abjad }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-slate-600">
            {{ item.modelCodeProcess?.name ?? '—' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap items-center gap-1">
              <template v-for="(code, index) in item.route" :key="`${item.id}-${index}`">
                <span v-if="index > 0" class="text-xs text-slate-300">→</span>
                <span class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-[#0F1F52]">
                  {{ code }}
                </span>
              </template>
            </div>
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="item.isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#0F1F52] hover:bg-slate-200 transition-colors"
                aria-label="QR Code"
                @click="openQr(item)"
              >
                <QrCode class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('control-task.update')"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('control-task.delete')"
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

    <UiQrCodeModal
      v-model="showQrModal"
      :title="qrControlTask ? `${qrControlTask.name} · QR Code` : 'QR Code'"
      :value="qrControlTask?.abjad ?? ''"
    />
  </UiBaseCard>
</template>
