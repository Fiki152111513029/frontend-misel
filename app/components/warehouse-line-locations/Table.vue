<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type {
  WarehouseLineLocation,
  WarehouseLineLocationSortBy,
  WarehouseLineLocationSortOrder,
} from '~/types/warehouse-line-location'

export type WarehouseLineLocationSortKey = WarehouseLineLocationSortBy | 'droppingLocationCode' | 'pickingLocationCode'

interface Props {
  items: WarehouseLineLocation[]
  loading: boolean
  sortBy?: WarehouseLineLocationSortKey
  sortOrder?: WarehouseLineLocationSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [warehouseLineLocation: WarehouseLineLocation]
  delete: [warehouseLineLocation: WarehouseLineLocation]
  sort: [patch: { sortBy: WarehouseLineLocationSortKey, sortOrder: WarehouseLineLocationSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'droppingLocationCode', label: 'Dropping Location Code' },
  { key: 'pickingLocationCode', label: 'Picking Location Code' },
  { key: 'modelCodeProcess', label: 'Model Code Process' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions' && col.key !== 'modelCodeProcess')

const activeSort = ref<{ key: WarehouseLineLocationSortKey, order: WarehouseLineLocationSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: WarehouseLineLocationSortKey) {
  const order: WarehouseLineLocationSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
            @click="toggleSort(col.key as WarehouseLineLocationSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Model Code Process
        </th>
        <th style="width: 120px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No warehouse line locations found
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
            {{ item.droppingLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.pickingLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.modelCodeProcess?.name ?? '—' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('warehouse-line-location.update')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('warehouse-line-location.delete')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/15 transition-colors"
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
