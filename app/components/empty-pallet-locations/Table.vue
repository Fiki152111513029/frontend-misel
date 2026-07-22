<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type {
  EmptyPalletLocation,
  EmptyPalletLocationSortBy,
  EmptyPalletLocationSortOrder,
} from '~/types/empty-pallet-location'

export type EmptyPalletLocationSortKey = EmptyPalletLocationSortBy | 'iRaypleLocationCode' | 'isActive'

interface Props {
  items: EmptyPalletLocation[]
  loading: boolean
  sortBy?: EmptyPalletLocationSortKey
  sortOrder?: EmptyPalletLocationSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [emptyPalletLocation: EmptyPalletLocation]
  delete: [emptyPalletLocation: EmptyPalletLocation]
  sort: [patch: { sortBy: EmptyPalletLocationSortKey, sortOrder: EmptyPalletLocationSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'iRaypleLocationCode', label: 'iRayple Location Code' },
  { key: 'isActive', label: 'Active', width: '90px' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'iRaypleLocationCode', label: 'iRayple Location Code' },
  { key: 'isActive', label: 'Active', width: '90px' },
]

const activeSort = ref<{ key: EmptyPalletLocationSortKey, order: EmptyPalletLocationSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: EmptyPalletLocationSortKey) {
  const order: EmptyPalletLocationSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
            @click="toggleSort(col.key as EmptyPalletLocationSortKey)"
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
          No empty pallet locations found
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
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                item.isActive
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              "
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('empty-pallet-location.update')"
                type="button"
                class="rounded-lg bg-slate-100 dark:bg-slate-800/60 p-1.5 text-[#01ADEF] hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('empty-pallet-location.delete')"
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
