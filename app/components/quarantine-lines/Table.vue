<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { QuarantineLine, QuarantineLineSortBy, QuarantineLineSortOrder } from '~/types/quarantine-line'

export type QuarantineLineSortKey = QuarantineLineSortBy | 'status' | 'modelCodeProcess'

interface Props {
  items: QuarantineLine[]
  loading: boolean
  sortBy?: QuarantineLineSortKey
  sortOrder?: QuarantineLineSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [quarantineLine: QuarantineLine]
  delete: [quarantineLine: QuarantineLine]
  sort: [patch: { sortBy: QuarantineLineSortKey, sortOrder: QuarantineLineSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'modelCodeProcess', label: 'Task Template' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: QuarantineLineSortKey, order: QuarantineLineSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: QuarantineLineSortKey) {
  const order: QuarantineLineSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
            @click="toggleSort(col.key as QuarantineLineSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 120px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No quarantine lines found
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
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.modelCodeProcess?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('quarantine-line.update')"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('quarantine-line.delete')"
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
