<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { QuarantineArea, QuarantineAreaSortBy, QuarantineAreaSortOrder } from '~/types/quarantine-area'

export type QuarantineAreaSortKey = QuarantineAreaSortBy | 'iRaypleLocationCode' | 'quarantineLine'

interface Props {
  items: QuarantineArea[]
  loading: boolean
  sortBy?: QuarantineAreaSortKey
  sortOrder?: QuarantineAreaSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [quarantineArea: QuarantineArea]
  delete: [quarantineArea: QuarantineArea]
  sort: [patch: { sortBy: QuarantineAreaSortKey, sortOrder: QuarantineAreaSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'iRaypleLocationCode', label: 'iRayple Location Code' },
  { key: 'quarantineLine', label: 'Quarantine Line' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: QuarantineAreaSortKey, order: QuarantineAreaSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: QuarantineAreaSortKey) {
  const order: QuarantineAreaSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
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
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as QuarantineAreaSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 120px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No quarantine areas found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.iRaypleLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.quarantineLine.name }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('quarantine-area.update')"
                type="button"
                class="rounded-lg bg-slate-100 dark:bg-slate-800/60 p-1.5 text-[#01ADEF] hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('quarantine-area.delete')"
                type="button"
                class="rounded-lg bg-red-50 dark:bg-red-900/15 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors"
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
